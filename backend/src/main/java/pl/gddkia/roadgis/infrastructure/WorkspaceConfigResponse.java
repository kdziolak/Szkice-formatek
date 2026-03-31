package pl.gddkia.roadgis.infrastructure;

import java.util.List;

public record WorkspaceConfigResponse(
    String activeEditableLayerId,
    List<WorkspaceLayerDefinition> layers,
    WorkspaceLayout layout) {}
