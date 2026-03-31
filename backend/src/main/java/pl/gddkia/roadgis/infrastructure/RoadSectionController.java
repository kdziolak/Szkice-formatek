package pl.gddkia.roadgis.infrastructure;

import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/road-sections")
public class RoadSectionController {

  private final RoadSectionQueryService roadSectionQueryService;

  public RoadSectionController(RoadSectionQueryService roadSectionQueryService) {
    this.roadSectionQueryService = roadSectionQueryService;
  }

  @GetMapping
  public PagedRoadSectionsResponse listRoadSections(
      @RequestParam(required = false) String roadNumber,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) UUID draftId,
      @RequestParam(required = false) UUID referenceSegmentBusinessId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size) {
    return roadSectionQueryService.listRoadSections(
        roadNumber, status, draftId, referenceSegmentBusinessId, page, size);
  }

  @GetMapping("/{businessId}")
  public RoadSectionComparisonDetail getRoadSection(
      @PathVariable UUID businessId, @RequestParam(required = false) UUID draftId) {
    return roadSectionQueryService.getRoadSection(businessId, draftId);
  }
}
