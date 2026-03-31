package pl.gddkia.roadgis.editing;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DraftCommandResponse(
    UUID draftCommandId,
    UUID draftId,
    DraftEntityType entityType,
    DraftActionType actionType,
    UUID targetBusinessId,
    DraftValidationState validationState,
    DraftConflictState conflictState,
    OffsetDateTime receivedAt) {}
