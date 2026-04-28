# RoadInfraGIS Poland Vertical Slice Design

## Cel

RoadInfraGIS Poland ma rozwijać istniejący projekt w katalogach `backend/`, `frontend/`, `db/`, `docs/`, `geoserver/`, `sample-data/` i `scripts/`, bez tworzenia drugiego repozytorium w podkatalogu. Pierwszy etap ma dostarczyć uruchamialny pionowy przekrój: mapa, tabela, panel atrybutów, wersja robocza, walidacja, dowiązanie do systemu referencyjnego, import, eksport i raporty.

## Decyzja architektoniczna

Backend pozostaje modularnym monolitem Spring Boot. Dla prototypu źródłem danych przestrzennych jest PostgreSQL + PostGIS uruchamiany z `docker-compose.yml`; GeoServer pozostaje opcjonalną warstwą publikacji opisaną w dokumentacji, a frontend pobiera GeoJSON bezpośrednio z REST API. Dzięki temu prototyp jest prostszy do uruchomienia lokalnie, ale zachowuje granicę odpowiedzialności: backend jest właścicielem walidacji i procesu draft/publish, frontend odpowiada za UX mapy, tabeli i formularza.

## Zakres implementacji

1. Backend:
   - migracja Flyway tworząca tabele dróg, odcinków referencyjnych, punktów referencyjnych, obiektów infrastruktury, workspace, historii, walidacji, importów i eksportów,
   - seed danych DK7, DK79, S7, DW721 w okolicy Warszawy,
   - REST API wymagane w specyfikacji użytkownika,
   - walidator domenowy z testami jednostkowymi,
   - eksport CSV i GeoJSON oraz raporty bazowe.

2. Frontend:
   - Angular standalone components,
   - OpenLayers jako główny silnik mapy,
   - top bar, mapa, dolna tabela, prawy panel zakładek,
   - signal store synchronizujący mapa ↔ tabela ↔ formularz,
   - obsługa workspace, walidacji, dowiązania SR, importu GeoJSON i eksportu.

3. Dokumentacja:
   - przekrojowe pliki `docs/01-architecture.md` do `docs/06-import-validation-workflow.md`,
   - aktualizacja README z komendami,
   - macierz zgodności i obszary wymagające weryfikacji prawnej.

## Uproszczenia świadome

- Pełne JWT zastępuje mock kontekstu użytkownika i role pokazywane w UI.
- GeoServer nie jest wymagany do uruchomienia vertical slice; API GeoJSON jest źródłem warstw.
- Import CSV ma prosty parser prototypowy i architekturę pod rozbudowę.
- Zaawansowana książka drogi, pełne formularze GUS, SHP/GML/DXF/DWG i pełne uprawnienia pozostają opisanymi rozszerzeniami.

## Testowanie

Minimalna walidacja obejmuje:

- unit test walidatora domenowego,
- test API dla obiektów infrastruktury,
- test store frontendu dla synchronizacji selekcji i statusów,
- build backendu i frontendu po implementacji.
