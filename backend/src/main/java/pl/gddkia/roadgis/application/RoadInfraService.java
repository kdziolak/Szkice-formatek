package pl.gddkia.roadgis.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.core.type.TypeReference;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.gddkia.roadgis.api.RoadInfraDtos.BindReferenceSegmentRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.ExportJobDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.HistoryDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.ImportJobDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.InfrastructureObjectDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.InfrastructureObjectRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.LayerDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.ObjectValidationResponse;
import pl.gddkia.roadgis.api.RoadInfraDtos.ReferenceSegmentDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.ReportRowDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionUpdateRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.ValidationIssueDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceObjectRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceObjectUpdateRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRoadSectionRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRequest;
import pl.gddkia.roadgis.common.OperatorContext;
import pl.gddkia.roadgis.domain.DraftStatus;
import pl.gddkia.roadgis.domain.GeometryType;
import pl.gddkia.roadgis.domain.ValidationSeverity;
import pl.gddkia.roadgis.domain.ValidationStatus;
import pl.gddkia.roadgis.infrastructure.RoadInfraRepository;
import pl.gddkia.roadgis.validation.InfrastructureObjectValidator;
import pl.gddkia.roadgis.validation.ReferenceMileageRange;
import pl.gddkia.roadgis.validation.RoadSectionValidationTarget;
import pl.gddkia.roadgis.validation.RoadSectionValidator;
import pl.gddkia.roadgis.validation.ValidationIssueDraft;
import pl.gddkia.roadgis.validation.ValidationTarget;

@Service
public class RoadInfraService {

  private static final Set<String> OPEN_WORKSPACE_STATUSES = Set.of("AKTYWNY", "W_WALIDACJI");
  private static final TypeReference<Map<String, Object>> ATTRIBUTES_TYPE = new TypeReference<>() {
  };

  private final RoadInfraRepository repository;
  private final InfrastructureObjectValidator validator;
  private final RoadSectionValidator roadSectionValidator;
  private final ObjectMapper objectMapper;
  private final OperatorContext operatorContext;

  public RoadInfraService(RoadInfraRepository repository, ObjectMapper objectMapper, OperatorContext operatorContext) {
    this.repository = repository;
    this.objectMapper = objectMapper;
    this.operatorContext = operatorContext;
    this.validator = new InfrastructureObjectValidator();
    this.roadSectionValidator = new RoadSectionValidator();
  }

  public List<RoadDto> listRoads() {
    return repository.listRoads();
  }

  public List<ReferenceSegmentDto> listReferenceSegments(String roadNumber) {
    return repository.listReferenceSegments(roadNumber);
  }

  public ReferenceSegmentDto nearestReferenceSegment(BigDecimal lat, BigDecimal lon, String roadNumber) {
    return repository.nearestReferenceSegment(lat, lon, roadNumber);
  }

  public List<InfrastructureObjectDto> listInfrastructureObjects(String objectType, String status) {
    return repository.listInfrastructureObjects(objectType, status);
  }

  public InfrastructureObjectDto getInfrastructureObject(UUID id) {
    return repository.getInfrastructureObject(id);
  }

  public List<RoadSectionDto> listRoadSections(String roadNumber, String status) {
    return repository.listRoadSections(roadNumber, status);
  }

  public RoadSectionDto getRoadSection(UUID id) {
    return repository.getRoadSection(id);
  }

  @Transactional
  public InfrastructureObjectDto createInfrastructureObject(InfrastructureObjectRequest request) {
    String operator = currentOperator();
    UUID id = repository.createInfrastructureObject(request);
    repository.addHistory(id, "CREATE", null, null, request.name(), operator,
        "Utworzenie obiektu infrastruktury w prototypie.");
    return repository.getInfrastructureObject(id);
  }

  @Transactional
  public InfrastructureObjectDto updateInfrastructureObject(UUID id, InfrastructureObjectRequest request) {
    String operator = currentOperator();
    InfrastructureObjectDto before = repository.getInfrastructureObject(id);
    repository.updateInfrastructureObject(id, request);
    repository.addHistory(id, "UPDATE", "object", before.name(), request.name(), operator,
        "Aktualizacja atrybutow lub geometrii obiektu.");
    return repository.getInfrastructureObject(id);
  }

