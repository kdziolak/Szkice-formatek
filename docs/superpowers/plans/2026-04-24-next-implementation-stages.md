# Next Implementation Stages Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Domknac etap foundation, przerwany frontendowy workspace i uruchomic pierwszy pelny pion domenowy `reference + road_section + draft save`.

**Architecture:** Najpierw stabilizujemy model referencyjny, dane `RoadSection` i minimalny model draftu w MS SQL + backendzie, a dopiero potem podpina sie do tego frontendowy workspace. GeoServer w najblizszym etapie publikuje tylko stan opublikowany, a overlay draftu pozostaje po stronie frontend/backend.

**Tech Stack:** Angular 19, Tailwind, PrimeNG, OpenLayers, Java 21, Spring Boot 3.4, Flyway, MS SQL Server, GeoTools, GeoServer.

---

## Current Status

### Epics already in progress

- `EP-01 Foundation i governance`: dokumentacja, ADR-y, backlog, szkielety katalogow, minimalny backend bootstrap.
- `EP-06 Operacyjny frontend GIS`: rozpoczet y szkic workspace `data-management` z mapa, tabela, formularzem i draft UX.
- Frontendowy fragment `EP-04 Draft i workflow zmian`: tylko na poziomie UI i planu, bez dzialajacego store/API.
- Analityczny nurt `EP-07 Import i eksport`: istnieja specyfikacje UX importu, brak implementacji.

### Epics not yet materially implemented

- `EP-02 System referencyjny`
- `EP-03 Ewidencja obiektow drogowych`
- `EP-04 Draft i workflow zmian` po stronie backend/db
- `EP-05 Walidacja i topologia`
- `EP-07 Import i eksport` po stronie kodu
- `EP-08 Raporty i dokumenty`
- `EP-09 Administracja i utrzymanie` poza podstawowym skeletonem

### Key conclusions

- Repo nie jest jeszcze na etapie wielu rownoleglych pionow biznesowych.
- Najwieksza wartosc da teraz pierwszy pelny pion przez wszystkie warstwy, a nie dalsze rozszerzanie samego UI.
- Najlepszy kandydat na taki pion to `RoadSection` osadzony w systemie referencyjnym i obsludze draftu.
- `RoadSection` musi byc od poczatku jawnie zwiazany z mechanizmem referencyjnym, a nie tylko z sama geometria mapowa.
- Semantyka draftu musi zostac zatwierdzona przed implementacja `edit.*`, zeby nie utrwalic zbyt generycznego modelu.

## Strategic Decision

### Current implementation priority

- [ ] **Stage 1: Domknac foundation techniczne dla pierwszego pionu**
- [ ] **Stage 2: Zaimplementowac `EP-02` + minimalne `EP-03` dla `RoadSection`**
- [ ] **Stage 3: Zaimplementowac minimalne `EP-04` dla zapisu draftu**
- [ ] **Stage 4: Podpiac realne API do istniejacego frontendowego workspace**
- [ ] **Stage 5: Dolozyc walidacje lekkie i publikacje MVP**

### Explicit deprioritization for now

- [ ] Nie rozszerzac jeszcze katalogu obiektow infrastruktury poza `RoadSection`.
- [ ] Nie zaczynac jeszcze pelnego importu produkcyjnego.
- [ ] Nie zaczynac jeszcze raportow `Ksiazka Drogi` i `Mapa Techniczno-Eksploatacyjna`.
- [ ] Nie budowac jeszcze konflikt resolution, split/merge i zaawansowanej topologii.

## Execution Waves

### Wave 1: Foundation hardening

**Outcome:** Repo jest gotowe do implementacji pierwszego pionu bez dalszego dryfu dokumentacja-vs-kod.

- [ ] Zweryfikowac i domknac konwencje `business_id`, statusow i nazw schematow/tabel.
- [ ] Ustalic docelowa lokalizacje migracji Flyway i zgodnosc backend <-> db.
- [ ] Uporzadkowac minimalny kontrakt OpenAPI dla `road-sections`, `reference`, `reference-binding`, `drafts`.
- [ ] Potwierdzic, ze `RoadSection` jest pierwszym agregatem edycyjnym MVP.
- [ ] Zatwierdzic minimalna semantyke draftu MVP:
  - [ ] czy `draft_object` przechowuje snapshot payloadu, czy command payload,
  - [ ] jak identyfikowany jest obiekt zrodlowy i nowy obiekt,
  - [ ] jaki jest minimalny warunek publikacji,
  - [ ] gdzie egzekwowane sa uprawnienia do create draft / validate / publish.
