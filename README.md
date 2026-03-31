# Road GIS Platform

System GIS do zarzadzania infrastruktura drogowa w Polsce.

## Cel
Platforma wspiera:
- ewidencje drog,
- ksiazke drogi,
- mapy techniczno-eksploatacyjne,
- operacyjna prace GIS na mapie, tabeli i formularzu.

## Stack
- Frontend: Angular, Tailwind, PrimeNG, OpenLayers
- Backend: Java, Spring Boot, GeoTools
- GIS services: GeoServer
- Database: MS SQL

## Struktura
- `docs/` - architektura, domena, ADR, backlog
- `db/` - schematy i migracje MS SQL
- `backend/` - API i logika biznesowa
- `frontend/` - aplikacja webowa
- `geoserver/` - konfiguracja uslug i stylow
- `scripts/` - skrypty developerskie i CI

## Lokalny workflow
Repo utrzymuje backend na repo-local Java 21 i frontend na repo-local Node 22.12.0. Globalne `JAVA_HOME` i `node` moga pozostac na starszych wersjach hosta.

1. Zainstaluj repo-local JDK 21:
   `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap\install-jdk21.ps1`
2. Zainstaluj repo-local Node 22.12.0:
   `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap\install-node22.ps1`
3. Sprawdz lokalne srodowisko:
   `powershell -ExecutionPolicy Bypass -File .\scripts\dev\doctor.ps1`
4. Uruchom frontendowy check lokalny:
   `powershell -ExecutionPolicy Bypass -File .\scripts\dev\frontend-check.ps1`
5. Uruchom backendowe testy unit lokalnie:
   `powershell -ExecutionPolicy Bypass -File .\scripts\dev\backend-unit.ps1`

## Kontenery i testy integracyjne
- Lokalny workflow na tej maszynie nie zaklada Dockera ani WSL.
- `mvnw -P integration-tests verify` jest tutaj traktowane jako sciezka CI-only.
- Zrodlem prawdy dla testow integracyjnych jest GitHub Actions z Java 21 i Dockerem na runnerze.

## Zasady pracy
Przed praca przeczytaj:
1. `AGENTS.md`
2. `docs/architecture/system-overview.md`
3. `docs/domain/domain-model.md`