  @Transactional
  public InfrastructureObjectDto bindReferenceSegment(UUID id, BindReferenceSegmentRequest request) {
    String operator = currentOperator();
    ReferenceSegmentDto segment = repository.getReferenceSegment(request.referenceSegmentId());
    repository.bindReferenceSegment(id, segment.roadId(), request.referenceSegmentId(),
        segment.startMileageKm(), segment.endMileageKm());
    repository.addHistory(id, "BIND_REFERENCE_SEGMENT", "referenceSegmentId", null,
        request.referenceSegmentId().toString(), operator, "Dowiazanie obiektu do systemu referencyjnego.");
    return repository.getInfrastructureObject(id);
  }

  @Transactional
  public ObjectValidationResponse validateInfrastructureObject(UUID id) {
    InfrastructureObjectDto object = repository.getInfrastructureObject(id);
    List<ValidationIssueDraft> issueDrafts = validator.validate(toValidationTarget(object), referenceRange(object));
    repository.replaceValidationIssues(id, issueDrafts);
    String status = issueDrafts.stream().anyMatch(issue -> issue.severity() == ValidationSeverity.BLOCKING)
        ? dominantStatus(issueDrafts)
        : ValidationStatus.OK.name();
    repository.updateValidationStatus(id, status);
    return new ObjectValidationResponse(id, status, repository.listValidationIssuesForObject(id));
  }

  public List<LayerDto> listLayers() {
    return repository.listLayers();
  }

  public JsonNode layerFeatures(String layerCode) {
    return repository.layerFeatures(layerCode);
  }

  @Transactional
  public WorkspaceDto createWorkspace(WorkspaceRequest request) {
    WorkspaceRequest trustedRequest = new WorkspaceRequest(
        request.name(),
        operatorContext.currentOperatorOr(request.createdBy()),
        request.scopeGeometry());
    UUID id = repository.createWorkspace(trustedRequest);
    return repository.getWorkspace(id);
  }

  public List<WorkspaceDto> listWorkspaces() {
    return repository.listWorkspaces();
  }

  public WorkspaceDto getWorkspace(UUID id) {
    return repository.getWorkspace(id);
  }

  @Transactional
  public WorkspaceDto addObjectToWorkspace(UUID workspaceId, WorkspaceObjectRequest request) {
    String operator = currentOperator();
    requireOpenWorkspace(workspaceId);
    InfrastructureObjectDto object = repository.getInfrastructureObject(request.objectId());
    repository.addObjectToWorkspace(workspaceId, object, operator);
    repository.addHistory(request.objectId(), "ADD_TO_WORKSPACE", "draftStatus", object.draftStatus(),
        DraftStatus.DODANY_DO_WERSJI_ROBOCZEJ.name(), operator, "Dodanie obiektu do wersji roboczej.");
    return repository.getWorkspace(workspaceId);
  }

  @Transactional
  public InfrastructureObjectDto updateWorkspaceObject(
      UUID workspaceId,
      UUID objectId,
      WorkspaceObjectUpdateRequest request
  ) {
    String operator = currentOperator();
    requireOpenWorkspace(workspaceId);
    InfrastructureObjectDto updated = repository.updateWorkspaceObject(workspaceId, objectId, request, operator);
    repository.addHistory(objectId, "WORKSPACE_UPDATE", "currentSnapshot", null, "updated", operator,
        "Zmiana robocza w workspace.");
    return updated;
  }

  @Transactional
  public InfrastructureObjectDto bindWorkspaceObjectReferenceSegment(
      UUID workspaceId,
      UUID objectId,
      BindReferenceSegmentRequest request
  ) {
    String operator = currentOperator();
    requireOpenWorkspace(workspaceId);
    InfrastructureObjectDto current = repository.getWorkspaceObjectSnapshot(workspaceId, objectId);
    ReferenceSegmentDto segment = repository.getReferenceSegment(request.referenceSegmentId());
    WorkspaceObjectUpdateRequest updateRequest = new WorkspaceObjectUpdateRequest(
        current.name(),
        current.globalMileageFrom() == null ? segment.startMileageKm() : current.globalMileageFrom(),
        current.globalMileageTo() == null ? segment.endMileageKm() : current.globalMileageTo(),
        request.referenceSegmentId(),
        current.geometry(),
        current.attributes()
    );
    InfrastructureObjectDto updated = repository.updateWorkspaceObject(workspaceId, objectId, updateRequest, operator);
    repository.addHistory(objectId, "WORKSPACE_BIND_REFERENCE_SEGMENT", "referenceSegmentId", null,
        request.referenceSegmentId().toString(), operator,
        "Robocze dowiazanie obiektu do systemu referencyjnego.");
    return updated;
  }

