# Container Diagram

```mermaid
flowchart TB
  Browser[Frontend SPA\nAngular + PrimeNG + OpenLayers]
  Api[Backend API\nSpring Boot]
  Geo[GeoServer\nWMS/WFS]
  Db[(MS SQL Server)]
  Storage[Magazyn plikow]

  Browser --> Api
  Browser --> Geo
  Api --> Db
  Api --> Storage
  Geo --> Db
```

## Komentarz

- frontend obsluguje UX pracy na mapie, tabeli i formularzu,
- backend pozostaje wlascicielem procesu biznesowego, draftow i walidacji,
- GeoServer publikuje warstwy do odczytu i stylizacji,
- baza danych przechowuje stan operacyjny, referencyjny i raportowy.
