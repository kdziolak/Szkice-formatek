package pl.gddkia.roadgis.common;

import com.fasterxml.jackson.databind.JsonNode;

public record GeoJsonGeometry(String type, JsonNode coordinates) {}
