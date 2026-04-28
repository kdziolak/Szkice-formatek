# Database Layout

Katalog `db/` przechowuje artefakty SQL Server jako zrodlo prawdy dla schematu i obiektow bazodanowych.

## Struktura

- `schemas/` - definicje schematow logicznych,
- `tables/` - skrypty tabel i indeksow,
- `views/` - widoki raportowe i publikacyjne,
- `procedures/` - procedury wspierajace importy lub raporty,
- `seed/` - dane startowe i slowniki,
- `migrations/` - wersjonowane migracje wdrozeniowe.

## Flyway

Kanonicznym zrodlem migracji dla MS SQL jest katalog `db/mssql/migrations`.

Backend nie utrzymuje drugiej recznej kopii migracji. Podczas budowania modulu `backend` Maven kopiuje pliki `*.sql` z `../db/mssql/migrations` do artefaktu pod sciezka `classpath:db/migration`, a Spring Boot uruchamia Flyway z tej lokalizacji.

Kazda zmiana schematu musi wiec trafic najpierw do `db/mssql/migrations`, a zgodnosc backend <-> db jest sprawdzana przez build backendu i konfiguracje zasobow Maven.
