# 05. Kontrakt API

## Status Dokumentu

- Status: kontrakt MVP zgodny z pionem Reference + RoadSection + Draft Save.
- Data: 2026-04-27.
- Zakres: drogi, system referencyjny, odcinki drogi, obiekty infrastruktury, workspace, zapis roboczy i lekka walidacja.
- Poza zakresem MVP: raporty produkcyjne, importy branżowe, GeoServer WMS/WFS, WFS-T, zaawansowana topologia, pelny IAM i ekran logowania.
- Źródło techniczne: `docs/api/openapi.yaml`.

## Konwencje

| Obszar | Konwencja |
| --- | --- |
| Prefiks runtime | `/api` |
| Wersjonowanie ścieżek | Brak równoległego `/api/v1` w MVP |
| Format | JSON; geometrie jako GeoJSON |
| Identyfikatory | UUID techniczne oraz kody biznesowe, np. `DK7-ODC-001` |
| Daty | ISO-8601 |
| Statusy | Jawne statusy obiektu, walidacji i wersji roboczej |
| Publikacja | Workspace: `validate`, `finalize`, `reject` |

MVP działa na prototypowym PostgreSQL/PostGIS i migracjach Flyway w
`backend/src/main/resources/db/migration`. Docelowy MS SQL pozostaje decyzją
architektoniczną dla utwardzenia produkcyjnego.

## Security MVP

Domyslnie lokalny runtime pozostaje bez wymaganego tokenu:
`ROADGIS_SECURITY_ENABLED=false`. Po wlaczeniu security przez
`ROADGIS_SECURITY_ENABLED=true` klient przekazuje token JWT w naglowku:

```http
Authorization: Bearer <jwt>
```

Reguly MVP:

- `GET /api/health`, `GET /actuator/health`, Swagger UI i OpenAPI sa publiczne;
- `GET /api/**` wymaga roli `ROADGIS_VIEWER` albo `ROADGIS_EDITOR`;
- `POST`, `PUT`, `PATCH` i `DELETE /api/**` wymagaja roli `ROADGIS_EDITOR`;
- role sa czytane z claimu `roles`;
- wartosci `ROADGIS_VIEWER`, `ROADGIS_EDITOR`, `ROLE_ROADGIS_VIEWER` i
  `ROLE_ROADGIS_EDITOR` sa mapowane do Spring authorities;
- w trybie secure backend ustala operatora z JWT: najpierw
  `preferred_username`, potem `sub`;
- pola `createdBy` pozostaja w DTO dla kompatybilnosci, ale w trybie secure
  autor operacji jest nadpisywany przez principal z tokenu.

## Bledy API

Backend zwraca bledy w formacie `application/problem+json`, zgodnie z modelem
`ProblemDetail` opisanym w `docs/api/openapi.yaml`.

| Status | Przypadek |
| --- | --- |
| `400` | Niepoprawny format lub tresc zadania |
| `401` | Brak tokenu JWT albo token niepoprawny w trybie secure |
| `403` | Token poprawny, ale operator nie ma wymaganej roli |
| `404` | Brak zasobu wskazanego identyfikatorem |
| `409` | Konflikt stanu, np. operacja na zamknietym workspace |
| `500` | Nieobsluzony blad serwera |

## Health

| Metoda | Ścieżka | Cel |
| --- | --- | --- |
| `GET` | `/api/health` | Status API i nazwa systemu |

## Drogi i System Referencyjny

| Metoda | Ścieżka | Cel |
| --- | --- | --- |
| `GET` | `/api/roads` | Lista dróg |
| `GET` | `/api/reference-segments` | Lista odcinków referencyjnych |
| `GET` | `/api/reference-segments/nearest?lat=&lon=&roadNumber=` | Sugestia najbliższego odcinka SR |

`ReferenceSegmentDto`:

```json
{
  "id": "uuid",
  "roadId": "uuid",
  "roadNumber": "DK7",
  "segmentCode": "DK7-WAW-001",
  "startMileageKm": 450.0,
  "endMileageKm": 452.4,
  "carriageway": "PRAWA",
  "direction": "GDAŃSK",
  "geometry": {
    "type": "LineString",
    "coordinates": [[20.9211, 52.1861], [20.9482, 52.1989]]
  },
  "status": "AKTYWNY"
}
```

## Odcinki Drogi

| Metoda | Ścieżka | Cel |
| --- | --- | --- |
| `GET` | `/api/road-sections` | Lista odcinków drogi z filtrami `roadNumber` i `status` |
| `GET` | `/api/road-sections/{id}` | Szczegóły odcinka drogi |

`RoadSectionDto`:

```json
{
  "id": "uuid",
  "sectionCode": "DK7-ODC-001",
  "name": "DK7 Warszawa - Łomianki",
  "roadId": "uuid",
  "roadNumber": "DK7",
  "referenceSegmentId": "uuid",
  "globalMileageFrom": 450.0,
  "globalMileageTo": 452.4,
  "localMileageFrom": 0.0,
  "localMileageTo": 2.4,
  "carriageway": "PRAWA",
  "direction": "GDAŃSK",
  "geometry": {
    "type": "LineString",
    "coordinates": [[20.9211, 52.1861], [20.9482, 52.1989]]
  },
  "status": "AKTYWNY",
  "validationStatus": "OK",
  "draftStatus": "NIE_DOTYCZY",
  "referenceBinding": {
    "referenceSegmentId": "uuid",
    "segmentCode": "DK7-WAW-001",
    "roadNumber": "DK7",
    "startMileageKm": 450.0,
    "endMileageKm": 452.4,
    "carriageway": "PRAWA",
    "direction": "GDAŃSK",
    "consistencyStatus": "ZGODNE"
  }
}
```

