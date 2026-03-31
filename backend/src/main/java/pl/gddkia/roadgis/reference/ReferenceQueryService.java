package pl.gddkia.roadgis.reference;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import pl.gddkia.roadgis.common.GeometryMapper;
import pl.gddkia.roadgis.infrastructure.FeatureView;
import pl.gddkia.roadgis.infrastructure.RoadSectionOverlayStatus;

@Service
public class ReferenceQueryService {

  private final ReferenceQueryRepository referenceQueryRepository;
  private final GeometryMapper geometryMapper;

  public ReferenceQueryService(
      ReferenceQueryRepository referenceQueryRepository, GeometryMapper geometryMapper) {
    this.referenceQueryRepository = referenceQueryRepository;
    this.geometryMapper = geometryMapper;
  }

  public PagedReferenceSegmentsResponse listReferenceSegments(
      String roadNumber, BigDecimal chainageFrom, BigDecimal chainageTo, int page, int size) {
    return referenceQueryRepository.listReferenceSegments(roadNumber, chainageFrom, chainageTo, page, size);
  }

  public ReferenceLocateResponse locateReferenceSegments(
      String roadNumber, BigDecimal chainage, String directionCode) {
    return new ReferenceLocateResponse(
        roadNumber,
        chainage,
        directionCode,
        referenceQueryRepository.locateReferenceSegments(roadNumber, chainage, directionCode));
  }

  public List<FeatureView> queryReferenceSegmentFeatures(String bboxPolygonWkt, double scaleDenominator) {
    return referenceQueryRepository.findRowsWithinBbox(bboxPolygonWkt).stream()
        .map(
            row ->
                new FeatureView(
                    row.businessId(),
                    row.segmentCode(),
                    RoadSectionOverlayStatus.NONE,
                    false,
                    row.geometryWkt() == null || row.srid() == null
                        ? null
                        : geometryMapper.toGeoJson(row.geometryWkt(), row.srid())))
        .toList();
  }
}
