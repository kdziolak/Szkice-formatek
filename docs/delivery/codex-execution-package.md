# Codex Execution Package - Road GIS Platform

## Cel dokumentu

Ten dokument jest pakietem wykonawczym dla dalszej pracy agentowej Codex nad systemem GIS do zarzadzania infrastruktura drogowa w Polsce. Zawiera decyzje techniczne, model domenowy, model danych, backlog wdrozeniowy, architekture backendu i frontendu, projekt warstwy GIS, specyfikacje ekranow i iteracyjny plan realizacji.

## Status

- Status: Draft for implementation
- Data: 2026-03-30
- Zakres: foundation + execution guidance

## Zalozenie projektowe

1. Pierwszy produkcyjny zakres obejmuje drogi krajowe i jednostki organizacyjne odpowiadajace modelowi pracy GDDKiA.
2. Podstawowym ukladem roboczym dla danych przestrzennych jest EPSG:2180, a publikacja pomocnicza moze byc transformowana do EPSG:3857 dla mapy webowej.
3. Ksiazka drogi i mapa techniczno-eksploatacyjna sa generowane wylacznie ze stanu opublikowanego.
4. System ma wspierac obiekty niepelne w imporcie roboczym, ale nie dopuszcza ich do publikacji bez przejscia walidacji.
5. W pierwszej fazie runtime pozostaje modularnym monolitem z osobnym GeoServerem, bez dodatkowego brokera komunikatow.

---

## Czesc A - Architektura rozwiazania

### A.1 Architektura logiczna

System jest podzielony na osiem glownych obszarow biznesowo-technicznych:

| Obszar | Cel | Wlasciciel logiki |
| --- | --- | --- |
| System referencyjny | referencyjne punkty, odcinki, kilometraz, osie, dowiazania | backend |
| Ewidencja drog i jezdni | drogi, jezdnie, pasy ruchu, pobocza, korona, pas drogowy | backend |
| Obiekty infrastruktury | skrzyzowania, obiekty inzynierskie, zjazdy, chodniki, sciezki rowerowe, zatoki, perony, bariery, ekrany, odwodnienie, oswietlenie, oznakowanie, uzbrojenie | backend |
| Draft i workflow zmian | zapis roboczy, konflikty, publikacja, archiwizacja | backend |
| Walidacja | walidacje atrybutowe, topologiczne, referencyjne i raportowe | backend |
| Operacyjna praca GIS | mapa, tabela, formularz, operacje geometrii i zaznaczenia | frontend + backend |
| Raportowanie | ksiazka drogi, mapa techniczno-eksploatacyjna, eksporty | backend + GeoServer |
| Administracja i konfiguracja | slowniki, widocznosc warstw, uprawnienia, layouty formularzy | backend + frontend |

### A.2 Architektura techniczna

| Warstwa | Technologia | Odpowiedzialnosc |
| --- | --- | --- |
| Frontend SPA | Angular + PrimeNG + Tailwind + OpenLayers | interfejs roboczy, stan UI, mapa, tabela, formularze, synchronizacja zaznaczen |
| Backend API | Java 21 + Spring Boot + Spring JDBC + Flyway + GeoTools | API REST, logika biznesowa, walidacja, workflow draft/publish, import/export, raporty |
| GIS Publishing | GeoServer | WMS, WFS, WMTS, stylizacja, skalozaleznosc, publikacja warstw odczytowych |
| Storage | MS SQL Server + file storage | dane transakcyjne, geometrie, historia, konfiguracja, zalaczniki |
| Reverse proxy | nginx | routing frontend/API/GeoServer, cache kontrolowany |
| Observability | logs + metrics + health | diagnostyka, monitoring, support |

### A.3 Rozdzial odpowiedzialnosci

| Funkcja | Frontend | Backend | GeoServer | MS SQL |
| --- | --- | --- | --- | --- |
| Prezentacja mapy | render mapy, highlight, selection, ribbon | dostarcza konfiguracje warstw i dane biznesowe | publikuje warstwy WMS/WFS/WMTS | przechowuje geometrie i atrybuty |
| Edycja geometrii | interakcje mapowe, snapping UI | zapis draftu, walidacja, overlay draftu | brak zapisu roboczego | przechowuje stan publikowany i draft payload |
| Walidacja | prezentacja bledow, kolorystyka statusow | silnik regul | ewentualne warstwy kontrolne | dane do porownan i topologii |
| Raporty | uruchomienie i pobranie | generacja snapshotow i dokumentow | mapy wydrukowe i warstwy raportowe | snapshoty raportowe |
| Import | upload, mapowanie kolumn | parsowanie, staging, walidacja, draft | opcjonalna publikacja warstw importu | staging, bledy importu |
| Konfiguracja warstw | drzewo warstw, preferencje uzytkownika | polityki dostepu i definicje | implementacja publikacji | tabele cfg i ref |

### A.4 Glowne przeplywy danych

#### A.4.1 Odczyt operacyjny

1. Frontend pobiera workspace uzytkownika, konfiguracje warstw i slowniki z backendu.
2. Frontend pobiera warstwy bazowe i publikacyjne z GeoServera.
3. Frontend pobiera liste obiektow i szczegoly przez API backendu.
4. Selekcja na mapie powoduje pobranie szczegolow biznesowych z backendu.

#### A.4.2 Edycja obiektu

1. Uzytkownik wybiera obiekt lub rysuje nowa geometrie.
2. Frontend tworzy command edycyjny i zapisuje go do draftu przez backend.
3. Backend tworzy lub aktualizuje `edit.draft_object`.
4. Backend uruchamia walidacje synchroniczna lekkich regul i asynchroniczna ciezszych regul topologicznych.
5. Frontend odswieza overlay draftu, panel walidacji i status obiektu.

#### A.4.3 Publikacja

1. Uzytkownik uruchamia finalny zapis.
2. Backend blokuje draft, uruchamia komplet walidacji.
3. Przy braku bledow krytycznych backend promuje zmiany do tabel publikowanych.
4. Backend zapisuje historie i wpis audytowy.
5. GeoServer odswieza warstwy lub cache warstw publikacyjnych.

#### A.4.4 Raportowanie

1. Uzytkownik wybiera zakres raportu i date danych.
2. Backend materializuje lub odczytuje snapshot raportowy.
3. Dla map raportowych backend pobiera uslugi mapowe z GeoServera.
4. Wynik jest zwracany jako PDF/XLSX/GeoJSON zgodnie z typem raportu.

### A.5 Glowne komponenty systemu

#### Frontend

- shell aplikacji z ribbonem i docking layout,
- modul mapy operacyjnej,
- modul tabel danych z server-side query,
- modul formularzy obiektow i walidacji,
- modul importow, raportow i administracji.

#### Backend

- API reference,
- API infrastructure,
- API editing,
- API validation,
- API reports,
- API import/export,
- security + audit,
- adapter GeoServer,
- service geometry and chainage.

#### GeoServer

- workspace `road-gis`,
- warstwy publikacyjne per domena,
- style skalozalezne,
- warstwy raportowe i wydrukowe,
- cache i profile WMTS dla warstw masowych.

#### Baza i storage

- schematy domenowe,
- tabele publikowane,
- tabele draft i staging,
- tabele historii i audit,
- magazyn zalacznikow,
- konfiguracja warstw i layoutow.

### A.6 Kluczowe decyzje architektoniczne

1. Backend jest wlascicielem procesu biznesowego, a GeoServer nie przejmuje regul walidacyjnych ani zapisu zmian.
2. Model danych rozdziela stan publikowany od roboczego. Raporty korzystaja wylacznie z danych opublikowanych.
3. System referencyjny i kilometraz sa osobnym kontekstem domenowym, nie tylko polami pomocniczymi.
4. Frontend pracuje na jednym workspace synchronizujacym mape, tabele i formularz.
5. Dla warstw masowych preferowany jest WMS/WMTS, a dla obszarow interaktywnych WFS lub dedykowane REST DTO.
6. Import nie zapisuje bezposrednio do tabel publikowanych. Kazdy import przechodzi przez staging i draft.
7. Historia zmian jest traktowana jako wymog podstawowy, nie pomocniczy.

---

## Czesc B - Struktura repozytorium

### B.1 Struktura docelowa

```text
road-gis-platform/
├─ docs/
├─ db/
├─ backend/
├─ frontend/
├─ geoserver/
├─ scripts/
├─ infra/
├─ .github/
├─ .editorconfig
├─ .gitignore
├─ AGENTS.md
└─ README.md
```

### B.2 Przeznaczenie folderow

| Folder | Przeznaczenie |
| --- | --- |
| `docs/architecture` | decyzje architektoniczne, diagramy, kontekst systemu |
| `docs/adr` | trwale decyzje techniczne i granice architektury |
| `docs/domain` | model domenowy, jezyk wspolny, cykl zycia obiektow, reguly ukladow odniesienia |
| `docs/ux` | mapa ekranow, tryby pracy, zasady ergonomii enterprise GIS |
| `docs/api` | OpenAPI, przyklady payloadow, kontrakty integracyjne |
| `docs/reports` | specyfikacje ksiazki drogi i map techniczno-eksploatacyjnych |
| `docs/delivery` | roadmapa, backlog, plan wydan, pakiet wykonawczy Codex |
| `db/mssql` | skrypty DDL, widoki, procedury, seed, migracje |
| `backend` | aplikacja Spring Boot z logika domenowa i API |
| `frontend` | aplikacja Angular i komponenty mapowo-tabelaryczne |
| `geoserver` | konfiguracja workspace, warstw, stylow, datastore i seedow |
| `scripts` | bootstrap lokalny, dev scripts, CI, release |
| `infra` | kontenery, compose, nginx, observability |
| `.github/workflows` | pipeline CI/CD i quality gates |

### B.3 Struktura backendu

| Katalog | Przeznaczenie |
| --- | --- |
| `backend/src/main/java/pl/gddkia/roadgis/app` | bootstrap aplikacji, entrypoints |
| `backend/.../config` | konfiguracja Spring, datasource, web, security |
| `backend/.../common` | common abstractions, error model, audit context |
| `backend/.../reference` | system referencyjny, punkty, odcinki, kilometraz |
| `backend/.../infrastructure` | drogi, jezdnie i obiekty infrastruktury |
| `backend/.../editing` | drafty, konflikty, publish workflow |
| `backend/.../validation` | reguly i raporty walidacyjne |
| `backend/.../importexport` | importy plikowe, eksporty, staging |
| `backend/.../reports` | snapshoty, PDF/XLSX, mapa raportowa |
| `backend/.../attachments` | zalaczniki, storage adapters |

### B.4 Struktura frontendu

| Katalog | Przeznaczenie |
| --- | --- |
| `frontend/src/app/core` | bootstrapping, auth, API client, config runtime |
| `frontend/src/app/shared` | wspolne komponenty, pipes, directives, utils |
| `frontend/src/app/shell` | layout, ribbon, dock panels, navigation shell |
| `frontend/src/app/features/dashboard` | pulpit operacyjny |
| `frontend/src/app/features/data-management` | glowny tryb pracy GIS |
| `frontend/src/app/features/object-editor` | szczegoly i edycja obiektu |
| `frontend/src/app/features/reference-binding` | dowiazanie do systemu referencyjnego |
| `frontend/src/app/features/import` | importy, mapowanie, staging errors |
| `frontend/src/app/features/validation` | panel issue i topologia |
| `frontend/src/app/features/reports` | uruchamianie i przeglad raportow |
| `frontend/src/app/features/administration` | slowniki i konfiguracja |
| `frontend/src/app/map` | OpenLayers integration, map services, interactions |
| `frontend/src/app/state` | stores i event coordination |

