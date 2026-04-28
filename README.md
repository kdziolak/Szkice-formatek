# RoadGIS Platform

RoadGIS Platform to uruchamialny prototyp systemu GIS do zarządzania infrastrukturą drogową w Polsce. Projekt pokazuje pionowy przekrój klasy enterprise: mapa OpenLayers, tabela atrybutowa, prawy panel warstw i formularzy, system referencyjny, wersje robocze, walidacja, import, eksport, raporty i historia zmian.

Prototyp nie udaje kompletnego systemu prawnego. Dokumentacja wskazuje założenia, matrycę zgodności, obszary wymagające weryfikacji prawnej oraz miejsca przygotowane pod pełną książkę drogi, GUS i integrację produkcyjną.

## Stack

- Frontend: Angular 21.2.x, TypeScript 5.9.x, PrimeNG 21.1.x, Tailwind CSS 4.2.x, OpenLayers 10.9.x, RxJS 7.8.x.
- Backend: Java 21, Spring Boot 4.0.x, Spring Web, Spring Data JDBC/JPA boundary, Flyway, GeoTools 34.x, Springdoc OpenAPI.
- Baza prototypu: PostgreSQL 16 + PostGIS 3.4 przez Docker Compose.
- GIS services: bezpośrednie API GeoJSON w prototypie; GeoServer opisany jako opcjonalna warstwa WMS/WFS do rozbudowy.

Wersje bibliotek frontendowych zostały sprawdzone 2026-04-25 przez npm i Context7. TypeScript 5.9.x jest celowym wyborem zgodnościowym dla Angular DevKit 21.2.x, którego peer dependency ma zakres `>=5.9 <6.0`.

## Struktura

```text
backend/        Spring Boot API, walidacja, migracje Flyway, seed danych
frontend/       Angular GIS workspace z mapą, tabelą i panelami
docs/           architektura, domena, compliance, UI, API, import/walidacja
sample-data/    przykładowe GeoJSON dla dróg, SR, barier, stacji i działek
scripts/        uruchamianie lokalne, seed pomocniczy, bootstrap Node 22, Java 21 i Maven
docker-compose.yml
```

## Szybki Start

Wymagane lokalnie:

- Docker Desktop z Compose.
- Java 21 albo repo-lokalny Temurin instalowany skryptem.
- Maven 3.9+ albo repo-lokalny Maven instalowany skryptem.
- Node 22.12+ dla Angular 21 albo repo-lokalny Node instalowany skryptem.

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\bootstrap\install-node22.ps1"
powershell -ExecutionPolicy Bypass -File ".\scripts\bootstrap\install-java21.ps1"
powershell -ExecutionPolicy Bypass -File ".\scripts\bootstrap\install-maven.ps1"
docker compose up -d postgis
```

Backend:

```powershell
cd backend
$env:JAVA_HOME = (Resolve-Path '..\.local-runtime\java-21').Path
$env:PATH = "$env:JAVA_HOME\bin;" + (Resolve-Path '..\.local-runtime\apache-maven-3.9.15\bin').Path + ';' + $env:PATH
mvn.cmd spring-boot:run
```

Frontend:

```powershell
cd frontend
$env:PATH = (Resolve-Path '..\.local-runtime\node-22.12.0').Path + ';' + $env:PATH
npm.cmd install
npm.cmd start
```

Aplikacja frontendowa działa domyślnie pod `http://localhost:4200`, a backend pod `http://localhost:8080`. Proxy Angular przekazuje `/api` do backendu.

## Dane I Migracje

Flyway tworzy schemat aplikacyjny i seeduje przykładowe dane:

- drogi: DK7, DK79, S7, DW721,
- odcinki i punkty referencyjne w okolicy Warszawy,
- bariery energochłonne, stacje pomiaru ruchu, kanały technologiczne i działki,
- obiekty poprawne, bez dowiązania SR oraz z błędami walidacji,
- workspace roboczy, historia zmian, raporty i katalog warstw.

`sample-data/` zawiera równoległe pliki GeoJSON do testów importu i demonstracji integracji.

