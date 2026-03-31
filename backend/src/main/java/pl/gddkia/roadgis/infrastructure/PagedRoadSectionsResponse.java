package pl.gddkia.roadgis.infrastructure;

import java.util.List;
import pl.gddkia.roadgis.common.PageMetadata;

public record PagedRoadSectionsResponse(List<RoadSectionSummary> items, PageMetadata page) {}
