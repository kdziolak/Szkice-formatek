package pl.gddkia.roadgis.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import pl.gddkia.roadgis.api.RoadInfraDtos.InfrastructureObjectDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.InfrastructureObjectRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.ReferenceSegmentDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.ReferenceBindingDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionUpdateRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRoadSectionRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRequest;
import pl.gddkia.roadgis.common.OperatorContext;
import pl.gddkia.roadgis.config.RoadgisSecurityProperties;
import pl.gddkia.roadgis.infrastructure.RoadInfraRepository;

@ExtendWith(MockitoExtension.class)
class RoadInfraServiceTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Mock
  private RoadInfraRepository repository;

  private RoadInfraService service;

  @BeforeEach
  void setUp() {
    service = new RoadInfraService(repository, objectMapper, operatorContext(false));
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void createWorkspaceOverridesClientAuthorWhenSecurityIsEnabled() {
    UUID workspaceId = UUID.randomUUID();
    service = new RoadInfraService(repository, objectMapper, operatorContext(true));
    Jwt jwt = Jwt.withTokenValue("secure-token")
        .header("alg", "none")
        .subject("jwt-subject")
        .claim("preferred_username", "jwt.operator")
        .build();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));

    when(repository.createWorkspace(any(WorkspaceRequest.class))).thenReturn(workspaceId);
    when(repository.getWorkspace(workspaceId)).thenReturn(workspace(workspaceId, "AKTYWNY"));

    service.createWorkspace(new WorkspaceRequest("Workspace", "client.operator", objectMapper.nullNode()));

    ArgumentCaptor<WorkspaceRequest> requestCaptor = ArgumentCaptor.forClass(WorkspaceRequest.class);
    verify(repository).createWorkspace(requestCaptor.capture());
    assertThat(requestCaptor.getValue().createdBy()).isEqualTo("jwt.operator");
  }

  @Test
  void finalizeWorkspaceWritesFinalObjectWithoutActiveDraftStatus() throws Exception {
    UUID workspaceId = UUID.randomUUID();
    UUID objectId = UUID.randomUUID();
    UUID roadId = UUID.randomUUID();
    UUID segmentId = UUID.randomUUID();
    InfrastructureObjectDto draft = infrastructureObject(objectId, roadId, segmentId);

    when(repository.getWorkspace(workspaceId))
        .thenReturn(workspace(workspaceId, "AKTYWNY"))
        .thenReturn(workspace(workspaceId, "SFINALIZOWANY"));
    when(repository.listWorkspaceObjectIds(workspaceId)).thenReturn(List.of(objectId));
    when(repository.getWorkspaceObjectSnapshot(workspaceId, objectId)).thenReturn(draft);
    when(repository.getReferenceSegment(segmentId)).thenReturn(referenceSegment(segmentId, roadId));
    when(repository.listValidationIssuesForWorkspace(workspaceId)).thenReturn(List.of());

    service.finalizeWorkspace(workspaceId);

    ArgumentCaptor<InfrastructureObjectRequest> requestCaptor = ArgumentCaptor.forClass(InfrastructureObjectRequest.class);
    verify(repository).updateInfrastructureObject(eq(objectId), requestCaptor.capture());
    assertThat(requestCaptor.getValue().draftStatus()).isEqualTo("NIE_DOTYCZY");
    verify(repository).finalizeWorkspace(workspaceId);
  }

  @Test
  void rejectWorkspaceIsBlockedForClosedWorkspace() {
    UUID workspaceId = UUID.randomUUID();
    when(repository.getWorkspace(workspaceId)).thenReturn(workspace(workspaceId, "SFINALIZOWANY"));

    assertThatThrownBy(() -> service.rejectWorkspace(workspaceId))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Workspace jest zamkniety");

    verify(repository, never()).rejectWorkspace(workspaceId);
  }

  @Test
  void addRoadSectionToWorkspaceCopiesSectionSnapshot() throws Exception {
    UUID workspaceId = UUID.randomUUID();
    UUID roadId = UUID.randomUUID();
    UUID segmentId = UUID.randomUUID();
    UUID roadSectionId = UUID.randomUUID();
    RoadSectionDto section = roadSection(roadSectionId, roadId, segmentId);

    when(repository.getWorkspace(workspaceId))
        .thenReturn(workspace(workspaceId, "AKTYWNY"))
        .thenReturn(workspace(workspaceId, "AKTYWNY"));
    when(repository.getRoadSection(roadSectionId)).thenReturn(section);

    service.addRoadSectionToWorkspace(workspaceId, new WorkspaceRoadSectionRequest(roadSectionId));

    verify(repository).addRoadSectionToWorkspace(workspaceId, section, "system");
  }

  @Test
  void updateRoadSectionDraftUsesWorkspaceRepository() throws Exception {
    UUID workspaceId = UUID.randomUUID();
    UUID roadId = UUID.randomUUID();
    UUID segmentId = UUID.randomUUID();
    UUID roadSectionId = UUID.randomUUID();
    RoadSectionUpdateRequest request = new RoadSectionUpdateRequest(
        "Odcinek po korekcie",
        new BigDecimal("12.100"),
        new BigDecimal("12.900"),
        segmentId,
        lineString(),
        "AKTYWNY");
    when(repository.getWorkspace(workspaceId)).thenReturn(workspace(workspaceId, "AKTYWNY"));
    when(repository.updateWorkspaceRoadSection(workspaceId, roadSectionId, request, "system"))
        .thenReturn(roadSection(roadSectionId, roadId, segmentId));

    service.updateWorkspaceRoadSection(workspaceId, roadSectionId, request);

    verify(repository).updateWorkspaceRoadSection(workspaceId, roadSectionId, request, "system");
    verify(repository, never()).updateInfrastructureObject(eq(roadSectionId), org.mockito.ArgumentMatchers.any());
  }

  @Test
  void finalizeWorkspaceWritesRoadSectionDraftWhenValidationPasses() throws Exception {
    UUID workspaceId = UUID.randomUUID();
    UUID roadId = UUID.randomUUID();
    UUID segmentId = UUID.randomUUID();
    UUID roadSectionId = UUID.randomUUID();
    RoadSectionDto draft = roadSection(roadSectionId, roadId, segmentId);

    when(repository.getWorkspace(workspaceId))
        .thenReturn(workspace(workspaceId, "AKTYWNY"))
        .thenReturn(workspace(workspaceId, "SFINALIZOWANY"));
    when(repository.listWorkspaceObjectIds(workspaceId)).thenReturn(List.of());
    when(repository.listWorkspaceRoadSectionIds(workspaceId)).thenReturn(List.of(roadSectionId));
    when(repository.getWorkspaceRoadSectionSnapshot(workspaceId, roadSectionId)).thenReturn(draft);
    when(repository.getReferenceSegment(segmentId)).thenReturn(referenceSegment(segmentId, roadId));
    when(repository.listValidationIssuesForWorkspace(workspaceId)).thenReturn(List.of());

    service.finalizeWorkspace(workspaceId);

    ArgumentCaptor<RoadSectionUpdateRequest> requestCaptor = ArgumentCaptor.forClass(RoadSectionUpdateRequest.class);
    verify(repository).updateRoadSectionFromDraft(eq(roadSectionId), requestCaptor.capture(), eq("OK"));
    assertThat(requestCaptor.getValue().status()).isEqualTo("AKTYWNY");
    verify(repository).finalizeWorkspace(workspaceId);
  }

  private InfrastructureObjectDto infrastructureObject(UUID objectId, UUID roadId, UUID segmentId) throws Exception {
    JsonNode geometry = objectMapper.readTree("""
        {"type":"LineString","coordinates":[[20.90,52.10],[20.91,52.11]]}
        """);
    return new InfrastructureObjectDto(
        objectId,
        "ROAD_BARRIER",
        "BAR-DK7-TEST",
        "Bariera testowa",
        roadId,
        "DK7",
        segmentId,
        "DK7-WAW-001",
        new BigDecimal("12.000"),
        new BigDecimal("12.500"),
        null,
        null,
        geometry,
        "LINESTRING",
        "GDDKiA",
        "Oddzial Warszawa",
        "Rejon Warszawa",
        "AKTYWNY",
        "OK",
        "ZAPISANY_W_WERSJI_ROBOCZEJ",
        LocalDate.parse("2024-01-01"),
        null,
        "system",
        Instant.parse("2026-01-01T00:00:00Z"),
        Instant.parse("2026-01-01T00:00:00Z"),
        objectMapper.createObjectNode());
  }

  private ReferenceSegmentDto referenceSegment(UUID segmentId, UUID roadId) throws Exception {
    return new ReferenceSegmentDto(
        segmentId,
        roadId,
        "DK7",
        "DK7-WAW-001",
        new BigDecimal("12.000"),
        new BigDecimal("13.000"),
        "PRAWA",
        "rosnacy kilometraz",
        "AKTYWNY",
        LocalDate.parse("2024-01-01"),
        null,
        lineString());
  }

  private RoadSectionDto roadSection(UUID roadSectionId, UUID roadId, UUID segmentId) throws Exception {
    return new RoadSectionDto(
        roadSectionId,
        "RS-DK7-TEST",
        roadId,
        "DK7",
        segmentId,
        "DK7-WAW-001",
        "DK7-WAW-001-ODC",
        "Odcinek DK7 Warszawa",
        new BigDecimal("12.000"),
        new BigDecimal("13.000"),
        "PRAWA",
        "rosnacy kilometraz",
        lineString(),
        "AKTYWNY",
        "OK",
        "ZAPISANY_W_WERSJI_ROBOCZEJ",
        LocalDate.parse("2024-01-01"),
        null,
        Instant.parse("2026-01-01T00:00:00Z"),
        new ReferenceBindingDto(
            segmentId,
            "DK7-WAW-001",
            roadId,
            "DK7",
            new BigDecimal("12.000"),
            new BigDecimal("13.000"),
            "SYSTEM_REFERENCYJNY",
            "ZGODNE")
    );
  }

  private JsonNode lineString() throws Exception {
    return objectMapper.readTree("""
        {"type":"LineString","coordinates":[[20.90,52.10],[20.92,52.12]]}
        """);
  }

  private WorkspaceDto workspace(UUID workspaceId, String status) {
    return new WorkspaceDto(
        workspaceId,
        "Workspace testowy",
        "operator",
        status,
        Instant.parse("2026-01-01T00:00:00Z"),
        null,
        objectMapper.nullNode(),
        1,
        0);
  }

  private OperatorContext operatorContext(boolean enabled) {
    return new OperatorContext(new RoadgisSecurityProperties(enabled, "roles", "preferred_username"));
  }
}
