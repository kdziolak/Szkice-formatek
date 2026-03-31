package pl.gddkia.roadgis.infrastructure;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import pl.gddkia.roadgis.common.ApiBadRequestException;
import pl.gddkia.roadgis.common.ApiNotFoundException;
import pl.gddkia.roadgis.common.GeometryMapper;
import pl.gddkia.roadgis.common.PageMetadata;
import pl.gddkia.roadgis.editing.DraftActionType;
import pl.gddkia.roadgis.editing.DraftRepository;
import pl.gddkia.roadgis.editing.DraftRoadSectionCommand;

@Service
public class RoadSectionQueryService {

  private final RoadSectionQueryRepository roadSectionQueryRepository;
  private final DraftRepository draftRepository;
  private final GeometryMapper geometryMapper;
  private final ObjectMapper objectMapper;

  public RoadSectionQueryService(
      RoadSectionQueryRepository roadSectionQueryRepository,
      DraftRepository draftRepository,
      GeometryMapper geometryMapper,
      ObjectMapper objectMapper) {
    this.roadSectionQueryRepository = roadSectionQueryRepository;
    this.draftRepository = draftRepository;
    this.geometryMapper = geometryMapper;
    this.objectMapper = objectMapper;
  }

  public PagedRoadSectionsResponse listRoadSections(
      String roadNumber,
      String status,
      UUID draftId,
      UUID referenceSegmentBusinessId,
      int page,
      int size) {
    List<OverlayRow> rows = buildMergedRows(draftId);
    List<RoadSectionSummary> filteredRows =
        rows.stream()
            .filter(row -> matchesFilters(row, roadNumber, status, referenceSegmentBusinessId))
            .sorted(this::compareRows)
            .map(this::toSummary)
            .toList();

    int fromIndex = Math.min(page * size, filteredRows.size());
    int toIndex = Math.min(fromIndex + size, filteredRows.size());

    return new PagedRoadSectionsResponse(
        filteredRows.subList(fromIndex, toIndex),
        PageMetadata.of(page, size, filteredRows.size()));
  }

  public RoadSectionComparisonDetail getRoadSection(UUID businessId, UUID draftId) {
    RoadSectionQueryRepository.RoadSectionDetailRow publishedRow =
        roadSectionQueryRepository.findByBusinessId(businessId).orElse(null);

    OverlayRow workingRow = buildMergedRowForBusinessId(businessId, draftId, publishedRow);
    if (workingRow == null && publishedRow == null) {
      throw new ApiNotFoundException(
          "ROAD_SECTION_NOT_FOUND",
          "Odcinek drogowy o podanym businessId nie istnieje.");
    }

    return new RoadSectionComparisonDetail(
        businessId,
        workingRow == null ? RoadSectionOverlayStatus.NONE : workingRow.overlayStatus,
        workingRow == null ? null : workingRow.draftCommandId,
        publishedRow == null ? null : toState(fromPublished(publishedRow)),
        workingRow == null ? toState(fromPublished(publishedRow)) : toState(workingRow));
  }

  public FeatureQueryResponse queryRoadSectionFeatures(
      String bbox, double scaleDenominator, UUID draftId, String status) {
    String bboxPolygon = toPolygonWkt(bbox);
    List<OverlayRow> publishedRows =
        roadSectionQueryRepository.findRowsWithinBbox(bboxPolygon, status).stream()
            .map(this::fromPublished)
            .toList();
    Map<UUID, OverlayRow> publishedMap = new LinkedHashMap<>();
    publishedRows.forEach(row -> publishedMap.put(row.businessId, row));

    List<FeatureView> draftFeatures = new ArrayList<>();
    if (draftId != null) {
      ensureDraftExists(draftId);
      for (DraftRoadSectionCommand command : draftRepository.findRoadSectionCommands(draftId)) {
        OverlayRow baseRow = publishedMap.get(command.targetBusinessId());
        if (baseRow == null) {
          baseRow =
              roadSectionQueryRepository.findByBusinessId(command.targetBusinessId())
                  .map(this::fromPublished)
                  .orElse(null);
        }

        OverlayRow mergedRow = mergeSingle(baseRow, command);
        if (mergedRow != null && intersectsBbox(mergedRow.geometryWkt, bboxPolygon)) {
          if (status == null || status.equals(mergedRow.lifecycleStatus)) {
            draftFeatures.add(toFeatureView(mergedRow));
          }
        }
      }
    }

    List<FeatureView> publishedFeatures = publishedRows.stream().map(this::toFeatureView).toList();
    return new FeatureQueryResponse(publishedFeatures, draftFeatures);
  }

  public boolean existsByBusinessId(UUID businessId) {
    return roadSectionQueryRepository.existsByBusinessId(businessId);
  }

