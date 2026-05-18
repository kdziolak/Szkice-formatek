# ADR 0004: Draft Versioning Model

- Status: Accepted for MVP
- Data: 2026-03-30
- Aktualizacja: 2026-05-04

## Decyzja robocza

Zmiany danych sa przygotowywane w warstwie draft, a stan opublikowany pozostaje referencyjnym zrodlem raportowania i publikacji mapowej.

W MVP draft jest realizowany przez `workspace` jako kontener pracy operatora oraz tabele snapshotow roboczych:

- `draft_object_states` dla obiektow infrastruktury,
- `draft_road_section_states` dla `RoadSection`.

Snapshot przechowuje aktualny roboczy stan encji, a nie liste komend. Encja zrodlowa jest identyfikowana przez `object_id` albo `road_section_id`; tworzenie nowych encji i model komend pozostaja poza zakresem MVP. Publikacja workspace promuje snapshot do tabel publikowanych tylko po walidacji bez bledow blokujacych.

## Implikacje

- draft moze agregowac wiele zmian przed publikacja,
- publikacja tworzy nowy stan referencyjny i wpis audytowy,
- overlay draftu pozostaje po stronie backend/frontend i nie jest publikowany przez GeoServer,
- model konfliktow, tworzenie nowych encji oraz split/merge wymagaja dalszego doprecyzowania na kolejnym etapie.
