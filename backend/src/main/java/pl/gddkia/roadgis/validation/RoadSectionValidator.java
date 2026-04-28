package pl.gddkia.roadgis.validation;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import pl.gddkia.roadgis.domain.DraftStatus;
import pl.gddkia.roadgis.domain.ValidationSeverity;
import pl.gddkia.roadgis.domain.ValidationStatus;

public class RoadSectionValidator {

  private static final String TARGET_TYPE = "ROAD_SECTION";

  public List<ValidationIssueDraft> validate(RoadSectionValidationTarget target, ReferenceMileageRange referenceRange) {
    List<ValidationIssueDraft> issues = new ArrayList<>();

    validateReferenceBinding(target, issues);
    validateMileage(target, referenceRange, issues);
    validateLineStringGeometry(target, issues);
    validateFinalizationReadiness(target, issues);

    return issues;
  }

  private void validateReferenceBinding(RoadSectionValidationTarget target, List<ValidationIssueDraft> issues) {
    if (target.referenceSegmentId() == null) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.BRAK_DOWIAZANIA_DO_SR,
          "MISSING_REFERENCE_SEGMENT", "referenceSegmentId",
          "Odcinek drogi musi byc dowiazany do odcinka systemu referencyjnego."));
    }
  }

  private void validateMileage(
      RoadSectionValidationTarget target,
      ReferenceMileageRange referenceRange,
      List<ValidationIssueDraft> issues
  ) {
    if (target.kilometerFrom() == null || target.kilometerTo() == null) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.BRAK_WYMAGANYCH_ATRYBUTOW,
          "ROAD_SECTION_MILEAGE_REQUIRED", "kilometerFrom",
          "Odcinek drogi musi miec kilometraz od i do."));
      return;
    }

    if (target.kilometerFrom().compareTo(target.kilometerTo()) > 0) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNE_DANE_ATRYBUTOWE,
          "ROAD_SECTION_MILEAGE_ORDER", "kilometerFrom",
          "Kilometraz odcinka drogi od nie moze byc wiekszy niz kilometraz do."));
    }

    if (referenceRange != null && referenceRange.present()
        && (outsideRange(target.kilometerFrom(), referenceRange) || outsideRange(target.kilometerTo(), referenceRange))) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNE_DANE_ATRYBUTOWE,
          "ROAD_SECTION_MILEAGE_OUTSIDE_REFERENCE", "kilometerFrom",
          "Kilometraz odcinka drogi wykracza poza zakres dowiazanego odcinka referencyjnego."));
    }
  }

  private void validateLineStringGeometry(RoadSectionValidationTarget target, List<ValidationIssueDraft> issues) {
    JsonNode geometry = target.geometry();
    if (geometry == null || geometry.isNull() || geometry.isMissingNode()) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNA_GEOMETRIA,
          "ROAD_SECTION_EMPTY_GEOMETRY", "geometry",
          "Odcinek drogi musi miec geometrie liniowa."));
      return;
    }

    if (!"LineString".equals(geometry.path("type").asText())) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNA_GEOMETRIA,
          "ROAD_SECTION_GEOMETRY_TYPE", "geometry",
          "Geometria odcinka drogi musi byc typu LineString."));
      return;
    }

    if (!validLine(geometry.path("coordinates"))) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNA_GEOMETRIA,
          "ROAD_SECTION_GEOMETRY_COORDINATES", "geometry",
          "Geometria LineString odcinka drogi ma niepoprawna strukture wspolrzednych."));
    }
  }

  private void validateFinalizationReadiness(RoadSectionValidationTarget target, List<ValidationIssueDraft> issues) {
    if (target.draftStatus() != DraftStatus.GOTOWY_DO_ZAPISU_FINALNEGO) {
      return;
    }
    boolean hasBlocking = issues.stream().anyMatch(issue -> issue.severity() == ValidationSeverity.BLOCKING);
    if (hasBlocking) {
      issues.add(issue(target, ValidationSeverity.BLOCKING, ValidationStatus.NIEPOPRAWNE_DANE_ATRYBUTOWE,
          "ROAD_SECTION_FINALIZATION_BLOCKED", "draftStatus",
          "Odcinek gotowy do finalizacji nie moze miec bledow krytycznych."));
    }
  }

  private boolean outsideRange(BigDecimal mileage, ReferenceMileageRange referenceRange) {
    return mileage.compareTo(referenceRange.startMileageKm()) < 0
        || mileage.compareTo(referenceRange.endMileageKm()) > 0;
  }

  private boolean validLine(JsonNode coordinates) {
    if (!coordinates.isArray() || coordinates.size() < 2) {
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

  private ValidationIssueDraft issue(
      RoadSectionValidationTarget target,
      ValidationSeverity severity,
      ValidationStatus status,
      String issueType,
      String fieldName,
      String message
  ) {
    return new ValidationIssueDraft(
        TARGET_TYPE,
        target.id(),
        target.sectionCode(),
        null,
        severity,
        status,
        issueType,
        fieldName,
        message);
  }
}
