package pl.gddkia.roadgis.editing;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.springframework.stereotype.Service;
import pl.gddkia.roadgis.common.ApiBadRequestException;
import pl.gddkia.roadgis.common.ApiNotFoundException;
import pl.gddkia.roadgis.common.GeometryMapper;
import pl.gddkia.roadgis.infrastructure.RoadSectionQueryService;

@Service
public class DraftService {

  private static final String ACTOR = "system";

  private final DraftRepository draftRepository;
  private final RoadSectionQueryService roadSectionQueryService;
  private final GeometryMapper geometryMapper;
  private final ObjectMapper objectMapper;

  public DraftService(
      DraftRepository draftRepository,
      RoadSectionQueryService roadSectionQueryService,
      GeometryMapper geometryMapper,
      ObjectMapper objectMapper) {
    this.draftRepository = draftRepository;
    this.roadSectionQueryService = roadSectionQueryService;
    this.geometryMapper = geometryMapper;
    this.objectMapper = objectMapper;
  }

  public DraftCreateResponse createDraft(DraftCreateRequest request) {
    return draftRepository.createDraft(request.draftName(), request.draftScope(), ACTOR);
  }

  public DraftCommandResponse saveDraftCommand(UUID draftId, DraftCommandRequest request) {
    DraftRepository.DraftReference draftReference =
        draftRepository.findDraft(draftId)
            .orElseThrow(
                () ->
                    new ApiNotFoundException(
                        "DRAFT_NOT_FOUND", "Draft o podanym identyfikatorze nie istnieje."));

    UUID targetBusinessId = resolveTargetBusinessId(request);
    validateRoadSectionTarget(request.actionType(), targetBusinessId);

    return draftRepository.upsertDraftCommand(
        draftReference.draftId(),
        draftReference.businessId(),
        request.entityType(),
        targetBusinessId,
        request.actionType(),
        serializePayload(request),
        geometryMapper.toWkt(request.geometry()),
        request.geometry() == null ? null : geometryMapper.systemSrid(),
        ACTOR);
  }

  private UUID resolveTargetBusinessId(DraftCommandRequest request) {
    return switch (request.actionType()) {
      case CREATE -> request.targetBusinessId() != null ? request.targetBusinessId() : UUID.randomUUID();
      case UPDATE, DELETE -> {
        if (request.targetBusinessId() == null) {
          throw new ApiBadRequestException(
              "INVALID_REQUEST",
              "Pole targetBusinessId jest wymagane dla akcji UPDATE i DELETE.");
        }
        yield request.targetBusinessId();
      }
    };
  }

  private void validateRoadSectionTarget(DraftActionType actionType, UUID targetBusinessId) {
    if (actionType == DraftActionType.CREATE) {
      return;
    }

    if (!roadSectionQueryService.existsByBusinessId(targetBusinessId)) {
      throw new ApiNotFoundException(
          "ROAD_SECTION_NOT_FOUND", "Odcinek drogowy o podanym businessId nie istnieje.");
    }
  }

  private String serializePayload(DraftCommandRequest request) {
    try {
      return objectMapper.writeValueAsString(request.payload());
    } catch (JsonProcessingException exception) {
      throw new ApiBadRequestException(
          "INVALID_REQUEST", "Nie udalo sie zapisac payload w formacie JSON.");
    }
  }
}
