package pl.gddkia.roadgis.validation;

import java.util.UUID;
import pl.gddkia.roadgis.domain.ValidationSeverity;
import pl.gddkia.roadgis.domain.ValidationStatus;

public record ValidationIssueDraft(
    String targetType,
    UUID targetId,
    String targetCode,
    UUID objectId,
    ValidationSeverity severity,
    ValidationStatus status,
    String issueType,
    String fieldName,
    String message
) {
  public ValidationIssueDraft(
      UUID objectId,
      ValidationSeverity severity,
      ValidationStatus status,
      String issueType,
      String fieldName,
      String message
  ) {
    this("INFRASTRUCTURE_OBJECT", objectId, null, objectId, severity, status, issueType, fieldName, message);
  }
}
