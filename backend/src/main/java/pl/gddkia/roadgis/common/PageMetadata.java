package pl.gddkia.roadgis.common;

public record PageMetadata(int page, int size, long totalElements, int totalPages) {

  public static PageMetadata of(int page, int size, long totalElements) {
    int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
    return new PageMetadata(page, size, totalElements, totalPages);
  }
}
