package pl.gddkia.roadgis.infrastructure;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import pl.gddkia.roadgis.api.RoadInfraDtos.HistoryDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.ImportJobDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.InfrastructureObjectDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.InfrastructureObjectRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.LayerDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.ReferenceBindingDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.ReferenceSegmentDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.ReportRowDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.RoadSectionUpdateRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.ValidationIssueDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceObjectUpdateRequest;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRequest;
import pl.gddkia.roadgis.common.NotFoundException;
import pl.gddkia.roadgis.domain.DraftStatus;
import pl.gddkia.roadgis.validation.ValidationIssueDraft;

@Repository
public class RoadInfraRepository {

  private final JdbcTemplate jdbcTemplate;
  private final ObjectMapper objectMapper;

  public RoadInfraRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
    this.jdbcTemplate = jdbcTemplate;
    this.objectMapper = objectMapper;
  }

  public List<RoadDto> listRoads() {
    return jdbcTemplate.query("""
        select id, road_number, category, name, managing_authority, total_length_km
        from roads
        order by road_number
        """, this::roadDto);
  }

  public List<ReferenceSegmentDto> listReferenceSegments(String roadNumber) {
    return jdbcTemplate.query("""
        select rs.id, rs.road_id, r.road_number, rs.segment_code, rs.start_mileage_km, rs.end_mileage_km,
               rs.carriageway, rs.direction, rs.status, rs.valid_from, rs.valid_to,
               ST_AsGeoJSON(rs.geometry)::text as geometry_geojson
        from reference_segments rs
        join roads r on r.id = rs.road_id
        where (? is null or r.road_number = ?)
        order by r.road_number, rs.start_mileage_km
        """, this::referenceSegmentDto, roadNumber, roadNumber);
  }

  public ReferenceSegmentDto getReferenceSegment(UUID id) {
    return queryOne("""
        select rs.id, rs.road_id, r.road_number, rs.segment_code, rs.start_mileage_km, rs.end_mileage_km,
               rs.carriageway, rs.direction, rs.status, rs.valid_from, rs.valid_to,
               ST_AsGeoJSON(rs.geometry)::text as geometry_geojson
        from reference_segments rs
        join roads r on r.id = rs.road_id
        where rs.id = ?
        """, this::referenceSegmentDto, id);
  }

  public ReferenceSegmentDto nearestReferenceSegment(BigDecimal lat, BigDecimal lon, String roadNumber) {
    return queryOne("""
        select rs.id, rs.road_id, r.road_number, rs.segment_code, rs.start_mileage_km, rs.end_mileage_km,
               rs.carriageway, rs.direction, rs.status, rs.valid_from, rs.valid_to,
               ST_AsGeoJSON(rs.geometry)::text as geometry_geojson
        from reference_segments rs
        join roads r on r.id = rs.road_id
        where (? is null or r.road_number = ?)
        order by rs.geometry <-> ST_SetSRID(ST_MakePoint(?, ?), 4326)
        limit 1
        """, this::referenceSegmentDto, roadNumber, roadNumber, lon, lat);
  }

  public List<InfrastructureObjectDto> listInfrastructureObjects(String objectType, String status) {
    return jdbcTemplate.query("""
        select io.id, io.object_type, io.object_code, io.name, io.road_id, r.road_number,
               io.reference_segment_id, rs.segment_code as reference_segment_code,
               io.global_mileage_from, io.global_mileage_to, io.local_mileage_from, io.local_mileage_to,
               ST_AsGeoJSON(io.geometry)::text as geometry_geojson,
               io.geometry_type, io.owner, io.branch, io.district, io.status, io.validation_status,
               io.draft_status, io.valid_from, io.valid_to, io.created_by, io.created_at, io.updated_at,
               io.attributes::text as attributes_json
        from infrastructure_objects io
        left join roads r on r.id = io.road_id
        left join reference_segments rs on rs.id = io.reference_segment_id
        where (? is null or io.object_type = ?)
          and (? is null or io.status = ?)
        order by io.object_type, io.object_code
        """, this::infrastructureObjectDto, objectType, objectType, status, status);
  }

  public InfrastructureObjectDto getInfrastructureObject(UUID id) {
    return queryOne("""
        select io.id, io.object_type, io.object_code, io.name, io.road_id, r.road_number,
               io.reference_segment_id, rs.segment_code as reference_segment_code,
               io.global_mileage_from, io.global_mileage_to, io.local_mileage_from, io.local_mileage_to,
               ST_AsGeoJSON(io.geometry)::text as geometry_geojson,
               io.geometry_type, io.owner, io.branch, io.district, io.status, io.validation_status,
               io.draft_status, io.valid_from, io.valid_to, io.created_by, io.created_at, io.updated_at,
               io.attributes::text as attributes_json
        from infrastructure_objects io
        left join roads r on r.id = io.road_id
        left join reference_segments rs on rs.id = io.reference_segment_id
        where io.id = ?
        """, this::infrastructureObjectDto, id);
  }

  public List<RoadSectionDto> listRoadSections(String roadNumber, String status) {
    return jdbcTemplate.query("""
        select rs.id, rs.business_id, rs.road_id, r.road_number, rs.reference_segment_id,
               direct_rs.segment_code as reference_segment_code, rs.section_code, rs.name,
               rs.kilometer_from, rs.kilometer_to, rs.carriageway, rs.direction,
               ST_AsGeoJSON(rs.geometry)::text as geometry_geojson,
               rs.status, rs.validation_status, rs.draft_status, rs.valid_from, rs.valid_to, rs.updated_at,
               rb.reference_segment_id as binding_reference_segment_id,
               binding_rs.segment_code as binding_reference_segment_code,
               binding_r.id as binding_road_id,
               binding_r.road_number as binding_road_number,
               rb.mileage_from as binding_mileage_from,
               rb.mileage_to as binding_mileage_to,
               rb.location_method as binding_location_method,
               rb.consistency_status as binding_consistency_status
        from road_sections rs
        join roads r on r.id = rs.road_id
        left join reference_segments direct_rs on direct_rs.id = rs.reference_segment_id
        left join lateral (
          select *
          from road_section_reference_bindings binding
          where binding.road_section_id = rs.id
            and binding.valid_to is null
          order by binding.created_at desc
          limit 1
        ) rb on true
        left join reference_segments binding_rs on binding_rs.id = rb.reference_segment_id
        left join roads binding_r on binding_r.id = binding_rs.road_id
        where (? is null or r.road_number = ?)
          and (? is null or rs.status = ?)
        order by r.road_number, rs.kilometer_from, rs.section_code
        """, this::roadSectionDto, roadNumber, roadNumber, status, status);
  }

  public RoadSectionDto getRoadSection(UUID id) {
    return queryOne("""
        select rs.id, rs.business_id, rs.road_id, r.road_number, rs.reference_segment_id,
               direct_rs.segment_code as reference_segment_code, rs.section_code, rs.name,
               rs.kilometer_from, rs.kilometer_to, rs.carriageway, rs.direction,
               ST_AsGeoJSON(rs.geometry)::text as geometry_geojson,
               rs.status, rs.validation_status, rs.draft_status, rs.valid_from, rs.valid_to, rs.updated_at,
               rb.reference_segment_id as binding_reference_segment_id,
               binding_rs.segment_code as binding_reference_segment_code,
               binding_r.id as binding_road_id,
               binding_r.road_number as binding_road_number,
               rb.mileage_from as binding_mileage_from,
               rb.mileage_to as binding_mileage_to,
               rb.location_method as binding_location_method,
               rb.consistency_status as binding_consistency_status
        from road_sections rs
        join roads r on r.id = rs.road_id
        left join reference_segments direct_rs on direct_rs.id = rs.reference_segment_id
        left join lateral (
          select *
          from road_section_reference_bindings binding
          where binding.road_section_id = rs.id
            and binding.valid_to is null
          order by binding.created_at desc
          limit 1
        ) rb on true
        left join reference_segments binding_rs on binding_rs.id = rb.reference_segment_id
        left join roads binding_r on binding_r.id = binding_rs.road_id
        where rs.id = ?
        """, this::roadSectionDto, id);
  }

  public UUID createInfrastructureObject(InfrastructureObjectRequest request) {
    UUID id = UUID.randomUUID();
    String geometry = persistableGeometryJson(request.geometry());
    jdbcTemplate.update("""
        insert into infrastructure_objects (
          id, object_type, object_code, name, road_id, reference_segment_id,
          global_mileage_from, global_mileage_to, local_mileage_from, local_mileage_to,
          geometry, geometry_type, owner, branch, district, status, validation_status, draft_status,
          valid_from, created_by, attributes
        )
        values (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          case when ? is null then null else ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) end,
          ?, ?, ?, ?, ?, ?, ?,
          current_date, 'system', cast(? as jsonb)
        )
        """,
        id,
        defaultValue(request.objectType(), "IMPORTED_OBJECT"),
        defaultValue(request.objectCode(), "OBJ-" + id.toString().substring(0, 8)),
        defaultValue(request.name(), "Obiekt infrastruktury"),
        request.roadId(),
        request.referenceSegmentId(),
        request.globalMileageFrom(),
        request.globalMileageTo(),
        request.localMileageFrom(),
        request.localMileageTo(),
        geometry,
        geometry,
        defaultValue(request.geometryType(), "POINT"),
        defaultValue(request.owner(), "Nieustalony"),
        defaultValue(request.branch(), "Oddzial Warszawa"),
        defaultValue(request.district(), "Rejon Warszawa"),
        defaultValue(request.status(), "NOWY"),
        defaultValue(request.validationStatus(), "WYMAGA_WERYFIKACJI_OPERATORA"),
        defaultValue(request.draftStatus(), DraftStatus.NIE_DOTYCZY.name()),
        json(request.attributes()));
    return id;
  }

  public void updateInfrastructureObject(UUID id, InfrastructureObjectRequest request) {
    String geometry = persistableGeometryJson(request.geometry());
    jdbcTemplate.update("""
        update infrastructure_objects
        set object_type = ?,
            object_code = ?,
            name = ?,
            road_id = ?,
            reference_segment_id = ?,
            global_mileage_from = ?,
            global_mileage_to = ?,
            local_mileage_from = ?,
            local_mileage_to = ?,
            geometry = case when ? is null then null else ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) end,
            geometry_type = ?,
            owner = ?,
            branch = ?,
            district = ?,
            status = ?,
            validation_status = ?,
            draft_status = ?,
            attributes = cast(? as jsonb),
            updated_at = now()
        where id = ?
        """,
        defaultValue(request.objectType(), "IMPORTED_OBJECT"),
        defaultValue(request.objectCode(), "OBJ-" + id.toString().substring(0, 8)),
        defaultValue(request.name(), "Obiekt infrastruktury"),
        request.roadId(),
        request.referenceSegmentId(),
        request.globalMileageFrom(),
        request.globalMileageTo(),
        request.localMileageFrom(),
        request.localMileageTo(),
        geometry,
        geometry,
        defaultValue(request.geometryType(), "POINT"),
        defaultValue(request.owner(), "Nieustalony"),
        defaultValue(request.branch(), "Oddzial Warszawa"),
        defaultValue(request.district(), "Rejon Warszawa"),
        defaultValue(request.status(), "NOWY"),
        defaultValue(request.validationStatus(), "WYMAGA_WERYFIKACJI_OPERATORA"),
        defaultValue(request.draftStatus(), DraftStatus.W_MODYFIKACJI.name()),
        json(request.attributes()),
        id);
  }

  public void updateRoadSectionFromDraft(
      UUID id,
      RoadSectionUpdateRequest request,
      String validationStatus
  ) {
    String geometry = persistableGeometryJson(request.geometry());
    ReferenceSegmentDto segment = request.referenceSegmentId() == null ? null : getReferenceSegment(request.referenceSegmentId());
    UUID roadId = segment == null ? null : segment.roadId();
    jdbcTemplate.update("""
        update road_sections
        set name = ?,
            road_id = coalesce(?, road_id),
            reference_segment_id = ?,
            kilometer_from = ?,
            kilometer_to = ?,
            geometry = case when ? is null then geometry else ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) end,
            status = ?,
            validation_status = ?,
            draft_status = ?,
            updated_at = now()
        where id = ?
        """,
        defaultValue(request.name(), "Odcinek drogi"),
        roadId,
        request.referenceSegmentId(),
        request.kilometerFrom(),
        request.kilometerTo(),
        geometry,
        geometry,
        defaultValue(request.status(), "AKTYWNY"),
        validationStatus,
        DraftStatus.NIE_DOTYCZY.name(),
        id);
    if (request.referenceSegmentId() != null) {
      upsertRoadSectionReferenceBinding(
          id,
          request.referenceSegmentId(),
          request.kilometerFrom(),
          request.kilometerTo());
    }
  }

  public void bindReferenceSegment(
      UUID id,
      UUID roadId,
      UUID referenceSegmentId,
      BigDecimal startMileageKm,
      BigDecimal endMileageKm
  ) {
    jdbcTemplate.update("""
        update infrastructure_objects
        set road_id = ?,
            reference_segment_id = ?,
            global_mileage_from = coalesce(global_mileage_from, ?),
            global_mileage_to = coalesce(global_mileage_to, ?),
            validation_status = 'WYMAGA_WERYFIKACJI_OPERATORA',
            updated_at = now()
        where id = ?
        """, roadId, referenceSegmentId, startMileageKm, endMileageKm, id);
  }

  public void replaceValidationIssues(UUID objectId, List<ValidationIssueDraft> issues) {
    replaceValidationIssues(objectId, null, issues);
  }

  public void replaceValidationIssues(UUID objectId, JsonNode geometryMarker, List<ValidationIssueDraft> issues) {
    jdbcTemplate.update("""
        delete from validation_issues
        where coalesce(target_type, 'INFRASTRUCTURE_OBJECT') = 'INFRASTRUCTURE_OBJECT'
          and coalesce(target_id, object_id) = ?
        """, objectId);
    String marker = persistableGeometryJson(geometryMarker);
    for (ValidationIssueDraft issue : issues) {
      jdbcTemplate.update("""
          insert into validation_issues (
            id, object_id, target_type, target_id, target_code,
            severity, issue_type, field_name, message, geometry_marker, resolved
          )
          select ?, ?, ?, ?, coalesce(?, io.object_code),
                 ?, ?, ?, ?,
                 coalesce(case when ? is null then null else ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) end, io.geometry),
                 false
          from infrastructure_objects io
          where io.id = ?
          """,
          UUID.randomUUID(),
          objectId,
          "INFRASTRUCTURE_OBJECT",
          objectId,
          issue.targetCode(),
          issue.severity().name(),
          issue.issueType(),
          issue.fieldName(),
          issue.message(),
          marker,
          marker,
          objectId);
    }
  }

  public void replaceRoadSectionValidationIssues(
      UUID roadSectionId,
      JsonNode geometryMarker,
      List<ValidationIssueDraft> issues
  ) {
    jdbcTemplate.update("""
        delete from validation_issues
        where target_type = 'ROAD_SECTION'
          and target_id = ?
        """, roadSectionId);
    String marker = persistableGeometryJson(geometryMarker);
    for (ValidationIssueDraft issue : issues) {
      jdbcTemplate.update("""
          insert into validation_issues (
            id, object_id, target_type, target_id, target_code,
            severity, issue_type, field_name, message, geometry_marker, resolved
          )
          select ?, null, 'ROAD_SECTION', ?, coalesce(?, rs.section_code),
                 ?, ?, ?, ?,
                 coalesce(case when ? is null then null else ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) end, rs.geometry),
                 false
          from road_sections rs
          where rs.id = ?
          """,
          UUID.randomUUID(),
          roadSectionId,
          issue.targetCode(),
          issue.severity().name(),
          issue.issueType(),
          issue.fieldName(),
          issue.message(),
          marker,
          marker,
          roadSectionId);
    }
  }

  public void updateValidationStatus(UUID objectId, String status) {
    jdbcTemplate.update("""
        update infrastructure_objects
        set validation_status = ?, updated_at = now()
        where id = ?
        """, status, objectId);
  }

  public List<ValidationIssueDto> listValidationIssuesForObject(UUID objectId) {
    return jdbcTemplate.query("""
        select vi.id, vi.object_id, io.object_code,
               coalesce(vi.target_type, 'INFRASTRUCTURE_OBJECT') as target_type,
               coalesce(vi.target_id, vi.object_id) as target_id,
               coalesce(vi.target_code, io.object_code) as target_code,
               vi.severity, vi.issue_type, vi.field_name,
               vi.message, ST_AsGeoJSON(vi.geometry_marker)::text as geometry_marker_geojson,
               vi.created_at, vi.resolved
        from validation_issues vi
        join infrastructure_objects io on io.id = vi.object_id
        where coalesce(vi.target_type, 'INFRASTRUCTURE_OBJECT') = 'INFRASTRUCTURE_OBJECT'
          and coalesce(vi.target_id, vi.object_id) = ?
        order by vi.created_at desc, vi.severity
        """, this::validationIssueDto, objectId);
  }

  public List<LayerDto> listLayers() {
    return jdbcTemplate.query("""
        select layer_code, layer_name, group_name, geometry_type, visible_by_default, min_scale_label, style_hint
        from layer_catalog
        order by sort_order, layer_name
        """, this::layerDto);
  }

  public JsonNode layerFeatures(String layerCode) {
    return switch (layerCode) {
      case "roads" -> roadsFeatureCollection();
      case "road-sections" -> roadSectionsFeatureCollection();
      case "reference-segments" -> referenceSegmentsFeatureCollection();
      case "road-barriers" -> infrastructureFeatureCollection(listInfrastructureObjects("ROAD_BARRIER", null));
      case "traffic-stations" -> infrastructureFeatureCollection(listInfrastructureObjects("TRAFFIC_COUNTING_STATION", null));
      case "technical-channels" -> infrastructureFeatureCollection(listInfrastructureObjects("TECHNICAL_CHANNEL", null));
      case "parcels" -> infrastructureFeatureCollection(listInfrastructureObjects("ROAD_PARCEL", null));
      case "validation-issues" -> validationIssueFeatureCollection(listValidationIssues());
      default -> infrastructureFeatureCollection(listInfrastructureObjects(null, null));
    };
  }

  public UUID createWorkspace(WorkspaceRequest request) {
    UUID id = UUID.randomUUID();
    String geometry = persistableGeometryJson(request.scopeGeometry());
    jdbcTemplate.update("""
        insert into draft_workspaces (id, name, created_by, scope_geometry, status)
        values (?, ?, ?, case when ? is null then null else ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) end, 'AKTYWNY')
        """,
        id,
        defaultValue(request.name(), "Wersja robocza"),
        defaultValue(request.createdBy(), "operator"),
        geometry,
        geometry);
    return id;
  }

  public WorkspaceDto getWorkspace(UUID id) {
    return queryOne(workspaceSql("where dw.id = ?"), this::workspaceDto, id);
  }

  public List<WorkspaceDto> listWorkspaces() {
    return jdbcTemplate.query(workspaceSql(""), this::workspaceDto);
  }

  public void addObjectToWorkspace(UUID workspaceId, InfrastructureObjectDto object, String changedBy) {
    String snapshot = json(objectMapper.valueToTree(object));
    jdbcTemplate.update("""
        insert into draft_object_states (
          id, workspace_id, object_id, edit_status, validation_status,
          original_snapshot, current_snapshot, changed_by
        )
        values (?, ?, ?, 'DODANY_DO_WERSJI_ROBOCZEJ', ?, cast(? as jsonb), cast(? as jsonb), ?)
        on conflict (workspace_id, object_id)
        do update set edit_status = excluded.edit_status,
                      validation_status = excluded.validation_status,
                      current_snapshot = excluded.current_snapshot,
                      changed_by = excluded.changed_by,
                      changed_at = now()
        """,
        UUID.randomUUID(),
        workspaceId,
        object.id(),
        object.validationStatus(),
        snapshot,
        snapshot,
        defaultValue(changedBy, "system"));
    jdbcTemplate.update("""
        update infrastructure_objects
        set draft_status = ?, updated_at = now()
        where id = ?
        """, DraftStatus.DODANY_DO_WERSJI_ROBOCZEJ.name(), object.id());
  }

  public InfrastructureObjectDto updateWorkspaceObject(
      UUID workspaceId,
      UUID objectId,
      WorkspaceObjectUpdateRequest request,
      String changedBy
  ) {
    InfrastructureObjectDto current = getWorkspaceObjectSnapshot(workspaceId, objectId);
    InfrastructureObjectDto updated = applyWorkspacePatch(current, request);
    String snapshot = json(objectMapper.valueToTree(updated));
    jdbcTemplate.update("""
        update draft_object_states
        set edit_status = ?,
            validation_status = ?,
            current_snapshot = cast(? as jsonb),
            changed_at = now(),
            changed_by = ?
        where workspace_id = ? and object_id = ?
        """,
        DraftStatus.ZAPISANY_W_WERSJI_ROBOCZEJ.name(),
        "WYMAGA_WERYFIKACJI_OPERATORA",
        snapshot,
        defaultValue(changedBy, "system"),
        workspaceId,
        objectId);
    jdbcTemplate.update("""
        update infrastructure_objects
        set draft_status = ?, updated_at = now()
        where id = ?
        """, DraftStatus.ZAPISANY_W_WERSJI_ROBOCZEJ.name(), objectId);
    return updated;
  }

  public void addRoadSectionToWorkspace(UUID workspaceId, RoadSectionDto section, String changedBy) {
    String snapshot = json(objectMapper.valueToTree(section));
    jdbcTemplate.update("""
        insert into draft_road_section_states (
          id, workspace_id, road_section_id, edit_status, validation_status,
          original_snapshot, current_snapshot, changed_by
        )
        values (?, ?, ?, 'DODANY_DO_WERSJI_ROBOCZEJ', ?, cast(? as jsonb), cast(? as jsonb), ?)
        on conflict (workspace_id, road_section_id)
        do update set edit_status = excluded.edit_status,
                      validation_status = excluded.validation_status,
                      current_snapshot = excluded.current_snapshot,
                      changed_by = excluded.changed_by,
                      changed_at = now()
        """,
        UUID.randomUUID(),
        workspaceId,
        section.id(),
        section.validationStatus(),
        snapshot,
        snapshot,
        defaultValue(changedBy, "system"));
    jdbcTemplate.update("""
        update road_sections
        set draft_status = ?, updated_at = now()
        where id = ?
        """, DraftStatus.DODANY_DO_WERSJI_ROBOCZEJ.name(), section.id());
  }

  public RoadSectionDto updateWorkspaceRoadSection(
      UUID workspaceId,
      UUID roadSectionId,
      RoadSectionUpdateRequest request,
      String changedBy
  ) {
    RoadSectionDto current = getWorkspaceRoadSectionSnapshot(workspaceId, roadSectionId);
    RoadSectionDto updated = applyRoadSectionWorkspacePatch(current, request);
    String snapshot = json(objectMapper.valueToTree(updated));
    jdbcTemplate.update("""
        update draft_road_section_states
        set edit_status = ?,
            validation_status = ?,
            current_snapshot = cast(? as jsonb),
            changed_at = now(),
            changed_by = ?
        where workspace_id = ? and road_section_id = ?
        """,
        DraftStatus.ZAPISANY_W_WERSJI_ROBOCZEJ.name(),
        "WYMAGA_WERYFIKACJI_OPERATORA",
        snapshot,
        defaultValue(changedBy, "system"),
        workspaceId,
        roadSectionId);
    jdbcTemplate.update("""
        update road_sections
        set draft_status = ?, updated_at = now()
        where id = ?
        """, DraftStatus.ZAPISANY_W_WERSJI_ROBOCZEJ.name(), roadSectionId);
    return updated;
  }

  public InfrastructureObjectDto getWorkspaceObjectSnapshot(UUID workspaceId, UUID objectId) {
    return queryOne("""
        select current_snapshot::text as snapshot_json
        from draft_object_states
        where workspace_id = ? and object_id = ?
        """, (rs, rowNum) -> infrastructureObjectSnapshot(rs.getString("snapshot_json")), workspaceId, objectId);
  }

  public RoadSectionDto getWorkspaceRoadSectionSnapshot(UUID workspaceId, UUID roadSectionId) {
    return queryOne("""
        select current_snapshot::text as snapshot_json
        from draft_road_section_states
        where workspace_id = ? and road_section_id = ?
        """, (rs, rowNum) -> roadSectionSnapshot(rs.getString("snapshot_json")), workspaceId, roadSectionId);
  }

  public void updateWorkspaceObjectValidationStatus(UUID workspaceId, UUID objectId, String validationStatus) {
    jdbcTemplate.update("""
        update draft_object_states
        set validation_status = ?,
            current_snapshot = jsonb_set(current_snapshot, '{validationStatus}', to_jsonb(?::text), true),
            changed_at = now()
        where workspace_id = ? and object_id = ?
        """, validationStatus, validationStatus, workspaceId, objectId);
  }

  public void updateWorkspaceRoadSectionValidationStatus(UUID workspaceId, UUID roadSectionId, String validationStatus) {
    jdbcTemplate.update("""
        update draft_road_section_states
        set validation_status = ?,
            current_snapshot = jsonb_set(current_snapshot, '{validationStatus}', to_jsonb(?::text), true),
            changed_at = now()
        where workspace_id = ? and road_section_id = ?
        """, validationStatus, validationStatus, workspaceId, roadSectionId);
  }

  public List<UUID> listWorkspaceObjectIds(UUID workspaceId) {
    return jdbcTemplate.query("""
        select object_id
        from draft_object_states
        where workspace_id = ?
        order by changed_at
        """, (rs, rowNum) -> rs.getObject("object_id", UUID.class), workspaceId);
  }

  public List<UUID> listWorkspaceRoadSectionIds(UUID workspaceId) {
    return jdbcTemplate.query("""
        select road_section_id
        from draft_road_section_states
        where workspace_id = ?
        order by changed_at
        """, (rs, rowNum) -> rs.getObject("road_section_id", UUID.class), workspaceId);
  }

  public void updateWorkspaceStatus(UUID workspaceId, String status) {
    jdbcTemplate.update("""
        update draft_workspaces
        set status = ?
        where id = ?
        """, status, workspaceId);
  }

  public List<ValidationIssueDto> listValidationIssuesForWorkspace(UUID workspaceId) {
    return jdbcTemplate.query("""
        select vi.id, vi.object_id, io.object_code,
               coalesce(vi.target_type, 'INFRASTRUCTURE_OBJECT') as target_type,
               coalesce(vi.target_id, vi.object_id) as target_id,
               coalesce(vi.target_code, io.object_code) as target_code,
               vi.severity, vi.issue_type, vi.field_name,
               vi.message, ST_AsGeoJSON(vi.geometry_marker)::text as geometry_marker_geojson,
               vi.created_at, vi.resolved
        from draft_object_states dos
        join infrastructure_objects io on io.id = dos.object_id
        join validation_issues vi on coalesce(vi.target_type, 'INFRASTRUCTURE_OBJECT') = 'INFRASTRUCTURE_OBJECT'
          and coalesce(vi.target_id, vi.object_id) = io.id
        where dos.workspace_id = ?
        union all
        select vi.id, vi.object_id, null as object_code,
               vi.target_type,
               vi.target_id,
               coalesce(vi.target_code, rs.section_code) as target_code,
               vi.severity, vi.issue_type, vi.field_name,
               vi.message, ST_AsGeoJSON(vi.geometry_marker)::text as geometry_marker_geojson,
               vi.created_at, vi.resolved
        from draft_road_section_states drs
        join road_sections rs on rs.id = drs.road_section_id
        join validation_issues vi on vi.target_type = 'ROAD_SECTION'
          and vi.target_id = rs.id
        where drs.workspace_id = ?
        order by severity, target_code
        """, this::validationIssueDto, workspaceId, workspaceId);
  }

  public void finalizeWorkspace(UUID workspaceId) {
    jdbcTemplate.update("""
        update draft_object_states
        set edit_status = 'ZAPISANY_DO_BAZY_FINALNEJ', changed_at = now()
        where workspace_id = ?
        """, workspaceId);
    jdbcTemplate.update("""
        update draft_road_section_states
        set edit_status = 'ZAPISANY_DO_BAZY_FINALNEJ', changed_at = now()
        where workspace_id = ?
        """, workspaceId);
    jdbcTemplate.update("""
        update draft_workspaces
        set status = 'SFINALIZOWANY', closed_at = now()
        where id = ?
        """, workspaceId);
  }

  public void rejectWorkspace(UUID workspaceId) {
    jdbcTemplate.update("""
        update infrastructure_objects
        set draft_status = 'NIE_DOTYCZY', updated_at = now()
        where id in (select object_id from draft_object_states where workspace_id = ?)
        """, workspaceId);
    jdbcTemplate.update("""
        update road_sections
        set draft_status = 'NIE_DOTYCZY', updated_at = now()
        where id in (select road_section_id from draft_road_section_states where workspace_id = ?)
        """, workspaceId);
    jdbcTemplate.update("""
        update draft_object_states
        set edit_status = 'ODRZUCONY', changed_at = now()
        where workspace_id = ?
        """, workspaceId);
    jdbcTemplate.update("""
        update draft_road_section_states
        set edit_status = 'ODRZUCONY', changed_at = now()
        where workspace_id = ?
        """, workspaceId);
    jdbcTemplate.update("""
        update draft_workspaces
        set status = 'ODRZUCONY', closed_at = now()
        where id = ?
        """, workspaceId);
  }

  public UUID createImportJob(String importType, String sourceName) {
    UUID id = UUID.randomUUID();
    jdbcTemplate.update("""
        insert into import_jobs (id, import_type, source_name, status, imported_count, rejected_count, error_report)
        values (?, ?, ?, 'RUNNING', 0, 0, '{}'::jsonb)
        """, id, importType, sourceName);
    return id;
  }

  public void finishImportJob(UUID jobId, int importedCount, int rejectedCount, JsonNode report) {
    jdbcTemplate.update("""
        update import_jobs
        set status = 'COMPLETED',
            imported_count = ?,
            rejected_count = ?,
            error_report = cast(? as jsonb)
        where id = ?
        """, importedCount, rejectedCount, json(report), jobId);
  }

  public ImportJobDto getImportJob(UUID id) {
    return queryOne("""
        select id, import_type, source_name, status, imported_count, rejected_count, created_at, error_report::text as error_report_json
        from import_jobs
        where id = ?
        """, this::importJobDto, id);
  }

  public List<ValidationIssueDto> listValidationIssues() {
    return jdbcTemplate.query("""
        select vi.id, vi.object_id, io.object_code,
               coalesce(vi.target_type, 'INFRASTRUCTURE_OBJECT') as target_type,
               coalesce(vi.target_id, vi.object_id) as target_id,
               coalesce(vi.target_code, io.object_code, rs.section_code) as target_code,
               vi.severity, vi.issue_type, vi.field_name,
               vi.message, ST_AsGeoJSON(vi.geometry_marker)::text as geometry_marker_geojson,
               vi.created_at, vi.resolved
        from validation_issues vi
        left join infrastructure_objects io on io.id = vi.object_id
        left join road_sections rs on vi.target_type = 'ROAD_SECTION' and rs.id = vi.target_id
        where vi.resolved = false
        order by vi.severity, target_code, vi.field_name
        """, this::validationIssueDto);
  }

  public List<ReportRowDto> roadInventoryReport(String roadNumber) {
    return jdbcTemplate.query("""
        select r.road_number,
               coalesce(io.object_type, 'BRAK_OBIEKTOW') as object_type,
               count(io.id) as object_count,
               coalesce(sum(coalesce(io.global_mileage_to, io.global_mileage_from)
                   - coalesce(io.global_mileage_from, io.global_mileage_to)), 0) as length_km,
               count(vi.id) filter (where vi.resolved = false) as issue_count
        from roads r
        left join infrastructure_objects io on io.road_id = r.id
        left join validation_issues vi on vi.object_id = io.id
        where (? is null or r.road_number = ?)
        group by r.road_number, io.object_type
        order by r.road_number, io.object_type
        """, (rs, rowNum) -> {
          Map<String, Object> values = new LinkedHashMap<>();
          values.put("roadNumber", rs.getString("road_number"));
          values.put("objectType", rs.getString("object_type"));
          values.put("objectCount", rs.getInt("object_count"));
          values.put("lengthKm", rs.getBigDecimal("length_km"));
          values.put("validationIssueCount", rs.getInt("issue_count"));
          return new ReportRowDto(values);
        }, roadNumber, roadNumber);
  }

  public List<ReportRowDto> trafficStationsReport() {
    return jdbcTemplate.query("""
        select io.object_code, io.name, r.road_number, io.global_mileage_from,
               io.status, io.validation_status, io.attributes
        from infrastructure_objects io
        left join roads r on r.id = io.road_id
        where io.object_type = 'TRAFFIC_COUNTING_STATION'
        order by r.road_number, io.global_mileage_from
        """, (rs, rowNum) -> {
          JsonNode attributes = readJson(rs.getString("attributes"));
          Map<String, Object> values = new LinkedHashMap<>();
          values.put("objectCode", rs.getString("object_code"));
          values.put("stationName", rs.getString("name"));
          values.put("roadNumber", rs.getString("road_number"));
          values.put("mileageKm", rs.getBigDecimal("global_mileage_from"));
          values.put("stationClass", text(attributes, "stationClass"));
          values.put("deviceSymbol", text(attributes, "deviceSymbol"));
          values.put("active", attributes.path("active").asBoolean(false));
          values.put("validationStatus", rs.getString("validation_status"));
          return new ReportRowDto(values);
        });
  }

  public List<HistoryDto> historyForObject(UUID objectId) {
    return jdbcTemplate.query("""
        select id, object_id, operation_type, field_name, old_value, new_value, changed_by, changed_at, reason
        from change_history
        where object_id = ?
        order by changed_at desc
        """, this::historyDto, objectId);
  }

  public void addHistory(
      UUID objectId,
      String operationType,
      String fieldName,
      String oldValue,
      String newValue,
      String changedBy,
      String reason
  ) {
    jdbcTemplate.update("""
        insert into change_history (id, object_id, operation_type, field_name, old_value, new_value, changed_by, reason)
        values (?, ?, ?, ?, ?, ?, ?, ?)
        """, UUID.randomUUID(), objectId, operationType, fieldName, oldValue, newValue, changedBy, reason);
  }

  private String workspaceSql(String whereClause) {
    return """
        select dw.id, dw.name, dw.created_by, dw.status, dw.created_at, dw.closed_at,
               ST_AsGeoJSON(dw.scope_geometry)::text as scope_geometry_geojson,
               (
                 (select count(*) from draft_object_states dos where dos.workspace_id = dw.id)
                 + (select count(*) from draft_road_section_states drs where drs.workspace_id = dw.id)
               ) as object_count,
               (
                 (select count(*) from draft_object_states dos
                  join validation_issues vi
                    on coalesce(vi.target_type, 'INFRASTRUCTURE_OBJECT') = 'INFRASTRUCTURE_OBJECT'
                   and coalesce(vi.target_id, vi.object_id) = dos.object_id
                  where dos.workspace_id = dw.id
                    and vi.severity = 'BLOCKING'
                    and vi.resolved = false)
                 + (select count(*) from draft_road_section_states drs
                  join validation_issues vi
                    on vi.target_type = 'ROAD_SECTION'
                   and vi.target_id = drs.road_section_id
                  where drs.workspace_id = dw.id
                    and vi.severity = 'BLOCKING'
                    and vi.resolved = false)
               ) as blocking_issue_count
        from draft_workspaces dw
        """ + whereClause + """
        order by dw.created_at desc
        """;
  }

  private JsonNode infrastructureFeatureCollection(List<InfrastructureObjectDto> objects) {
    ObjectNode collection = objectMapper.createObjectNode();
    collection.put("type", "FeatureCollection");
    ArrayNode features = collection.putArray("features");
    for (InfrastructureObjectDto object : objects) {
      ObjectNode feature = features.addObject();
      feature.put("type", "Feature");
      feature.set("geometry", object.geometry());
      ObjectNode properties = feature.putObject("properties");
      properties.put("id", object.id().toString());
      properties.put("objectType", object.objectType());
      properties.put("objectCode", object.objectCode());
      properties.put("name", object.name());
      properties.put("roadNumber", object.roadNumber());
      properties.put("status", object.status());
      properties.put("validationStatus", object.validationStatus());
      properties.put("draftStatus", object.draftStatus());
      properties.put("branch", object.branch());
      properties.put("district", object.district());
      properties.set("attributes", object.attributes());
    }
    return collection;
  }

  private JsonNode referenceSegmentsFeatureCollection() {
    ObjectNode collection = objectMapper.createObjectNode();
    collection.put("type", "FeatureCollection");
    ArrayNode features = collection.putArray("features");
    for (ReferenceSegmentDto segment : listReferenceSegments(null)) {
      ObjectNode feature = features.addObject();
      feature.put("type", "Feature");
      feature.set("geometry", segment.geometry());
      ObjectNode properties = feature.putObject("properties");
      properties.put("id", segment.id().toString());
      properties.put("roadNumber", segment.roadNumber());
      properties.put("segmentCode", segment.segmentCode());
      properties.put("status", segment.status());
      properties.put("startMileageKm", segment.startMileageKm());
      properties.put("endMileageKm", segment.endMileageKm());
      properties.put("layerKind", "REFERENCE_SEGMENT");
    }
    return collection;
  }

  private JsonNode roadSectionsFeatureCollection() {
    ObjectNode collection = objectMapper.createObjectNode();
    collection.put("type", "FeatureCollection");
    ArrayNode features = collection.putArray("features");
    for (RoadSectionDto section : listRoadSections(null, null)) {
      ObjectNode feature = features.addObject();
      feature.put("type", "Feature");
      feature.set("geometry", section.geometry());
      ObjectNode properties = feature.putObject("properties");
      properties.put("id", section.id().toString());
      properties.put("businessId", section.businessId());
      properties.put("sectionCode", section.sectionCode());
      properties.put("name", section.name());
      properties.put("roadNumber", section.roadNumber());
      properties.put("referenceSegmentCode", section.referenceSegmentCode());
      properties.put("kilometerFrom", section.kilometerFrom());
      properties.put("kilometerTo", section.kilometerTo());
      properties.put("status", section.status());
      properties.put("validationStatus", section.validationStatus());
      properties.put("draftStatus", section.draftStatus());
      properties.put("layerKind", "ROAD_SECTION");
    }
    return collection;
  }

  private JsonNode roadsFeatureCollection() {
    ObjectNode collection = objectMapper.createObjectNode();
    collection.put("type", "FeatureCollection");
    ArrayNode features = collection.putArray("features");
    jdbcTemplate.query("""
        select r.id, r.road_number, r.category, r.name, r.managing_authority, r.total_length_km,
               ST_AsGeoJSON(ST_LineMerge(ST_Union(rs.geometry)))::text as geometry_geojson
        from roads r
        join reference_segments rs on rs.road_id = r.id
        group by r.id, r.road_number, r.category, r.name, r.managing_authority, r.total_length_km
        order by r.road_number
        """, rs -> {
          ObjectNode feature = features.addObject();
          feature.put("type", "Feature");
          feature.set("geometry", readJson(rs.getString("geometry_geojson")));
          ObjectNode properties = feature.putObject("properties");
          properties.put("id", rs.getObject("id", UUID.class).toString());
          properties.put("roadNumber", rs.getString("road_number"));
          properties.put("category", rs.getString("category"));
          properties.put("name", rs.getString("name"));
          properties.put("managingAuthority", rs.getString("managing_authority"));
          properties.put("totalLengthKm", rs.getBigDecimal("total_length_km"));
          properties.put("layerKind", "ROAD");
        });
    return collection;
  }

  private JsonNode validationIssueFeatureCollection(List<ValidationIssueDto> issues) {
    ObjectNode collection = objectMapper.createObjectNode();
    collection.put("type", "FeatureCollection");
    ArrayNode features = collection.putArray("features");
    for (ValidationIssueDto issue : issues) {
      ObjectNode feature = features.addObject();
      feature.put("type", "Feature");
      feature.set("geometry", issue.geometryMarker());
      ObjectNode properties = feature.putObject("properties");
      properties.put("id", issue.id().toString());
      if (issue.objectId() != null) {
        properties.put("objectId", issue.objectId().toString());
      }
      properties.put("objectCode", issue.objectCode());
      properties.put("targetType", issue.targetType());
      if (issue.targetId() != null) {
        properties.put("targetId", issue.targetId().toString());
      }
      properties.put("targetCode", issue.targetCode());
      properties.put("severity", issue.severity());
      properties.put("issueType", issue.issueType());
      properties.put("fieldName", issue.fieldName());
      properties.put("message", issue.message());
    }
    return collection;
  }

  private RoadDto roadDto(ResultSet rs, int rowNum) throws SQLException {
    return new RoadDto(
        rs.getObject("id", UUID.class),
        rs.getString("road_number"),
        rs.getString("category"),
        rs.getString("name"),
        rs.getString("managing_authority"),
        rs.getBigDecimal("total_length_km"));
  }

  private ReferenceSegmentDto referenceSegmentDto(ResultSet rs, int rowNum) throws SQLException {
    return new ReferenceSegmentDto(
        rs.getObject("id", UUID.class),
        rs.getObject("road_id", UUID.class),
        rs.getString("road_number"),
        rs.getString("segment_code"),
        rs.getBigDecimal("start_mileage_km"),
        rs.getBigDecimal("end_mileage_km"),
        rs.getString("carriageway"),
        rs.getString("direction"),
        rs.getString("status"),
        localDate(rs, "valid_from"),
        localDate(rs, "valid_to"),
        readJson(rs.getString("geometry_geojson")));
  }

  private InfrastructureObjectDto infrastructureObjectDto(ResultSet rs, int rowNum) throws SQLException {
    return new InfrastructureObjectDto(
        rs.getObject("id", UUID.class),
        rs.getString("object_type"),
        rs.getString("object_code"),
        rs.getString("name"),
        rs.getObject("road_id", UUID.class),
        rs.getString("road_number"),
        rs.getObject("reference_segment_id", UUID.class),
        rs.getString("reference_segment_code"),
        rs.getBigDecimal("global_mileage_from"),
        rs.getBigDecimal("global_mileage_to"),
        rs.getBigDecimal("local_mileage_from"),
        rs.getBigDecimal("local_mileage_to"),
        readJson(rs.getString("geometry_geojson")),
        rs.getString("geometry_type"),
        rs.getString("owner"),
        rs.getString("branch"),
        rs.getString("district"),
        rs.getString("status"),
        rs.getString("validation_status"),
        rs.getString("draft_status"),
        localDate(rs, "valid_from"),
        localDate(rs, "valid_to"),
        rs.getString("created_by"),
        instant(rs, "created_at"),
        instant(rs, "updated_at"),
        readJson(rs.getString("attributes_json")));
  }

  private RoadSectionDto roadSectionDto(ResultSet rs, int rowNum) throws SQLException {
    ReferenceBindingDto binding = null;
    UUID bindingReferenceSegmentId = rs.getObject("binding_reference_segment_id", UUID.class);
    if (bindingReferenceSegmentId != null) {
      binding = new ReferenceBindingDto(
          bindingReferenceSegmentId,
          rs.getString("binding_reference_segment_code"),
          rs.getObject("binding_road_id", UUID.class),
          rs.getString("binding_road_number"),
          rs.getBigDecimal("binding_mileage_from"),
          rs.getBigDecimal("binding_mileage_to"),
          rs.getString("binding_location_method"),
          rs.getString("binding_consistency_status"));
    }
    return new RoadSectionDto(
        rs.getObject("id", UUID.class),
        rs.getString("business_id"),
        rs.getObject("road_id", UUID.class),
        rs.getString("road_number"),
        rs.getObject("reference_segment_id", UUID.class),
        rs.getString("reference_segment_code"),
        rs.getString("section_code"),
        rs.getString("name"),
        rs.getBigDecimal("kilometer_from"),
        rs.getBigDecimal("kilometer_to"),
        rs.getString("carriageway"),
        rs.getString("direction"),
        readJson(rs.getString("geometry_geojson")),
        rs.getString("status"),
        rs.getString("validation_status"),
        rs.getString("draft_status"),
        localDate(rs, "valid_from"),
        localDate(rs, "valid_to"),
        instant(rs, "updated_at"),
        binding);
  }

  private ValidationIssueDto validationIssueDto(ResultSet rs, int rowNum) throws SQLException {
    return new ValidationIssueDto(
        rs.getObject("id", UUID.class),
        rs.getObject("object_id", UUID.class),
        rs.getString("object_code"),
        rs.getString("target_type"),
        rs.getObject("target_id", UUID.class),
        rs.getString("target_code"),
        rs.getString("severity"),
        rs.getString("issue_type"),
        rs.getString("field_name"),
        rs.getString("message"),
        readJson(rs.getString("geometry_marker_geojson")),
        instant(rs, "created_at"),
        rs.getBoolean("resolved"));
  }

  private LayerDto layerDto(ResultSet rs, int rowNum) throws SQLException {
    return new LayerDto(
        rs.getString("layer_code"),
        rs.getString("layer_name"),
        rs.getString("group_name"),
        rs.getString("geometry_type"),
        rs.getBoolean("visible_by_default"),
        rs.getString("min_scale_label"),
        rs.getString("style_hint"));
  }

  private WorkspaceDto workspaceDto(ResultSet rs, int rowNum) throws SQLException {
    return new WorkspaceDto(
        rs.getObject("id", UUID.class),
        rs.getString("name"),
        rs.getString("created_by"),
        rs.getString("status"),
        instant(rs, "created_at"),
        instant(rs, "closed_at"),
        readJson(rs.getString("scope_geometry_geojson")),
        rs.getInt("object_count"),
        rs.getInt("blocking_issue_count"));
  }

  private ImportJobDto importJobDto(ResultSet rs, int rowNum) throws SQLException {
    return new ImportJobDto(
        rs.getObject("id", UUID.class),
        rs.getString("import_type"),
        rs.getString("source_name"),
        rs.getString("status"),
        rs.getInt("imported_count"),
        rs.getInt("rejected_count"),
        instant(rs, "created_at"),
        readJson(rs.getString("error_report_json")));
  }

  private InfrastructureObjectDto infrastructureObjectSnapshot(String rawJson) {
    try {
      return objectMapper.treeToValue(readJson(rawJson), InfrastructureObjectDto.class);
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("Niepoprawny snapshot obiektu w wersji roboczej.", exception);
    }
  }

  private RoadSectionDto roadSectionSnapshot(String rawJson) {
    try {
      return objectMapper.treeToValue(readJson(rawJson), RoadSectionDto.class);
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("Niepoprawny snapshot odcinka drogi w wersji roboczej.", exception);
    }
  }

  private InfrastructureObjectDto applyWorkspacePatch(
      InfrastructureObjectDto current,
      WorkspaceObjectUpdateRequest request
  ) {
    UUID referenceSegmentId = request.referenceSegmentId() == null
        ? current.referenceSegmentId()
        : request.referenceSegmentId();
    UUID roadId = current.roadId();
    String roadNumber = current.roadNumber();
    String referenceSegmentCode = current.referenceSegmentCode();
    if (request.referenceSegmentId() != null) {
      ReferenceSegmentDto segment = getReferenceSegment(request.referenceSegmentId());
      roadId = segment.roadId();
      roadNumber = segment.roadNumber();
      referenceSegmentCode = segment.segmentCode();
    }
    return new InfrastructureObjectDto(
        current.id(),
        current.objectType(),
        current.objectCode(),
        defaultValue(request.name(), current.name()),
        roadId,
        roadNumber,
        referenceSegmentId,
        referenceSegmentCode,
        request.globalMileageFrom() == null ? current.globalMileageFrom() : request.globalMileageFrom(),
        request.globalMileageTo() == null ? current.globalMileageTo() : request.globalMileageTo(),
        current.localMileageFrom(),
        current.localMileageTo(),
        request.geometry() == null || request.geometry().isMissingNode() ? current.geometry() : request.geometry(),
        current.geometryType(),
        current.owner(),
        current.branch(),
        current.district(),
        current.status(),
        "WYMAGA_WERYFIKACJI_OPERATORA",
        DraftStatus.ZAPISANY_W_WERSJI_ROBOCZEJ.name(),
        current.validFrom(),
        current.validTo(),
        current.createdBy(),
        current.createdAt(),
        Instant.now(),
        request.attributes() == null || request.attributes().isMissingNode() ? current.attributes() : request.attributes());
  }

  private RoadSectionDto applyRoadSectionWorkspacePatch(
      RoadSectionDto current,
      RoadSectionUpdateRequest request
  ) {
    UUID referenceSegmentId = request.referenceSegmentId() == null
        ? current.referenceSegmentId()
        : request.referenceSegmentId();
    UUID roadId = current.roadId();
    String roadNumber = current.roadNumber();
    String referenceSegmentCode = current.referenceSegmentCode();
    ReferenceBindingDto binding = current.referenceBinding();
    BigDecimal kilometerFrom = request.kilometerFrom() == null ? current.kilometerFrom() : request.kilometerFrom();
    BigDecimal kilometerTo = request.kilometerTo() == null ? current.kilometerTo() : request.kilometerTo();
    if (request.referenceSegmentId() != null) {
      ReferenceSegmentDto segment = getReferenceSegment(request.referenceSegmentId());
      roadId = segment.roadId();
      roadNumber = segment.roadNumber();
      referenceSegmentCode = segment.segmentCode();
      binding = new ReferenceBindingDto(
          segment.id(),
          segment.segmentCode(),
          segment.roadId(),
          segment.roadNumber(),
          kilometerFrom,
          kilometerTo,
          "SYSTEM_REFERENCYJNY",
          bindingConsistency(segment, kilometerFrom, kilometerTo));
    }
    return new RoadSectionDto(
        current.id(),
        current.businessId(),
        roadId,
        roadNumber,
        referenceSegmentId,
        referenceSegmentCode,
        current.sectionCode(),
        defaultValue(request.name(), current.name()),
        kilometerFrom,
        kilometerTo,
        current.carriageway(),
        current.direction(),
        request.geometry() == null || request.geometry().isMissingNode() ? current.geometry() : request.geometry(),
        defaultValue(request.status(), current.status()),
        "WYMAGA_WERYFIKACJI_OPERATORA",
        DraftStatus.ZAPISANY_W_WERSJI_ROBOCZEJ.name(),
        current.validFrom(),
        current.validTo(),
        Instant.now(),
        binding);
  }

  private HistoryDto historyDto(ResultSet rs, int rowNum) throws SQLException {
    return new HistoryDto(
        rs.getObject("id", UUID.class),
        rs.getObject("object_id", UUID.class),
        rs.getString("operation_type"),
        rs.getString("field_name"),
        rs.getString("old_value"),
        rs.getString("new_value"),
        rs.getString("changed_by"),
        instant(rs, "changed_at"),
        rs.getString("reason"));
  }

  private <T> T queryOne(String sql, org.springframework.jdbc.core.RowMapper<T> mapper, Object... args) {
    try {
      return jdbcTemplate.queryForObject(sql, mapper, args);
    } catch (EmptyResultDataAccessException exception) {
      throw new NotFoundException("Nie znaleziono rekordu dla zapytania.");
    }
  }

  private JsonNode readJson(String rawJson) {
    if (rawJson == null || rawJson.isBlank()) {
      return objectMapper.nullNode();
    }
    try {
      return objectMapper.readTree(rawJson);
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("Niepoprawny JSON w bazie danych.", exception);
    }
  }

  private String json(JsonNode node) {
    if (node == null || node.isNull() || node.isMissingNode()) {
      return "{}";
    }
    try {
      return objectMapper.writeValueAsString(node);
    } catch (JsonProcessingException exception) {
      throw new IllegalArgumentException("Nie mozna zapisac JSON.", exception);
    }
  }

  private String geometryJson(JsonNode node) {
    if (node == null || node.isNull() || node.isMissingNode() || node.path("type").asText("").isBlank()) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(node);
    } catch (JsonProcessingException exception) {
      throw new IllegalArgumentException("Nie mozna zapisac geometrii GeoJSON.", exception);
    }
  }

  private String persistableGeometryJson(JsonNode node) {
    if (!isPersistableGeoJsonGeometry(node)) {
      return null;
    }
    return geometryJson(node);
  }

  private boolean isPersistableGeoJsonGeometry(JsonNode node) {
    if (node == null || node.isNull() || node.isMissingNode()) {
      return false;
    }
    return switch (node.path("type").asText("")) {
      case "Point" -> validPosition(node.path("coordinates"));
      case "LineString" -> validLine(node.path("coordinates"), 2);
      case "Polygon" -> validPolygon(node.path("coordinates"));
      default -> false;
    };
  }

  private boolean validPolygon(JsonNode coordinates) {
    if (!coordinates.isArray() || coordinates.isEmpty()) {
      return false;
    }
    for (JsonNode ring : coordinates) {
      if (!validLine(ring, 4)) {
        return false;
      }
    }
    return true;
  }

  private boolean validLine(JsonNode coordinates, int minPositions) {
    if (!coordinates.isArray() || coordinates.size() < minPositions) {
      return false;
    }
    for (JsonNode coordinate : coordinates) {
      if (!validPosition(coordinate)) {
        return false;
      }
    }
    return true;
  }

  private boolean validPosition(JsonNode coordinate) {
    return coordinate.isArray()
        && coordinate.size() >= 2
        && coordinate.get(0).isNumber()
        && coordinate.get(1).isNumber();
  }

  private LocalDate localDate(ResultSet rs, String column) throws SQLException {
    Date date = rs.getDate(column);
    return date == null ? null : date.toLocalDate();
  }

  private Instant instant(ResultSet rs, String column) throws SQLException {
    Timestamp timestamp = rs.getTimestamp(column);
    return timestamp == null ? null : timestamp.toInstant();
  }

  private String defaultValue(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }

  private void upsertRoadSectionReferenceBinding(
      UUID roadSectionId,
      UUID referenceSegmentId,
      BigDecimal kilometerFrom,
      BigDecimal kilometerTo
  ) {
    ReferenceSegmentDto segment = getReferenceSegment(referenceSegmentId);
    jdbcTemplate.update("""
        update road_section_reference_bindings
        set valid_to = current_date
        where road_section_id = ?
          and valid_to is null
        """, roadSectionId);
    jdbcTemplate.update("""
        insert into road_section_reference_bindings (
          id, road_section_id, reference_segment_id, mileage_from, mileage_to,
          location_method, consistency_status, valid_from
        )
        values (?, ?, ?, ?, ?, 'SYSTEM_REFERENCYJNY', ?, current_date)
        """,
        UUID.randomUUID(),
        roadSectionId,
        referenceSegmentId,
        kilometerFrom,
        kilometerTo,
        bindingConsistency(segment, kilometerFrom, kilometerTo));
  }

  private String bindingConsistency(ReferenceSegmentDto segment, BigDecimal kilometerFrom, BigDecimal kilometerTo) {
    if (kilometerFrom == null || kilometerTo == null || segment == null) {
      return "WYMAGA_WERYFIKACJI";
    }
    return kilometerFrom.compareTo(segment.startMileageKm()) >= 0
        && kilometerTo.compareTo(segment.endMileageKm()) <= 0
        ? "ZGODNE"
        : "POZA_ZAKRESEM_SR";
  }

  private String text(JsonNode node, String field) {
    JsonNode value = node == null ? null : node.get(field);
    return value == null || value.isNull() ? null : value.asText();
  }
}