  private List<OverlayRow> buildMergedRows(UUID draftId) {
    Map<UUID, OverlayRow> mergedRows = new LinkedHashMap<>();
    roadSectionQueryRepository.findAllRows()
        .forEach(row -> mergedRows.put(row.businessId(), fromPublished(row)));

    if (draftId == null) {
      return new ArrayList<>(mergedRows.values());
    }

    ensureDraftExists(draftId);
    for (DraftRoadSectionCommand command : draftRepository.findRoadSectionCommands(draftId)) {
      OverlayRow merged = mergeSingle(mergedRows.get(command.targetBusinessId()), command);
      if (merged != null) {
        mergedRows.put(merged.businessId, merged);
      }
    }

    return new ArrayList<>(mergedRows.values());
  }

  private OverlayRow buildMergedRowForBusinessId(
      UUID businessId,
      UUID draftId,
      RoadSectionQueryRepository.RoadSectionDetailRow publishedRow) {
    if (draftId == null) {
      return publishedRow == null ? null : fromPublished(publishedRow);
    }

    ensureDraftExists(draftId);
    OverlayRow current = publishedRow == null ? null : fromPublished(publishedRow);
    for (DraftRoadSectionCommand command : draftRepository.findRoadSectionCommands(draftId)) {
      if (command.targetBusinessId().equals(businessId)) {
        current = mergeSingle(current, command);
      }
    }
    return current;
  }

  private OverlayRow mergeSingle(OverlayRow baseRow, DraftRoadSectionCommand command) {
    OverlayRow row =
        baseRow == null
            ? OverlayRow.draftOnly(command.targetBusinessId(), command.draftCommandId())
            : baseRow.copy();

    row.draftCommandId = command.draftCommandId();

    if (command.actionType() == DraftActionType.CREATE) {
      row.draftOnly = true;
      row.overlayStatus = RoadSectionOverlayStatus.CREATED;
    } else if (command.actionType() == DraftActionType.UPDATE) {
      row.overlayStatus = RoadSectionOverlayStatus.UPDATED;
    } else if (command.actionType() == DraftActionType.DELETE) {
      row.overlayStatus = RoadSectionOverlayStatus.DELETED;
    }

    applyPayload(row, command.payloadJson());

    if (command.geometryWkt() != null) {
      row.geometryWkt = command.geometryWkt();
      row.srid = command.srid();
    }

    return row;
  }

  private void applyPayload(OverlayRow row, String payloadJson) {
    try {
      JsonNode payload = objectMapper.readTree(payloadJson);
      row.roadNumber = readString(payload, "roadNumber", row.roadNumber);
      row.roadClassCode = readString(payload, "roadClassCode", row.roadClassCode);
      row.roadName = readString(payload, "roadName", row.roadName);
      row.sectionCode = readString(payload, "sectionCode", row.sectionCode);
      row.lifecycleStatus = readString(payload, "lifecycleStatus", row.lifecycleStatus);

      if (payload.hasNonNull("referenceSegmentBusinessId")) {
        row.referenceSegmentBusinessId = UUID.fromString(payload.get("referenceSegmentBusinessId").asText());
      }
      if (payload.hasNonNull("chainageFrom")) {
        row.chainageFrom = payload.get("chainageFrom").decimalValue();
      }
      if (payload.hasNonNull("chainageTo")) {
        row.chainageTo = payload.get("chainageTo").decimalValue();
      }
    } catch (Exception exception) {
      throw new ApiBadRequestException("INVALID_REQUEST", "Nie udalo sie odczytac payload overlay draftu.");
    }
  }

  private String readString(JsonNode payload, String key, String fallback) {
    return payload.hasNonNull(key) ? payload.get(key).asText() : fallback;
  }

  private boolean matchesFilters(
      OverlayRow row, String roadNumber, String status, UUID referenceSegmentBusinessId) {
    if (roadNumber != null && !roadNumber.equals(row.roadNumber)) {
      return false;
    }
    if (status != null && !status.equals(row.lifecycleStatus)) {
      return false;
    }
    if (referenceSegmentBusinessId != null && !referenceSegmentBusinessId.equals(row.referenceSegmentBusinessId)) {
      return false;
    }
    return true;
  }

  private int compareRows(OverlayRow left, OverlayRow right) {
    Comparator<String> nullSafeString = Comparator.nullsLast(String::compareTo);
    Comparator<BigDecimal> nullSafeDecimal = Comparator.nullsLast(BigDecimal::compareTo);

    int roadCompare = nullSafeString.compare(left.roadNumber, right.roadNumber);
    if (roadCompare != 0) {
      return roadCompare;
    }
    int chainageCompare = nullSafeDecimal.compare(left.chainageFrom, right.chainageFrom);
    if (chainageCompare != 0) {
      return chainageCompare;
    }
    return nullSafeString.compare(left.sectionCode, right.sectionCode);
  }

  private RoadSectionSummary toSummary(OverlayRow row) {
    return new RoadSectionSummary(
        row.businessId,
        row.roadNumber,
        row.roadClassCode,
        row.roadName,
        row.sectionCode,
        row.referenceSegmentBusinessId,
        row.chainageFrom,
        row.chainageTo,
        row.lifecycleStatus,
        row.overlayStatus,
        row.draftCommandId,
        row.draftOnly);
  }

