package pl.gddkia.roadgis.reference;

import java.util.List;
import pl.gddkia.roadgis.common.PageMetadata;

public record PagedReferenceSegmentsResponse(
    List<ReferenceSegmentSummary> items, PageMetadata page) {}
