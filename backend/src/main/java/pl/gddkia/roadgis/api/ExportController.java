package pl.gddkia.roadgis.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.gddkia.roadgis.application.RoadInfraService;

@RestController
@RequestMapping("/api/export")
class ExportController {

  private final RoadInfraService service;

  ExportController(RoadInfraService service) {
    this.service = service;
  }

  @GetMapping("/objects.geojson")
  JsonNode objectsGeoJson() {
    return service.exportObjectsGeoJson();
  }

  @GetMapping(value = "/objects.csv", produces = "text/csv")
  ResponseEntity<String> objectsCsv() {
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=road-infra-objects.csv")
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(service.exportObjectsCsv());
  }
}