- [ ] Zdefiniowac twarde kryterium `foundation closed`:
  - [ ] kontrakt API dla pionu MVP zatwierdzony,
  - [ ] lokalizacja migracji i naming ustalone,
  - [ ] pierwszy agregat i binding referencyjny potwierdzone,
  - [ ] brak otwartych decyzji blokujacych dla `RoadSection`.
- [ ] Oznaczyc obecny frontendowy workspace jako `prototype/in-progress`, dopoki nie ma dzialajacego store i API.

### Wave 2: Reference + RoadSection read model

**Outcome:** System potrafi odczytac i pokazac opublikowane dane referencyjne oraz `RoadSection`.

- [ ] Dodac migracje `ref.reference_point` i `ref.reference_segment`.
- [ ] Dodac migracje publikowanych tabel `road.road_section`.
- [ ] Dodac jawny model `ReferenceBinding` dla `RoadSection`, obejmujacy segment referencyjny, chainage od-do, sposob lokalizacji i zgodnosc geometria ↔ referencja.
- [ ] Dodac indeksy i zalozenia geometryczne zgodne z SRID roboczym.
- [ ] Dodac walidacje wejsciowa geometrii i SRID na granicy API.
- [ ] Zaimplementowac backendowe API odczytu referencji i `road-sections`:
  - [ ] lista,
  - [ ] detal,
  - [ ] filtracja po statusie,
  - [ ] wyszukiwanie po `business_id`,
  - [ ] odczyt danych bindingu referencyjnego.
- [ ] Rozszerzyc OpenAPI i testy integracyjne dla odczytu.
- [ ] Przygotowac minimalne warstwy GeoServer dla referencji i opublikowanego `road_section`.

### Wave 3: Draft save MVP

**Outcome:** System potrafi tworzyc draft i zapisac zmiane atrybutow/geometrii dla `RoadSection`.

- [ ] Dodac model `edit.draft`, `edit.draft_object`, `edit.validation_issue`.
- [ ] Oprzec implementacje `edit.*` o zatwierdzona semantyke MVP:
  - [ ] `draft` jako kontener pracy uzytkownika,
  - [ ] `draft_object` powiazany z `business_id` lub identyfikatorem nowego obiektu,
  - [ ] payload obejmuje atrybuty, geometrie i binding referencyjny,
  - [ ] publikacja jest mozliwa tylko po przejsciu walidacji lekkiej i sprawdzeniu uprawnien.
- [ ] Zaimplementowac `POST /drafts`, `POST /drafts/{id}/commands`, `POST /drafts/{id}/validate-lite`.
- [ ] Zapisac minimalna historie i kontekst audytowy.
- [ ] Utrzymac overlay draftu poza GeoServerem.
- [ ] Zdefiniowac lekka walidacje atrybutowa i referencyjna dla MVP.

### Wave 4: Frontend integration

**Outcome:** Istniejacy ekran `data-management` dziala na prawdziwym kontrakcie dla jednego agregatu.

- [ ] Domknac brakujace pliki `object-entry.models` i store nad realnym HTTP kontraktem.
- [ ] Podpiac tabele, formularz i mape do API `RoadSection`.
- [ ] Zachowac synchronizacje `mapa <-> tabela <-> formularz`.
- [ ] Pokazac status draftu, wyniki walidacji i binding referencyjny.
- [ ] Zweryfikowac build i podstawowe scenariusze UI.

### Wave 5: Publish MVP

**Outcome:** Zmiana z draftu moze przejsc do stanu opublikowanego dla `RoadSection`.

- [ ] Dodac minimalny endpoint publikacji draftu.
- [ ] Promowac zmiany z `edit.*` do tabel publikowanych.
- [ ] Zapisac wpis historii i audytu.
- [ ] Odswiezyc odczyt publikowany i warstwy mapowe.

