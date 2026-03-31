# Database Layout

Katalog `db/` przechowuje artefakty SQL Server jako zrodlo prawdy dla schematu i obiektow bazodanowych.

## Struktura

- `schemas/` - definicje schematow logicznych,
- `tables/` - skrypty tabel i indeksow,
- `views/` - widoki raportowe i publikacyjne,
- `procedures/` - procedury wspierajace importy lub raporty,
- `seed/` - dane startowe i slowniki,
- `migrations/` - wersjonowane migracje wdrozeniowe.

Docelowo migracje uruchamiane przez backend powinny byc synchronizowane z zawartoscia tego katalogu.
