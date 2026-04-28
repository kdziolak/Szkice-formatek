package pl.gddkia.roadgis.api;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import pl.gddkia.roadgis.common.NotFoundException;

@RestControllerAdvice
class ApiExceptionHandler {

  @ExceptionHandler(NotFoundException.class)
  ProblemDetail handleNotFound(NotFoundException exception, HttpServletRequest request) {
    return problem(HttpStatus.NOT_FOUND, "Zasob nie zostal znaleziony", exception.getMessage(), request);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  ProblemDetail handleIllegalArgument(IllegalArgumentException exception, HttpServletRequest request) {
    return problem(HttpStatus.BAD_REQUEST, "Niepoprawne zadanie", exception.getMessage(), request);
  }

  @ExceptionHandler(IllegalStateException.class)
  ProblemDetail handleIllegalState(IllegalStateException exception, HttpServletRequest request) {
    return problem(HttpStatus.CONFLICT, "Konflikt stanu", exception.getMessage(), request);
  }

  @ExceptionHandler({
      HttpMessageNotReadableException.class,
      MethodArgumentTypeMismatchException.class,
      MethodArgumentNotValidException.class
  })
  ProblemDetail handleBadRequest(Exception exception, HttpServletRequest request) {
    return problem(HttpStatus.BAD_REQUEST, "Niepoprawny format zadania", exception.getMessage(), request);
  }

  @ExceptionHandler(Exception.class)
  ProblemDetail handleUnexpected(Exception exception, HttpServletRequest request) {
    return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Blad serwera",
        "Nie udalo sie obsluzyc zadania API.", request);
  }

  private ProblemDetail problem(HttpStatus status, String title, String detail, HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
    problem.setTitle(title);
    problem.setType(URI.create("urn:roadgis:problem:" + status.value()));
    problem.setInstance(URI.create(request.getRequestURI()));
    problem.setProperty("timestamp", Instant.now());
    return problem;
  }
}