`ReferenceBindingDto` opisuje aktywne dowiązanie obiektu lub odcinka drogi do
systemu referencyjnego. `consistencyStatus` może przyjmować wartości `ZGODNE`,
`POZA_ZAKRESEM`, `BRAK_DOWIAZANIA` albo `NIESPOJNA_DROGA`.

`RoadSectionUpdateRequest`:

```json
{
  "sectionCode": "DK7-ODC-001",
  "name": "DK7 Warszawa - Łomianki",
  "roadId": "uuid",
  "referenceSegmentId": "uuid",
  "globalMileageFrom": 450.0,
  "globalMileageTo": 452.4,
  "localMileageFrom": 0.0,
  "localMileageTo": 2.4,
  "carriageway": "PRAWA",
  "direction": "GDAŃSK",
  "geometry": {
    "type": "LineString",
    "coordinates": [[20.9211, 52.1861], [20.9482, 52.1989]]
  },
  "status": "AKTYWNY"
}
```

## Obiekty Infrastruktury

| Metoda | Ścieżka | Cel |
| --- | --- | --- |
| `GET` | `/api/infrastructure-objects` | Lista obiektów z filtrami opcjonalnymi |
| `GET` | `/api/infrastructure-objects/{id}` | Szczegóły obiektu |
| `POST` | `/api/infrastructure-objects` | Utworzenie obiektu |
| `PUT` | `/api/infrastructure-objects/{id}` | Aktualizacja atrybutów i geometrii |
| `POST` | `/api/infrastructure-objects/{id}/bind-reference-segment` | Finalne dowiązanie obiektu do SR |
| `POST` | `/api/infrastructure-objects/{id}/validate` | Walidacja domenowa obiektu |

Istniejący flow `infrastructure-objects` pozostaje kompatybilny. Zmiana wspólna
dotyczy wyłącznie rozszerzenia modelu walidacji o generyczny target.

## Workspace i Draft Save

| Metoda | Ścieżka | Cel |
| --- | --- | --- |
| `POST` | `/api/workspaces` | Utworzenie workspace |
| `GET` | `/api/workspaces` | Lista workspace |
| `GET` | `/api/workspaces/{id}` | Szczegóły workspace |
| `POST` | `/api/workspaces/{id}/objects` | Dodanie obiektu do workspace ze snapshotem |
| `PUT` | `/api/workspaces/{id}/objects/{objectId}` | Zapis roboczy obiektu |
| `POST` | `/api/workspaces/{id}/objects/{objectId}/bind-reference-segment` | Robocze dowiązanie obiektu do SR |
| `POST` | `/api/workspaces/{id}/road-sections` | Dodanie odcinka drogi do workspace ze snapshotem |
| `PUT` | `/api/workspaces/{id}/road-sections/{roadSectionId}` | Zapis roboczy odcinka drogi |
| `POST` | `/api/workspaces/{id}/road-sections/{roadSectionId}/bind-reference-segment` | Robocze dowiązanie odcinka drogi do SR |
| `POST` | `/api/workspaces/{id}/validate` | Walidacja roboczych obiektów i odcinków drogi |
| `POST` | `/api/workspaces/{id}/finalize` | Zatwierdzenie workspace |
| `POST` | `/api/workspaces/{id}/reject` | Odrzucenie workspace |

`WorkspaceRoadSectionRequest`:

```json
{
  "roadSectionId": "uuid"
}
```

`ReferenceBindingRequest`:

```json
{
  "referenceSegmentId": "uuid"
}
```

Workspace pozostaje implementacją wersji roboczej w MVP. Osobne `/drafts` nie
jest wprowadzane w tym etapie.

## Walidacja

`ValidationIssueDto`:

```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "targetType": "ROAD_SECTION",
  "targetId": "uuid",
  "targetCode": "DK7-ODC-001",
  "objectId": null,
  "objectCode": null,
  "severity": "ERROR",
  "status": "BLOCKING",
  "issueType": "MISSING_REFERENCE_SEGMENT",
  "fieldName": "referenceSegmentId",
  "message": "Odcinek drogi powinien być dowiązany do systemu referencyjnego.",
  "geometryMarker": {
    "type": "Point",
    "coordinates": [20.95, 52.19]
  },
  "resolved": false,
  "createdAt": "2026-04-27T10:15:00Z",
  "resolvedAt": null
}
```

Dla zgodności wstecznej `objectId` i `objectCode` pozostają w DTO. Dla nowych
typów walidacji źródłem prawdy są pola `targetType`, `targetId` i `targetCode`.

Minimalne reguły dla `ROAD_SECTION` w MVP:

- wymagane dowiązanie do odcinka referencyjnego,
- zakres kilometrażu musi mieścić się w zakresie odcinka SR,
- `globalMileageFrom` nie może być większy niż `globalMileageTo`,
- geometria odcinka drogi musi być poprawnym `LineString`,
- finalizacja workspace jest blokowana przez błędy `BLOCKING`.

## Warstwy i GeoJSON

| Metoda | Ścieżka | Cel |
| --- | --- | --- |
| `GET` | `/api/layers` | Konfiguracja drzewa warstw |
| `GET` | `/api/layers/{layerCode}/features` | Dane warstwy jako FeatureCollection |

Warstwa `road-sections` jest dostępna w MVP jako dane z backendu. GeoServer
publikuje dopiero stan zatwierdzony w późniejszym etapie; overlay wersji
roboczej pozostaje po stronie backend/frontend.

## Raporty

| Metoda | Ścieżka | Cel |
| --- | --- | --- |
| `GET` | `/api/reports/validation-issues` | Lista błędów walidacji dla obiektów i odcinków drogi |

Raporty są lekkim widokiem walidacji MVP, nie pełnym modułem raportowym książki
drogi.
