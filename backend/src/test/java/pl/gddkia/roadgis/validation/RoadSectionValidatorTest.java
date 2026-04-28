package pl.gddkia.roadgis.validation;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pl.gddkia.roadgis.domain.DraftStatus;
import pl.gddkia.roadgis.domain.ValidationSeverity;
import pl.gddkia.roadgis.domain.ValidationStatus;

class RoadSectionValidatorTest {

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final RoadSectionValidator validator = new RoadSectionValidator();

  @Test
  void reportsMissingReferenceBinding() throws Exception {
    RoadSectionValidationTarget target = target(null, "12.000", "12.800",
        geometry("{\"type\":\"LineString\",\"coordinates\":[[20.90,52.10],[20.92,52.12]]}"));

    assertThat(validator.validate(target, ReferenceMileageRange.none()))
        .anySatisfy(issue -> {
          assertThat(issue.targetType()).isEqualTo("ROAD_SECTION");
          assertThat(issue.status()).isEqualTo(ValidationStatus.BRAK_DOWIAZANIA_DO_SR);
          assertThat(issue.severity()).isEqualTo(ValidationSeverity.BLOCKING);
        });
  }

  @Test
  void reportsMileageOutsideReferenceSegmentAsBlockingIssue() throws Exception {
    RoadSectionValidationTarget target = target(UUID.randomUUID(), "11.900", "13.200",
        geometry("{\"type\":\"LineString\",\"coordinates\":[[20.90,52.10],[20.92,52.12]]}"));

    assertThat(validator.validate(target, ReferenceMileageRange.of(new BigDecimal("12.000"), new BigDecimal("13.000"))))
        .anySatisfy(issue -> {
          assertThat(issue.issueType()).isEqualTo("ROAD_SECTION_MILEAGE_OUTSIDE_REFERENCE");
          assertThat(issue.status()).isEqualTo(ValidationStatus.NIEPOPRAWNE_DANE_ATRYBUTOWE);
          assertThat(issue.severity()).isEqualTo(ValidationSeverity.BLOCKING);
        });
  }

  @Test
  void reportsInvalidLineStringGeometry() throws Exception {
    RoadSectionValidationTarget target = target(UUID.randomUUID(), "12.000", "12.800",
        geometry("{\"type\":\"Point\",\"coordinates\":[20.90,52.10]}"));

    assertThat(validator.validate(target, ReferenceMileageRange.of(new BigDecimal("12.000"), new BigDecimal("13.000"))))
        .anySatisfy(issue -> {
          assertThat(issue.issueType()).isEqualTo("ROAD_SECTION_GEOMETRY_TYPE");
          assertThat(issue.status()).isEqualTo(ValidationStatus.NIEPOPRAWNA_GEOMETRIA);
          assertThat(issue.severity()).isEqualTo(ValidationSeverity.BLOCKING);
        });
  }

  @Test
  void acceptsCompleteRoadSectionWithoutBlockingIssues() throws Exception {
    RoadSectionValidationTarget target = target(UUID.randomUUID(), "12.000", "12.800",
        geometry("{\"type\":\"LineString\",\"coordinates\":[[20.90,52.10],[20.92,52.12]]}"));

    assertThat(validator.validate(target, ReferenceMileageRange.of(new BigDecimal("12.000"), new BigDecimal("13.000"))))
        .noneSatisfy(issue -> assertThat(issue.severity()).isEqualTo(ValidationSeverity.BLOCKING));
  }

  private RoadSectionValidationTarget target(
      UUID referenceSegmentId,
      String kilometerFrom,
      String kilometerTo,
      JsonNode geometry
  ) {
    return new RoadSectionValidationTarget(
        UUID.randomUUID(),
        "DK7-WAW-001-ODC",
        referenceSegmentId,
        new BigDecimal(kilometerFrom),
        new BigDecimal(kilometerTo),
        geometry,
        DraftStatus.GOTOWY_DO_WALIDACJI
    );
  }

  private JsonNode geometry(String rawJson) throws Exception {
    return objectMapper.readTree(rawJson);
  }
}