### B.5 Zalozenie projektowe

Opcjonalny katalog `shared/` poza `backend/` i `frontend/` warto dodac dopiero wtedy, gdy pojawi sie rzeczywista potrzeba wspolnych kontraktow generowanych z OpenAPI. Na etapie foundation lepiej uniknac sztucznej abstrakcji.

---

## Czesc C - Backlog wdrozeniowy

### C.1 Epiki

| ID | Epik | Cel |
| --- | --- | --- |
| EP-01 | Foundation i governance | domkniecie podstaw architektury, repo i konwencji |
| EP-02 | System referencyjny | model punktow, odcinkow i kilometraza |
| EP-03 | Ewidencja obiektow drogowych | baza danych i API dla obiektow liniowych, punktowych i powierzchniowych |
| EP-04 | Draft i workflow zmian | zapis roboczy, konflikty, publikacja, historia |
| EP-05 | Walidacja i topologia | walidacje atrybutowe, przestrzenne, raportowe |
| EP-06 | Operacyjny frontend GIS | workspace mapa+tabela+formularz |
| EP-07 | Import i eksport | staging, mapowanie formatow, eksporty |
| EP-08 | Raporty i dokumenty | ksiazka drogi, mapa techniczno-eksploatacyjna |
| EP-09 | Administracja i utrzymanie | slowniki, konfiguracja warstw, audyt i monitorowanie |

### C.2 Zadania backlogu

| ID | Nazwa | Cel | Warstwa | Zaleznosci | Priorytet | Definicja ukonczenia |
| --- | --- | --- | --- | --- | --- | --- |
| EP-01-T01 | Domkniecie pakietu dokumentacyjnego | spiac architekture, domene, backlog i iteracje | docs | brak | P1 | dokumenty A-N zatwierdzone w review |
| EP-01-T02 | Konwencje nazw i identyfikatorow | ustalic wzorzec `business_id`, statusow i slownikow | docs + backend + db | EP-01-T01 | P1 | ADR lub doc z konwencjami zaakceptowany |
| EP-01-T03 | Bootstrap lokalnego srodowiska | przygotowac compose dla backend, frontend, SQL Server, GeoServer | infra + scripts | EP-01-T01 | P1 | lokalne uruchomienie opisane i powtarzalne |
| EP-01-T04 | Quality gate CI | lint, build, test, verify OpenAPI i SQL scripts | .github + scripts | EP-01-T03 | P1 | pipeline przechodzi dla skeletonu |
| EP-02-T01 | Model logiczny systemu referencyjnego | opisac punkty i odcinki referencyjne, chainage, dowiazania | docs + db | EP-01-T02 | P1 | model danych i reguly powiazan zatwierdzone |
| EP-02-T02 | Tabele `ref.reference_point` i `ref.reference_segment` | wdrozyc DDL i indeksy przestrzenne | db | EP-02-T01 | P1 | migracja tworzy tabele i indeksy |
| EP-02-T03 | API odczytu systemu referencyjnego | endpointy listy, detalu, wyszukiwania po kilometrazu | backend | EP-02-T02 | P1 | OpenAPI i testy integracyjne istnieja |
| EP-02-T04 | Warstwy GeoServer dla referencji | publikacja osi i pikietazu | geoserver | EP-02-T02 | P2 | warstwy sa widoczne i stylizowane |
| EP-03-T01 | Model drog, jezdni i przekroju | road, carriageway, lane, shoulder, road belt | docs + db | EP-02-T01 | P1 | model logiczny zaakceptowany |
| EP-03-T02 | Model obiektow infrastruktury | skrzyzowania, mosty, zjazdy, bariery, oswietlenie, oznakowanie | docs + db | EP-03-T01 | P1 | katalog obiektow i klasy geometryczne zdefiniowane |
| EP-03-T03 | Tabele publikowane dla ewidencji | utworzyc tabele `road.*` i `asset.*` | db | EP-03-T01, EP-03-T02 | P1 | migracje przechodza, FK i indeksy sa kompletne |
| EP-03-T04 | API CRUD odczytowe dla obiektow | lista, detal, filtrowanie, bbox, wyszukiwanie | backend | EP-03-T03 | P1 | DTO, endpointy i testy integracyjne dzialaja |
| EP-03-T05 | Warstwy publikacyjne GeoServer dla infrastruktury | publikacja warstw masowych i szczegolowych | geoserver | EP-03-T03 | P2 | workspace zawiera warstwy i style |
| EP-04-T01 | Model draft i change set | zdefiniowac `edit.draft`, `edit.draft_object`, konflikty | docs + db | EP-03-T03 | P1 | model i migracje gotowe |
| EP-04-T02 | Serwis zapisu roboczego | create/update/delete command do draftu | backend | EP-04-T01 | P1 | API zapisuje draft bez publikacji |
| EP-04-T03 | Overlay draftu w odczycie | nakladanie zmian roboczych na widoki UI | backend + frontend | EP-04-T02 | P1 | uzytkownik widzi stan roboczy i publikowany |
| EP-04-T04 | Publikacja draftu | promote do tabel publikowanych + historia | backend + db | EP-04-T02 | P1 | publish przechodzi z walidacja i audytem |
| EP-04-T05 | Obsluga konfliktow zmian | konflikt na obiekcie, geometrii i slownikach | backend + frontend | EP-04-T03 | P2 | konflikt ma status, UI i workflow rozwiazania |
| EP-05-T01 | Katalog regul walidacyjnych | sklasyfikowac reguly krytyczne, ostrzezenia, info | docs + backend | EP-04-T01 | P1 | katalog regul i poziomow istnieje |
| EP-05-T02 | Walidacja atrybutowa | sprawdzanie wymaganych pol, slownikow i zakresow | backend | EP-05-T01 | P1 | wynik trafia do `edit.validation_issue` |
| EP-05-T03 | Walidacja topologiczna | relacje przestrzenne, przeciecia, braki dowiazania | backend + db | EP-05-T01 | P1 | reguly uruchamialne i raportowane |
| EP-05-T04 | Panel walidacji w UI | filtrowanie bledow, przejscie do obiektu, kolorystyka | frontend | EP-05-T02, EP-05-T03 | P1 | uzytkownik moze naprowadzac na blad z listy |
| EP-05-T05 | Walidacja publikacyjna raportow | kontrola kompletnosci pod ksiazke drogi i mapy techniczne | backend | EP-05-T03 | P2 | raport publikacyjny blokuje finalny zapis |
| EP-06-T01 | Shell aplikacji i routing | layout enterprise, ribbon, docking, menu | frontend | EP-01-T03 | P1 | shell uruchamia sie i nawiguje po feature modules |
| EP-06-T02 | Modul mapy operacyjnej | OpenLayers, warstwy, selection, highlight, scale | frontend + geoserver | EP-02-T04, EP-03-T05 | P1 | mapa obsluguje odczyt i narzedzia nawigacyjne |
| EP-06-T03 | Tabela danych z query server-side | sortowanie, filtrowanie, paging, masowe zaznaczanie | frontend + backend | EP-03-T04 | P1 | tabela obsluguje duze wolumeny |
| EP-06-T04 | Formularz obiektu i statusy | zakladki atrybutow, zalacznikow, historii i walidacji | frontend + backend | EP-03-T04 | P1 | formularz obsluguje odczyt i draft save |
| EP-06-T05 | Synchronizacja mapa+tabela+formularz | selection coordinator i centralny workspace | frontend | EP-06-T02, EP-06-T03, EP-06-T04 | P1 | jedna selekcja steruje calym widokiem |
| EP-06-T06 | Narzedzia edycji geometrii | rysowanie, snapping, split, merge, copy geometry | frontend + backend | EP-04-T02 | P1 | operacje tworza commandy draftu |
| EP-07-T01 | Staging importow | zapis plikow, metadata job, staging records | backend + db + attachments | EP-01-T03 | P1 | import tworzy job i rekordy staging |
| EP-07-T02 | Import GeoJSON/CSV/XLSX MVP | pierwsze formaty robocze i mapowanie kolumn | backend + frontend | EP-07-T01 | P1 | mozliwy import do draftu z raportem bledow |
| EP-07-T03 | Import SHP/GML/DXF | rozszerzenie dla GIS z parserami i mapowaniem geometrii | backend | EP-07-T02 | P2 | formaty sa walidowane i wspierane przez staging |
| EP-07-T04 | Eksport danych i raportow | GeoJSON, XLSX, PDF, warstwy pomocnicze | backend + frontend | EP-03-T04, EP-08-T01 | P2 | eksport generuje plik z audytem |
| EP-08-T01 | Model raportowy | snapshoty, zestawienia, zakresy i parametry raportu | docs + db + backend | EP-04-T04 | P1 | model snapshotu i parametrow zatwierdzony |
| EP-08-T02 | Ksiazka drogi MVP | generacja raportu dla odcinka i zakresu czasu | backend + frontend | EP-08-T01 | P1 | PDF/XLSX generowane z danych opublikowanych |
| EP-08-T03 | Mapa techniczno-eksploatacyjna MVP | warstwy, legenda, filtr zakresu i wydruk | backend + geoserver + frontend | EP-08-T01 | P1 | wygenerowana mapa odpowiada danym publikowanym |
| EP-08-T04 | Kolejka dokumentow i pobran | status generacji, archiwum plikow, retry | backend + frontend | EP-08-T02 | P2 | uzytkownik widzi status i moze pobierac archiwa |
| EP-09-T01 | Slowniki i konfiguracja warstw | admin slownikow, typow obiektow, skali i formularzy | backend + frontend + db | EP-03-T03 | P1 | admin moze zarzadzac konfiguracja bez deployu |
| EP-09-T02 | Uprawnienia i audyt | role, zakres danych, audit trail, login context | backend + frontend | EP-01-T03 | P1 | kazda zmiana ma wpis audytowy |
| EP-09-T03 | Monitoring i health | metryki, log correlation, health checks | infra + backend | EP-01-T04 | P2 | dashboard operacyjny i alerty dzialaja |
| EP-09-T04 | Backup i archiwizacja eksportow | retention, restore procedure, archiwum zalacznikow | infra + db | EP-08-T04 | P2 | procedura odzysku opisana i sprawdzona |

---

## Czesc D - Model domenowy

### D.1 Konteksty domenowe