  @Transactional
  public WorkspaceDto addRoadSectionToWorkspace(UUID workspaceId, WorkspaceRoadSectionRequest request) {
    String operator = currentOperator();
    requireOpenWorkspace(workspaceId);
    RoadSectionDto section = repository.getRoadSection(request.roadSectionId());
    repository.addRoadSectionToWorkspace(workspaceId, section, operator);
    return repository.getWorkspace(workspaceId);
  }

  @Transactional
  public RoadSectionDto updateWorkspaceRoadSection(
      UUID workspaceId,
      UUID roadSectionId,
      RoadSectionUpdateRequest request
  ) {
    String operator = currentOperator();
    requireOpenWorkspace(workspaceId);
    return repository.updateWorkspaceRoadSection(workspaceId, roadSectionId, request, operator);
  }

  @Transactional
  public RoadSectionDto bindWorkspaceRoadSectionReferenceSegment(
      UUID workspaceId,
      UUID roadSectionId,
      BindReferenceSegmentRequest request
  ) {
    String operator = currentOperator();
    requireOpenWorkspace(workspaceId);
    RoadSectionDto current = repository.getWorkspaceRoadSectionSnapshot(workspaceId, roadSectionId);
    ReferenceSegmentDto segment = repository.getReferenceSegment(request.referenceSegmentId());
    RoadSectionUpdateRequest updateRequest = new RoadSectionUpdateRequest(
        current.name(),
        current.kilometerFrom() == null ? segment.startMileageKm() : current.kilometerFrom(),
        current.kilometerTo() == null ? segment.endMileageKm() : current.kilometerTo(),
        request.referenceSegmentId(),
        current.geometry(),
        current.status()
    );
    return repository.updateWorkspaceRoadSection(workspaceId, roadSectionId, updateRequest, operator);
  }

  @Transactional
  public List<ValidationIssueDto> validateWorkspace(UUID workspaceId) {
    requireOpenWorkspace(workspaceId);
    List<UUID> objectIds = repository.listWorkspaceObjectIds(workspaceId);
    for (UUID objectId : objectIds) {
      InfrastructureObjectDto draft = repository.getWorkspaceObjectSnapshot(workspaceId, objectId);
      List<ValidationIssueDraft> issueDrafts = validator.validate(toValidationTarget(draft), referenceRange(draft));
      repository.replaceValidationIssues(objectId, draft.geometry(), issueDrafts);
      repository.updateWorkspaceObjectValidationStatus(workspaceId, objectId, statusForIssues(issueDrafts));
    }
    List<UUID> roadSectionIds = repository.listWorkspaceRoadSectionIds(workspaceId);
    for (UUID roadSectionId : roadSectionIds) {
      RoadSectionDto draft = repository.getWorkspaceRoadSectionSnapshot(workspaceId, roadSectionId);
      List<ValidationIssueDraft> issueDrafts = roadSectionValidator.validate(
          toRoadSectionValidationTarget(draft),
          referenceRange(draft));
      repository.replaceRoadSectionValidationIssues(roadSectionId, draft.geometry(), issueDrafts);
      repository.updateWorkspaceRoadSectionValidationStatus(workspaceId, roadSectionId, statusForIssues(issueDrafts));
    }
    repository.updateWorkspaceStatus(workspaceId, "W_WALIDACJI");
    return repository.listValidationIssuesForWorkspace(workspaceId);
  }

