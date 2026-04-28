package pl.gddkia.roadgis.api;

import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.gddkia.roadgis.api.RoadInfraDtos.BindReferenceSegmentRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.InfrastructureObjectDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionUpdateRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.ValidationIssueDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceObjectRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceObjectUpdateRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRoadSectionRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRequest;
import pl.gddkia.roadgis.application.RoadInfraService;

@RestController
@RequestMapping("/api/workspaces")
class WorkspaceController {

  private final RoadInfraService service;

  WorkspaceController(RoadInfraService service) {
    this.service = service;
  }

  @PostMapping
  WorkspaceDto create(@RequestBody WorkspaceRequest request) {
    return service.createWorkspace(request);
  }

  @GetMapping
  List<WorkspaceDto> list() {
    return service.listWorkspaces();
  }

  @GetMapping("/{id}")
  WorkspaceDto get(@PathVariable UUID id) {
    return service.getWorkspace(id);
  }

  @PostMapping("/{id}/objects")
  WorkspaceDto addObject(@PathVariable UUID id, @RequestBody WorkspaceObjectRequest request) {
    return service.addObjectToWorkspace(id, request);
  }

  @PutMapping("/{id}/objects/{objectId}")
  InfrastructureObjectDto updateObject(
      @PathVariable UUID id,
      @PathVariable UUID objectId,
      @RequestBody WorkspaceObjectUpdateRequest request
  ) {
    return service.updateWorkspaceObject(id, objectId, request);
  }

  @PostMapping("/{id}/objects/{objectId}/bind-reference-segment")
  InfrastructureObjectDto bindReferenceSegment(
      @PathVariable UUID id,
      @PathVariable UUID objectId,
      @RequestBody BindReferenceSegmentRequest request
  ) {
    return service.bindWorkspaceObjectReferenceSegment(id, objectId, request);
  }

  @PostMapping("/{id}/road-sections")
  WorkspaceDto addRoadSection(@PathVariable UUID id, @RequestBody WorkspaceRoadSectionRequest request) {
    return service.addRoadSectionToWorkspace(id, request);
  }

  @PutMapping("/{id}/road-sections/{roadSectionId}")
  RoadSectionDto updateRoadSection(
      @PathVariable UUID id,
      @PathVariable UUID roadSectionId,
      @RequestBody RoadSectionUpdateRequest request
  ) {
    return service.updateWorkspaceRoadSection(id, roadSectionId, request);
  }

  @PostMapping("/{id}/road-sections/{roadSectionId}/bind-reference-segment")
  RoadSectionDto bindRoadSectionReferenceSegment(
      @PathVariable UUID id,
      @PathVariable UUID roadSectionId,
      @RequestBody BindReferenceSegmentRequest request
  ) {
    return service.bindWorkspaceRoadSectionReferenceSegment(id, roadSectionId, request);
  }

  @PostMapping("/{id}/validate")
  List<ValidationIssueDto> validate(@PathVariable UUID id) {
    return service.validateWorkspace(id);
  }

  @PostMapping("/{id}/finalize")
  WorkspaceDto finalizeWorkspace(@PathVariable UUID id) {
    return service.finalizeWorkspace(id);
  }

  @PostMapping("/{id}/reject")
  WorkspaceDto reject(@PathVariable UUID id) {
    return service.rejectWorkspace(id);
  }
}