| Kontekst | Encje glowne | Cel |
| --- | --- | --- |
| Reference System | `ReferenceAxis`, `ReferencePoint`, `ReferenceSegment`, `SupportPoint`, `SupportSegment`, `ChainageMeasure` | stabilne dowiazanie do kilometraza i referencji terenowej |
| Road Network | `Road`, `Carriageway`, `RoadSection`, `Lane`, `Shoulder`, `MedianStrip`, `RoadCrown`, `RoadBelt` | opis drogi jako ukladu funkcjonalnego i geometrycznego |
| Infrastructure Assets | `Intersection`, `EngineeringStructure`, `Driveway`, `Sidewalk`, `BicyclePath`, `BusBay`, `Platform`, `Barrier`, `NoiseScreen`, `DrainageElement`, `LightingElement`, `RoadSign`, `RoadMarking`, `UtilityAsset` | ewidencja obiektow terenowych |
| Administration | `AdministrativeUnit`, `RoadAuthority`, `MaintenanceDistrict`, `DictionaryEntry` | kontekst organizacyjny i slowniki |
| Editing | `Draft`, `DraftObject`, `ChangeSet`, `ConflictCase`, `ValidationIssue` | praca robocza i publikacja |
| Reporting | `ReportDefinition`, `ReportSnapshot`, `ReportLine`, `MapSheet` | materializacja raportow i map |
| Configuration | `LayerDefinition`, `LayerStylePolicy`, `FormDefinition`, `ColumnLayout`, `WorkspaceProfile` | sterowanie UI i zachowaniem warstw |
| Attachments | `Attachment`, `AttachmentLink`, `AttachmentCategory` | zalaczniki do obiektow, draftow i raportow |

### D.2 Wspolny model kazdego obiektu terenowego

Kazdy obiekt infrastrukturalny ma cztery aspekty:

| Aspekt | Co zawiera |
| --- | --- |
| Przestrzenny | geometria, SRID, typ geometrii, precision, bbox |
| Ewidencyjny | identyfikator biznesowy, klasyfikacja, status, zarzadca, daty obowiazywania |
| Raportowy | pola potrzebne do ksiazki drogi i map techniczno-eksploatacyjnych |
| Historyczny | kto zmienil, kiedy, z jakiego draftu, jaka byla poprzednia wersja |

### D.3 Wspolne atrybuty obiektow

| Pole | Znaczenie |
| --- | --- |
| `business_id` | stabilny identyfikator biznesowy GUID/UUID |
| `registry_number` | numer ewidencyjny obiektu w domenie |
| `object_type_code` | typ z katalogu slownikowego |
| `lifecycle_status` | `DRAFT`, `VALID`, `INVALID`, `CONFLICT`, `PUBLISHED`, `ARCHIVED`, `UNBOUND` |
| `reference_segment_id` | dowiazanie do odcinka referencyjnego |
| `chainage_from` / `chainage_to` | kilometraz poczatkowy i koncowy |
| `administrative_unit_id` | jednostka administracyjna |
| `maintenance_district_id` | rejon utrzymania |
| `geometry` | geometria SQL Server `geometry` |
| `valid_from` / `valid_to` | zakres obowiazywania danych publikowanych |
| `source_system` | pochodzenie rekordu |
| `last_validation_status` | wynik ostatniej walidacji |

### D.4 Encje systemu referencyjnego

| Encja | Typ geometrii | Kluczowe atrybuty | Relacje |
| --- | --- | --- | --- |
| `ReferenceAxis` | LineString | road_number, axis_code, direction | 1..n do `ReferenceSegment` |
| `ReferencePoint` | Point | chainage, marker_type, survey_accuracy | nalezy do `ReferenceAxis` |
| `ReferenceSegment` | LineString | chainage_from, chainage_to, measure_method | nalezy do `ReferenceAxis` |
| `SupportPoint` | Point | support_code, description | moze wspierac wiele dowiazan |
| `SupportSegment` | LineString | start_support_point_id, end_support_point_id | wspomaga model referencyjny |
| `ChainageMeasure` | brak / scalar | measure_value, source, confidence | odnosi sie do obiektu i segmentu |

### D.5 Encje drog i jezdni

| Encja | Typ geometrii | Uwagi domenowe |
| --- | --- | --- |
| `Road` | brak / logical | logiczna droga z numerem, klasa i zarzadca |
| `RoadSection` | LineString | podstawowa jednostka operacyjna dla odcinka drogi |
| `Carriageway` | Polygon lub LineString | jezdnia z kierunkiem i przekrojem |
| `Lane` | LineString lub Polygon | pas ruchu z numerem i funkcja |
| `Shoulder` | Polygon | pobocze utwardzone lub nieutwardzone |
| `MedianStrip` | Polygon | pas dzielacy |
| `RoadCrown` | Polygon | korona drogi |
| `RoadBelt` | Polygon | pas drogowy jako zakres wlasnosci i utrzymania |

### D.6 Encje obiektow infrastruktury

| Encja | Typ geometrii | Kluczowe pola raportowe |
| --- | --- | --- |
| `Intersection` | Point/Polygon | typ skrzyzowania, kategoria, sterowanie ruchem |
| `EngineeringStructure` | Point/Line/Polygon | nr obiektu, typ, nosnosc, swiatlo, stan |
| `Driveway` | LineString | kategoria, strona drogi, obsluga dzialki |
| `Sidewalk` | LineString/Polygon | szerokosc, nawierzchnia, dostepnosc |
| `BicyclePath` | LineString/Polygon | kierunkowosc, segregacja, nawierzchnia |
| `BusBay` | Polygon | typ zatoki, dlugosc uzytkowa |
| `Platform` | Polygon | nr stanowiska, typ peronu, dostepnosc |
| `Barrier` | LineString | typ bariery, poziom powstrzymywania |
| `NoiseScreen` | LineString/Polygon | wysokosc, dlugosc, material |
| `DrainageElement` | Point/Line | typ odwodnienia, srednica, odbiornik |
| `LightingElement` | Point | typ slupa, zasilanie, moc |
| `RoadSign` | Point | grupa znaku, tresc, strona drogi |
| `RoadMarking` | LineString/Polygon | rodzaj oznakowania, barwa, stan |
| `UtilityAsset` | Point/Line | typ uzbrojenia, gestor, relacja do pasa drogowego |

### D.7 Statusy i historia

#### Status obiektu

- `DRAFT` - zmiany tylko robocze
- `VALID` - przechodzi walidacje lokalna
- `INVALID` - ma bledy krytyczne
- `CONFLICT` - koliduje z innym draftem lub stanem publikowanym
- `PUBLISHED` - stan opublikowany
- `ARCHIVED` - obiekt historyczny
- `UNBOUND` - brak pelnego dowiazania do systemu referencyjnego

#### Status draftu

- `OPEN`
- `IN_REVIEW`
- `VALIDATED`
- `READY_TO_PUBLISH`
- `PUBLISHED`
- `REJECTED`
- `CANCELLED`

### D.8 Zalaczniki

`Attachment` moze byc dowiazany do:

- obiektu publikowanego,
- draftu,
- import job,
- raportu,
- wpisu walidacyjnego.

Minimalne pola:

- `attachment_id`,
- `file_name`,
- `file_extension`,
- `mime_type`,
- `storage_uri`,
- `checksum_sha256`,
- `attachment_category_code`,
- `uploaded_by`,
- `uploaded_at`.

### D.9 Dane raportowe i konfiguracja UI

| Encja | Cel |
| --- | --- |
| `ReportDefinition` | definicja raportu i jego parametrow |
| `ReportSnapshot` | stan danych na moment generacji |
| `MapSheet` | zakres mapy, skala, siatka arkuszy |
| `LayerDefinition` | opis warstw, zrodla, skal i uprawnien |
| `FormDefinition` | konfiguracja zakladek formularza i pol |
| `ColumnLayout` | konfiguracja tabel i presetow kolumn |
| `WorkspaceProfile` | preferencje uzytkownika dla layoutu i warstw |

### D.10 Kluczowe relacje domenowe

1. `Road` ma wiele `RoadSection`.
2. `RoadSection` moze miec wiele `Carriageway`, `Lane` i obiektow terenowych.
3. Kazdy obiekt raportowy musi miec powiazanie z `ReferenceSegment` lub uzasadniony status `UNBOUND`.
4. `Draft` agreguje wiele `DraftObject`.
5. `DraftObject` moze generowac wiele `ValidationIssue`.
6. `ReportSnapshot` jest budowany z opublikowanych rekordow i wskazuje wersje danych.

---

## Czesc E - Model bazy danych MS SQL

### E.1 Schematy

| Schemat | Przeznaczenie |
| --- | --- |
| `ref` | system referencyjny, kilometraz, punkty i odcinki |
| `road` | drogi, jezdnie, pasy, przekroje, pas drogowy |
| `asset` | obiekty infrastrukturalne |
| `edit` | drafty, zmiany, konflikty, walidacje |
| `report` | snapshoty raportowe i materializacja zestawien |
| `cfg` | konfiguracja warstw, formularzy, slownikow UI |
| `adm` | jednostki administracyjne, rejestry organizacyjne |
| `audit` | historia zmian, log operacji, security audit |
| `integ` | staging importow, mapowania i integracje |

### E.2 Wzorzec tabel publikowanych

Kazda tabela publikowana powinna miec minimum:

- klucz techniczny `id BIGINT IDENTITY`,
- klucz biznesowy `business_id UNIQUEIDENTIFIER`,
- status rekordowy,
- pola audytowe,
- pola obowiazywania czasowego,
- geometrie z kontrola SRID tam, gdzie to zasadne.

### E.3 Tabele glowne

| Tabela | Cel | PK | Kluczowe FK |
| --- | --- | --- | --- |
| `ref.reference_axis` | osie drog i kierunki referencyjne | `reference_axis_id` | `road_id` |
| `ref.reference_point` | pikiety i punkty referencyjne | `reference_point_id` | `reference_axis_id` |
| `ref.reference_segment` | odcinki referencyjne | `reference_segment_id` | `reference_axis_id` |
| `road.road` | logiczne drogi | `road_id` | `road_class_dict_id`, `road_authority_id` |
| `road.road_section` | odcinki drogowe | `road_section_id` | `road_id`, `reference_segment_id` |
| `road.carriageway` | jezdnie | `carriageway_id` | `road_section_id` |
| `road.lane` | pasy ruchu | `lane_id` | `carriageway_id` |
| `road.shoulder` | pobocza | `shoulder_id` | `road_section_id` |
| `road.road_belt` | pas drogowy | `road_belt_id` | `road_section_id` |
| `asset.intersection` | skrzyzowania | `intersection_id` | `road_section_id` |
| `asset.engineering_structure` | obiekty inzynierskie | `engineering_structure_id` | `road_section_id` |
| `asset.driveway` | zjazdy | `driveway_id` | `road_section_id` |
| `asset.sidewalk` | chodniki | `sidewalk_id` | `road_section_id` |
| `asset.bicycle_path` | sciezki rowerowe | `bicycle_path_id` | `road_section_id` |
| `asset.bus_bay` | zatoki | `bus_bay_id` | `road_section_id` |
| `asset.platform` | perony | `platform_id` | `road_section_id` |
| `asset.barrier` | bariery | `barrier_id` | `road_section_id` |
| `asset.noise_screen` | ekrany | `noise_screen_id` | `road_section_id` |
| `asset.drainage_element` | odwodnienie | `drainage_element_id` | `road_section_id` |
| `asset.lighting_element` | oswietlenie | `lighting_element_id` | `road_section_id` |
| `asset.road_sign` | oznakowanie pionowe | `road_sign_id` | `road_section_id` |
| `asset.road_marking` | oznakowanie poziome | `road_marking_id` | `road_section_id` |
| `asset.utility_asset` | uzbrojenie techniczne drogi | `utility_asset_id` | `road_section_id` |

### E.4 Tabele slownikowe

