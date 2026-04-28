package pl.gddkia.roadgis.domain;

public enum GeometryType {
  POINT("Point"),
  LINESTRING("LineString"),
  POLYGON("Polygon");

  private final String geoJsonType;

  GeometryType(String geoJsonType) {
    this.geoJsonType = geoJsonType;
  }

  public String geoJsonType() {
    return geoJsonType;
  }
}
