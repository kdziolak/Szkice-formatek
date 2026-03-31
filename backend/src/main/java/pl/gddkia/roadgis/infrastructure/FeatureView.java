package pl.gddkia.roadgis.infrastructure;

import java.util.UUID;
import pl.gddkia.roadgis.common.GeoJsonGeometry;

public record FeatureView(
    UUID businessId,
    String label,
    RoadSectionOverlayStatus overlayStatus,
    boolean draftOnly,
    GeoJsonGeometry geometry) {}
