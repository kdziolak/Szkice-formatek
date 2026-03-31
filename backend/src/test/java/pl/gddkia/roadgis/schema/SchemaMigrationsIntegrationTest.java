package pl.gddkia.roadgis.schema;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import pl.gddkia.roadgis.support.AbstractSqlServerIntegrationTest;

class SchemaMigrationsIntegrationTest extends AbstractSqlServerIntegrationTest {

  @Test
  void shouldApplyReferenceRoadAndEditingMigrations() {
    Integer tableCount =
        jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM sys.tables table_ref
            INNER JOIN sys.schemas schema_ref
              ON schema_ref.schema_id = table_ref.schema_id
            WHERE (schema_ref.name = 'ref' AND table_ref.name IN ('reference_axis', 'reference_segment'))
               OR (schema_ref.name = 'road' AND table_ref.name IN ('road', 'road_section'))
               OR (schema_ref.name = 'edit' AND table_ref.name IN ('draft', 'draft_object'))
            """,
            Map.of(),
            Integer.class);

    assertThat(tableCount).isEqualTo(6);
  }
}
