package pl.gddkia.roadgis.infrastructure;

import java.util.UUID;

public record RoadSectionComparisonDetail(
    UUID businessId,
    RoadSectionOverlayStatus overlayStatus,
    UUID draftCommandId,
    RoadSectionState published,
    RoadSectionState working) {}
