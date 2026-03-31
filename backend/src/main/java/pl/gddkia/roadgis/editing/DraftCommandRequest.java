package pl.gddkia.roadgis.editing;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import pl.gddkia.roadgis.common.GeoJsonGeometry;

public record DraftCommandRequest(
    @NotNull DraftEntityType entityType,
    @NotNull DraftActionType actionType,
    UUID targetBusinessId,
    @NotNull JsonNode payload,
    GeoJsonGeometry geometry) {}
