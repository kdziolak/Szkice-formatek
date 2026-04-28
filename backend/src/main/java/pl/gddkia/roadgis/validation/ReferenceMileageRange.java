package pl.gddkia.roadgis.validation;

import java.math.BigDecimal;
import java.util.Optional;

public record ReferenceMileageRange(BigDecimal startMileageKm, BigDecimal endMileageKm) {

  public static ReferenceMileageRange of(BigDecimal startMileageKm, BigDecimal endMileageKm) {
    return new ReferenceMileageRange(startMileageKm, endMileageKm);
  }

  public static ReferenceMileageRange none() {
    return new ReferenceMileageRange(null, null);
  }

  public boolean present() {
    return startMileageKm != null && endMileageKm != null;
  }

  public Optional<BigDecimal> start() {
    return Optional.ofNullable(startMileageKm);
  }

  public Optional<BigDecimal> end() {
    return Optional.ofNullable(endMileageKm);
  }
}
