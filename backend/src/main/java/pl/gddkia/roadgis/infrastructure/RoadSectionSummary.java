package pl.gddkia.roadgis.infrastructure;

import java.math.BigDecimal;
import java.util.UUID;

public record RoadSectionSummary(
    UUID businessId,
    String roadNumber,
    String roadClassCode,
    String roadName,
    String sectionCode,
    UUID referenceSegmentBusinessId,
    BigDecimal chainageFrom,
    BigDecimal chainageTo,
    String lifecycleStatus,
    RoadSectionOverlayStatus overlayStatus,
    UUID draftCommandId,
    boolean isDraftOnly) {}