  @Transactional
  public WorkspaceDto finalizeWorkspace(UUID workspaceId) {
    String operator = currentOperator();
    List<ValidationIssueDto> issues = validateWorkspace(workspaceId);
    List<ValidationIssueDto> blocking = issues.stream()
        .filter(issue -> "BLOCKING".equals(issue.severity()))
        .toList();
    if (!blocking.isEmpty()) {
      repository.updateWorkspaceStatus(workspaceId, "W_WALIDACJI");
      return repository.getWorkspace(workspaceId);
    }
    List<UUID> objectIds = repository.listWorkspaceObjectIds(workspaceId);
    for (UUID objectId : objectIds) {
      InfrastructureObjectDto draft = repository.getWorkspaceObjectSnapshot(workspaceId, objectId);
      String validationStatus = issues.stream().anyMatch(issue -> objectId.equals(issue.targetId()))
          ? ValidationStatus.OSTRZEZENIE.name()
          : ValidationStatus.OK.name();
      repository.updateInfrastructureObject(objectId, finalRequestFromDraft(draft, validationStatus));
      repository.addHistory(objectId, "FINALIZE_WORKSPACE", "draftStatus", draft.draftStatus(),
          DraftStatus.ZAPISANY_DO_BAZY_FINALNEJ.name(), operator, "Zapis wersji roboczej do bazy finalnej.");
    }
    List<UUID> roadSectionIds = repository.listWorkspaceRoadSectionIds(workspaceId);
    for (UUID roadSectionId : roadSectionIds) {
      RoadSectionDto draft = repository.getWorkspaceRoadSectionSnapshot(workspaceId, roadSectionId);
      String validationStatus = issues.stream()
          .anyMatch(issue -> "ROAD_SECTION".equals(issue.targetType()) && roadSectionId.equals(issue.targetId()))
          ? ValidationStatus.OSTRZEZENIE.name()
          : ValidationStatus.OK.name();
      repository.updateRoadSectionFromDraft(roadSectionId, finalRoadSectionRequestFromDraft(draft), validationStatus);
    }
    repository.finalizeWorkspace(workspaceId);
    return repository.getWorkspace(workspaceId);
  }

  @Transactional
  public WorkspaceDto rejectWorkspace(UUID workspaceId) {
    requireOpenWorkspace(workspaceId);
    repository.rejectWorkspace(workspaceId);
    return repository.getWorkspace(workspaceId);
  }

  @Transactional
  public ImportJobDto importGeoJson(JsonNode payload) {
    String operator = currentOperator();
    UUID jobId = repository.createImportJob("GEOJSON", "request-body");
    JsonNode features = payload.path("features");
    int imported = 0;
    if (features.isArray()) {
      for (JsonNode feature : features) {
        InfrastructureObjectRequest request = requestFromFeature(feature);
        UUID objectId = repository.createInfrastructureObject(request);
        validateImportedObject(objectId);
        repository.addHistory(objectId, "IMPORT_GEOJSON", null, null, request.objectCode(), operator,
            "Import do danych roboczych z GeoJSON.");
        imported++;
      }
    }
    repository.finishImportJob(jobId, imported, 0, objectMapper.createObjectNode());
    return repository.getImportJob(jobId);
  }

  @Transactional
  public ImportJobDto importCsv(String csvBody) {
    UUID jobId = repository.createImportJob("CSV", "request-body.csv");
    int lineCount = (int) csvBody.lines().skip(1).filter(line -> !line.isBlank()).count();
    ObjectNode report = objectMapper.createObjectNode();
    report.put("note", "CSV parser prototypowy rejestruje zadanie i liczbe rekordow; mapowanie pol jest opisane w dokumentacji.");
    repository.finishImportJob(jobId, 0, lineCount, report);
    return repository.getImportJob(jobId);
  }

  public ImportJobDto getImportJob(UUID id) {
    return repository.getImportJob(id);
  }

  public List<ValidationIssueDto> validationIssuesReport() {
    return repository.listValidationIssues();
  }

  public List<ReportRowDto> roadInventoryReport(String roadNumber) {
    return repository.roadInventoryReport(roadNumber);
  }

  public List<ReportRowDto> trafficStationsReport() {
    return repository.trafficStationsReport();
  }

  public JsonNode exportObjectsGeoJson() {
    return toFeatureCollection(repository.listInfrastructureObjects(null, null));
  }

