# Road GIS Platform

System GIS do zarządzania infrastrukturą drogową w Polsce.

## Cel
Platforma wspiera:
- ewidencję dróg
- książkę drogi
- mapy techniczno-eksploatacyjne
- operacyjną pracę GIS na mapie, tabeli i formularzu

## Stack
- Frontend: Angular, Tailwind, PrimeNG, OpenLayers
- Backend: Java, Spring Boot, GeoTools
- GIS services: GeoServer
- Database: MS SQL

## Struktura
- `docs/` — architektura, domena, ADR, backlog
- `db/` — schematy i migracje MS SQL
- `backend/` — API i logika biznesowa
- `frontend/` — aplikacja webowa
- `geoserver/` — konfiguracja usług i stylów
- `scripts/` — skrypty developerskie i CI

## Zasady pracy
Przed pracą przeczytaj:
1. `AGENTS.md`
2. `docs/architecture/system-overview.md`
3. `docs/domain/domain-model.md`

## Pierwsze kroki
1. Przygotuj dokument architektury.
2. Przygotuj ADR-y.
3. Przygotuj model domenowy.
4. Przygotuj szkic bazy danych.
5. Przygotuj OpenAPI.
6. Utwórz szkielety backendu i frontendu.