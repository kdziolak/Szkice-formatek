package pl.gddkia.roadgis.reference;

import java.math.BigDecimal;
import java.util.UUID;

public record ReferenceSegmentSummary(
    UUID businessId,
    String roadNumber,
    String axisCode,
    String directionCode,
    String segmentCode,
    BigDecimal chainageFrom,
    BigDecimal chainageTo) {}
