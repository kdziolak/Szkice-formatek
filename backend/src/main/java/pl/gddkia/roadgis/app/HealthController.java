package pl.gddkia.roadgis.app;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

  @GetMapping
  public HealthResponse getHealth() {
    String version = RoadGisApplication.class.getPackage().getImplementationVersion();
    return new HealthResponse("UP", version != null ? version : "dev");
  }
}
