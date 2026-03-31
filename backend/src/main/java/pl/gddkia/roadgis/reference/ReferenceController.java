package pl.gddkia.roadgis.reference;

import java.math.BigDecimal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reference")
public class ReferenceController {

  private final ReferenceQueryService referenceQueryService;

  public ReferenceController(ReferenceQueryService referenceQueryService) {
    this.referenceQueryService = referenceQueryService;
  }

  @GetMapping("/segments")
  public PagedReferenceSegmentsResponse listReferenceSegments(
      @RequestParam(required = false) String roadNumber,
      @RequestParam(required = false) BigDecimal chainageFrom,
      @RequestParam(required = false) BigDecimal chainageTo,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size) {
    return referenceQueryService.listReferenceSegments(roadNumber, chainageFrom, chainageTo, page, size);
  }

  @GetMapping("/locate")
  public ReferenceLocateResponse locateReferenceSegments(
      @RequestParam String roadNumber,
      @RequestParam BigDecimal chainage,
      @RequestParam(required = false) String directionCode) {
    return referenceQueryService.locateReferenceSegments(roadNumber, chainage, directionCode);
  }
}