| Tabela | Cel |
| --- | --- |
| `adm.dictionary` | definicje slownikow |
| `adm.dictionary_entry` | wpisy slownikowe |
| `adm.administrative_unit` | wojewodztwa, powiaty, gminy, rejony |
| `adm.road_authority` | zarzadcy drog |
| `adm.maintenance_district` | rejony utrzymania |
| `cfg.object_type_definition` | katalog typow obiektow |
| `cfg.validation_rule_definition` | katalog regul walidacyjnych |
| `cfg.report_definition` | konfiguracja raportow |

### E.5 Tabele relacyjne

| Tabela | Cel |
| --- | --- |
| `asset.object_attachment_link` | powiazanie obiekt-zalacznik |
| `asset.object_reference_binding` | dowiazanie obiekt-system referencyjny |
| `asset.object_tag` | tagi i klasyfikacje dodatkowe |
| `cfg.layer_object_type` | powiazanie warstw z typami obiektow |
| `cfg.form_field_binding` | mapowanie pol formularza do atrybutow |
| `report.snapshot_object_link` | powiazanie snapshotu z rekordami zrodlowymi |

### E.6 Tabele historii i workflow

| Tabela | Cel |
| --- | --- |
| `edit.draft` | naglowek draftu |
| `edit.draft_object` | payload zmian dla obiektu |
| `edit.draft_relation` | zmiany relacji |
| `edit.conflict_case` | konflikty przy zapisie i publikacji |
| `edit.validation_issue` | bledy i ostrzezenia |
| `audit.change_log` | historia publikowanych zmian |
| `audit.entity_history` | snapshot zmiany encji lub payload diff |
| `audit.login_audit` | slady bezpieczenstwa |

### E.7 Tabele konfiguracji

| Tabela | Cel |
| --- | --- |
| `cfg.layer_definition` | definicja warstwy, typ, skale, zrodlo |
| `cfg.layer_style_profile` | styl i legenda warstwy |
| `cfg.workspace_profile` | layout i preferencje uzytkownika |
| `cfg.column_layout` | definicje kolumn tabelarycznych |
| `cfg.form_definition` | formularze i zakladki |
| `cfg.map_tool_permission` | uprawnienia do narzedzi mapowych |

### E.8 Klucze i indeksy

1. PK typu `BIGINT IDENTITY` dla wydajnych relacji wewnetrznych.
2. `UNIQUE NONCLUSTERED` na `business_id`.
3. `SPATIAL INDEX` na wszystkich tabelach z geometria publikowana i wybranych tabelach draftu.
4. Indeks zlozony dla wyszukiwania po kilometrazu:
   - `reference_segment_id`,
   - `chainage_from`,
   - `chainage_to`,
   - `lifecycle_status`.
5. Indeks filtrujacy dla rekordow aktywnych:
   - `WHERE archived_at IS NULL`.
6. Indeksy raportowe na:
   - `report_snapshot_id`,
   - `road_section_id`,
   - `administrative_unit_id`,
   - `published_at`.

### E.9 Zasady integralnosci

1. Obiekt terenowy bez geometrii jest dopuszczony tylko w staging lub draft przy imporcie specjalnym.
2. Rekord publikowany musi miec `reference_segment_id` lub status `UNBOUND` z uzasadnieniem.
3. `chainage_from` nie moze byc wieksze od `chainage_to`.
4. `valid_from` musi byc mniejsze od `valid_to`, chyba ze `valid_to` jest `NULL`.
5. Status `PUBLISHED` nie wystepuje w `edit.draft_object`.
6. Zalaczniki maja twarde FK do tabel lacznikowych, nie bezposrednio do wszystkich tabel domenowych.

### E.10 Zasady wersjonowania

#### Model publikowany

- tabele publikowane przechowuja stan aktualny,
- `audit.entity_history` przechowuje poprzedni payload oraz metadane zmiany,
- `valid_from` / `valid_to` wspieraja rekonstrukcje stanu raportowego.

#### Model draft

- `edit.draft` przechowuje kontener roboczy,
- `edit.draft_object` przechowuje:
  - `entity_type`,
  - `target_business_id`,
  - `action_type`,
  - `payload_json`,
  - `geometry`,
  - `validation_state`,
  - `conflict_state`.

### E.11 Przykladowy fizyczny DDL

```sql
CREATE TABLE ref.reference_segment (
    reference_segment_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    business_id UNIQUEIDENTIFIER NOT NULL,
    reference_axis_id BIGINT NOT NULL,
    segment_code NVARCHAR(100) NOT NULL,
    chainage_from DECIMAL(12,3) NOT NULL,
    chainage_to DECIMAL(12,3) NOT NULL,
    geometry_value geometry NOT NULL,
    srid INT NOT NULL CONSTRAINT CK_reference_segment_srid CHECK (srid = 2180),
    valid_from DATETIME2(0) NOT NULL,
    valid_to DATETIME2(0) NULL,
    created_at DATETIME2(0) NOT NULL,
    created_by NVARCHAR(100) NOT NULL,
    updated_at DATETIME2(0) NOT NULL,
    updated_by NVARCHAR(100) NOT NULL,
    CONSTRAINT UQ_reference_segment_business_id UNIQUE (business_id),
    CONSTRAINT FK_reference_segment_axis FOREIGN KEY (reference_axis_id)
        REFERENCES ref.reference_axis(reference_axis_id),
    CONSTRAINT CK_reference_segment_chainage CHECK (chainage_from <= chainage_to)
);
GO
CREATE SPATIAL INDEX SIX_reference_segment_geometry
ON ref.reference_segment(geometry_value);
```

```sql
CREATE TABLE road.road_section (
    road_section_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    business_id UNIQUEIDENTIFIER NOT NULL,
    road_id BIGINT NOT NULL,
    reference_segment_id BIGINT NULL,
    section_code NVARCHAR(100) NOT NULL,
    chainage_from DECIMAL(12,3) NOT NULL,
    chainage_to DECIMAL(12,3) NOT NULL,
    geometry_value geometry NOT NULL,
    lifecycle_status NVARCHAR(30) NOT NULL,
    administrative_unit_id BIGINT NOT NULL,
    maintenance_district_id BIGINT NOT NULL,
    valid_from DATETIME2(0) NOT NULL,
    valid_to DATETIME2(0) NULL,
    created_at DATETIME2(0) NOT NULL,
    created_by NVARCHAR(100) NOT NULL,
    updated_at DATETIME2(0) NOT NULL,
    updated_by NVARCHAR(100) NOT NULL,
    CONSTRAINT UQ_road_section_business_id UNIQUE (business_id),
    CONSTRAINT FK_road_section_road FOREIGN KEY (road_id) REFERENCES road.road(road_id),
    CONSTRAINT FK_road_section_reference_segment FOREIGN KEY (reference_segment_id)
        REFERENCES ref.reference_segment(reference_segment_id)
);
GO
CREATE INDEX IX_road_section_reference_chainage
ON road.road_section(reference_segment_id, chainage_from, chainage_to, lifecycle_status);
GO
CREATE SPATIAL INDEX SIX_road_section_geometry
ON road.road_section(geometry_value);
```

```sql
CREATE TABLE edit.draft_object (
    draft_object_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    draft_id BIGINT NOT NULL,
    entity_type NVARCHAR(100) NOT NULL,
    target_business_id UNIQUEIDENTIFIER NULL,
    action_type NVARCHAR(30) NOT NULL,
    payload_json NVARCHAR(MAX) NOT NULL,
    geometry_value geometry NULL,
    validation_state NVARCHAR(30) NOT NULL,
    conflict_state NVARCHAR(30) NOT NULL,
    created_at DATETIME2(0) NOT NULL,
    created_by NVARCHAR(100) NOT NULL,
    updated_at DATETIME2(0) NOT NULL,
    updated_by NVARCHAR(100) NOT NULL,
    CONSTRAINT FK_draft_object_draft FOREIGN KEY (draft_id) REFERENCES edit.draft(draft_id)
);
GO
CREATE INDEX IX_draft_object_draft_entity
ON edit.draft_object(draft_id, entity_type, action_type);
```

---

## Czesc F - Architektura backendu Java

### F.1 Moduly backendu

| Modul | Zakres |
| --- | --- |
| `reference` | punkty referencyjne, odcinki, chainage, wyszukiwanie po kilometrazu |
| `infrastructure` | road, road section, obiekty terenowe, read model i commands |
| `editing` | draft lifecycle, publish, conflicts, overlay |
| `validation` | atrybuty, topologia, kompletnosc raportowa |
| `importexport` | import parsers, staging, export generators |
| `reports` | report snapshot, ksiazka drogi, map sheets |
| `attachments` | metadata zalacznikow, storage, checksums |
| `common` | error model, paging, bbox query, enums, audit context |
| `config` | security, JDBC, GeoTools, OpenAPI, MVC |

### F.2 Warstwa API

Zasady:

1. REST dla operacji biznesowych i query ekranowych.
2. Dla ciezkich operacji asynchronicznych zwracany `202 Accepted` z identyfikatorem joba.
3. Dla mapy operacyjnej preferowane dedykowane endpointy query zamiast nadmiernego obciazania WFS.

Przykladowe endpointy:

| Metoda | Endpoint | Cel |
| --- | --- | --- |
| `GET` | `/api/v1/reference/segments` | lista odcinkow referencyjnych z filtrami |
| `GET` | `/api/v1/reference/locate` | wyszukiwanie obiektow po drodze i kilometrazu |
| `GET` | `/api/v1/road-sections` | lista odcinkow drogowych |
| `GET` | `/api/v1/road-sections/{businessId}` | detal odcinka |
| `POST` | `/api/v1/drafts` | utworzenie draftu |
| `POST` | `/api/v1/drafts/{draftId}/commands` | zapis commandu edycyjnego |
| `GET` | `/api/v1/drafts/{draftId}/validation-issues` | lista bledow draftu |
| `POST` | `/api/v1/drafts/{draftId}/publish` | publikacja draftu |
| `POST` | `/api/v1/import-jobs` | rozpoczecie importu |
| `GET` | `/api/v1/import-jobs/{jobId}` | status importu |
| `POST` | `/api/v1/reports/ksiazka-drogi` | uruchomienie raportu |
| `POST` | `/api/v1/reports/technical-map` | uruchomienie mapy raportowej |
| `GET` | `/api/v1/layers/workspace` | konfiguracja warstw i narzedzi dla uzytkownika |

### F.3 Warstwa uslug

| Serwis | Odpowiedzialnosc |
| --- | --- |
| `ReferenceLocationService` | locate by road number + chainage + side |
| `RoadSectionQueryService` | list/detail/filter odcinkow |
| `InfrastructureCommandService` | command model dla obiektow |
| `DraftLifecycleService` | create/open/save/submit/publish/cancel draft |
| `DraftOverlayService` | nakladanie zmian roboczych na read model |
| `ValidationOrchestrator` | uruchamianie pakietow walidacji |
| `TopologyValidationService` | relacje przestrzenne i geometrii |
| `ImportJobService` | staging, parser orchestration, import metrics |
| `ReportGenerationService` | snapshot + renderer raportu |
| `LayerWorkspaceService` | definicje warstw, stylow i uprawnien |
| `AuditService` | rejestrowanie zmian i operacji |

### F.4 Warstwa walidacji

Walidacje dziela sie na:

