package pl.gddkia.roadgis.api;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.gddkia.roadgis.api.RoadInfraDtos.ReferenceSegmentDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadDto;
import pl.gddkia.roadgis.application.RoadInfraService;

@RestController
@RequestMapping("/api")
class RoadReferenceController {

  private final RoadInfraService service;

  RoadReferenceController(RoadInfraService service) {
    this.service = service;
  }

  @GetMapping("/roads")
  List<RoadDto> roads() {
    return service.listRoads();
  }

  @GetMapping("/reference-segments")
  List<ReferenceSegmentDto> referenceSegments(@RequestParam(required = false) String roadNumber) {
    return service.listReferenceSegments(roadNumber);
  }

  @GetMapping("/reference-segments/nearest")
  ReferenceSegmentDto nearestReferenceSegment(
      @RequestParam BigDecimal lat,
      @RequestParam BigDecimal lon,
      @RequestParam(required = false) String roadNumber
  ) {
    return service.nearestReferenceSegment(lat, lon, roadNumber);
  }
}
