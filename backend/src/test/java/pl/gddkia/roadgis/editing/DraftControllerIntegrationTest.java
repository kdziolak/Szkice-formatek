package pl.gddkia.roadgis.editing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MvcResult;
import pl.gddkia.roadgis.support.AbstractSqlServerIntegrationTest;

@Sql(scripts = "/sql/cleanup.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Sql(scripts = "/sql/reference-road-seed.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class DraftControllerIntegrationTest extends AbstractSqlServerIntegrationTest {

  @Test
  void shouldCreateDraftForRoadSectionScope() throws Exception {
    mockMvc.perform(
            post("/api/v1/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "draftName": "Korekta A4 km 12+345",
                      "draftScope": "ROAD_SECTION"
                    }
                    """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.draftId").exists())
        .andExpect(jsonPath("$.draftName").value("Korekta A4 km 12+345"))
        .andExpect(jsonPath("$.draftScope").value("ROAD_SECTION"))
        .andExpect(jsonPath("$.draftStatus").value("OPEN"));

    Integer draftCount =
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM edit.draft", Map.of(), Integer.class);

    assertThat(draftCount).isEqualTo(1);
  }

  @Test
  void shouldSaveCreateCommandAndGenerateTargetBusinessId() throws Exception {
    String draftId = createDraft();

    mockMvc.perform(
            post("/api/v1/drafts/{draftId}/commands", draftId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "entityType": "ROAD_SECTION",
                      "actionType": "CREATE",
                      "payload": {
                        "sectionCode": "A4-ODC-099",
                        "roadNumber": "A4"
                      },
                      "geometry": {
                        "type": "LineString",
                        "coordinates": [
                          [500000.0, 300000.0],
                          [500250.0, 300100.0]
                        ]
                      }
                    }
                    """))
        .andExpect(status().isAccepted())
        .andExpect(jsonPath("$.draftCommandId").exists())
        .andExpect(jsonPath("$.draftId").value(draftId))
        .andExpect(jsonPath("$.targetBusinessId").exists())
        .andExpect(jsonPath("$.validationState").value("PENDING"))
        .andExpect(jsonPath("$.conflictState").value("NONE"));

    Integer commandCount =
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM edit.draft_object", Map.of(), Integer.class);

    assertThat(commandCount).isEqualTo(1);
  }

  @Test
  void shouldUpsertDraftCommandForSameTargetBusinessId() throws Exception {
    String draftId = createDraft();

    mockMvc.perform(
            post("/api/v1/drafts/{draftId}/commands", draftId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "entityType": "ROAD_SECTION",
                      "actionType": "UPDATE",
                      "targetBusinessId": "55555555-5555-5555-5555-555555555555",
                      "payload": {
                        "sectionCode": "A4-ODC-001",
                        "lifecycleStatus": "VALID"
                      }
                    }
                    """))
        .andExpect(status().isAccepted());

    mockMvc.perform(
            post("/api/v1/drafts/{draftId}/commands", draftId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "entityType": "ROAD_SECTION",
                      "actionType": "UPDATE",
                      "targetBusinessId": "55555555-5555-5555-5555-555555555555",
                      "payload": {
                        "sectionCode": "A4-ODC-001",
                        "lifecycleStatus": "INVALID"
                      }
                    }
                    """))
        .andExpect(status().isAccepted());

    Integer commandCount =
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM edit.draft_object", Map.of(), Integer.class);
    String payloadJson =
        jdbcTemplate.queryForObject(
            "SELECT payload_json FROM edit.draft_object",
            Map.of(),
            String.class);

    assertThat(commandCount).isEqualTo(1);
    assertThat(payloadJson).contains("\"lifecycleStatus\":\"INVALID\"");
  }

  @Test
  void shouldRejectUpdateWithoutTargetBusinessId() throws Exception {
    String draftId = createDraft();

    mockMvc.perform(
            post("/api/v1/drafts/{draftId}/commands", draftId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "entityType": "ROAD_SECTION",
                      "actionType": "UPDATE",
                      "payload": {
                        "sectionCode": "A4-ODC-001"
                      }
                    }
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
  }

  @Test
  void shouldReturnNotFoundForUnknownDraftId() throws Exception {
    mockMvc.perform(
            post("/api/v1/drafts/{draftId}/commands", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "entityType": "ROAD_SECTION",
                      "actionType": "CREATE",
                      "payload": {
                        "sectionCode": "A4-ODC-404"
                      }
                    }
                    """))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("DRAFT_NOT_FOUND"));
  }

  private String createDraft() throws Exception {
    MvcResult result =
        mockMvc.perform(
                post("/api/v1/drafts")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "draftName": "Draft testowy",
                          "draftScope": "ROAD_SECTION"
                        }
                        """))
            .andExpect(status().isCreated())
            .andReturn();

    JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
    return response.get("draftId").asText();
  }
}