| Typ | Przyklady |
| --- | --- |
| Atrybutowa | wymagane pola, zakresy, formaty, slowniki |
| Referencyjna | dowiazanie do systemu referencyjnego, kilometraz, jednostka |
| Topologiczna | przeciecia, overshoot, gap, poza pasem drogowym, brak styku |
| Raportowa | kompletnosc pol do ksiazki drogi i mapy technicznej |
| Workflow | brak konfliktu, gotowosc draftu do publikacji |

### F.5 Warstwa GIS

Backend GIS nie zastepuje GeoServera. Odpowiada za:

- transformacje ukladow odniesienia przy imporcie i eksporcie,
- relacje przestrzenne wykorzystywane w walidacji,
- snap candidate search,
- pomiary geometrii potrzebne do raportowania,
- przygotowanie uproszczonych read modeli mapowych.

### F.6 Warstwa raportowania

Model:

1. `ReportDefinition` opisuje typ raportu.
2. `ReportSnapshotService` materializuje dane ze stanu publikowanego.
3. `DocumentRenderer` tworzy PDF/XLSX.
4. `MapCompositionService` sklada warstwy raportowe z GeoServera.

### F.7 Warstwa importu i eksportu

Import pipeline:

1. upload pliku,
2. metadata job,
3. parser formatu,
4. staging records,
5. walidacja schematu,
6. mapowanie do modelu domenowego,
7. zapis do draftu,
8. raport bledow.

Eksport pipeline:

1. query zakresu,
2. kontrola uprawnien,
3. serializacja do formatu,
4. zapis archiwum,
5. udostepnienie do pobrania.

### F.8 Wzorzec autoryzacji i audytu

#### Autoryzacja

- Spring Security jako resource server,
- zewnetrzny provider tozsamosci,
- role aplikacyjne:
  - `ROLE_GIS_EDITOR`,
  - `ROLE_GIS_REVIEWER`,
  - `ROLE_REPORT_USER`,
  - `ROLE_ADMIN`.

#### Audyt

Kazda operacja zapisu zapisuje:

- `who`,
- `when`,
- `draft_id`,
- `entity_type`,
- `target_business_id`,
- `action_type`,
- `before_payload`,
- `after_payload`.

### F.9 Przykladowe DTO

```java
package pl.gddkia.roadgis.infrastructure.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RoadSectionSummaryDto(
    UUID businessId,
    String roadNumber,
    String sectionCode,
    BigDecimal chainageFrom,
    BigDecimal chainageTo,
    String lifecycleStatus,
    String administrativeUnitName
) {}
```

```java
package pl.gddkia.roadgis.editing.api.dto;

import java.util.UUID;

public record DraftCommandDto(
    UUID targetBusinessId,
    String entityType,
    String actionType,
    String payloadJson,
    String geometryWkt
) {}
```

```java
package pl.gddkia.roadgis.validation.api.dto;

import java.util.UUID;

public record ValidationIssueDto(
    UUID issueId,
    String severity,
    String ruleCode,
    String entityType,
    UUID targetBusinessId,
    String message,
    String hint
) {}
```

### F.10 Przykladowe serwisy

```java
package pl.gddkia.roadgis.editing.application;

import java.util.UUID;
import pl.gddkia.roadgis.editing.api.dto.DraftCommandDto;

public interface DraftCommandService {
  UUID createDraft(String draftName);
  void applyCommand(UUID draftBusinessId, DraftCommandDto command);
  void publishDraft(UUID draftBusinessId);
}
```

```java
package pl.gddkia.roadgis.reference.application;

import java.math.BigDecimal;
import java.util.Optional;
import pl.gddkia.roadgis.reference.api.dto.ReferenceLocationDto;

public interface ReferenceLocationService {
  Optional<ReferenceLocationDto> locate(String roadNumber, BigDecimal chainage, String sideCode);
}
```

### F.11 Przykladowe use case'y

| Use case | Wejscie | Wynik |
| --- | --- | --- |
| `CreateDraftForRoadSectionEdit` | businessId odcinka, nazwa draftu | draft otwarty dla edycji |
| `SaveGeometryChange` | draftId, entityType, geometryWkt | rekord w `edit.draft_object` i walidacja |
| `ValidateDraftForPublish` | draftId | lista issue z rozroznieniem na error/warning |
| `PublishDraft` | draftId | stan opublikowany + wpisy historii |
| `GenerateRoadBook` | roadSectionId, date, format | job raportowy i plik wynikowy |

---

## Czesc G - Architektura frontendu Angular

### G.1 Moduly Angular

| Modul | Odpowiedzialnosc |
| --- | --- |
| `CoreModule` | auth, interceptory, runtime config, api clients |
| `ShellModule` | layout, ribbon, side panels, status bar |
| `MapModule` | OpenLayers map host, layers, interactions, measure tools |
| `StateModule` | workspace store, selection store, draft store |
| `DashboardFeatureModule` | pulpit startowy |
| `DataManagementFeatureModule` | glowny widok operacyjny |
| `ObjectEditorFeatureModule` | formularze domenowe |
| `ReferenceBindingFeatureModule` | powiazania referencyjne i locate |
| `ImportFeatureModule` | import wizard i job monitor |
| `ValidationFeatureModule` | panel issue i topologia |
| `ReportsFeatureModule` | uruchamianie i przeglad raportow |
| `AdministrationFeatureModule` | slowniki i konfiguracja |

### G.2 Glowne komponenty

| Komponent | Cel |
| --- | --- |
| `app-shell-layout` | glowny layout z dockingiem |
| `app-ribbon-bar` | zakladki `Start`, `Edycja`, `Widok`, `Walidacja`, `Raporty` |
| `app-layer-tree` | drzewo warstw, widocznosc, legenda |
| `app-map-canvas` | host OpenLayers |
| `app-data-grid` | tabela z wirtualizacja i presetami |
| `app-object-form-panel` | formularz boczny lub dolny |
| `app-validation-panel` | lista bledow i ostrzezen |
| `app-status-bar` | skala, uklad, status draftu, liczba selekcji |
| `app-import-wizard` | import krokowy |
| `app-report-runner` | uruchamianie raportu i status |

### G.3 Serwisy

| Serwis | Cel |
| --- | --- |
| `WorkspaceService` | kontekst widoku, layout, aktywna karta |
| `SelectionCoordinatorService` | synchronizacja mapa/tabela/formularz |
| `DraftService` | create/save/finalize draft |
| `MapService` | lifecycle mapy i tool state |
| `LayerCatalogService` | konfiguracja warstw i legenda |
| `DataQueryService` | filtrowanie i listy obiektow |
| `ObjectFormService` | schema formularza, dirty state, validation mapping |
| `ValidationService` | issue list, severity filters, focus on object |
| `ImportJobService` | uploady, polling, retry |
| `ReportService` | start report, status, download |

### G.4 Modele TypeScript

| Model | Cel |
| --- | --- |
| `WorkspaceState` | aktywna warstwa, selection, current draft, layout |
| `LayerViewModel` | drzewo warstw i widocznosc |
| `FeatureSelection` | lista zaznaczonych obiektow |
| `RoadSectionViewModel` | widok tabelaryczny odcinka |
| `ObjectFormModel` | stan formularza i zakladek |
| `ValidationIssueViewModel` | issue dla panelu walidacji |
| `DraftSummary` | status draftu i liczba zmian |
| `ReportJobViewModel` | status generacji raportu |

### G.5 Routing

```text
/
|- dashboard
|- data-management
|- object-editor/:entityType/:businessId
|- reference-binding
|- import
|- validation
|- reports
|- administration
```

### G.6 Stan aplikacji

Zalozenie projektowe:

Na starcie rekomendowany jest store oparty o Angular Signals + lekkie serwisy stanowe, bez dodatkowego globalnego frameworka. Powody:

- mniejsza zlozonosc foundation,
- latwiejsza izolacja feature modules,
- dobra kontrola nad lokalnym i wspoldzielonym stanem widoku.

Glowne store:

- `workspace.store.ts`,
- `selection.store.ts`,
- `draft.store.ts`,
- `validation.store.ts`,
- `layer.store.ts`.

### G.7 Integracja OpenLayers

1. Map host inicjalizuje mape, view, basemap i overlay layers.
2. Warstwy publikacyjne:
   - WMS/WMTS dla duzych wolumenow,
   - WFS lub REST vector source dla obiektow edycyjnych.
3. Warstwa draftu jest renderowana osobno, z kolorami statusow.
4. Interakcje:
   - select,
   - modify,
   - draw,
   - snap,
   - translate,
   - split,
   - measure.

### G.8 Wzorce formularzy PrimeNG

1. Formularze sekcyjne z zakladkami:
   - dane podstawowe,
   - referencja,
   - geometria,
   - zalaczniki,
   - historia,
   - walidacja.
2. Pola slownikowe jako `p-dropdown`, `p-multiselect`, `p-autocomplete`.
3. Walidacje inline + summary panel.
4. Dirty state widoczny na poziomie pola, zakladki i calego formularza.

### G.9 Wzorce tabel

1. `p-table` z lazy loading i server-side filtering.
2. Wirtualizacja i ograniczona liczba renderowanych wierszy.
3. Presety kolumn zapisane w `cfg.column_layout`.
4. Multi-select z akcjami zbiorczymi w ribbonie.

### G.10 Wzorce paneli i ribbona

Ribbon powinien zachowywac sie jak aplikacja desktopowa:

- zakladki zalezne od kontekstu,
- grupy akcji z ikonami i labelami,
- disabled state zgodny z uprawnieniami i statusem draftu,
- hotkeys dla kluczowych akcji.

### G.11 Mechanizmy walidacji i komunikatow

| Mechanizm | Zastosowanie |
| --- | --- |
| Inline field error | blad pola formularza |
| Row marker | blad na wierszu tabeli |
| Feature highlight | problem wskazany na mapie |
| Validation panel | lista issue i nawigacja do obiektu |
| Status badge | stany `draft`, `invalid`, `conflict`, `archived` |
| Toast | wynik akcji technicznej lub krotszej operacji |
| Blocking dialog | publikacja, operacja zbiorcza, konflikt |

---

## Czesc H - Glowne ekrany systemu

### H.1 Pulpit roboczy

| Obszar | Opis |
| --- | --- |
| Layout | kafle startowe, lista ostatnich draftow, raporty oczekujace, alerty walidacyjne |
| Komponenty | `dashboard-summary`, `draft-list`, `report-queue`, `system-alerts` |
| Akcje uzytkownika | otwarcie draftu, przejscie do zarzadzania danymi, wznowienie raportu |
| Wywolania systemowe | `GET /dashboard/summary`, `GET /drafts/recent`, `GET /reports/jobs` |
| Stany wyjatkowe | brak uprawnien do wybranego modulu, niedostepne joby raportowe |

### H.2 Tryb zarzadzania danymi

| Obszar | Opis |
| --- | --- |
| Layout | ribbon + lewy panel warstw + mapa + dolna tabela + prawy formularz + dolny panel walidacji |
| Komponenty | `app-ribbon-bar`, `app-layer-tree`, `app-map-canvas`, `app-data-grid`, `app-object-form-panel`, `app-validation-panel`, `app-status-bar` |
| Akcje uzytkownika | selekcja, rysowanie, filtrowanie, operacje zbiorcze, save draft, publish |
| Wywolania systemowe | query list, detail, draft commands, validation issues, workspace config |
| Stany wyjatkowe | konflikt zmian, zbyt duza liczba obiektow, brak dowiazania, blad topologii |

### H.3 Edycja obiektu

