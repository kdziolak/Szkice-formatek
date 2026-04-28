package pl.gddkia.roadgis.validation;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pl.gddkia.roadgis.domain.DraftStatus;
import pl.gddkia.roadgis.domain.GeometryType;
import pl.gddkia.roadgis.domain.ValidationSeverity;
import pl.gddkia.roadgis.domain.ValidationStatus;

class InfrastructureObjectValidatorTest {

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final InfrastructureObjectValidator validator = new InfrastructureObjectValidator();

  @Test
  void reportsMissingReferenceBindingForInventoryObject() throws Exception {
    ValidationTarget target = target(
        "ROAD_BARRIER",
        GeometryType.LINESTRING,
        geometry("{\"type\":\"LineString\",\"coordinates\":[[21.000,52.200],[21.010,52.205]]}"),
        null,
        "12.200",
        "12.650",
        Map.of("material", "stal")
    );

    assertThat(validator.validate(target, ReferenceMileageRange.none()))
        .anySatisfy(issue -> {
          assertThat(issue.status()).isEqualTo(ValidationStatus.BRAK_DOWIAZANIA_DO_SR);
          assertThat(issue.severity()).isEqualTo(ValidationSeverity.BLOCKING);
        });
  }

  @Test
  void reportsGeometryTypeMismatch() throws Exception {
    ValidationTarget target = target(
        "TRAFFIC_COUNTING_STATION",
        GeometryType.POINT,
        geometry("{\"type\":\"LineString\",\"coordinates\":[[21.000,52.200],[21.010,52.205]]}"),
        UUID.randomUUID(),
        "12.200",
        "12.200",
        Map.of("deviceSymbol", "RPP-7")
    );

    assertThat(validator.validate(target, ReferenceMileageRange.of(new BigDecimal("12.000"), new BigDecimal("13.000"))))
        .anySatisfy(issue -> {
          assertThat(issue.status()).isEqualTo(ValidationStatus.NIEPOPRAWNA_GEOMETRIA);
          assertThat(issue.fieldName()).isEqualTo("geometry");
        });
  }

  @Test
  void reportsUnsupportedGeometryTypeCode() throws Exception {
    ValidationTarget target = target(
        "TECHNICAL_CHANNEL",
        null,
        geometry("{\"type\":\"MultiLineString\",\"coordinates\":[[[21.000,52.200],[21.010,52.205]]]}"),
        UUID.randomUUID(),
        "12.200",
        "12.650",
        Map.of("material", "HDPE")
    );

    assertThat(validator.validate(target, ReferenceMileageRange.of(new BigDecimal("12.000"), new BigDecimal("13.000"))))
        .anySatisfy(issue -> {
          assertThat(issue.issueType()).isEqualTo("UNSUPPORTED_GEOMETRY_TYPE");
          assertThat(issue.severity()).isEqualTo(ValidationSeverity.BLOCKING);
        });
  }

  @Test
  void reportsInvalidGeoJsonCoordinates() throws Exception {
    ValidationTarget target = target(
        "ROAD_BARRIER",
        GeometryType.LINESTRING,
        geometry("{\"type\":\"LineString\",\"coordinates\":[[21.000,\"bad\"],[21.010,52.205]]}"),
        UUID.randomUUID(),
        "12.200",
        "12.650",
        Map.of("material", "stal")
    );

    assertThat(validator.validate(target, ReferenceMileageRange.of(new BigDecimal("12.000"), new BigDecimal("13.000"))))
        .anySatisfy(issue -> {
          assertThat(issue.issueType()).isEqualTo("INVALID_GEOJSON_COORDINATES");
          assertThat(issue.severity()).isEqualTo(ValidationSeverity.BLOCKING);
        });
  }


  @Test
  void reportsMileageOrderAndRangeViolations() throws Exception {
    ValidationTarget target = target(
        "TECHNICAL_CHANNEL",
        GeometryType.LINESTRING,
        geometry("{\"type\":\"LineString\",\"coordinates\":[[21.000,52.200],[21.010,52.205]]}"),
        UUID.randomUUID(),
        "14.000",
        "13.000",
        Map.of("material", "HDPE")
    );

    assertThat(validator.validate(target, ReferenceMileageRange.of(new BigDecimal("12.000"), new BigDecimal("13.500"))))
        .extracting(ValidationIssueDraft::status)
        .contains(ValidationStatus.NIEPOPRAWNE_DANE_ATRYBUTOWE, ValidationStatus.WYMAGA_WERYFIKACJI_OPERATORA);
  }

  @Test
  void reportsTrafficStationWithoutDeviceSymbolUnlessStationIsOtherClass() throws Exception {
    ValidationTarget target = target(
        "TRAFFIC_COUNTING_STATION",
        GeometryType.POINT,
        geometry("{\"type\":\"Point\",\"coordinates\":[21.000,52.200]}"),
        UUID.randomUUID(),
        "12.200",
        "12.200",
        Map.of("stationClass", "SCPR")
    );

    assertThat(validator.validate(target, ReferenceMileageRange.of(new BigDecimal("12.000"), new BigDecimal("13.000"))))
        .anySatisfy(issue -> {
          assertThat(issue.status()).isEqualTo(ValidationStatus.BRAK_WYMAGANYCH_ATRYBUTOW);
          assertThat(issue.fieldName()).isEqualTo("deviceSymbol");
        });
  }

  @Test
  void allowsWarningsForReadyObjectWhenCoreDataIsComplete() throws Exception {
    ValidationTarget target = target(
        "TRAFFIC_COUNTING_STATION",
        GeometryType.POINT,
        geometry("{\"type\":\"Point\",\"coordinates\":[21.000,52.200]}"),
        UUID.randomUUID(),
        "12.200",
        "12.200",
        Map.of("stationClass", "INNA")
    );

    assertThat(validator.validate(target, ReferenceMileageRange.of(new BigDecimal("12.000"), new BigDecimal("13.000"))))
        .noneSatisfy(issue -> assertThat(issue.severity()).isEqualTo(ValidationSeverity.BLOCKING));
  }

  private ValidationTarget target(
      String objectType,
      GeometryType geometryType,
      JsonNode geometry,
      UUID referenceSegmentId,
      String mileageFrom,
      String mileageTo,
      Map<String, Object> attributes
  ) {
    return new ValidationTarget(
        UUID.randomUUID(),
        objectType,
        objectType + "-001",
        geometryType,
        geometry,
        referenceSegmentId,
        new BigDecimal(mileageFrom),
        new BigDecimal(mileageTo),
        attributes,
        DraftStatus.GOTOWY_DO_WALIDACJI
    );
  }

  private JsonNode geometry(String rawJson) throws Exception {
    return objectMapper.readTree(rawJson);
  }
}
