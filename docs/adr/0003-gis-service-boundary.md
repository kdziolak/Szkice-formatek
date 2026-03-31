# ADR 0003: GIS Service Boundary

- Status: Proposed
- Data: 2026-03-30

## Decyzja robocza

GeoServer pozostaje komponentem publikacyjnym i renderujacym. Nie przejmuje reguly biznesowej, workflow draftow ani odpowiedzialnosci za audyt zmian.

## Implikacje

- backend jest jedynym miejscem zapisu i walidacji danych roboczych,
- GeoServer publikuje wybrane warstwy i style na podstawie kontrolowanych zrodel,
- przyszle integracje WFS-T lub edycja bezposrednia przez warstwy GIS wymagaja osobnego ADR.