| Obszar | Opis |
| --- | --- |
| Layout | formularz pelnoekranowy lub w panelu bocznym z zakladkami |
| Komponenty | `object-header`, `object-tabs`, `reference-card`, `attachment-grid`, `history-list` |
| Akcje uzytkownika | zmiana atrybutow, podglad historii, dodanie zalacznika |
| Wywolania systemowe | `GET detail`, `GET history`, `POST attachment`, `POST draft command` |
| Stany wyjatkowe | obiekt zarchiwizowany, brak blokady draftu, niedostepny zalacznik |

### H.4 Dowiazanie do systemu referencyjnego

| Obszar | Opis |
| --- | --- |
| Layout | formularz locate + wynik na mapie + panel proponowanych referencji |
| Komponenty | `reference-search-form`, `reference-result-grid`, `map-highlight`, `binding-summary` |
| Akcje uzytkownika | wyszukanie po drodze i kilometrazu, zaakceptowanie dowiazania |
| Wywolania systemowe | `GET /reference/locate`, `POST /drafts/{id}/commands` |
| Stany wyjatkowe | wiele mozliwych dopasowan, brak dopasowania, poza zakresem kilometraza |

### H.5 Import danych

| Obszar | Opis |
| --- | --- |
| Layout | wizard krokowy: plik, mapowanie, walidacja, wynik |
| Komponenty | `import-file-step`, `import-mapping-step`, `import-validation-step`, `import-summary-step` |
| Akcje uzytkownika | upload, mapowanie kolumn, uruchomienie importu do draftu |
| Wywolania systemowe | `POST /import-jobs`, `GET /import-jobs/{id}`, `GET /import-jobs/{id}/issues` |
| Stany wyjatkowe | zly format, nieznany SRID, brak wymaganych kolumn |

### H.6 Walidacja i kontrola topologii

| Obszar | Opis |
| --- | --- |
| Layout | lista issue, filtry, mapa z highlightem, podglad reguly |
| Komponenty | `validation-issue-grid`, `severity-filter`, `rule-help-panel`, `map-focus-toolbar` |
| Akcje uzytkownika | filtrowanie bledow, przejscie do obiektu, oznaczenie do poprawy |
| Wywolania systemowe | `GET /drafts/{id}/validation-issues`, `POST /drafts/{id}/validate` |
| Stany wyjatkowe | issue dla obiektu usunietego z draftu, timeout ciezkiej walidacji |

### H.7 Raporty i eksporty

| Obszar | Opis |
| --- | --- |
| Layout | formularz raportu, kolejka dokumentow, historia pobran |
| Komponenty | `report-form`, `report-job-table`, `download-list`, `map-preview` |
| Akcje uzytkownika | uruchomienie raportu, pobranie pliku, wznowienie eksportu |
| Wywolania systemowe | `POST /reports/*`, `GET /reports/jobs/{id}`, `GET /exports/{id}/download` |
| Stany wyjatkowe | raport bez kompletnych danych, brak danych w zakresie |

### H.8 Administracja

| Obszar | Opis |
| --- | --- |
| Layout | zakladki slownikow, warstw, formularzy, rol i monitoringu |
| Komponenty | `dictionary-admin`, `layer-config-grid`, `form-layout-editor`, `permission-matrix` |
| Akcje uzytkownika | edycja slownikow, aktywacja warstw, konfiguracja layoutu |
| Wywolania systemowe | `GET/PUT /admin/*`, `GET /layers/config` |
| Stany wyjatkowe | konflikt konfiguracji, brak uprawnien administratora |

---

## Czesc I - Szczegolowa specyfikacja ekranu trybu zarzadzania danymi

### I.1 Cel ekranu

Ekran ma byc glownym operacyjnym miejscem pracy. Uzytkownik musi moc w jednym widoku:

- przegladac obiekty na mapie,
- filtrowac i porzadkowac je tabelarycznie,
- edytowac atrybuty i geometrie,
- obserwowac walidacje,
- pracowac na wielu obiektach jednoczesnie,
- zapisac stan roboczy albo wykonac zapis finalny.

### I.2 Layout

```text
+----------------------------------------------------------------------------------+
| Ribbon / toolbar                                                                 |
+-------------------------+--------------------------------------+-----------------+
| Layer tree + filters    | Operational map                      | Object form     |
|                         |                                      |                 |
|                         |                                      |                 |
+-------------------------+--------------------------------------+-----------------+
| Data table with tabs, presets, server filters and bulk actions                    |
+----------------------------------------------------+-----------------------------+
| Validation panel                                    | Status bar                  |
+----------------------------------------------------+-----------------------------+
```

### I.3 Ribbon / toolbar

Zakladki ribbona:

| Zakladka | Grupy akcji |
| --- | --- |
| `Start` | odswiez, zapisz workspace, eksport widoku, wybierz preset |
| `Edycja` | nowy obiekt, kopiuj, usun, split, merge, snap, przenies do draftu |
| `Referencja` | locate, dowiazanie, przeliczenie kilometraza |
| `Walidacja` | uruchom walidacje, pokaz tylko bledy, pokaz konflikty |
| `Raporty` | ksiazka drogi, mapa techniczna, eksport zaznaczenia |
| `Widok` | widocznosc paneli, reset layoutu, skala, etykiety |

Zasady:

1. Akcje sa kontekstowe dla aktywnej warstwy i zaznaczenia.
2. Operacje nieaktywne maja tooltip z wyjasnieniem blokady.
3. Dla operacji destrukcyjnych lub publikacyjnych wymagany jest dialog potwierdzenia.

### I.4 Drzewo warstw

Funkcje:

- grupowanie warstw: referencyjne, drogowe, obiekty, robocze, walidacyjne, raportowe,
- checkbox widocznosci,
- wybor warstwy aktywnej,
- legenda wierszowa,
- filtr tekstowy,
- preset skali i renderingu,
- oznaczenie warstw tylko do podgladu vs warstw edycyjnych.

Zasada:

- warstwa edycyjna jest zawsze jedna aktywna na raz,
- warstwy widokowe moga byc wielokrotnie wlaczone,
- warstwa draft overlay ma wyzszy priorytet renderowania od warstwy publikowanej.

### I.5 Mapa

Funkcje mapy:

- pan/zoom,
- box select,
- click select,
- hover highlight,
- draw point/line/polygon,
- modify geometry,
- snap do aktywnych warstw referencyjnych i roboczych,
- split, merge, copy geometry from existing,
- measure,
- locate by chainage.

Zasady:

1. Selekcja jednokrotna otwiera formularz.
2. Selekcja wielokrotna otwiera tryb operacji zbiorczych i podsumowanie.
3. Przy duzej liczbie obiektow mapa przechodzi na styl uproszczony lub odczyt raster/WMS.
4. Draft overlay wyswietla:
   - nowy obiekt: kolor zielony,
   - zmieniony: kolor niebieski,
   - konflikt: kolor pomaranczowy,
   - blad krytyczny: kolor czerwony,
   - archiwizacja: styl przerywany.

### I.6 Tabela danych

Funkcje:

- preset kolumn dla typu obiektu,
- lazy loading,
- filtrowanie po polach biznesowych,
- sortowanie,
- grouping opcjonalny,
- multi-select,
- row status badges,
- eksport zaznaczonych rekordow.

Zasady:

1. Tabela dziala na aktywnej warstwie lub aktywnym typie obiektu.
2. Selekcja w tabeli synchronizuje highlight na mapie.
3. Filtry tabeli moga ograniczac dane renderowane na mapie, ale tylko w warstwie roboczej.

### I.7 Formularz boczny lub dolny

Zakladki:

- Dane podstawowe
- Referencja
- Geometria
- Relacje
- Zalaczniki
- Historia
- Walidacja

Zasady:

1. Formularz musi obslugiwac stan `dirty`.
2. Zmiana aktywnego obiektu przy niezapisanych zmianach uruchamia `save draft` lub `discard` dialog.
3. Pola raportowe maja osobna sekcje z kontrola kompletnosci pod ksiazke drogi i mape techniczna.

### I.8 Panel walidacji

Funkcje:

- lista issue dla calego draftu lub aktywnej selekcji,
- filtrowanie po severity, regule, typie obiektu,
- przejscie do mapy, tabeli i formularza,
- grupowanie po obiekcie lub regule.

Severity:

- `ERROR`
- `WARNING`
- `INFO`

### I.9 Pasek statusu

Pola statusu:

- aktywny draft,
- liczba zaznaczonych obiektow,
- aktywna skala mapy,
- SRID,
- stan walidacji,
- stan synchronizacji,
- liczba obiektow w widoku,
- status locka i konfliktow.

### I.10 Synchronizacja zaznaczen

Reguly:

1. Mapa -> tabela: zaznaczenie obiektu centruje i podswietla wiersz.
2. Tabela -> mapa: zaznaczenie wiersza centruje obiekt opcjonalnie i highlightuje feature.
3. Formularz zmienia aktywny obiekt w `SelectionCoordinatorService`.
4. Operacje zbiorcze dzialaja na wspolnym zbiorze selection IDs.

### I.11 Operacje zbiorcze

Zakres:

- przypisanie wartosci slownikowej,
- zmiana jednostki utrzymaniowej,
- masowe dowiazanie do odcinka referencyjnego,
- oznaczenie do archiwizacji,
- eksport zaznaczonych,
- uruchomienie walidacji dla selekcji.

Warunki:

- musza byc jawnie potwierdzone,
- musza generowac preview zmian,
- musza trafic do jednego draftu lub wskazanego draftu.

### I.12 Zapis roboczy

Model:

1. Kazda zmiana formularza lub geometrii tworzy command.
2. Autosave moze byc wlaczony dla lekkich zmian, ale zawsze zapisuje do draftu.
3. Uzytkownik moze wykonac jawne `Zapisz roboczo`.
4. Widok pokazuje znacznik `Zapisano do draftu`.

### I.13 Zapis finalny

Model:

1. `Zapis finalny` uruchamia pelna walidacje.
2. Przy bledach krytycznych publikacja jest blokowana.
3. Przy ostrzezeniach uzytkownik z odpowiednia rola moze kontynuowac tylko jesli polityka to dopuszcza.
4. Po sukcesie draft uzyskuje status `PUBLISHED`, a ekran odswieza overlay i historie.

### I.14 Konflikty zmian

Typy konfliktow:

- ten sam obiekt zmieniony w innym drafcie,
- zmiana publikowanego stanu po otwarciu aktualnego draftu,
- konflikt geometrii po split/merge,
- konflikt referencyjny po zmianie segmentu bazowego.

Obsluga:

- dialog konfliktu,
- porownanie stanu `published` vs `my draft` vs `other draft`,
- decyzja: nadpisz, scal recznie, odrzuc, oznacz do review.

### I.15 Warstwy widokowe i edycyjne

| Typ warstwy | Zachowanie |
| --- | --- |
| Widokowa | tylko odczyt, zwykle WMS/WMTS |
| Ewidencyjna | odczyt + query backend, moze byc aktywowana do edycji |
| Draft overlay | lokalna/REST vector warstwa robocza |
| Walidacyjna | problem markers i zasiegi issue |
| Raportowa | podglad kompozycji map i arkuszy |

### I.16 Zachowanie zalezne od skali

