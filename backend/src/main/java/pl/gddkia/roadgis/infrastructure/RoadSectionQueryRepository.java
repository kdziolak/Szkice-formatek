package pl.gddkia.roadgis.infrastructure;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class RoadSectionQueryRepository {

  private static final RowMapper<RoadSectionDetailRow> ROAD_SECTION_DETAIL_ROW_MAPPER =
      (resultSet, rowNum) ->
          new RoadSectionDetailRow(
              UUID.fromString(resultSet.getString("business_id")),
              resultSet.getString("road_number"),
              resultSet.getString("road_class_code"),
              resultSet.getString("road_name"),
              resultSet.getString("section_code"),
              optionalUuid(resultSet.getString("reference_segment_business_id")),
              resultSet.getBigDecimal("chainage_from"),
              resultSet.getBigDecimal("chainage_to"),
              resultSet.getString("lifecycle_status"),
              resultSet.getString("geometry_wkt"),
              resultSet.getInt("srid"));

  private final NamedParameterJdbcTemplate jdbcTemplate;

  RoadSectionQueryRepository(NamedParameterJdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<RoadSectionDetailRow> findAllRows() {
    return jdbcTemplate.query(baseSelect() + orderClause(), new MapSqlParameterSource(), ROAD_SECTION_DETAIL_ROW_MAPPER);
  }

  public Optional<RoadSectionDetailRow> findByBusinessId(UUID businessId) {
    MapSqlParameterSource parameters =
        new MapSqlParameterSource().addValue("businessId", businessId.toString());

    List<RoadSectionDetailRow> results =
        jdbcTemplate.query(
            """
            SELECT
              CONVERT(varchar(36), section_ref.business_id) AS business_id,
              road_ref.road_number,
              road_ref.road_class_code,
              road_ref.road_name,
              section_ref.section_code,
              CONVERT(varchar(36), segment_ref.business_id) AS reference_segment_business_id,
              section_ref.chainage_from,
              section_ref.chainage_to,
              section_ref.lifecycle_status,
              section_ref.geometry_value.STAsText() AS geometry_wkt,
              section_ref.srid
            FROM road.road_section section_ref
            INNER JOIN road.road road_ref
              ON road_ref.road_id = section_ref.road_id
            LEFT JOIN ref.reference_segment segment_ref
              ON segment_ref.reference_segment_id = section_ref.reference_segment_id
            WHERE section_ref.business_id = CAST(:businessId AS uniqueidentifier)
            """,
            parameters,
            ROAD_SECTION_DETAIL_ROW_MAPPER);

    return results.stream().findFirst();
  }

  public List<RoadSectionDetailRow> findRowsWithinBbox(String bboxWkt, String status) {
    MapSqlParameterSource parameters =
        new MapSqlParameterSource()
            .addValue("bboxWkt", bboxWkt)
            .addValue("status", status);

    return jdbcTemplate.query(
        baseSelect()
            + """
            WHERE section_ref.geometry_value.STIntersects(geometry::STGeomFromText(:bboxWkt, 2180)) = 1
              AND (:status IS NULL OR section_ref.lifecycle_status = :status)
            """
            + orderClause(),
        parameters,
        ROAD_SECTION_DETAIL_ROW_MAPPER);
  }

  public boolean existsByBusinessId(UUID businessId) {
    Integer count =
        jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM road.road_section
            WHERE business_id = CAST(:businessId AS uniqueidentifier)
            """,
            new MapSqlParameterSource().addValue("businessId", businessId.toString()),
            Integer.class);

    return count != null && count > 0;
  }

  private static String baseSelect() {
    return """
        SELECT
          CONVERT(varchar(36), section_ref.business_id) AS business_id,
          road_ref.road_number,
          road_ref.road_class_code,
          road_ref.road_name,
          section_ref.section_code,
          CONVERT(varchar(36), segment_ref.business_id) AS reference_segment_business_id,
          section_ref.chainage_from,
          section_ref.chainage_to,
          section_ref.lifecycle_status,
          section_ref.geometry_value.STAsText() AS geometry_wkt,
          section_ref.srid
        FROM road.road_section section_ref
        INNER JOIN road.road road_ref
          ON road_ref.road_id = section_ref.road_id
        LEFT JOIN ref.reference_segment segment_ref
          ON segment_ref.reference_segment_id = section_ref.reference_segment_id
        """;
  }

  private static String orderClause() {
    return """
        ORDER BY road_ref.road_number, section_ref.chainage_from, section_ref.section_code
        """;
  }

  private static UUID optionalUuid(String value) {
    return value == null ? null : UUID.fromString(value);
  }

  record RoadSectionDetailRow(
      UUID businessId,
      String roadNumber,
      String roadClassCode,
      String roadName,
      String sectionCode,
      UUID referenceSegmentBusinessId,
      java.math.BigDecimal chainageFrom,
      java.math.BigDecimal chainageTo,
      String lifecycleStatus,
      String geometryWkt,
      int srid) {}
}
