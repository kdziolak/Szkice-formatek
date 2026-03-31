package pl.gddkia.roadgis.infrastructure;

public record WorkspaceLayout(
    String mode,
    int leftPanelWidth,
    int rightPanelWidth,
    int bottomPanelHeight) {}
