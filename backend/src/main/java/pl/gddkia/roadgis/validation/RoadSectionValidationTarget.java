package pl.gddkia.roadgis.validation;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.UUID;
import pl.gddkia.roadgis.domain.DraftStatus;

public record RoadSectionValidationTarget(
    UUID id,
    String sectionCode,
    UUID referenceSegmentId,
    BigDecimal kilometerFrom,
    BigDecimal kilometerTo,
    JsonNode geometry,
    DraftStatus draftStatus
) {
}
