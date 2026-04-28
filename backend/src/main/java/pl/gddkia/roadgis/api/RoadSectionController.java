package pl.gddkia.roadgis.api;

import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionDto;
import pl.gddkia.roadgis.application.RoadInfraService;

@RestController
@RequestMapping("/api/road-sections")
class RoadSectionController {

  private final RoadInfraService service;

  RoadSectionController(RoadInfraService service) {
    this.service = service;
  }

  @GetMapping
  List<RoadSectionDto> list(
      @RequestParam(required = false) String roadNumber,
      @RequestParam(required = false) String status
  ) {
    return service.listRoadSections(roadNumber, status);
  }

  @GetMapping("/{id}")
  RoadSectionDto get(@PathVariable UUID id) {
    return service.getRoadSection(id);
  }
}
