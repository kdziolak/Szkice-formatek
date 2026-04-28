# Object Entry Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable frontend slice for entering road GIS objects into the system through a synchronized map, table, form, validation panel, and draft workflow.

**Architecture:** The frontend owns interaction orchestration and view state. Backend draft APIs are not implemented yet, so the slice uses a typed mock gateway that follows the documented command-based contract and can later be replaced by real HTTP calls.

**Tech Stack:** Angular 19 standalone components, Angular signals, PrimeNG-ready markup, Tailwind layout tokens, OpenLayers 10, TypeScript.

---

## Scope

This plan implements the MVP for `EP-06` and the frontend-facing part of `EP-04`.

Included:

- Angular bootstrap and routing for a standalone frontend application.
- `data-management` workspace with ribbon, layer panel, OpenLayers map, data table, object form, reference binding, validation panel, and status bar.
- Central workspace store coordinating `mapa <-> tabela <-> formularz`.
- Mock draft gateway aligned to the future API: create draft, save command, validate, publish.
- Documentation update for the frontend slice and missing backend/API contract.

Deferred:

- Real backend persistence.
- Full topology engine and GeoServer integration.
- Bulk edit, split, merge, attachments, and import wizard.

## File Structure

- `frontend/src/main.ts`: standalone Angular bootstrap.
- `frontend/src/index.html`: application host.
- `frontend/src/styles.css`: Tailwind and domain UI tokens.
- `frontend/src/app/app.component.ts`: root shell and router outlet.
- `frontend/src/app/app.routes.ts`: route to data management workspace.
- `frontend/src/app/core/object-entry.models.ts`: shared frontend DTOs and domain-facing UI types.
- `frontend/src/app/core/mock-object-entry-api.service.ts`: typed mock gateway for draft and road object operations.
- `frontend/src/app/state/object-entry-workspace.store.ts`: signal-based workspace store and command coordination.
- `frontend/src/app/features/data-management/data-management-page.component.ts`: desktop GIS workspace container.
- `frontend/src/app/map/object-entry-map.component.ts`: OpenLayers map canvas, published layer, draft overlay, draw/select interactions.
- `frontend/angular.json`: complete Angular CLI build configuration.
- `frontend/tsconfig*.json`: TypeScript configuration for Angular.
- `docs/api/openapi.yaml`: document the planned draft commands and validation endpoints.
- `docs/ux/data-management-mode.md`: record MVP behavior and acceptance criteria.

## Tasks

### Task 1: Angular Foundation

- [ ] Create the missing Angular bootstrap files.
- [ ] Complete `angular.json` with build, serve, test, and style entries.
- [ ] Add TypeScript configs required by Angular CLI.
- [ ] Verify the empty shell compiles before feature code is added.

### Task 2: Object Entry State And Mock API

- [ ] Define object, geometry, draft, reference, validation, and command models.
- [ ] Implement `MockObjectEntryApiService` with deterministic sample road objects.
- [ ] Implement `ObjectEntryWorkspaceStore` with signals for active object, selection, dirty state, validation issues, draft status, and status messages.
- [ ] Expose methods for selecting an object, starting object creation, saving form changes, saving geometry, binding reference, validating, and publishing.

### Task 3: GIS Workspace UI

- [ ] Implement the `data-management` page as a professional desktop GIS workspace.
- [ ] Include ribbon actions for object type, draw mode, save draft, validate, and publish.
- [ ] Include layer/status panels that distinguish `published` from `draft`.
- [ ] Include a data table whose row selection updates the active object.
- [ ] Include an object form whose edits update the central store and draft state.
- [ ] Include reference binding and validation issue panels.

### Task 4: OpenLayers Map

- [ ] Render a map with a restrained infrastructure-oriented style.
- [ ] Add separate vector sources/layers for published objects and draft overlay.
- [ ] Synchronize map selection with the store.
- [ ] Add drawing for point, line, and polygon geometry types.
- [ ] Fit or center the map when active selection changes.
- [ ] Dispose the map and interactions cleanly.

### Task 5: Documentation And Contract Notes

- [ ] Update OpenAPI with the planned draft command, validation, detail, and reference locate endpoints.
- [ ] Update UX docs with the MVP interaction rules and deferred capabilities.
- [ ] Keep backend responsibilities explicit: validation, persistence, publishing, audit, and reference checks remain backend-owned.

### Task 6: Verification And Review

- [ ] Run `npm run build` in `frontend`.
- [ ] Run `npm run test -- --watch=false` if a test target is available.
- [ ] Use Playwright to inspect the built or served workspace on desktop and mobile widths.
- [ ] Request final reviewer feedback on diff, tests, and risks.
