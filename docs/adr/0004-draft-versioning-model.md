# ADR 0004: Draft Versioning Model

- Status: Accepted for MVP
- Data: 2026-04-24

## Kontekst

Pierwszy pion implementacyjny obejmuje `ReferenceSegment`, `RoadSection` oraz zapis zmiany roboczej w drafcie. System musi od poczatku rozdzielac stan opublikowany od stanu roboczego, zeby nie mieszac danych raportowych, publikacji GIS i pracy eksperckiej w mapie/tabeli/formularzu.

## Decyzja

Zmiany danych sa przygotowywane w warstwie draft, a stan opublikowany pozostaje referencyjnym zrodlem raportowania i publikacji mapowej.

Dla MVP przyjmujemy nastepujaca semantyke:

1. `draft` jest kontenerem pracy uzytkownika dla jednego zakresu zmian. W MVP jedynym zakresem jest `ROAD_SECTION`.
2. `draft_object` przechowuje snapshot roboczego payloadu obiektu, a nie pelny event sourcing komend.
3. Jeden draft moze miec najwyzej jeden aktywny snapshot dla pary `entity_type + target_business_id`.
4. `target_business_id` wskazuje obiekt zrodlowy dla `UPDATE` i `DELETE`; dla `CREATE` jest identyfikatorem nowego obiektu nadanym przed publikacja.
5. Payload `ROAD_SECTION` obejmuje atrybuty opisowe, `lifecycle_status`, geometrie oraz binding referencyjny: `reference_segment_id`/`referenceSegmentBusinessId`, `chainage_from`, `chainage_to` i metadane jakosci dowiazania.
6. Minimalny warunek przyszlej publikacji to: draft ma status publikowalny, wszystkie obiekty maja `validation_state = VALID`, brak `conflict_state = CONFLICT`, uzytkownik ma uprawnienie do publikacji, a geometrie zachowuja systemowy SRID 2180.
7. Uprawnienia do `create draft`, `save command`, `validate` i `publish` sa egzekwowane w warstwie application service / security boundary backendu, nie w kontrolerze i nie w frontendzie.
8. GeoServer publikuje tylko stan opublikowany. Overlay draftu pozostaje odpowiedzialnoscia backendowego read modelu i frontendu.

## Implikacje

- draft moze agregowac wiele zmian przed publikacja,
- publikacja tworzy nowy stan referencyjny i wpis audytowy,
- obecny `edit.draft_object.payload_json` jest akceptowanym mechanizmem przechowywania snapshotu roboczego dla `RoadSection`,
- rozbudowa na inne agregaty wymaga jawnej decyzji i rozszerzenia kontraktu, ale nie wymaga zmiany zalozenia o oddzieleniu draftu od stanu opublikowanego,
- pelny model konfliktow, historia publikacji i tabele audytowe pozostaja zakresem kolejnych etapow, ale nie blokuja pionu `RoadSection` draft save.
