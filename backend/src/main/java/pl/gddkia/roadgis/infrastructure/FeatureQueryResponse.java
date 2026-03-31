package pl.gddkia.roadgis.infrastructure;

import java.util.List;

public record FeatureQueryResponse(List<FeatureView> publishedFeatures, List<FeatureView> draftFeatures) {}
