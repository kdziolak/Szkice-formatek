package pl.gddkia.roadgis.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionUpdateRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.ValidationIssueDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRoadSectionRequest;
import pl.gddkia.roadgis.app.RoadGisApplication;
import pl.gddkia.roadgis.application.RoadInfraService;

@Testcontainers
@SpringBootTest(
    classes = RoadGisApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.NONE,
    properties = "roadgis.security.enabled=false"
)
class RoadInfraRepositoryIT {

  private static final DockerImageName POSTGIS_IMAGE = DockerImageName
      .parse("postgis/postgis:16-3.4")
      .asCompatibleSubstituteFor("postgres");

  private static final UUID ROAD_SECTION_ID = UUID.fromString("50000000-0000-0000-0000-000000000007");
  private static final UUID REFERENCE_SEGMENT_ID = UUID.fromString("00000000-0000-0000-0001-000000000007");

  @Container
  static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(POSTGIS_IMAGE)
      .withDatabaseName("roadgis_it")
      .withUsername("roadgis")
      .withPassword("roadgis");

  @DynamicPropertySource
  static void databaseProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private RoadInfraRepository repository;

  @Autowired
  private RoadInfraService service;

  @Test
  void appliesFlywayPostgisSeedsAndIndexes() {
    assertThat(successfulFlywayVersions()).contains("1", "2", "3");
    assertThat(isPostgisInstalled()).isTrue();
    assertThat(repository.listRoads()).extracting(RoadDto::roadNumber).contains("DK7");
    assertThat(repository.getRoadSection(ROAD_SECTION_ID).sectionCode()).isEqualTo("DK7-WAW-001-ODC");

    assertIndexExists("idx_draft_object_states_object");
    assertIndexExists("idx_change_history_object_changed_at");
    assertIndexExists("idx_validation_issues_object_resolved");
    assertIndexExists("idx_draft_road_section_states_section");
    assertIndexExists("idx_validation_issues_target_resolved");
  }

  @Test
  void supportsWorkspaceRoadSectionDraftRoundTrip() {
    WorkspaceDto workspace = service.createWorkspace(
        new WorkspaceRequest("IT workspace - road section draft", "integration-test", null));
    service.addRoadSectionToWorkspace(workspace.id(), new WorkspaceRoadSectionRequest(ROAD_SECTION_ID));

    RoadSectionDto current = service.getRoadSection(ROAD_SECTION_ID);
    RoadSectionDto draft = service.updateWorkspaceRoadSection(
        workspace.id(),
        ROAD_SECTION_ID,
        new RoadSectionUpdateRequest(
            "Odcinek DK7 Warszawa - test integracyjny",
            new BigDecimal("12.100"),
            new BigDecimal("12.900"),
            REFERENCE_SEGMENT_ID,
            current.geometry(),
            "AKTYWNY"));

    assertThat(draft.kilometerFrom()).isEqualByComparingTo("12.100");
    assertThat(draft.kilometerTo()).isEqualByComparingTo("12.900");
    assertThat(draft.referenceSegmentId()).isEqualTo(REFERENCE_SEGMENT_ID);

    List<ValidationIssueDto> issues = service.validateWorkspace(workspace.id());
    assertThat(issues).noneMatch(issue -> "BLOCKING".equals(issue.severity()));

    WorkspaceDto finalized = service.finalizeWorkspace(workspace.id());
    assertThat(finalized.status()).isEqualTo("SFINALIZOWANY");

    RoadSectionDto persisted = service.getRoadSection(ROAD_SECTION_ID);
    assertThat(persisted.name()).isEqualTo("Odcinek DK7 Warszawa - test integracyjny");
    assertThat(persisted.kilometerFrom()).isEqualByComparingTo("12.100");
    assertThat(persisted.validationStatus()).isEqualTo("OK");
    assertThat(persisted.draftStatus()).isEqualTo("NIE_DOTYCZY");
  }

  private List<String> successfulFlywayVersions() {
    return jdbcTemplate.queryForList(
        "select version from flyway_schema_history where success = true order by installed_rank",
        String.class);
  }

  private Boolean isPostgisInstalled() {
    return jdbcTemplate.queryForObject(
        "select exists(select 1 from pg_extension where extname = 'postgis')",
        Boolean.class);
  }

  private void assertIndexExists(String indexName) {
    Boolean exists = jdbcTemplate.queryForObject(
        "select to_regclass(?) is not null",
        Boolean.class,
        "public." + indexName);
    assertThat(exists).as("index %s exists", indexName).isTrue();
  }
}
