package pl.gddkia.roadgis.validation;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import pl.gddkia.roadgis.domain.DraftStatus;
import pl.gddkia.roadgis.domain.GeometryType;
import pl.gddkia.roadgis.domain.ValidationSeverity;
import pl.gddkia.roadgis.domain.ValidationStatus;

public class InfrastructureObjectValidator {

  public List<ValidationIssueDraft> validate(ValidationTarget target, ReferenceMileageRange referenceRange) {
    List<ValidationIssueDraft> issues = new ArrayList<>();

    validateRequiredObjectType(target, issues);
    validateGeometry(target, issues);
    validateReferenceBinding(target, issues);
    validateMileage(target, referenceRange, issues);
    validateTrafficCountingStation(target, issues);
    validateRoadParcel(target, issues);
    validateFinalizationReadiness(target, issues);

    return issues;
  }

  private void validateRequiredObjectType(ValidationTarget target, List<ValidationIssueDraft> issues) {
    if (blank(target.objectType())) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.BRAK_WYMAGANYCH_ATRYBUTOW,
          "REQUIRED_OBJECT_TYPE", "objectType", "Obiekt infrastruktury musi miec typ."));
    }
  }

  private void validateGeometry(ValidationTarget target, List<ValidationIssueDraft> issues) {
    GeometryType expected = target.geometryType();
    if (expected == null) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNA_GEOMETRIA,
          "UNSUPPORTED_GEOMETRY_TYPE", "geometryType",
          "Typ geometrii musi byc jednym z POINT, LINESTRING albo POLYGON."));
    }

    if (target.geometry() == null || target.geometry().isNull()) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNA_GEOMETRIA,
          "EMPTY_GEOMETRY", "geometry", "Obiekt musi miec geometrie."));
      return;
    }

    JsonNode typeNode = target.geometry().get("type");
    if (typeNode == null || blank(typeNode.asText())) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNA_GEOMETRIA,
          "MISSING_GEOMETRY_TYPE", "geometry", "Geometria musi zawierac typ GeoJSON."));
      return;
    }

    if (expected == null) {
      return;
    }
    if (expected != null && !Objects.equals(expected.geoJsonType(), typeNode.asText())) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNA_GEOMETRIA,
          "GEOMETRY_TYPE_MISMATCH", "geometry",
          "Typ geometrii obiektu nie zgadza sie z typem GeoJSON."));
      return;
    }

    if (!validCoordinates(typeNode.asText(), target.geometry().path("coordinates"))) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNA_GEOMETRIA,
          "INVALID_GEOJSON_COORDINATES", "geometry",
          "Geometria GeoJSON ma niepoprawna strukture wspolrzednych."));
    }
  }

  private boolean validCoordinates(String geoJsonType, JsonNode coordinates) {
    return switch (geoJsonType) {
      case "Point" -> validPosition(coordinates);
      case "LineString" -> validLine(coordinates, 2);
      case "Polygon" -> validPolygon(coordinates);
      default -> false;
    };
  }

  private boolean validPolygon(JsonNode coordinates) {
    if (!coordinates.isArray() || coordinates.isEmpty()) {
      return false;
    }
    for (JsonNode ring : coordinates) {
      if (!validLine(ring, 4)) {
        return false;
      }
    }
    return true;
  }

  private boolean validLine(JsonNode coordinates, int minPositions) {
    if (!coordinates.isArray() || coordinates.size() < minPositions) {
      return false;
    }
    for (JsonNode coordinate : coordinates) {
      if (!validPosition(coordinate)) {
        return false;
      }
    }
    return true;
  }

  private boolean validPosition(JsonNode coordinate) {
    return coordinate.isArray()
        && coordinate.size() >= 2
        && coordinate.get(0).isNumber()
        && coordinate.get(1).isNumber();
  }

  private void validateReferenceBinding(ValidationTarget target, List<ValidationIssueDraft> issues) {
    if (target.referenceSegmentId() == null && requiresReferenceBinding(target)) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.BRAK_DOWIAZANIA_DO_SR,
          "MISSING_REFERENCE_SEGMENT", "referenceSegmentId",
          "Obiekt ewidencyjny musi byc dowiazany do odcinka systemu referencyjnego."));
    }
  }

  private void validateMileage(
      ValidationTarget target,
      ReferenceMileageRange referenceRange,
      List<ValidationIssueDraft> issues
  ) {
    if (target.geometryType() == GeometryType.LINESTRING
        && (target.globalMileageFrom() == null || target.globalMileageTo() == null)) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.BRAK_WYMAGANYCH_ATRYBUTOW,
          "MISSING_LINE_MILEAGE", "globalMileageFrom",
          "Obiekt liniowy powinien miec kilometraz od i do."));
      return;
    }

    BigDecimal from = target.globalMileageFrom();
    BigDecimal to = target.globalMileageTo();
    if (from != null && to != null && from.compareTo(to) > 0) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNE_DANE_ATRYBUTOWE,
          "MILEAGE_ORDER", "globalMileageFrom",
          "Kilometraz od nie moze byc wiekszy niz kilometraz do."));
    }

    if (from != null && to != null && referenceRange != null && referenceRange.present()
        && (outsideRange(from, referenceRange) || outsideRange(to, referenceRange))) {
      issues.add(issue(target, ValidationSeverity.WARNING, ValidationStatus.WYMAGA_WERYFIKACJI_OPERATORA,
          "MILEAGE_OUTSIDE_REFERENCE_SEGMENT", "globalMileageFrom",
          "Kilometraz obiektu wykracza poza zakres dowiazanego odcinka referencyjnego."));
    }
  }

  private boolean outsideRange(BigDecimal mileage, ReferenceMileageRange referenceRange) {
    return mileage.compareTo(referenceRange.startMileageKm()) < 0
        || mileage.compareTo(referenceRange.endMileageKm()) > 0;
  }

  private void validateTrafficCountingStation(ValidationTarget target, List<ValidationIssueDraft> issues) {
    if (!"TRAFFIC_COUNTING_STATION".equals(normalizedObjectType(target))) {
      return;
    }

    Object stationClass = target.attribute("stationClass");
    Object deviceSymbol = target.attribute("deviceSymbol");
    Object deviceId = target.attribute("deviceId");
    boolean otherStation = stationClass != null && "INNA".equals(stationClass.toString().trim().toUpperCase(Locale.ROOT));
    if (!otherStation && blankObject(deviceSymbol) && blankObject(deviceId)) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.BRAK_WYMAGANYCH_ATRYBUTOW,
          "TRAFFIC_STATION_DEVICE_REQUIRED", "deviceSymbol",
          "Stacja pomiaru ruchu musi miec symbol urzadzenia albo oznaczenie jako stacja inna."));
    }
  }

  private void validateRoadParcel(ValidationTarget target, List<ValidationIssueDraft> issues) {
    if (!"ROAD_PARCEL".equals(normalizedObjectType(target))) {
      return;
    }

    for (String field : List.of("parcelNumber", "precinct", "commune", "county", "voivodeship")) {
      if (blankObject(target.attribute(field))) {
        issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.BRAK_WYMAGANYCH_ATRYBUTOW,
            "PARCEL_REQUIRED_FIELD", field,
            "Dzialka musi miec numer, obreb, gmine, powiat i wojewodztwo."));
      }
    }
  }

  private void validateFinalizationReadiness(ValidationTarget target, List<ValidationIssueDraft> issues) {
    if (target.draftStatus() != DraftStatus.GOTOWY_DO_ZAPISU_FINALNEGO) {
      return;
    }

    boolean hasBlocking = issues.stream().anyMatch(issue -> issue.severity() == ValidationSeverity.BLOCKING);
    if (hasBlocking) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNE_DANE_ATRYBUTOWE,
          "FINALIZATION_BLOCKED", "draftStatus",
          "Obiekt gotowy do finalizacji nie moze miec bledow krytycznych."));
    }
  }

  private boolean requiresReferenceBinding(ValidationTarget target) {
    return !"ROAD_PARCEL".equals(normalizedObjectType(target));
  }

  private ValidationIssueDraft issue(
      ValidationTarget target,
      ValidationSeverity severity,
      ValidationStatus status,
      String issueType,
      String fieldName,
      String message
  ) {
    return new ValidationIssueDraft(
        "INFRASTRUCTURE_OBJECT",
        target.id(),
        target.objectCode(),
        target.id(),
        severity,
        status,
        issueType,
        fieldName,
        message);
  }

  private String normalizedObjectType(ValidationTarget target) {
    return target.objectType() == null ? "" : target.objectType().trim().toUpperCase(Locale.ROOT);
  }

  private boolean blankObject(Object value) {
    return value == null || blank(value.toString());
  }

  private boolean blank(String value) {
    return value == null || value.trim().isEmpty();
  }
}
