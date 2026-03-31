package pl.gddkia.roadgis.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import org.geotools.geojson.geom.GeometryJSON;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.io.WKTWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GeometryMapper {

  private final ObjectMapper objectMapper;
  private final GeometryJSON geometryJson;
  private final int systemSrid;

  public GeometryMapper(
      ObjectMapper objectMapper, @Value("${roadgis.spatial.srid:2180}") int systemSrid) {
    this.objectMapper = objectMapper;
    this.geometryJson = new GeometryJSON(6);
    this.systemSrid = systemSrid;
  }

  public int systemSrid() {
    return systemSrid;
  }

  public GeoJsonGeometry toGeoJson(String wkt, int srid) {
    if (wkt == null) {
      return null;
    }

    try {
      Geometry geometry = new WKTReader().read(wkt);
      geometry.setSRID(srid);
      StringWriter writer = new StringWriter();
      geometryJson.write(geometry, writer);
      return objectMapper.readValue(writer.toString(), GeoJsonGeometry.class);
    } catch (Exception exception) {
      throw new ApiBadRequestException("INVALID_GEOMETRY", "Nie udalo sie zmapowac geometrii.");
    }
  }

  public String toWkt(GeoJsonGeometry geometry) {
    if (geometry == null) {
      return null;
    }

    try {
      String geometryJsonPayload = objectMapper.writeValueAsString(geometry);
      Geometry parsedGeometry = geometryJson.read(new StringReader(geometryJsonPayload));
      parsedGeometry.setSRID(systemSrid);
      return new WKTWriter().write(parsedGeometry);
    } catch (Exception exception) {
      throw new ApiBadRequestException("INVALID_GEOMETRY", "Nie udalo sie odczytac geometrii GeoJSON.");
    }
  }
}
