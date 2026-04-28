package pl.gddkia.roadgis.api;

import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.gddkia.roadgis.api.RoadInfraDtos.HistoryDto;
import pl.gddkia.roadgis.application.RoadInfraService;

@RestController
@RequestMapping("/api/history")
class HistoryController {

  private final RoadInfraService service;

  HistoryController(RoadInfraService service) {
    this.service = service;
  }

  @GetMapping("/object/{objectId}")
  List<HistoryDto> history(@PathVariable UUID objectId) {
    return service.historyForObject(objectId);
  }
}
