package pl.gddkia.roadgis.api;

import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
class SystemController {

  @GetMapping("/health")
  Map<String, Object> health() {
    return Map.of(
        "status", "UP",
        "service", "RoadGIS Platform",
        "timestamp", Instant.now());
  }
}
