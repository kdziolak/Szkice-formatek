package pl.gddkia.roadgis.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;
import pl.gddkia.roadgis.common.NotFoundException;

class ApiExceptionHandlerTest {

  private final ApiExceptionHandler handler = new ApiExceptionHandler();

  @Test
  void mapsMissingRecordToNotFoundProblemDetail() {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/road-sections/missing");

    ProblemDetail problem = handler.handleNotFound(
        new NotFoundException("Nie znaleziono rekordu dla zapytania."), request);

    assertThat(problem.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
    assertThat(problem.getTitle()).isEqualTo("Zasob nie zostal znaleziony");
    assertThat(problem.getInstance().toString()).isEqualTo("/api/road-sections/missing");
    assertThat(problem.getProperties()).containsKey("timestamp");
  }

  @Test
  void mapsClosedWorkspaceToConflictProblemDetail() {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/workspaces/123/finalize");

    ProblemDetail problem = handler.handleIllegalState(
        new IllegalStateException("Workspace jest zamkniety i nie moze przyjmowac zmian roboczych."), request);

    assertThat(problem.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
    assertThat(problem.getTitle()).isEqualTo("Konflikt stanu");
  }
}
