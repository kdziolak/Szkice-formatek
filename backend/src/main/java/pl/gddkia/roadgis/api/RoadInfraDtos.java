package pl.gddkia.roadgis.api;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class RoadInfraDtos {

  private RoadInfraDtos() {
  }

  public record RoadDto(
      UUID id,
      String roadNumber,
      String category,
      String name,
      String managingAuthority,
      BigDecimal totalLengthKm
  ) {
  }

  public record ReferenceSegmentDto(
      UUID id,
      UUID roadId,
      String roadNumber,
      String segmentCode,
      BigDecimal startMileageKm,
      BigDecimal endMileageKm,
      String carriageway,
      String direction,
      String status,
      LocalDate validFrom,
      LocalDate validTo,
      JsonNode geometry
  ) {
  }

  public record InfrastructureObjectDto(
      UUID id,
      String objectType,
      String objectCode,
      String name,
      UUID roadId,
      String roadNumber,
      UUID referenceSegmentId,
      String referenceSegmentCode,
      BigDecimal globalMileageFrom,
      BigDecimal globalMileageTo,
      BigDecimal localMileageFrom,
      BigDecimal localMileageTo,
      JsonNode geometry,
      String geometryType,
      String owner,
      String branch,
      String district,
      String status,
      String validationStatus,
      String draftStatus,
      LocalDate validFrom,
      LocalDate validTo,
      String createdBy,
      Instant createdAt,
      Instant updatedAt,
      JsonNode attributes
  ) {
  }

  public record InfrastructureObjectRequest(
      String objectType,
      String objectCode,
      String name,
      UUID roadId,
      UUID referenceSegmentId,
      BigDecimal globalMileageFrom,
      BigDecimal globalMileageTo,
      BigDecimal localMileageFrom,
      BigDecimal localMileageTo,
      JsonNode geometry,
      String geometryType,
      String owner,
      String branch,
      String district,
      String status,
      String validationStatus,
      String draftStatus,
      JsonNode attributes
  ) {
  }

  public record ReferenceBindingDto(
      UUID referenceSegmentId,
      String referenceSegmentCode,
      UUID roadId,
      String roadNumber,
      BigDecimal mileageFrom,
      BigDecimal mileageTo,
      String locationMethod,
      String consistencyStatus
  ) {
  }

  public record RoadSectionDto(
      UUID id,
      String businessId,
      UUID roadId,
      String roadNumber,
      UUID referenceSegmentId,
      String referenceSegmentCode,
      String sectionCode,
      String name,
      BigDecimal kilometerFrom,
      BigDecimal kilometerTo,
      String carriageway,
      String direction,
      JsonNode geometry,
      String status,
      String validationStatus,
      String draftStatus,
      LocalDate validFrom,
      LocalDate validTo,
      Instant updatedAt,
      ReferenceBindingDto referenceBinding
  ) {
  }

  public record RoadSectionUpdateRequest(
      String name,
      BigDecimal kilometerFrom,
      BigDecimal kilometerTo,
      UUID referenceSegmentId,
      JsonNode geometry,
      String status
  ) {
  }

  public record BindReferenceSegmentRequest(UUID referenceSegmentId) {
  }

  public record LayerDto(
      String layerCode,
      String layerName,
      String groupName,
      String geometryType,
      boolean visibleByDefault,
      String minScaleLabel,
      String styleHint
  ) {
  }

  public record WorkspaceRequest(String name, String createdBy, JsonNode scopeGeometry) {
  }

  public record WorkspaceObjectRequest(UUID objectId) {
  }

  public record WorkspaceRoadSectionRequest(UUID roadSectionId) {
  }

  public record WorkspaceDto(
      UUID id,
      String name,
      String createdBy,
      String status,
      Instant createdAt,
      Instant closedAt,
      JsonNode scopeGeometry,
      int objectCount,
      int blockingIssueCount
  ) {
  }

  public record WorkspaceObjectUpdateRequest(
      String name,
      BigDecimal globalMileageFrom,
      BigDecimal globalMileageTo,
      UUID referenceSegmentId,
      JsonNode geometry,
      JsonNode attributes
  ) {
  }

  public record ValidationIssueDto(
      UUID id,
      UUID objectId,
      String objectCode,
      String targetType,
      UUID targetId,
      String targetCode,
      String severity,
      String issueType,
      String fieldName,
      String message,
      JsonNode geometryMarker,
      Instant createdAt,
      boolean resolved
  ) {
  }

  public record ImportJobDto(
      UUID id,
      String importType,
      String sourceName,
      String status,
      int importedCount,
      int rejectedCount,
      Instant createdAt,
      JsonNode errorReport
  ) {
  }

  public record ReportRowDto(Map<String, Object> values) {
  }

  public record ExportJobDto(
      UUID id,
      String exportType,
      String format,
      String status,
      String createdBy,
      Instant createdAt,
      String downloadPath
  ) {
  }

  public record HistoryDto(
      UUID id,
      UUID objectId,
      String operationType,
      String fieldName,
      String oldValue,
      String newValue,
      String changedBy,
      Instant changedAt,
      String reason
  ) {
  }

  public record ObjectValidationResponse(
      UUID objectId,
      String validationStatus,
      List<ValidationIssueDto> issues
  ) {
  }

  public record RoadSectionValidationResponse(
      UUID roadSectionId,
      String validationStatus,
      List<ValidationIssueDto> issues
  ) {
  }
}
