package pl.gddkia.roadgis.reference;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import pl.gddkia.roadgis.common.PageMetadata;

@Repository
class ReferenceQueryRepository {

  private static final RowMapper<ReferenceSegmentSummary> REFERENCE_SEGMENT_ROW_MAPPER =
      (resultSet, rowNum) ->
          new ReferenceSegmentSummary(
              UUID.fromString(resultSet.getString("business_id")),
              resultSet.getString("road_number"),
              resultSet.getString("axis_code"),
              resultSet.getString("direction_code"),
              resultSet.getString("segment_code"),
              resultSet.getBigDecimal("chainage_from"),
              resultSet.getBigDecimal("chainage_to"));

  private static final RowMapper<ReferenceLocateCandidate> LOCATE_ROW_MAPPER =
      (resultSet, rowNum) ->
          new ReferenceLocateCandidate(
              UUID.fromString(resultSet.getString("business_id")),
              resultSet.getString("road_number"),
              resultSet.getString("axis_code"),
              resultSet.getString("direction_code"),
              resultSet.getString("segment_code"),
              resultSet.getBigDecimal("chainage_from"),
              resultSet.getBigDecimal("chainage_to"),
              resultSet.getBigDecimal("matched_chainage"),
              resultSet.getDouble("score"));

  private static final RowMapper<ReferenceSegmentFeatureRow> FEATURE_ROW_MAPPER =
      (resultSet, rowNum) ->
          new ReferenceSegmentFeatureRow(
              UUID.fromString(resultSet.getString("business_id")),
              resultSet.getString("segment_code"),
              resultSet.getString("geometry_wkt"),
              resultSet.getInt("srid"));

  private final NamedParameterJdbcTemplate jdbcTemplate;

  ReferenceQueryRepository(NamedParameterJdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public PagedReferenceSegmentsResponse listReferenceSegments(
      String roadNumber, BigDecimal chainageFrom, BigDecimal chainageTo, int page, int size) {
    MapSqlParameterSource parameters = new MapSqlParameterSource();
    String whereClause = buildWhereClause(roadNumber, chainageFrom, chainageTo, parameters);
    String fromClause =
        """
        FROM ref.reference_segment rs
        INNER JOIN ref.reference_axis ra
          ON ra.reference_axis_id = rs.reference_axis_id
        """
            + whereClause;

    Long totalElements =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) " + fromClause,
            parameters,
            Long.class);

    parameters.addValue("offset", page * size);
    parameters.addValue("size", size);

    List<ReferenceSegmentSummary> items =
        jdbcTemplate.query(
            """
            SELECT
              CONVERT(varchar(36), rs.business_id) AS business_id,
              ra.road_number,
              ra.axis_code,
              ra.direction_code,
              rs.segment_code,
              rs.chainage_from,
              rs.chainage_to
            """
                + fromClause
                + """
             ORDER BY ra.road_number, ra.axis_code, rs.chainage_from
             OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY
            """,
            parameters,
            REFERENCE_SEGMENT_ROW_MAPPER);

    return new PagedReferenceSegmentsResponse(items, PageMetadata.of(page, size, totalElements == null ? 0 : totalElements));
  }

  public List<ReferenceLocateCandidate> locateReferenceSegments(
      String roadNumber, BigDecimal chainage, String directionCode) {
    String distanceExpression =
        """
        CASE
          WHEN :chainage < rs.chainage_from THEN rs.chainage_from - :chainage
          WHEN :chainage > rs.chainage_to THEN :chainage - rs.chainage_to
          ELSE 0
        END
        """;

    String matchedChainageExpression =
        """
        CASE
          WHEN :chainage < rs.chainage_from THEN rs.chainage_from
          WHEN :chainage > rs.chainage_to THEN rs.chainage_to
          ELSE :chainage
        END
        """;

    MapSqlParameterSource parameters =
        new MapSqlParameterSource()
            .addValue("roadNumber", roadNumber)
            .addValue("chainage", chainage)
            .addValue("directionCode", directionCode, Types.NVARCHAR);

    return jdbcTemplate.query(
        """
        SELECT TOP 20
          CONVERT(varchar(36), rs.business_id) AS business_id,
          ra.road_number,
          ra.axis_code,
          ra.direction_code,
          rs.segment_code,
          rs.chainage_from,
          rs.chainage_to,
          CAST(%s AS DECIMAL(12,3)) AS matched_chainage,
          CAST(
            CASE
              WHEN %s = 0 THEN 1.0
              ELSE 1.0 / (1.0 + CAST(%s AS FLOAT))
            END AS FLOAT
          ) AS score
        FROM ref.reference_segment rs
        INNER JOIN ref.reference_axis ra
          ON ra.reference_axis_id = rs.reference_axis_id
        WHERE ra.road_number = :roadNumber
          AND (:directionCode IS NULL OR ra.direction_code = :directionCode)
        ORDER BY score DESC, %s ASC, rs.chainage_from ASC
        """
            .formatted(
                matchedChainageExpression,
                distanceExpression,
                distanceExpression,
                distanceExpression),
        parameters,
        LOCATE_ROW_MAPPER);
  }

  public List<ReferenceSegmentFeatureRow> findRowsWithinBbox(String bboxPolygonWkt) {
    return jdbcTemplate.query(
        """
        SELECT
          CONVERT(varchar(36), rs.business_id) AS business_id,
          rs.segment_code,
          rs.geometry_value.STAsText() AS geometry_wkt,
          rs.srid
        FROM ref.reference_segment rs
        WHERE rs.geometry_value.STIntersects(geometry::STGeomFromText(:bboxPolygonWkt, 2180)) = 1
        ORDER BY rs.chainage_from ASC
        """,
        new MapSqlParameterSource("bboxPolygonWkt", bboxPolygonWkt),
        FEATURE_ROW_MAPPER);
  }

  private String buildWhereClause(
      String roadNumber,
      BigDecimal chainageFrom,
      BigDecimal chainageTo,
      MapSqlParameterSource parameters) {
    List<String> conditions = new ArrayList<>();

    if (roadNumber != null && !roadNumber.isBlank()) {
      conditions.add("ra.road_number = :roadNumber");
      parameters.addValue("roadNumber", roadNumber);
    }

    if (chainageFrom != null) {
      conditions.add("rs.chainage_to >= :chainageFrom");
      parameters.addValue("chainageFrom", chainageFrom);
    }

    if (chainageTo != null) {
      conditions.add("rs.chainage_from <= :chainageTo");
      parameters.addValue("chainageTo", chainageTo);
    }

    if (conditions.isEmpty()) {
      return "";
    }

    return " WHERE " + String.join(" AND ", conditions);
  }

  public record ReferenceSegmentFeatureRow(
      UUID businessId,
      String segmentCode,
      String geometryWkt,
      Integer srid) {}
}
