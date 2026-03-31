package pl.gddkia.roadgis.infrastructure;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import pl.gddkia.roadgis.common.ApiBadRequestException;
import pl.gddkia.roadgis.reference.ReferenceQueryService;

@Service
public class WorkspaceQueryService {

  private final RoadSectionQueryService roadSectionQueryService;
  private final ReferenceQueryService referenceQueryService;

  public WorkspaceQueryService(
      RoadSectionQueryService roadSectionQueryService,
      ReferenceQueryService referenceQueryService) {
    this.roadSectionQueryService = roadSectionQueryService;
    this.referenceQueryService = referenceQueryService;
  }

  public FeatureQueryResponse queryFeatures(
      String layer, String bbox, double scaleDenominator, UUID draftId, String status) {
    return switch (layer) {
      case "ROAD_SECTION" ->
          roadSectionQueryService.queryRoadSectionFeatures(bbox, scaleDenominator, draftId, status);
      case "REFERENCE_SEGMENT" ->
          new FeatureQueryResponse(
              referenceQueryService.queryReferenceSegmentFeatures(toPolygonWkt(bbox), scaleDenominator),
              List.of());
      default ->
          throw new ApiBadRequestException(
              "INVALID_REQUEST",
              "Warstwa musi byc jedna z obslugiwanych wartosci: ROAD_SECTION, REFERENCE_SEGMENT.");
    };
  }

  public WorkspaceConfigResponse getWorkspaceConfiguration() {
    return new WorkspaceConfigResponse(
        "road-section-draft",
        List.of(
            new WorkspaceLayerDefinition(
                "road-section-published", "Odcinki drogowe", "published", true, false, 10),
            new WorkspaceLayerDefinition(
                "road-section-draft", "Odcinki drogowe - robocze", "draft", true, true, 20),
            new WorkspaceLayerDefinition(
                "reference-segment", "Odcinki referencyjne", "context", false, false, 5)),
        new WorkspaceLayout("three-panel", 320, 360, 240));
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
}