  public String exportObjectsCsv() {
    StringBuilder csv = new StringBuilder("id,objectCode,objectType,name,roadNumber,globalMileageFrom,globalMileageTo,status,validationStatus,draftStatus\n");
    for (InfrastructureObjectDto object : repository.listInfrastructureObjects(null, null)) {
      csv.append(object.id()).append(',')
          .append(csv(object.objectCode())).append(',')
          .append(csv(object.objectType())).append(',')
          .append(csv(object.name())).append(',')
          .append(csv(object.roadNumber())).append(',')
          .append(value(object.globalMileageFrom())).append(',')
          .append(value(object.globalMileageTo())).append(',')
          .append(csv(object.status())).append(',')
          .append(csv(object.validationStatus())).append(',')
          .append(csv(object.draftStatus())).append('\n');
    }
    return csv.toString();
  }

  public List<HistoryDto> historyForObject(UUID objectId) {
    return repository.historyForObject(objectId);
  }

  public ExportJobDto registerExport(String exportType, String format) {
    return new ExportJobDto(UUID.randomUUID(), exportType, format, "READY", currentOperator(), Instant.now(), "/api/export/objects." + format.toLowerCase());
  }

  private String currentOperator() {
    return operatorContext.currentOperatorOr("system");
  }

  private ValidationTarget toValidationTarget(InfrastructureObjectDto object) {
    return new ValidationTarget(
        object.id(),
        object.objectType(),
        object.objectCode(),
        geometryType(object.geometryType()),
        object.geometry(),
        object.referenceSegmentId(),
        object.globalMileageFrom(),
        object.globalMileageTo(),
        object.attributes() == null ? Map.of() : objectMapper.convertValue(object.attributes(), ATTRIBUTES_TYPE),
        DraftStatus.valueOf(object.draftStatus())
    );
  }

  private ReferenceMileageRange referenceRange(InfrastructureObjectDto object) {
    if (object.referenceSegmentId() == null) {
      return ReferenceMileageRange.none();
    }
    ReferenceSegmentDto segment = repository.getReferenceSegment(object.referenceSegmentId());
    return ReferenceMileageRange.of(segment.startMileageKm(), segment.endMileageKm());
  }

  private RoadSectionValidationTarget toRoadSectionValidationTarget(RoadSectionDto section) {
    return new RoadSectionValidationTarget(
        section.id(),
        section.sectionCode(),
        section.referenceSegmentId(),
        section.kilometerFrom(),
        section.kilometerTo(),
        section.geometry(),
        DraftStatus.valueOf(section.draftStatus())
    );
  }

  private ReferenceMileageRange referenceRange(RoadSectionDto section) {
    if (section.referenceSegmentId() == null) {
      return ReferenceMileageRange.none();
    }
    ReferenceSegmentDto segment = repository.getReferenceSegment(section.referenceSegmentId());
    return ReferenceMileageRange.of(segment.startMileageKm(), segment.endMileageKm());
  }

  private String dominantStatus(List<ValidationIssueDraft> issues) {
    return issues.stream()
        .filter(issue -> issue.severity() == ValidationSeverity.BLOCKING)
        .findFirst()
        .map(issue -> issue.status().name())
        .orElse(ValidationStatus.OSTRZEZENIE.name());
  }

  private String statusForIssues(List<ValidationIssueDraft> issues) {
    if (issues.stream().anyMatch(issue -> issue.severity() == ValidationSeverity.BLOCKING)) {
      return dominantStatus(issues);
    }
    return issues.isEmpty() ? ValidationStatus.OK.name() : ValidationStatus.OSTRZEZENIE.name();
  }

  private InfrastructureObjectRequest finalRequestFromDraft(InfrastructureObjectDto draft, String validationStatus) {
    return new InfrastructureObjectRequest(
        draft.objectType(),
        draft.objectCode(),
        draft.name(),
        draft.roadId(),
        draft.referenceSegmentId(),
        draft.globalMileageFrom(),
        draft.globalMileageTo(),
        draft.localMileageFrom(),
        draft.localMileageTo(),
        draft.geometry(),
        draft.geometryType(),
        draft.owner(),
        draft.branch(),
        draft.district(),
        "AKTYWNY",
        validationStatus,
        DraftStatus.NIE_DOTYCZY.name(),
        draft.attributes());
  }

