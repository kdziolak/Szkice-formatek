package pl.gddkia.roadgis.editing;

import java.sql.Types;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DraftRepository {

  private static final RowMapper<DraftReference> DRAFT_REFERENCE_ROW_MAPPER =
      (resultSet, rowNum) ->
          new DraftReference(
              resultSet.getLong("draft_id"),
              UUID.fromString(resultSet.getString("business_id")),
              DraftStatus.valueOf(resultSet.getString("draft_status")));

  private static final RowMapper<DraftCreateResponse> DRAFT_CREATE_ROW_MAPPER =
      (resultSet, rowNum) ->
          new DraftCreateResponse(
              UUID.fromString(resultSet.getString("business_id")),
              resultSet.getString("draft_name"),
              DraftScope.valueOf(resultSet.getString("draft_scope")),
              DraftStatus.valueOf(resultSet.getString("draft_status")),
              toOffsetDateTime(resultSet.getObject("created_at", LocalDateTime.class)));

  private static final RowMapper<DraftCommandResponse> DRAFT_COMMAND_ROW_MAPPER =
      (resultSet, rowNum) ->
          new DraftCommandResponse(
              UUID.fromString(resultSet.getString("draft_object_business_id")),
              UUID.fromString(resultSet.getString("draft_business_id")),
              DraftEntityType.valueOf(resultSet.getString("entity_type")),
              DraftActionType.valueOf(resultSet.getString("action_type")),
              UUID.fromString(resultSet.getString("target_business_id")),
              DraftValidationState.valueOf(resultSet.getString("validation_state")),
              DraftConflictState.valueOf(resultSet.getString("conflict_state")),
              toOffsetDateTime(resultSet.getObject("changed_at", LocalDateTime.class)));

  private static final RowMapper<DraftRoadSectionCommand> DRAFT_ROAD_SECTION_COMMAND_ROW_MAPPER =
      (resultSet, rowNum) ->
          new DraftRoadSectionCommand(
              UUID.fromString(resultSet.getString("draft_command_id")),
              UUID.fromString(resultSet.getString("target_business_id")),
              DraftActionType.valueOf(resultSet.getString("action_type")),
              resultSet.getString("payload_json"),
              resultSet.getString("geometry_wkt"),
              resultSet.getObject("srid", Integer.class));

  private final NamedParameterJdbcTemplate jdbcTemplate;

  public DraftRepository(NamedParameterJdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public DraftCreateResponse createDraft(String draftName, DraftScope draftScope, String actor) {
    return jdbcTemplate.queryForObject(
        """
        INSERT INTO edit.draft (
          business_id,
          draft_name,
          draft_scope,
          draft_status,
          created_at,
          created_by,
          updated_at,
          updated_by
        )
        OUTPUT
          CONVERT(varchar(36), INSERTED.business_id) AS business_id,
          INSERTED.draft_name,
          INSERTED.draft_scope,
          INSERTED.draft_status,
          INSERTED.created_at
        VALUES (
          NEWID(),
          :draftName,
          :draftScope,
          'OPEN',
          SYSUTCDATETIME(),
          :actor,
          SYSUTCDATETIME(),
          :actor
        )
        """,
        new MapSqlParameterSource()
            .addValue("draftName", draftName)
            .addValue("draftScope", draftScope.name())
            .addValue("actor", actor),
        DRAFT_CREATE_ROW_MAPPER);
  }

  public Optional<DraftReference> findDraft(UUID draftBusinessId) {
    List<DraftReference> drafts =
        jdbcTemplate.query(
            """
            SELECT
              draft_id,
              CONVERT(varchar(36), business_id) AS business_id,
              draft_status
            FROM edit.draft
            WHERE business_id = CAST(:draftBusinessId AS uniqueidentifier)
            """,
            new MapSqlParameterSource().addValue("draftBusinessId", draftBusinessId.toString()),
            DRAFT_REFERENCE_ROW_MAPPER);

    return drafts.stream().findFirst();
  }

  public DraftCommandResponse upsertDraftCommand(
      long draftId,
      UUID draftBusinessId,
      DraftEntityType entityType,
      UUID targetBusinessId,
      DraftActionType actionType,
      String payloadJson,
      String geometryWkt,
      Integer srid,
      String actor) {
    MapSqlParameterSource parameters =
        new MapSqlParameterSource()
            .addValue("draftId", draftId)
            .addValue("draftBusinessId", draftBusinessId.toString())
            .addValue("entityType", entityType.name())
            .addValue("targetBusinessId", targetBusinessId.toString())
            .addValue("actionType", actionType.name())
            .addValue("payloadJson", payloadJson)
            .addValue("geometryWkt", geometryWkt, Types.NVARCHAR)
            .addValue("srid", srid, Types.INTEGER)
            .addValue("actor", actor);

    List<DraftCommandResponse> updatedRows =
        jdbcTemplate.query(
            """
            UPDATE edit.draft_object
            SET action_type = :actionType,
                payload_json = :payloadJson,
                geometry_value = CASE
                  WHEN :geometryWkt IS NULL THEN NULL
                  ELSE geometry::STGeomFromText(:geometryWkt, :srid)
                END,
                srid = :srid,
                validation_state = 'PENDING',
                conflict_state = 'NONE',
                updated_at = SYSUTCDATETIME(),
                updated_by = :actor
            OUTPUT
              CONVERT(varchar(36), INSERTED.business_id) AS draft_object_business_id,
              CAST(:draftBusinessId AS varchar(36)) AS draft_business_id,
              INSERTED.entity_type,
              INSERTED.action_type,
              CONVERT(varchar(36), INSERTED.target_business_id) AS target_business_id,
              INSERTED.validation_state,
              INSERTED.conflict_state,
              INSERTED.updated_at AS changed_at
            WHERE draft_id = :draftId
              AND entity_type = :entityType
              AND target_business_id = CAST(:targetBusinessId AS uniqueidentifier)
            """,
            parameters,
            DRAFT_COMMAND_ROW_MAPPER);

    if (!updatedRows.isEmpty()) {
      return updatedRows.getFirst();
    }

    return jdbcTemplate.queryForObject(
        """
        INSERT INTO edit.draft_object (
          business_id,
          draft_id,
          entity_type,
          target_business_id,
          action_type,
          payload_json,
          geometry_value,
          srid,
          validation_state,
          conflict_state,
          created_at,
          created_by,
          updated_at,
          updated_by
        )
        OUTPUT
          CONVERT(varchar(36), INSERTED.business_id) AS draft_object_business_id,
          CAST(:draftBusinessId AS varchar(36)) AS draft_business_id,
          INSERTED.entity_type,
          INSERTED.action_type,
          CONVERT(varchar(36), INSERTED.target_business_id) AS target_business_id,
          INSERTED.validation_state,
          INSERTED.conflict_state,
          INSERTED.created_at AS changed_at
        VALUES (
          NEWID(),
          :draftId,
          :entityType,
          CAST(:targetBusinessId AS uniqueidentifier),
          :actionType,
          :payloadJson,
          CASE
            WHEN :geometryWkt IS NULL THEN NULL
            ELSE geometry::STGeomFromText(:geometryWkt, :srid)
          END,
          :srid,
          'PENDING',
          'NONE',
          SYSUTCDATETIME(),
          :actor,
          SYSUTCDATETIME(),
          :actor
        )
        """,
        parameters,
        DRAFT_COMMAND_ROW_MAPPER);
  }

  private static OffsetDateTime toOffsetDateTime(LocalDateTime localDateTime) {
    return localDateTime.atOffset(ZoneOffset.UTC);
  }

  public List<DraftRoadSectionCommand> findRoadSectionCommands(UUID draftBusinessId) {
    return jdbcTemplate.query(
        """
        SELECT
          CONVERT(varchar(36), draft_object.business_id) AS draft_command_id,
          CONVERT(varchar(36), draft_object.target_business_id) AS target_business_id,
          draft_object.action_type,
          draft_object.payload_json,
          draft_object.geometry_value.STAsText() AS geometry_wkt,
          draft_object.srid
        FROM edit.draft draft_ref
        INNER JOIN edit.draft_object draft_object
          ON draft_object.draft_id = draft_ref.draft_id
        WHERE draft_ref.business_id = CAST(:draftBusinessId AS uniqueidentifier)
          AND draft_object.entity_type = 'ROAD_SECTION'
        ORDER BY draft_object.updated_at ASC, draft_object.created_at ASC
        """,
        new MapSqlParameterSource().addValue("draftBusinessId", draftBusinessId.toString()),
        DRAFT_ROAD_SECTION_COMMAND_ROW_MAPPER);
  }

  public record DraftReference(long draftId, UUID businessId, DraftStatus draftStatus) {}
}
