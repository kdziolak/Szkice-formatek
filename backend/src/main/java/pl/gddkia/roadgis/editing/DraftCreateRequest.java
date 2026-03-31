package pl.gddkia.roadgis.editing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DraftCreateRequest(
    @NotBlank @Size(max = 200) String draftName,
    @NotNull DraftScope draftScope) {}
