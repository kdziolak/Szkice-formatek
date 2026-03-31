package pl.gddkia.roadgis.infrastructure;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MvcResult;
import pl.gddkia.roadgis.support.AbstractSqlServerIntegrationTest;

@Sql(scripts = "/sql/cleanup.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Sql(scripts = "/sql/reference-road-seed.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class RoadSectionControllerIntegrationTest extends AbstractSqlServerIntegrationTest {

  @Test
  void shouldListRoadSectionsWithoutGeometry() throws Exception {
    mockMvc.perform(
            get("/api/v1/road-sections")
                .queryParam("roadNumber", "A4")
                .queryParam("status", "PUBLISHED")
                .queryParam(
                    "referenceSegmentBusinessId", "22222222-2222-2222-2222-222222222222")
                .queryParam("page", "0")
                .queryParam("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(1)))
        .andExpect(jsonPath("$.items[0].businessId").value("55555555-5555-5555-5555-555555555555"))
        .andExpect(jsonPath("$.items[0].geometry").doesNotExist())
        .andExpect(jsonPath("$.items[0].overlayStatus").value("NONE"))
        .andExpect(jsonPath("$.items[0].isDraftOnly").value(false))
        .andExpect(jsonPath("$.page.totalElements").value(1));
  }

  @Test
  void shouldReturnRoadSectionDetailWithGeoJsonGeometry() throws Exception {
    mockMvc.perform(get("/api/v1/road-sections/{businessId}", "55555555-5555-5555-5555-555555555555"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.businessId").value("55555555-5555-5555-5555-555555555555"))
        .andExpect(jsonPath("$.overlayStatus").value("NONE"))
        .andExpect(jsonPath("$.published.geometry.type").value("LineString"))
        .andExpect(jsonPath("$.working.geometry.coordinates", hasSize(2)));
  }

  @Test
  void shouldReturnNotFoundForUnknownRoadSection() throws Exception {
    mockMvc.perform(get("/api/v1/road-sections/{businessId}", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("ROAD_SECTION_NOT_FOUND"));
  }

  @Test
  void shouldMergeUpdatedAndCreatedDraftRowsIntoRoadSectionList() throws Exception {
    String draftId = createDraft();

    saveDraftCommand(
        draftId,
        """
        {
          "entityType": "ROAD_SECTION",
          "actionType": "UPDATE",
          "targetBusinessId": "55555555-5555-5555-5555-555555555555",
          "payload": {
            "roadName": "Autostrada A4 po korekcie",
            "lifecycleStatus": "PUBLISHED"
          }
        }
        """);

    saveDraftCommand(
        draftId,
        """
        {
          "entityType": "ROAD_SECTION",
          "actionType": "CREATE",
          "targetBusinessId": "77777777-7777-7777-7777-777777777777",
          "payload": {
            "roadNumber": "A4",
            "roadClassCode": "A",
            "roadName": "Autostrada A4 nowy odcinek",
            "sectionCode": "A4-ODC-099",
            "referenceSegmentBusinessId": "22222222-2222-2222-2222-222222222222",
            "chainageFrom": 18.000,
            "chainageTo": 19.500,
            "lifecycleStatus": "PUBLISHED"
          },
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [500300.0, 300000.0],
              [500900.0, 300050.0]
            ]
          }
        }
        """);

    mockMvc.perform(
            get("/api/v1/road-sections")
                .queryParam("roadNumber", "A4")
                .queryParam("status", "PUBLISHED")
                .queryParam("draftId", draftId)
                .queryParam("page", "0")
                .queryParam("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(2)))
        .andExpect(jsonPath("$.items[0].businessId").value("55555555-5555-5555-5555-555555555555"))
        .andExpect(jsonPath("$.items[0].overlayStatus").value("UPDATED"))
        .andExpect(jsonPath("$.items[0].draftCommandId").exists())
        .andExpect(jsonPath("$.items[0].isDraftOnly").value(false))
        .andExpect(jsonPath("$.items[1].businessId").value("77777777-7777-7777-7777-777777777777"))
        .andExpect(jsonPath("$.items[1].overlayStatus").value("CREATED"))
        .andExpect(jsonPath("$.items[1].isDraftOnly").value(true));
  }

  @Test
  void shouldReturnPublishedAndWorkingStatesWhenDraftOverlayExists() throws Exception {
    String draftId = createDraft();

    saveDraftCommand(
        draftId,
        """
        {
          "entityType": "ROAD_SECTION",
          "actionType": "UPDATE",
          "targetBusinessId": "55555555-5555-5555-5555-555555555555",
          "payload": {
            "roadName": "Autostrada A4 po korekcie",
            "sectionCode": "A4-ODC-001-R"
          }
        }
        """);

    mockMvc.perform(
            get("/api/v1/road-sections/{businessId}", "55555555-5555-5555-5555-555555555555")
                .queryParam("draftId", draftId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.businessId").value("55555555-5555-5555-5555-555555555555"))
        .andExpect(jsonPath("$.overlayStatus").value("UPDATED"))
        .andExpect(jsonPath("$.draftCommandId").exists())
        .andExpect(jsonPath("$.published.roadName").value("Autostrada A4"))
        .andExpect(jsonPath("$.working.roadName").value("Autostrada A4 po korekcie"))
        .andExpect(jsonPath("$.working.sectionCode").value("A4-ODC-001-R"))
        .andExpect(jsonPath("$.working.geometry.type").value("LineString"));
  }

  private String createDraft() throws Exception {
    MvcResult result =
        mockMvc.perform(
                post("/api/v1/drafts")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "draftName": "Overlay road-section",
                          "draftScope": "ROAD_SECTION"
                        }
                        """))
            .andExpect(status().isCreated())
            .andReturn();

    JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
    return response.get("draftId").asText();
  }

  private void saveDraftCommand(String draftId, String payload) throws Exception {
    mockMvc.perform(
            post("/api/v1/drafts/{draftId}/commands", draftId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isAccepted());
  }
}
