package pl.gddkia.roadgis.editing;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/drafts")
public class DraftController {

  private final DraftService draftService;

  public DraftController(DraftService draftService) {
    this.draftService = draftService;
  }

  @PostMapping
  public DraftCreateResponse createDraft(@Valid @RequestBody DraftCreateRequest request) {
    return draftService.createDraft(request);
  }

  @PostMapping("/{draftId}/commands")
  public DraftCommandResponse saveDraftCommand(
      @PathVariable UUID draftId, @Valid @RequestBody DraftCommandRequest request) {
    return draftService.saveDraftCommand(draftId, request);
  }
}
