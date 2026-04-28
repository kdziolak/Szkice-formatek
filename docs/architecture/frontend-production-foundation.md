# Frontend production foundation - etap 1

## Diagnoza MVP

MVP ma dzialajacy pionowy wycinek: Angular standalone, OpenLayers, PrimeNG, signal store, mockowane odczyty, mapa, tabela, formularz, workspace i walidacja. Najwieksza wartosc to synchronizacja mapa - tabela - formularz. Najwieksze ryzyko to zbyt szeroki `RoadInfraGisStore`, twardo wpisane procesy w jednym ekranie i brak osobnej warstwy domenowej dla importu, dzialek, SR, raportow oraz eksportu.

Projekt nie uzywa Nx, dlatego etap 1 nie migruje repozytorium. Docelowy podzial Nx-like jest odtwarzany w `frontend/src/app/domains`, z zachowaniem dzialajacego MVP.

## Plan rozbudowy

1. Zachowac obecny rdzen mapowy OpenLayers i synchronizacje selekcji.
2. Dodac modele domenowe gotowe pod przyszle REST API.
3. Dodac fasady danych dla warstw, selekcji, edycji, workspace, importu, dzialek, walidacji, SR i raportow.
4. Rozbudowac ekran pracy do ergonomii desktop GIS: lewa szyna, gorny toolbar, prawa legenda/info/proces, dolna tabela.
5. Wprowadzic klikalne workflow: import obiektow, import dzialek, wersja robocza, edycja, dowiazanie SR, walidacja, raporty/eksport.
6. Utrzymac mocki jako kontrakt referencyjny dla backendu i analitykow.

## Struktura folderow

```text
frontend/src/app/
  core/
  features/
    data-management/
  map/
  state/
  domains/
    road-gis/
      models/
      data-access/
```

Kolejne etapy powinny rozszerzyc `domains/road-gis` do osobnych domen `gis`, `zid`, `sr` i `reporting`, gdy komponenty procesow przestana byc tylko panelami w shellu.

## Ekrany i procesy

- Kompozycja mapowa z mapa, tabela, legenda, warstwami i odczytem skali/CRS.
- Drzewo warstw z grupami OSM, Geoportal/GUGiK, dzialki, kontury, SR, obiekty ZID, obiekty robocze i warstwy pomocnicze.
- Panel informacji oraz atrybutow zsynchronizowany z mapa i tabela.
- Proces importu obiektow infrastruktury z rozpoznaniem warstw, mapowaniem geometrii i atrybutow, podgladem, walidacja i raportem.
- Proces importu dzialek z porownaniem SAP HANA, ZID i GUGiK oraz raportem rozbieznosci.
- Proces wersji roboczej i walidacji.
- Proces dowiazania do systemu referencyjnego.
- Proces raportow i eksportu.

## Modele danych

Dodano modele: `LayerDefinition`, `MapComposition`, `GisFeature`, `RoadInfrastructureObject`, `ReferenceSegment`, `ReferenceBinding`, `Workset`, `WorksetObject`, `DraftStatus`, `ValidationStatus`, `ValidationIssue`, `ImportSession`, `ImportLayer`, `AttributeMapping`, `ParcelImportCandidate`, `ParcelComparisonResult`, `ImportReport`, `ReportDefinition`, `ExportJob`, `WorkflowDefinition`.

## Plan commitow / etapow

1. `frontend/domain-foundation`: modele, mocki, fasady, testy fasad.
2. `frontend/gis-workbench-shell`: layout GIS, lewa szyna, prawa zakladka procesu, warstwy.
3. `frontend/clickable-workflows`: importy, dzialki, SR, walidacja, raporty w panelu procesu.
4. `frontend/backend-contracts`: podmiana mockow na kontrakty REST i OpenAPI.
5. `frontend/gis-quality`: testy e2e synchronizacji mapa - tabela - formularz, testy renderowania mapy i regresji layoutu.

## Etap 2 - stabilizacja workbencha

Kolejny krok po fundamencie polega na ograniczaniu odpowiedzialnosci `DataManagementPageComponent`. Konfiguracja stanu rozwiniecia grup warstw zostala przeniesiona do view-modelu workbencha:

- `features/data-management/data-management-workbench.view-model.ts`

Ten plik jest miejscem na kolejne stale prezentacyjne shellu GIS: akcje modulow, akcje lewej szyny, domyslne grupy warstw i docelowo definicje zakladek procesu. Dzieki temu ekran mapowy moze pozostac kontenerem orkiestrujacym fasady, a nie jednym komponentem przechowujacym cala konfiguracje interfejsu.

Testy komponentu zostaly rozszerzone o zachowania kluczowe dla klikalnego MVP:

- aktywacja procesu biznesowego przelacza prawy panel na `Proces`,
- wybor kroku procesu aktualizuje aktywny krok workflow,
- przelaczanie warstwy przechodzi przez `LayerFacade`,
- zwijanie grup warstw nie psuje stanu innych grup,
- zmiana zakladki edytora przechodzi przez `ObjectEditorFacade`,
- wybor bledu walidacji nadal deleguje akcje do wspolnego store.

To nie zastepuje testow e2e, ale zabezpiecza kontrakt `mapa - tabela - panel procesu` na poziomie jednostkowym przed dalszym dzieleniem ekranu na domeny `gis`, `zid`, `sr` i `reporting`.

## Ryzyka i TODO

- Polskie etykiety w istniejacych plikach maja mojibake i wymagaja osobnego zadania porzadkujacego kodowanie.
- Store nadal ma szeroka odpowiedzialnosc; etap 2 powinien wydzielic store warstw, store selekcji, store edycji i store workflow.
- Odczyty mock oraz zapisy `/api` sa nadal mieszane w `RoadInfraGisApiService`; docelowo wymagany jest jawny tryb mock/API.
- Style mapy OpenLayers sa lokalne; kontrakt GeoServer/SLD i zaleznosci skali musza zostac doprecyzowane.
