package pl.gddkia.roadgis.api;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.gddkia.roadgis.api.RoadInfraDtos.ReportRowDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.ValidationIssueDto;
import pl.gddkia.roadgis.application.RoadInfraService;

@RestController
@RequestMapping("/api/reports")
class ReportController {

  private final RoadInfraService service;

  ReportController(RoadInfraService service) {
    this.service = service;
  }

  @GetMapping("/validation-issues")
  List<ValidationIssueDto> validationIssues() {
    return service.validationIssuesReport();
  }

  @GetMapping("/road-inventory")
  List<ReportRowDto> roadInventory(@RequestParam(required = false) String roadNumber) {
    return service.roadInventoryReport(roadNumber);
  }

  @GetMapping("/traffic-stations")
  List<ReportRowDto> trafficStations() {
    return service.trafficStationsReport();
  }
}
