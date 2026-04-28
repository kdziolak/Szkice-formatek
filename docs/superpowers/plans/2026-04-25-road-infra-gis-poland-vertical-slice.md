# RoadInfraGIS Poland Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable RoadInfraGIS Poland prototype in the existing repository with backend API, PostGIS schema, Angular/OpenLayers UI, seed data, documentation and verification.

**Architecture:** Spring Boot owns validation, draft workflow, REST contracts and PostGIS access. Angular owns the desktop-GIS interaction model and consumes backend GeoJSON/DTO endpoints. GeoServer is documented as an optional publication layer, not required for local vertical-slice startup.

**Tech Stack:** Java 21, Spring Boot, Flyway, PostgreSQL/PostGIS, Angular 19, OpenLayers, Tailwind, PrimeIcons, RxJS/Signals.

---

### Task 1: Backend Domain And Validation

**Files:**
- Create: `backend/src/test/java/pl/gddkia/roadgis/validation/InfrastructureObjectValidatorTest.java`
- Create: `backend/src/main/java/pl/gddkia/roadgis/domain/*.java`
- Create: `backend/src/main/java/pl/gddkia/roadgis/validation/*.java`

- [ ] Write failing validator tests for geometry type, missing reference segment, mileage range and traffic counting station device requirements.
- [ ] Run `mvn test -Dtest=InfrastructureObjectValidatorTest` from `backend/` and confirm RED.
- [ ] Implement enum dictionaries and validator classes.
- [ ] Re-run validator test and confirm GREEN.

### Task 2: PostGIS Persistence And Seed

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/db/migration/V1__road_infra_schema.sql`
- Create: `docker-compose.yml`
- Create: `sample-data/*.geojson`

- [ ] Add PostgreSQL/Flyway dependencies and PostGIS datasource defaults.
- [ ] Create schema and seed realistic Warsaw-area sample data.
- [ ] Add Docker Compose for PostGIS.
- [ ] Add sample GeoJSON files mirroring seeded layers.

### Task 3: Backend API

**Files:**
- Create: `backend/src/main/java/pl/gddkia/roadgis/api/*.java`
- Create: `backend/src/main/java/pl/gddkia/roadgis/application/*.java`
- Create: `backend/src/main/java/pl/gddkia/roadgis/infrastructure/*.java`
- Create: `backend/src/test/java/pl/gddkia/roadgis/api/InfrastructureObjectControllerTest.java`

- [ ] Add DTOs and JDBC repositories.
- [ ] Implement required `/api/*` endpoints for roads, reference segments, layers, objects, workspaces, import, reports, export and history.
- [ ] Add API slice tests for listing and validating infrastructure objects.
- [ ] Run targeted backend tests.

### Task 4: Frontend Vertical Slice

**Files:**
- Create: `frontend/src/app/core/road-infra-gis.models.ts`
- Create: `frontend/src/app/core/road-infra-gis-api.service.ts`
- Create: `frontend/src/app/state/road-infra-gis.store.ts`
- Modify: `frontend/src/app/features/data-management/*`
- Modify: `frontend/src/app/map/object-entry-map.component.ts`
- Modify: `frontend/src/main.ts`

- [ ] Add model and API service.
- [ ] Add signal store for map/table/form/workspace synchronization.
- [ ] Rework main data-management page to match desktop GIS layout with top bar, map, bottom tables and right tabs.
- [ ] Connect map selection and table selection through store.
- [ ] Add validation and reference binding actions.

### Task 5: Documentation And Developer UX

**Files:**
- Modify: `README.md`
- Create: `docs/01-architecture.md`
- Create: `docs/02-domain-model.md`
- Create: `docs/03-legal-compliance-matrix.md`
- Create: `docs/04-ui-ux-guidelines.md`
- Create: `docs/05-api-contract.md`
- Create: `docs/06-import-validation-workflow.md`
- Create: `scripts/run-dev.sh`
- Create: `scripts/seed-db.sh`

- [ ] Document architecture, domain, compliance assumptions, UI, API and import/validation workflow.
- [ ] Add concrete local startup commands.
- [ ] Record legal verification gaps and production TODOs.

### Task 6: Verification And Review

**Files:**
- All changed files.

- [ ] Run backend tests/build where dependencies allow.
- [ ] Run frontend build/tests where dependencies allow.
- [ ] Inspect git diff for unrelated changes.
- [ ] Request final reviewer on final package.
- [ ] Report changed files, commands, validation results, risks and next step.
