package pl.gddkia.roadgis.infrastructure;

public record WorkspaceLayerDefinition(
    String id,
    String label,
    String layerType,
    boolean visible,
    boolean editable,
    int zIndex) {}
