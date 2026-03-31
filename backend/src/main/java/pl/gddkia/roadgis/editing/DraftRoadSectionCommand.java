package pl.gddkia.roadgis.editing;

import java.util.UUID;

public record DraftRoadSectionCommand(
    UUID draftCommandId,
    UUID targetBusinessId,
    DraftActionType actionType,
    String payloadJson,
    String geometryWkt,
    Integer srid) {}
