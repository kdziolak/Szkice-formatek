package pl.gddkia.roadgis.infrastructure;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class WorkspaceOverlayIntegrationTest extends AbstractSqlServerIntegrationTest {

  @Test
  void shouldReturnWorkspaceConfigurationForDataManagement() throws Exception {
    mockMvc.perform(get("/api/v1/layers/workspace"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.activeEditableLayerId").value("road-section-draft"))
        .andExpect(jsonPath("$.layers", hasSize(3)))
        .andExpect(jsonPath("$.layers[0].id").value("road-section-published"))
        .andExpect(jsonPath("$.layers[1].id").value("road-section-draft"))
        .andExpect(jsonPath("$.layout.mode").value("three-panel"));
  }

  @Test
  void shouldReturnPublishedAndDraftFeatureStreamsForRoadSections() throws Exception {
    String draftId = createDraft();

    saveDraftCommand(
        draftId,
        """
        {
          "entityType": "ROAD_SECTION",
          "actionType": "UPDATE",
          "targetBusinessId": "55555555-5555-5555-5555-555555555555",
          "payload": {
            "roadName": "Autostrada A4 po korekcie"
          },
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [500000.0, 300000.0],
              [501050.0, 300120.0]
            ]
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
            get("/api/v1/query/features")
                .queryParam("layer", "ROAD_SECTION")
                .queryParam("bbox", "499900,299900,501500,300500")
                .queryParam("scaleDenominator", "5000")
                .queryParam("draftId", draftId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.publishedFeatures", hasSize(1)))
        .andExpect(jsonPath("$.draftFeatures", hasSize(2)))
        .andExpect(jsonPath("$.publishedFeatures[0].businessId").value("55555555-5555-5555-5555-555555555555"))
        .andExpect(jsonPath("$.draftFeatures[0].overlayStatus").exists())
        .andExpect(jsonPath("$.draftFeatures[0].geometry.type").value("LineString"));
  }

  @Test
  void shouldReturnReferenceSegmentsAsPublishedFeatureStream() throws Exception {
    mockMvc.perform(
            get("/api/v1/query/features")
                .queryParam("layer", "REFERENCE_SEGMENT")
                .queryParam("bbox", "499900,299900,501500,300500")
                .queryParam("scaleDenominator", "5000"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.publishedFeatures", hasSize(1)))
        .andExpect(jsonPath("$.draftFeatures", hasSize(0)))
        .andExpect(jsonPath("$.publishedFeatures[0].businessId").value("22222222-2222-2222-2222-222222222222"))
        .andExpect(jsonPath("$.publishedFeatures[0].overlayStatus").value("NONE"))
        .andExpect(jsonPath("$.publishedFeatures[0].draftOnly").value(false))
        .andExpect(jsonPath("$.publishedFeatures[0].geometry.type").value("LineString"));
  }

  private String createDraft() throws Exception {
    MvcResult result =
        mockMvc.perform(
                post("/api/v1/drafts")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "draftName": "Workspace overlay",
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
