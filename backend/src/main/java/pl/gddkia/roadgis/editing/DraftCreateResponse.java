package pl.gddkia.roadgis.editing;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DraftCreateResponse(
    UUID draftId,
    String draftName,
    DraftScope draftScope,
    DraftStatus draftStatus,
    OffsetDateTime createdAt) {}
