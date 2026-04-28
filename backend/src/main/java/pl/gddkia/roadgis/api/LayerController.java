package pl.gddkia.roadgis.api;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.gddkia.roadgis.api.RoadInfraDtos.LayerDto;
import pl.gddkia.roadgis.application.RoadInfraService;

@RestController
@RequestMapping("/api/layers")
class LayerController {

  private final RoadInfraService service;

  LayerController(RoadInfraService service) {
    this.service = service;
  }

  @GetMapping
  List<LayerDto> layers() {
    return service.listLayers();
  }

  @GetMapping("/{layerCode}/features")
  JsonNode features(@PathVariable String layerCode) {
    return service.layerFeatures(layerCode);
  }
}
