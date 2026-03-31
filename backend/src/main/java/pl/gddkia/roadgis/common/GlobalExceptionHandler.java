package pl.gddkia.roadgis.common;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ApiBadRequestException.class)
  public ResponseEntity<ApiErrorResponse> handleBadRequest(ApiBadRequestException exception) {
    return ResponseEntity.badRequest().body(new ApiErrorResponse(exception.code(), exception.getMessage()));
  }

  @ExceptionHandler(ApiNotFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNotFound(ApiNotFoundException exception) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(new ApiErrorResponse(exception.code(), exception.getMessage()));
  }

  @ExceptionHandler({
      ConstraintViolationException.class,
      HandlerMethodValidationException.class,
      HttpMessageNotReadableException.class,
      MethodArgumentNotValidException.class,
      MethodArgumentTypeMismatchException.class,
      MissingServletRequestParameterException.class
  })
  public ResponseEntity<ApiErrorResponse> handleInvalidRequest(Exception exception) {
    return ResponseEntity.badRequest()
        .body(new ApiErrorResponse("INVALID_REQUEST", "Niepoprawne dane wejsciowe."));
  }
}