| Skala | Zachowanie |
| --- | --- |
| > 1:100000 | tylko drogi, odcinki referencyjne, granice jednostek |
| 1:25000 - 1:100000 | jezdnie, skrzyzowania, duze obiekty, ograniczone etykiety |
| 1:5000 - 1:25000 | pasy ruchu, bariery, oswietlenie, oznakowanie liniowe |
| < 1:5000 | detale techniczne, snapping, etykiety obiektowe, operacje geometrii |

### I.17 Zachowanie dla duzej liczby obiektow

1. Lista i mapa sa queryowane po bbox, typie obiektu i filtrowaniu server-side.
2. WFS lub REST vector jest ograniczony tylko do aktywnej warstwy i skali roboczej.
3. Dla bardzo duzych warstw stosowany jest WMS/WMTS i query szczegolu po kliknieciu.
4. Tabela korzysta z lazy loading i presetow kolumn.

### I.18 Lista komponentow frontendowych

- `data-management-page`
- `ribbon-tab-group`
- `layer-tree-panel`
- `layer-legend-item`
- `map-toolbar`
- `map-canvas`
- `selection-summary-bar`
- `data-grid`
- `grid-filter-row`
- `object-form-panel`
- `object-form-tabs`
- `reference-binding-card`
- `attachment-panel`
- `validation-panel`
- `status-bar`
- `conflict-resolution-dialog`
- `bulk-edit-dialog`
- `publish-summary-dialog`

### I.19 Lista eventow

- `ACTIVE_LAYER_CHANGED`
- `MAP_FEATURE_SELECTED`
- `GRID_ROW_SELECTED`
- `SELECTION_SET_CHANGED`
- `FORM_DIRTY_CHANGED`
- `DRAFT_SAVED`
- `VALIDATION_REQUESTED`
- `VALIDATION_COMPLETED`
- `PUBLISH_REQUESTED`
- `PUBLISH_COMPLETED`
- `CONFLICT_DETECTED`
- `LAYOUT_PANEL_TOGGLED`
- `MAP_SCALE_CHANGED`
- `BULK_EDIT_CONFIRMED`

### I.20 Lista API calls

| Wywolanie | Cel |
| --- | --- |
| `GET /api/v1/layers/workspace` | konfiguracja warstw i narzedzi |
| `GET /api/v1/road-sections` | lista dla tabeli |
| `GET /api/v1/road-sections/{businessId}` | detal obiektu |
| `GET /api/v1/query/features` | query aktywnej warstwy po bbox/filters |
| `POST /api/v1/drafts` | utworzenie draftu |
| `POST /api/v1/drafts/{draftId}/commands` | zapis komendy |
| `POST /api/v1/drafts/{draftId}/validate` | uruchomienie walidacji |
| `GET /api/v1/drafts/{draftId}/validation-issues` | panel issue |
| `POST /api/v1/drafts/{draftId}/publish` | publikacja |
| `GET /api/v1/reference/locate` | locate dla kilometraza |
| `GET /api/v1/history/{entityType}/{businessId}` | historia obiektu |
| `POST /api/v1/attachments` | upload zalacznika |

### I.21 Lista tabel i encji wykorzystywanych przez widok

Publikowane:

- `road.road_section`
- `road.carriageway`
- `road.lane`
- `road.road_belt`
- `asset.*`
- `ref.reference_segment`
- `cfg.layer_definition`
- `cfg.column_layout`
- `cfg.form_definition`

Robocze i kontrolne:

- `edit.draft`
- `edit.draft_object`
- `edit.validation_issue`
- `edit.conflict_case`
- `audit.entity_history`

Encje backendowe:

- `RoadSection`
- `InfrastructureObject`
- `Draft`
- `DraftObject`
- `ValidationIssue`
- `LayerDefinition`
- `WorkspaceProfile`

---

## Czesc J - Procesy uzytkownika

### J.1 Dodanie obiektu

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| wybiera typ obiektu | ribbon aktywuje narzedzia rysowania | brak | sprawdzenie uprawnien lokalnie | aktywna warstwa edycyjna |
| rysuje geometrie | mapa pokazuje preview | `POST draft command` create | lekka walidacja geometrii | obiekt w drafcie |
| uzupelnia formularz | formularz oznacza pola wymagane | zapis payload do draftu | wymagane pola, slowniki | rekord roboczy gotowy do dalszej edycji |

### J.2 Edycja obiektu

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| zaznacza obiekt | highlight + otwarcie formularza | pobranie detalu | brak | obiekt aktywny |
| zmienia pole lub geometrie | dirty state + preview | zapis do draftu | walidacja pola / geometrii | zmiana w overlay draftu |
| uruchamia save roboczy | status bar pokazuje sukces | utrwalenie draftu | brak dodatkowej pelnej walidacji | zmiany bezpiecznie zapisane |

### J.3 Archiwizacja

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| wybiera obiekt lub selekcje | aktywuje akcje zbiorcze | brak | sprawdzenie roli | mozna uruchomic archiwizacje |
| wybiera `Archiwizuj` | dialog z uzasadnieniem | command `ARCHIVE` do draftu | czy obiekt nie jest zaleznoscia krytyczna | status `ARCHIVED` po publikacji |

### J.4 Import

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| upload pliku | wizard przechodzi do mapowania | tworzy import job i staging | format, rozmiar, MIME | job importu uruchomiony |
| mapuje kolumny | podglad zgodnosci | zapis mapowania | wymagane pola i SRID | gotowosc do przetwarzania |
| uruchamia import | progress + log bledow | parser + staging + draft save | schema, domena, topologia | rekordy w drafcie i raport bledow |

### J.5 Nadanie warstwy

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| admin wybiera typ obiektu | formularz warstwy | odczyt definicji | brak | konfiguracja otwarta |
| przypisuje warstwe | preview legendy i skali | zapis `cfg.layer_definition` | unikalnosc kodu warstwy | obiekty widoczne w wybranej warstwie |

### J.6 Masowe przypisanie wartosci

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| zaznacza wiele obiektow | summary selection | brak | sprawdzenie czy typy sa zgodne | zbior gotowy |
| wybiera pole i wartosc | bulk edit dialog | command batch do draftu | zgodnosc typu i slownika | wiele rekordow zaktualizowanych roboczo |

### J.7 Dowiazanie do systemu referencyjnego

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| uruchamia locate | formularz referencji | query locate | poprawny road number i chainage | lista kandydatow |
| wybiera segment | mapa centruje i pokazuje relacje | zapis commandu bind | kontrola zakresu chainage | obiekt dowiazany |

### J.8 Podzial obiektu

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| wybiera narzedzie split | mapa pokazuje punkt ciecia | brak | poprawny typ geometrii | narzedzie aktywne |
| zatwierdza podzial | preview dwoch geometrii | draft command `SPLIT` | geometria wynikowa, ciaglosc, chainage | dwa obiekty robocze do uzupelnienia |

### J.9 Walidacja topologiczna

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| uruchamia walidacje | progress panel | odpalenie `ValidationOrchestrator` | pelen pakiet topologii | lista issue |
| wybiera issue | focus na mapie i formularzu | pobranie kontekstu issue | brak | uzytkownik przechodzi do naprawy |

### J.10 Zapis roboczy

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| klika `Zapisz roboczo` | spinner + badge saved | commit draft metadata | tylko poprawnosc techniczna | draft zachowany |

### J.11 Zapis finalny

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| klika `Zapis finalny` | publish summary dialog | lock draft + full validation | atrybuty, referencja, topologia, raporty | decyzja publikacyjna |
| potwierdza publikacje | progress + blokada UI | promote do tabel publikowanych + audit | brak bledow krytycznych | dane opublikowane |

### J.12 Generowanie raportow

| Krok uzytkownika | Reakcja UI | Reakcja backendu | Walidacja | Rezultat |
| --- | --- | --- | --- | --- |
| wybiera typ raportu i zakres | formularz raportu | create report job | komplet danych i uprawnienia | job raportowy |
| pobiera wynik | kolejka dokumentow pokazuje ready | storage fetch | integralnosc pliku | PDF/XLSX/GeoJSON gotowy |

---

## Czesc K - GIS i realizm mapy

### K.1 Stylizacja warstw

1. Drogi i odcinki:
   - kolor zalezy od klasy drogi,
   - grubosc linii rosnie wraz ze szczegolowoscia skali.
2. Jezdnie i pasy:
   - widoczne od skal roboczych,
   - z zachowaniem kierunkowosci i oznaczen.
3. Bariery, ekrany, odwodnienie, oswietlenie:
   - symbole zblizone do standardow technicznych,
   - kolory statusowe nie moga zacierac znaczenia obiektu.
4. Draft overlay:
   - osobne style dla create/update/delete/conflict/error.

### K.2 Poziomy generalizacji

| Zakres | Regula |
| --- | --- |
| przeglad krajowy | tylko klasy drog i glowne osie |
| przeglad rejonowy | odcinki, obiekty duze, skrzyzowania |
| praca operacyjna | szczegoly pasa drogowego i obiekty techniczne |

### K.3 Etykiety

1. Etykiety sa wlaczane dopiero po przekroczeniu progu skali.
2. Priorytet etykiet:
   - droga,
   - odcinek,
   - obiekt inzynierski,
   - wybrane obiekty techniczne.
3. Przy konflikcie etykiet preferowany jest mniejszy szum, nie pelna kompletnosc.

### K.4 Skalozaleznosc

Warstwy musza miec `minScale` i `maxScale` w `cfg.layer_definition`, a GeoServer powinien miec odpowiadajace reguly stylu.

### K.5 Snapping

Typy snappingu:

- vertex snap,
- edge snap,
- reference line snap,
- chainage snap do punktow referencyjnych.

Zasady:

1. Snapping jest aktywny tylko dla zgodnych klas geometrii.
2. Mozna ograniczyc snapping do aktywnej warstwy, warstw referencyjnych albo wszystkich edycyjnych.

### K.6 Highlight i selekcja

1. Hover highlight jest chwilowy.
2. Selection highlight jest trwaly do zmiany selekcji.
3. Dla multi-select stosowany jest kolor grupy + licznik.

### K.7 Geometria punktowa / liniowa / powierzchniowa

| Typ | Przyklady |
| --- | --- |
| Punktowa | znaki, slupy oswietleniowe, punkty referencyjne |
| Liniowa | bariery, sciezki, chodniki, rowy, oznakowanie liniowe |
| Powierzchniowa | pas drogowy, zatoki, perony, korona drogi |

### K.8 Relacje przestrzenne

Reguly przykladowe:

1. `Lane` musi zawierac sie w `Carriageway`.
2. `Carriageway` musi przecinac lub przylegac do `RoadSection`.
3. `Barrier` i `NoiseScreen` powinny przebiegac w poblizu `RoadBelt`.
4. `BusBay` i `Platform` powinny byc powiazane przestrzennie.
5. `RoadSign` musi miec strone drogi i relacje do osi lub jezdni.

### K.9 Wymagania dla map techniczno-eksploatacyjnych

- odwzorowanie obiektow zgodnie z rzeczywista funkcja drogowa,
- czytelna legenda i skala,
- mozliwosc generacji arkuszy,
- wydruk z tytulem, zakresem, data publikacji i wersja danych,
- warstwy raportowe bez elementow roboczych draftu.

### K.10 Wymagania dla danych do ksiazki drogi

- komplet pol ewidencyjnych,
- identyfikacja odcinka i kilometraza,
- stan techniczny i kategoria obiektu,
- historia kluczowych zmian,
- powiazanie z zalacznikami i dokumentami dowodowymi.

