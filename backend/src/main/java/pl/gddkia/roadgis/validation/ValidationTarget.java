package pl.gddkia.roadgis.validation;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import pl.gddkia.roadgis.domain.DraftStatus;
import pl.gddkia.roadgis.domain.GeometryType;

public record ValidationTarget(
    UUID id,
    String objectType,
    String objectCode,
    GeometryType geometryType,
    JsonNode geometry,
    UUID referenceSegmentId,
    BigDecimal globalMileageFrom,
    BigDecimal globalMileageTo,
    Map<String, Object> attributes,
    DraftStatus draftStatus
) {

  public Object attribute(String key) {
    return attributes == null ? null : attributes.get(key);
  }
}