## Agent Delegation Strategy

### Main Codex responsibilities

- [ ] Podejmowac decyzje architektoniczne i kolejnosc fal.
- [ ] Czytac tylko streszczenia, diffy, testy i ryzyka.
- [ ] Odbierac i zatwierdzac prace workerow.
- [ ] Pilnowac granic frontend/backend/GeoServer/MS SQL.

### `qwen_colab_explorer`

- [ ] Przed kazda fala wskazuje tylko istotne pliki i miejsca wejscia.
- [ ] Mapuje zaleznosci bez czytania calego repo.
- [ ] Raportuje roznice miedzy planem a stanem kodu.

### `qwen_colab_worker`

- [ ] Worker A: `docs/api/` + `docs/adr/` dla kontraktu `RoadSection`, `ReferenceBinding` i semantyki draftu MVP.
- [ ] Worker B po akceptacji kontraktu: `db/` dla migracji `ref`, `road`, `edit`.
- [ ] Worker C po migracjach: `backend/` dla odczytu `reference` i `road-sections` oraz draft save MVP.
- [ ] Worker D dopiero po stabilizacji DTO: `frontend/` dla store i integracji workspace.
- [ ] Worker E dopiero pozniej: `geoserver/` dla warstw read-only.

### `gemini_consultant`

- [ ] Konsultuje tylko ryzyka modelu draftu, publikacji i granic GeoServer/backend.
- [ ] Nie przygotowuje implementacji, tylko decyzje i ostrzezenia.

### `final_reviewer`

- [ ] Uruchamiac po kazdej zakonczonej fali, nie po kazdym drobnym commicie.
- [ ] Dostaje tylko: plan, streszczenie eksploracji, zmienione pliki, diff, testy, ryzyka.

## Recommended Immediate Tasks

### Next task batch

- [ ] Task 1: Ujednolicic kontrakt MVP `RoadSection + ReferenceBinding + draft save` w `docs/api/openapi.yaml`.
- [ ] Task 2: Doprecyzowac i zapisac minimalna semantyke draftu MVP oraz granice uprawnien.
- [ ] Task 3: Dodac pierwsze migracje MS SQL dla `ref`, `road`, `edit`.
- [ ] Task 4: Zaimplementowac backendowy odczyt `road-sections` i `reference`.
- [ ] Task 5: Zaimplementowac zapis draftu i walidacje lekkie.
- [ ] Task 6: Dopiero potem domknac frontendowy store/models nad realnym API.

### Parallelization rules

- [ ] Rownolegle mozna prowadzic tylko kontrakt API i przygotowanie migracji, dopoki nie ma otwartych decyzji semantycznych.
- [ ] Backend read-only startuje po akceptacji kontraktu `RoadSection` i `ReferenceBinding`.
- [ ] Frontend integracyjny startuje po ustabilizowaniu DTO i endpointow odczytu.
- [ ] Draft publish nie powinien ruszyc przed zamknieciem modelu `edit.*`.
- [ ] GeoServer startuje dopiero po ustaleniu modelu publikowanego `road_section`.

## Verification Gates

- [ ] Po Wave 1: review dokumentacji, zgodnosci namingowej i kontraktu.
- [ ] Po Wave 2: `mvn test` lub `mvn clean verify` dla backendu oraz walidacja migracji.
- [ ] Po Wave 3: testy integracyjne draft API i walidacji lekkiej.
- [ ] Po Wave 4: `npm run build` i podstawowy test uruchomienia workspace.
- [ ] Po Wave 5: test przeplywu `read -> draft save -> validate -> publish`.

## Risks and Guardrails

- [ ] Nie rozwijac kilku agregatow naraz.
- [ ] Nie modelowac draftu zbyt generycznie bez sprawdzenia rzeczywistego przeplywu `RoadSection`.
- [ ] Nie odrywac `RoadSection` od bindingu referencyjnego i zasad chainage.
- [ ] Nie przenosic logiki walidacyjnej do GeoServera.
- [ ] Nie budowac raportow przed ustabilizowaniem stanu publikowanego.
- [ ] Nie rozszerzac importu przed gotowym stagingiem i draftem.
