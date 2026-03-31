package pl.gddkia.roadgis.reference;

import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.jdbc.Sql;
import pl.gddkia.roadgis.support.AbstractSqlServerIntegrationTest;

@Sql(scripts = "/sql/cleanup.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Sql(scripts = "/sql/reference-road-seed.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class ReferenceControllerIntegrationTest extends AbstractSqlServerIntegrationTest {

  @Test
  void shouldListReferenceSegmentsWithoutGeometry() throws Exception {
    mockMvc.perform(
            get("/api/v1/reference/segments")
                .queryParam("roadNumber", "A4")
                .queryParam("chainageFrom", "9.000")
                .queryParam("chainageTo", "35.000")
                .queryParam("page", "0")
                .queryParam("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(2)))
        .andExpect(jsonPath("$.items[0].businessId").value("22222222-2222-2222-2222-222222222222"))
        .andExpect(jsonPath("$.items[0].geometry").doesNotExist())
        .andExpect(jsonPath("$.page.totalElements").value(2))
        .andExpect(jsonPath("$.page.totalPages").value(1));
  }

  @Test
  void shouldRequireRoadNumberForLocate() throws Exception {
    mockMvc.perform(get("/api/v1/reference/locate").queryParam("chainage", "15.000"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
  }

  @Test
  void shouldReturnLocateCandidatesSortedByScore() throws Exception {
    mockMvc.perform(
            get("/api/v1/reference/locate")
                .queryParam("roadNumber", "A4")
                .queryParam("chainage", "15.000"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.roadNumber").value("A4"))
        .andExpect(jsonPath("$.candidates", hasSize(2)))
        .andExpect(jsonPath("$.candidates[0].businessId").value("22222222-2222-2222-2222-222222222222"))
        .andExpect(jsonPath("$.candidates[0].matchedChainage", closeTo(15.0d, 0.001d)))
        .andExpect(jsonPath("$.candidates[0].score", closeTo(1.0d, 0.001d)))
        .andExpect(jsonPath("$.candidates[1].businessId").value("33333333-3333-3333-3333-333333333333"));
  }
}
