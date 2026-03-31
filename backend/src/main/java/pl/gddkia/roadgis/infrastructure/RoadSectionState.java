package pl.gddkia.roadgis.infrastructure;

import java.math.BigDecimal;
import java.util.UUID;
import pl.gddkia.roadgis.common.GeoJsonGeometry;

public record RoadSectionState(
    UUID businessId,
    String roadNumber,
    String roadClassCode,
    String roadName,
    String sectionCode,
    UUID referenceSegmentBusinessId,
    BigDecimal chainageFrom,
    BigDecimal chainageTo,
    String lifecycleStatus,
    GeoJsonGeometry geometry) {}