  private RoadSectionState toState(OverlayRow row) {
    if (row == null) {
      return null;
    }

    return new RoadSectionState(
        row.businessId,
        row.roadNumber,
        row.roadClassCode,
        row.roadName,
        row.sectionCode,
        row.referenceSegmentBusinessId,
        row.chainageFrom,
        row.chainageTo,
        row.lifecycleStatus,
        row.geometryWkt == null || row.srid == null ? null : geometryMapper.toGeoJson(row.geometryWkt, row.srid));
  }

  private FeatureView toFeatureView(OverlayRow row) {
    return new FeatureView(
        row.businessId,
        row.sectionCode != null ? row.sectionCode : row.businessId.toString(),
        row.overlayStatus,
        row.draftOnly,
        row.geometryWkt == null || row.srid == null ? null : geometryMapper.toGeoJson(row.geometryWkt, row.srid));
  }

  private OverlayRow fromPublished(RoadSectionQueryRepository.RoadSectionDetailRow row) {
    OverlayRow overlayRow = new OverlayRow();
    overlayRow.businessId = row.businessId();
    overlayRow.roadNumber = row.roadNumber();
    overlayRow.roadClassCode = row.roadClassCode();
    overlayRow.roadName = row.roadName();
    overlayRow.sectionCode = row.sectionCode();
    overlayRow.referenceSegmentBusinessId = row.referenceSegmentBusinessId();
    overlayRow.chainageFrom = row.chainageFrom();
    overlayRow.chainageTo = row.chainageTo();
    overlayRow.lifecycleStatus = row.lifecycleStatus();
    overlayRow.geometryWkt = row.geometryWkt();
    overlayRow.srid = row.srid();
    overlayRow.overlayStatus = RoadSectionOverlayStatus.NONE;
    overlayRow.draftOnly = false;
    return overlayRow;
  }

  private void ensureDraftExists(UUID draftId) {
    draftRepository.findDraft(draftId)
        .orElseThrow(
            () -> new ApiNotFoundException("DRAFT_NOT_FOUND", "Draft o podanym identyfikatorze nie istnieje."));
  }

  private String toPolygonWkt(String bbox) {
    try {
      String[] parts = bbox.split(",");
      if (parts.length != 4) {
        throw new IllegalArgumentException("BBOX must have four coordinates");
      }
      double minX = Double.parseDouble(parts[0].trim());
      double minY = Double.parseDouble(parts[1].trim());
      double maxX = Double.parseDouble(parts[2].trim());
      double maxY = Double.parseDouble(parts[3].trim());
      return "POLYGON(("
          + minX + " " + minY + ","
          + maxX + " " + minY + ","
          + maxX + " " + maxY + ","
          + minX + " " + maxY + ","
          + minX + " " + minY + "))";
    } catch (Exception exception) {
      throw new ApiBadRequestException("INVALID_REQUEST", "Parametr bbox ma niepoprawny format.");
    }
  }

  private boolean intersectsBbox(String geometryWkt, String bboxPolygonWkt) {
    if (geometryWkt == null) {
      return false;
    }

    try {
      org.locationtech.jts.geom.Geometry geometry = new org.locationtech.jts.io.WKTReader().read(geometryWkt);
      org.locationtech.jts.geom.Geometry bboxGeometry =
          new org.locationtech.jts.io.WKTReader().read(bboxPolygonWkt);
      return geometry.intersects(bboxGeometry);
    } catch (Exception exception) {
      return false;
    }
  }

  private static final class OverlayRow {
    private UUID businessId;
    private String roadNumber;
    private String roadClassCode;
    private String roadName;
    private String sectionCode;
    private UUID referenceSegmentBusinessId;
    private BigDecimal chainageFrom;
    private BigDecimal chainageTo;
    private String lifecycleStatus;
    private String geometryWkt;
    private Integer srid;
    private RoadSectionOverlayStatus overlayStatus;
    private UUID draftCommandId;
    private boolean draftOnly;

    static OverlayRow draftOnly(UUID businessId, UUID draftCommandId) {
      OverlayRow row = new OverlayRow();
      row.businessId = businessId;
      row.draftCommandId = draftCommandId;
      row.draftOnly = true;
      return row;
    }

    OverlayRow copy() {
      OverlayRow row = new OverlayRow();
      row.businessId = businessId;
      row.roadNumber = roadNumber;
      row.roadClassCode = roadClassCode;
      row.roadName = roadName;
      row.sectionCode = sectionCode;
      row.referenceSegmentBusinessId = referenceSegmentBusinessId;
      row.chainageFrom = chainageFrom;
      row.chainageTo = chainageTo;
      row.lifecycleStatus = lifecycleStatus;
      row.geometryWkt = geometryWkt;
      row.srid = srid;
      row.overlayStatus = overlayStatus;
      row.draftCommandId = draftCommandId;
      row.draftOnly = draftOnly;
      return row;
    }
  }
}
