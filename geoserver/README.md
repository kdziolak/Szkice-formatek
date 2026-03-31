# GeoServer

Katalog `geoserver/` przechowuje artefakty potrzebne do publikacji warstw mapowych.

## Struktura

- `workspaces/` - konfiguracje workspace'ow,
- `styles/` - style SLD lub alternatywne definicje wizualne,
- `layers/` - definicje warstw i grup warstw,
- `datastore/` - konfiguracje zrodel danych,
- `seeds/` - materialy pomocnicze do bootstrapu i cache warm-up.

GeoServer powinien publikowac wybrane, kontrolowane widoki danych, a nie byc zrodlem reguly biznesowej.
