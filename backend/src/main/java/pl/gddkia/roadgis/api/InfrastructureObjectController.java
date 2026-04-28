package pl.gddkia.roadgis.api;

import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.gddkia.roadgis.api.RoadInfraDtos.BindReferenceSegmentRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.InfrastructureObjectDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.InfrastructureObjectRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.ObjectValidationResponse;
import pl.gddkia.roadgis.application.RoadInfraService;

@RestController
@RequestMapping("/api/infrastructure-objects")
class InfrastructureObjectController {

  private final RoadInfraService service;

  InfrastructureObjectController(RoadInfraService service) {
    this.service = service;
  }

  @GetMapping
  List<InfrastructureObjectDto> list(
      @RequestParam(required = false) String objectType,
      @RequestParam(required = false) String status
  ) {
    return service.listInfrastructureObjects(objectType, status);
  }

  @GetMapping("/{id}")
  InfrastructureObjectDto get(@PathVariable UUID id) {
    return service.getInfrastructureObject(id);
  }

  @PostMapping
  InfrastructureObjectDto create(@RequestBody InfrastructureObjectRequest request) {
    return service.createInfrastructureObject(request);
  }

  @PutMapping("/{id}")
  InfrastructureObjectDto update(@PathVariable UUID id, @RequestBody InfrastructureObjectRequest request) {
    return service.updateInfrastructureObject(id, request);
  }

  @PostMapping("/{id}/bind-reference-segment")
  InfrastructureObjectDto bindReferenceSegment(
      @PathVariable UUID id,
      @RequestBody BindReferenceSegmentRequest request
  ) {
    return service.bindReferenceSegment(id, request);
  }

  @PostMapping("/{id}/validate")
  ObjectValidationResponse validate(@PathVariable UUID id) {
    return service.validateInfrastructureObject(id);
  }
}
