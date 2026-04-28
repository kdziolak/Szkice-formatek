# Foundation Stage 1

## Cel

Ten dokument zamyka decyzje techniczne wymagane przed dalsza implementacja pionu `reference + RoadSection + draft save`.

## Zakres MVP

Pierwszym agregatem edycyjnym systemu jest `RoadSection`. Kolejne obiekty infrastruktury drogowej moga byc dodawane dopiero po utrwaleniu wzorca dla mapy, tabeli, formularza, bindingu referencyjnego i draftu.

GeoServer w MVP publikuje stan opublikowany. Overlay draftu jest liczony przez backendowy read model i prezentowany w frontendzie.

## Konwencje danych

| Obszar | Decyzja |
| --- | --- |
| Identyfikator techniczny | PK `BIGINT IDENTITY`, nazwany wedlug tabeli, np. `road_section_id` |
| Identyfikator biznesowy | `business_id UNIQUEIDENTIFIER NOT NULL`, stabilny w API jako `businessId` |
| Schematy bazodanowe | `ref`, `road`, `edit`; kolejne domeny tylko przez jawna decyzje architektoniczna |
| Nazwy tabel | liczba pojedyncza, np. `road.road_section`, `edit.draft_object` |
| Status obiektu | `lifecycle_status` z wartosciami `DRAFT`, `VALID`, `INVALID`, `CONFLICT`, `PUBLISHED`, `ARCHIVED`, `UNBOUND` |
| Status draftu | `OPEN`, `LOCKED`, `PUBLISHED`, `ARCHIVED` |
| SRID roboczy | EPSG:2180, egzekwowany w migracjach i mapperach geometrii |
| Kilometraz | `DECIMAL(12,3)` w bazie, `number` w API, zawsze jako `chainageFrom`/`chainageTo` |

## Binding referencyjny

`RoadSection` musi miec jawny kontekst referencyjny. W obecnym schemacie publikowanym binding jest fizycznie reprezentowany przez `road.road_section.reference_segment_id`, `chainage_from` i `chainage_to`. W kontrakcie API utrwalamy semantyczny obiekt `ReferenceBinding`, zeby kolejne etapy mogly dodac metode dowiazania i ocene zgodnosci geometrii bez zmiany sensu domenowego.

Minimalny binding dla MVP obejmuje:

- `referenceSegmentBusinessId`,
- `chainageFrom`,
- `chainageTo`,
- `bindingMethod`,
- `bindingQuality`,
- `geometryConsistency`.

## Migracje Flyway

Kanoniczne migracje sa utrzymywane w `db/mssql/migrations`. Backend pakuje je do `classpath:db/migration` przez konfiguracje `backend/pom.xml`, a runtime Spring Boot uzywa `spring.flyway.locations=classpath:db/migration`.

Nie tworzymy drugiej recznie utrzymywanej kopii migracji w `backend/src/main/resources/db/migration`. Zgodnosc backend <-> db oznacza, ze kazda migracja dodana do `db/mssql/migrations` jest wlaczana do artefaktu backendu przez build Maven.

## Kontrakt API

Kontrakt MVP obejmuje:

- odczyt odcinkow referencyjnych i locate po kilometrazu,
- liste i detal `RoadSection`,
- opcjonalny overlay draftu dla listy, detalu i features mapy,
- tworzenie draftu,
- zapis snapshotu roboczego `ROAD_SECTION`.

Kontrakt nie obejmuje jeszcze publikacji, konflikt resolution, audytu publikacji ani pelnej walidacji topologicznej.

## Foundation Closed

Stage 1 uznajemy za zamkniety, gdy:

- konwencje `business_id`, statusow, schematow i tabel sa opisane,
- lokalizacja migracji Flyway jest jednoznaczna,
- `RoadSection` jest potwierdzony jako pierwszy agregat edycyjny,
- minimalny `ReferenceBinding` jest utrwalony w kontrakcie API,
- semantyka draftu MVP jest zaakceptowana w ADR,
- frontendowy workspace jest oznaczony jako prototype/in-progress do czasu pelnego spiecia z realnym API.