---

## Czesc L - Formaty, importy, eksporty

| Format | Zastosowanie | Miejsce walidacji | Ograniczenia | Obsluga bledow |
| --- | --- | --- | --- | --- |
| SHP | import masowych warstw GIS | backend staging + parser + walidacja SRID | brak wsparcia dla zlozonych typow i dlugich nazw kolumn | raport bledow geometrii i mapowania kolumn |
| GML | wymiana danych przestrzennych i urzedowych | backend parser schematu + domena | wysoka wrazliwosc na schemy i namespaces | szczegolowy log parsera i odrzucone rekordy |
| GeoJSON | szybki import/eksport roboczy i API | backend + frontend preview | brak natywnej precyzji kilometraza i metadata enterprise | lista rekordow z bledami i eksport raportu |
| DWG | import danych projektowych CAD | backend adapter importu | wymaga mapowania warstw CAD do domeny GIS | blad warstwy, brak geometrii, brak SRID |
| DXF | import uproszczonych rysunkow CAD | backend adapter importu | brak jednolitych atrybutow biznesowych | staging z ostrzezeniami i mapowaniem recznym |
| CSV | import slownikowy i tabelaryczny | frontend mapowanie + backend walidacja | brak geometrii bez kolumn pomocniczych | raport brakujacych kolumn i slownikow |
| XLSX | import raportowy lub slownikowy | frontend wizard + backend parser | struktura zalezy od arkuszy i naglowkow | raport niezgodnych arkuszy i typow danych |
| PDF | eksport raportow i wydrukow map | backend renderer | brak round-trip do edycji | log joba i powtorzenie generacji |

Zalozenie projektowe:

Formaty DWG i DXF powinny byc dostepne od iteracji rozszerzonej, nie w MVP foundation. W pierwszej wartosci biznesowej wystarcza GeoJSON, CSV i XLSX oraz eksport PDF/XLSX.

---

## Czesc M - Plan realizacji w Codex

### M.1 Iteracja analityczna

| Pole | Zawartosc |
| --- | --- |
| Cel | domknac dokumenty domenowe, system referencyjny, katalog obiektow i raporty |
| Pliki do utworzenia | `docs/delivery/codex-execution-package.md`, `docs/domain/reference-system-rules.md` rozszerzenie, `docs/reports/*.md` rozszerzenie |
| Pliki do modyfikacji | `docs/domain/domain-model.md`, `docs/architecture/system-overview.md`, `docs/delivery/backlog.md` |
| Oczekiwany rezultat | spojny pakiet decyzji i backlog |
| Ryzyka | zbyt szeroki zakres modelu obiektow, niejednoznaczne nazwy domenowe |
| Kryteria review | jednoznaczne terminy, rozdzial odpowiedzialnosci, brak pustych sekcji |

### M.2 Iteracja architektury

| Pole | Zawartosc |
| --- | --- |
| Cel | zbudowac kontrakt architektoniczny dla backend/fronted/GeoServer/MS SQL |
| Pliki do utworzenia | `docs/architecture/context-diagram.md`, `docs/architecture/container-diagram.md`, `docs/adr/0003-gis-service-boundary.md`, `docs/adr/0004-draft-versioning-model.md` doprecyzowanie |
| Pliki do modyfikacji | `backend/pom.xml`, `frontend/package.json`, `infra/compose/*`, `geoserver/README.md` |
| Oczekiwany rezultat | foundation techniczny i zasady integracji |
| Ryzyka | zbyt szybkie wejscie w implementacje bez kontraktow API |
| Kryteria review | ADR-y sa konkretne, runtime odpowiedzialnosci nie nakladaja sie |

### M.3 Iteracja modelu danych

| Pole | Zawartosc |
| --- | --- |
| Cel | wdrozyc pierwsze migracje `ref`, `road`, `edit` |
| Pliki do utworzenia | `db/mssql/migrations/V001__init_reference.sql`, `db/mssql/migrations/V002__init_road.sql`, `db/mssql/migrations/V003__init_editing.sql`, `db/mssql/tables/*.sql` |
| Pliki do modyfikacji | `backend/src/main/resources/application.yml`, `db/README.md` |
| Oczekiwany rezultat | baza tworzy podstawowe tabele i indeksy |
| Ryzyka | zbyt ogolny model draftu, koszt pozniejszych migracji |
| Kryteria review | poprawne FK, indeksy przestrzenne, zgodnosc z domena |

### M.4 Iteracja backend MVP

| Pole | Zawartosc |
| --- | --- |
| Cel | API odczytu odcinkow drogowych i draft commands |
| Pliki do utworzenia | `backend/src/main/java/pl/gddkia/roadgis/reference/...`, `backend/src/main/java/pl/gddkia/roadgis/infrastructure/...`, `backend/src/main/java/pl/gddkia/roadgis/editing/...`, `backend/src/test/...` |
| Pliki do modyfikacji | `backend/pom.xml`, `docs/api/openapi.yaml` |
| Oczekiwany rezultat | dzialajace endpointy list/detail/create draft/save draft |
| Ryzyka | nadmierna abstrakcja repozytoriow, zbyt wczesny generic framework |
| Kryteria review | endpointy zgodne z OpenAPI, testy integracyjne przechodza |

### M.5 Iteracja frontend MVP

| Pole | Zawartosc |
| --- | --- |
| Cel | shell aplikacji, routing, lista odcinkow, detal i mapa odczytowa |
| Pliki do utworzenia | `frontend/src/app/shell/*`, `frontend/src/app/features/dashboard/*`, `frontend/src/app/features/data-management/*`, `frontend/src/app/map/*`, `frontend/src/app/state/*` |
| Pliki do modyfikacji | `frontend/package.json`, `frontend/angular.json`, `frontend/tailwind.config.js` |
| Oczekiwany rezultat | uruchamialny frontend z pierwszym operacyjnym widokiem |
| Ryzyka | zbyt skomplikowany stan globalny, zbyt wiele komponentow naraz |
| Kryteria review | widok dziala w scenariuszu mapa+tabela+formularz, kod jest modulowy |

### M.6 Iteracja edycji GIS

| Pole | Zawartosc |
| --- | --- |
| Cel | dodac rysowanie, modyfikacje geometrii, snapping i overlay draftu |
| Pliki do utworzenia | `frontend/src/app/map/interactions/*`, `backend/src/main/java/pl/gddkia/roadgis/editing/command/*`, `backend/src/main/java/pl/gddkia/roadgis/validation/geometry/*` |
| Pliki do modyfikacji | `docs/ux/data-management-mode.md`, `docs/api/openapi.yaml` |
| Oczekiwany rezultat | pierwsza operacyjna edycja geometrii w drafcie |
| Ryzyka | wydajnosc przy wielu feature, niejasny model split/merge |
| Kryteria review | narzedzia mapowe sa przewidywalne, overlay draftu odroznia sie od publikacji |

### M.7 Iteracja walidacji

| Pole | Zawartosc |
| --- | --- |
| Cel | uruchomic reguly atrybutowe, referencyjne i topologiczne |
| Pliki do utworzenia | `backend/src/main/java/pl/gddkia/roadgis/validation/rules/*`, `backend/src/main/java/pl/gddkia/roadgis/validation/api/*`, `frontend/src/app/features/validation/*` |
| Pliki do modyfikacji | `db/mssql/migrations/*`, `docs/domain/object-lifecycle.md` |
| Oczekiwany rezultat | pelny panel walidacji i blokada publikacji przy bledach krytycznych |
| Ryzyka | zbyt wolne walidacje i zly UX dla ciezkich procesow |
| Kryteria review | wynik walidacji jest czytelny, problem da sie naprawic z UI |

### M.8 Iteracja raportow

| Pole | Zawartosc |
| --- | --- |
| Cel | dostarczyc ksiazke drogi i mape techniczno-eksploatacyjna MVP |
| Pliki do utworzenia | `backend/src/main/java/pl/gddkia/roadgis/reports/*`, `frontend/src/app/features/reports/*`, `geoserver/styles/*`, `docs/reports/*` rozszerzenie |
| Pliki do modyfikacji | `docs/api/openapi.yaml`, `docs/delivery/release-plan.md` |
| Oczekiwany rezultat | raporty generowane z danych opublikowanych |
| Ryzyka | zbyt szeroki zakres map wydrukowych, duzy koszt stylizacji |
| Kryteria review | raporty odpowiadaja modelowi publikowanemu i maja audyt generacji |

### M.9 Iteracja stabilizacji

| Pole | Zawartosc |
| --- | --- |
| Cel | hardening, CI/CD, observability, performance tuning, backup |
| Pliki do utworzenia | `.github/workflows/*`, `infra/observability/*`, `scripts/ci/*`, `scripts/release/*` |
| Pliki do modyfikacji | `infra/compose/*`, `backend/README.md`, `frontend/README.md` |
| Oczekiwany rezultat | system gotowy do srodowiska testowego i review release |
| Ryzyka | niedoszacowanie wydajnosci geometrii i raportow |
| Kryteria review | build i testy sa powtarzalne, monitoring pokrywa krytyczne przeplywy |

---

## Czesc N - Pierwsze artefakty do wygenerowania

### N.1 Kolejnosc wykonania

1. `docs/delivery/codex-execution-package.md`
2. `docs/domain/domain-model.md` - rozszerzenie o obiekty referencyjne i infrastrukturalne
3. `db/mssql/migrations/V001__init_reference.sql`
4. `db/mssql/migrations/V002__init_road.sql`
5. `db/mssql/migrations/V003__init_editing.sql`
6. `docs/api/openapi.yaml` - rozszerzenie o endpointy draft i road section
7. `backend/src/main/java/pl/gddkia/roadgis/reference/*`
8. `backend/src/main/java/pl/gddkia/roadgis/infrastructure/*`
9. `backend/src/main/java/pl/gddkia/roadgis/editing/*`
10. `backend/src/test/*` - testy integracyjne dla odczytu i draftu
11. `frontend/src/app/shell/*`
12. `frontend/src/app/features/data-management/*`
13. `frontend/src/app/map/*`
14. `frontend/src/app/state/*`
15. `geoserver/workspaces/*`, `geoserver/layers/*`, `geoserver/styles/*`
16. `infra/compose/*` i `scripts/bootstrap/*`

### N.2 Minimalny start implementacyjny

Pierwszy pion, od ktorego warto zaczac, to:

1. system referencyjny,
2. `road_section`,
3. draft save,
4. ekran `data-management` z mapa + tabela + formularz,
5. walidacja minimalna,
6. raport `ksiazka drogi` dla odcinka.

To daje najkrotsza droge do prawdziwej wartosci biznesowej i pozwala sprawdzic:

- model danych,
- workflow draft/publish,
- synchronizacje UI,
- granice odpowiedzialnosci backend/GeoServer,
- sens ADR-ow technologicznych.

---

## Kolejny krok dla Codex

Nastepny krok implementacyjny powinien zaczac sie od artefaktu `db/mssql/migrations/V001__init_reference.sql`, a zaraz po nim `V002__init_road.sql` oraz rozszerzenia `docs/api/openapi.yaml` o pion `reference + road-section + draft`. Ten zestaw otwiera droge do pierwszego reviewable vertical slice: odczyt i edycja odcinka drogowego w trybie roboczym.
