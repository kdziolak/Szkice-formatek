package pl.gddkia.roadgis.api;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.gddkia.roadgis.api.RoadInfraDtos.ImportJobDto;
import pl.gddkia.roadgis.application.RoadInfraService;

@RestController
@RequestMapping("/api/import")
class ImportController {

  private final RoadInfraService service;

  ImportController(RoadInfraService service) {
    this.service = service;
  }

  @PostMapping("/geojson")
  ImportJobDto geoJson(@RequestBody JsonNode payload) {
    return service.importGeoJson(payload);
  }

  @PostMapping(value = "/csv", consumes = {MediaType.TEXT_PLAIN_VALUE, "text/csv", MediaType.ALL_VALUE})
  ImportJobDto csv(@RequestBody String body) {
    return service.importCsv(body);
  }

  @GetMapping("/jobs/{id}")
  ImportJobDto job(@PathVariable UUID id) {
    return service.getImportJob(id);
  }
}
