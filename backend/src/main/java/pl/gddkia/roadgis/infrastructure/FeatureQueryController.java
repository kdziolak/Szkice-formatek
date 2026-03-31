package pl.gddkia.roadgis.infrastructure;

import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/query")
public class FeatureQueryController {

  private final WorkspaceQueryService workspaceQueryService;

  public FeatureQueryController(WorkspaceQueryService workspaceQueryService) {
    this.workspaceQueryService = workspaceQueryService;
  }

  @GetMapping("/features")
  public FeatureQueryResponse queryFeatures(
      @RequestParam String layer,
      @RequestParam String bbox,
      @RequestParam double scaleDenominator,
      @RequestParam(required = false) UUID draftId,
      @RequestParam(required = false) String status) {
    return workspaceQueryService.queryFeatures(layer, bbox, scaleDenominator, draftId, status);
  }
}
