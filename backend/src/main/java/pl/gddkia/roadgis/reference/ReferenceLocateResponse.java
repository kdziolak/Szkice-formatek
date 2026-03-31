package pl.gddkia.roadgis.reference;

import java.math.BigDecimal;
import java.util.List;

public record ReferenceLocateResponse(
    String roadNumber, BigDecimal chainage, String directionCode, List<ReferenceLocateCandidate> candidates) {}