  private RoadSectionUpdateRequest finalRoadSectionRequestFromDraft(RoadSectionDto draft) {
    return new RoadSectionUpdateRequest(
        draft.name(),
        draft.kilometerFrom(),
        draft.kilometerTo(),
        draft.referenceSegmentId(),
        draft.geometry(),
        "AKTYWNY");
  }

  private WorkspaceDto requireOpenWorkspace(UUID workspaceId) {
    WorkspaceDto workspace = repository.getWorkspace(workspaceId);
    if (!OPEN_WORKSPACE_STATUSES.contains(workspace.status())) {
      throw new IllegalStateException("Workspace jest zamkniety i nie moze przyjmowac zmian roboczych.");
    }
    return workspace;
  }

  private ObjectNode toFeatureCollection(List<InfrastructureObjectDto> objects) {
    ObjectNode collection = objectMapper.createObjectNode();
    collection.put("type", "FeatureCollection");
    ArrayNode features = collection.putArray("features");
    for (InfrastructureObjectDto object : objects) {
      features.add(toFeature(object));
    }
    return collection;
  }

  private ObjectNode toFeature(InfrastructureObjectDto object) {
    ObjectNode feature = objectMapper.createObjectNode();
    feature.put("type", "Feature");
    feature.set("geometry", object.geometry());
    ObjectNode properties = feature.putObject("properties");
    properties.put("id", object.id().toString());
    properties.put("objectType", object.objectType());
    properties.put("objectCode", object.objectCode());
    properties.put("name", object.name());
    properties.put("roadNumber", object.roadNumber());
    properties.put("status", object.status());
    properties.put("validationStatus", object.validationStatus());
    properties.put("draftStatus", object.draftStatus());
    properties.put("referenceSegmentCode", object.referenceSegmentCode());
    properties.put("branch", object.branch());
    properties.put("district", object.district());
    properties.set("attributes", object.attributes());
    return feature;
  }

  private InfrastructureObjectRequest requestFromFeature(JsonNode feature) {
    JsonNode properties = feature.path("properties");
    String objectType = properties.path("objectType").asText("IMPORTED_OBJECT");
    JsonNode geometry = feature.path("geometry");
    String geometryType = normalizeGeometryType(geometry.path("type").asText("Point"));
    return new InfrastructureObjectRequest(
        objectType,
        properties.path("objectCode").asText("IMP-" + UUID.randomUUID().toString().substring(0, 8)),
        properties.path("name").asText("Obiekt importowany"),
        null,
        null,
        null,
        null,
        null,
        null,
        geometry,
        geometryType,
        properties.path("owner").asText("Nieustalony"),
        properties.path("branch").asText("Oddzial Warszawa"),
        properties.path("district").asText("Rejon Warszawa"),
        "NOWY",
        "WYMAGA_WERYFIKACJI_OPERATORA",
        "DODANY_DO_WERSJI_ROBOCZEJ",
        properties
    );
  }

  private void validateImportedObject(UUID objectId) {
    InfrastructureObjectDto imported = repository.getInfrastructureObject(objectId);
    List<ValidationIssueDraft> issueDrafts = validator.validate(toValidationTarget(imported), referenceRange(imported));
    repository.replaceValidationIssues(objectId, imported.geometry(), issueDrafts);
    repository.updateValidationStatus(objectId, statusForIssues(issueDrafts));
  }

  private GeometryType geometryType(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return GeometryType.valueOf(value);
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }

  private String normalizeGeometryType(String geoJsonType) {
    String normalized = geoJsonType == null ? "" : geoJsonType.trim();
    return switch (normalized) {
      case "Point" -> GeometryType.POINT.name();
      case "LineString" -> GeometryType.LINESTRING.name();
      case "Polygon" -> GeometryType.POLYGON.name();
      default -> normalized.isBlank() ? null : normalized.toUpperCase(Locale.ROOT);
    };
  }

  private String csv(String value) {
    if (value == null) {
      return "";
    }
    return "\"" + value.replace("\"", "\"\"") + "\"";
  }

  private String value(BigDecimal value) {
    return value == null ? "" : value.toPlainString();
  }
}
