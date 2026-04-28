# Frontend

Frontend jest projektowany jako aplikacja Angular z warstwami `core`, `shared`, `shell` i zestawem modulow `features/*`.

## Glowne obszary

- `dashboard/` - widok startowy i KPI,
- `data-management/` - praca na mapie, tabeli i filtrach,
- `object-editor/` - formularze i szczegoly obiektu,
- `reference-binding/` - laczenie z danymi referencyjnymi,
- `import/` - importy i monitoring wsadow,
- `validation/` - prezentacja bledow i statusu walidacji,
- `reports/` - uruchamianie i pobieranie raportow,
- `administration/` - slowniki, uprawnienia, konfiguracja.

## Status implementacyjny

Workspace `data-management` jest obecnie `prototype/in-progress`: sluzy do utrwalenia docelowej ergonomii GIS/CAD/Office i przeplywu mapa <-> tabela <-> formularz, ale nie jest jeszcze traktowany jako zamkniety pion produkcyjny.

Za domkniety frontendowy pion MVP uznajemy dopiero ekran spiety z realnym API `RoadSection`, `ReferenceBinding` i `Draft`, z zachowana synchronizacja mapy, tabeli i formularza oraz widocznym statusem overlay draftu.
