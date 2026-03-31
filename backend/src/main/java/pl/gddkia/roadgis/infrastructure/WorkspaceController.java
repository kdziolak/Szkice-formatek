package pl.gddkia.roadgis.infrastructure;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/layers")
public class WorkspaceController {

  private final WorkspaceQueryService workspaceQueryService;

  public WorkspaceController(WorkspaceQueryService workspaceQueryService) {
    this.workspaceQueryService = workspaceQueryService;
  }

  @GetMapping("/workspace")
  public WorkspaceConfigResponse getWorkspaceConfiguration() {
    return workspaceQueryService.getWorkspaceConfiguration();
  }
}