## Główne Endpointy

- `GET /api/roads`
- `GET /api/reference-segments`
- `GET /api/reference-segments/nearest?lat=&lon=&roadNumber=`
- `GET /api/infrastructure-objects`
- `POST /api/infrastructure-objects/{id}/validate`
- `POST /api/infrastructure-objects/{id}/bind-reference-segment`
- `GET /api/layers`
- `GET /api/layers/{layerCode}/features`
- `POST /api/workspaces`
- `PUT /api/workspaces/{id}/objects/{objectId}`
- `POST /api/workspaces/{id}/objects/{objectId}/bind-reference-segment`
- `POST /api/workspaces/{id}/validate`
- `POST /api/import/geojson`
- `POST /api/import/csv`
- `GET /api/export/objects.geojson`
- `GET /api/export/objects.csv`

Szczegóły są w `docs/05-api-contract.md`.

## Zaimplementowany Vertical Slice

- Profesjonalny układ web GIS inspirowany desktop GIS: toolbar, mapa, tabela dolna, prawy panel.
- Synchronizacja mapa, tabela i formularz dla obiektów infrastruktury.
- Drzewo warstw z grupami: system referencyjny, drogi, infrastruktura, działki, stacje, techniczne, podkłady.
- Formularz atrybutów z polskimi etykietami biznesowymi.
- Tryb zarządzania danymi i aktywna wersja robocza.
- Dowiązanie obiektu do najbliższego odcinka referencyjnego.
- Walidator domenowy dla geometrii, kilometrażu, pól wymaganych i finalizacji.
- Import GeoJSON/CSV do wersji roboczej w uproszczonym przepływie.
- Eksport CSV i GeoJSON.
- Raporty walidacji, ewidencji drogi i stacji pomiaru ruchu.
- Historia zmian rekordu.

## Uproszczenia Prototypu

- PostGIS jest jednym źródłem danych dla prototypu; MS SQL pozostaje docelową warstwą opisową i raportową opisaną w ADR.
- GeoServer nie jest wymagany do lokalnego uruchomienia. Backend publikuje GeoJSON bezpośrednio.
- Security jest uproszczone do mockowego kontekstu użytkownika i ról w danych.
- Import SHP/GML/DXF/DWG/XLSX jest przygotowany architektonicznie, ale niezaimplementowany.
- Książka drogi i GUS mają miejsca rozszerzeń oraz matrycę zgodności, nie finalny zakres prawny.

## Dokumentacja

- `docs/01-architecture.md` - architektura i sposób uruchomienia.
- `docs/02-domain-model.md` - encje, relacje, statusy i reguły.
- `docs/03-legal-compliance-matrix.md` - matryca zgodności i obszary prawne.
- `docs/04-ui-ux-guidelines.md` - układ GIS i interakcje.
- `docs/05-api-contract.md` - kontrakt REST i DTO.
- `docs/06-import-validation-workflow.md` - import, walidacja i zapis do workspace.

## Rozwój Do Wersji Produkcyjnej

Najbliższe kroki produkcyjne to: pełny model książki drogi, zatwierdzone mapowanie GUS, docelowe role i JWT, integracja GeoServer WMS/WFS, decyzja MS SQL/PostGIS per moduł, obsługa importów branżowych oraz komplet testów integracyjnych na bazie przestrzennej.

## Walidacja Lokalna

Backend:

```powershell
cd backend
$env:JAVA_HOME = (Resolve-Path '..\.local-runtime\java-21').Path
$env:PATH = "$env:JAVA_HOME\bin;" + (Resolve-Path '..\.local-runtime\apache-maven-3.9.15\bin').Path + ';' + $env:PATH
mvn.cmd test
```

Frontend:

```powershell
cd frontend
$env:PATH = (Resolve-Path '..\.local-runtime\node-22.12.0').Path + ';' + $env:PATH
npm.cmd run build
npm.cmd run lint
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm.cmd run test -- --watch=false --browsers=ChromeHeadless
```
