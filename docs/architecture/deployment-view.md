# Deployment View

## Widok wdrozeniowy

Docelowy uklad srodowiska produkcyjnego:

1. Przegladarka uzytkownika laczy sie z warstwa HTTP wystawiona przez reverse proxy.
2. Reverse proxy serwuje frontend SPA oraz przekazuje ruch API do backendu i ruch mapowy do GeoServera.
3. Backend dziala jako aplikacja Spring Boot z dostepem do MS SQL Server oraz magazynu plikow.
4. GeoServer publikuje stylizowane warstwy na podstawie kontrolowanych widokow lub tabel przestrzennych.
5. Monitoring i logowanie sa wydzielone do komponentow w `infra/observability/`.

## Komponenty infrastrukturalne

- `infra/docker/` dla obrazow kontenerowych,
- `infra/compose/` dla lokalnych i integracyjnych zestawow uruchomieniowych,
- `infra/nginx/` dla reverse proxy i routingu,
- `infra/observability/` dla logow, metryk i health-checkow.

## Zasady wdrozeniowe

- frontend i backend versionowane razem na poziomie wydania aplikacyjnego,
- warstwy GeoServera publikowane po zatwierdzeniu zmian danych,
- migracje bazy uruchamiane w kontrolowanym procesie release,
- konfiguracje srodowiskowe przechowywane poza repozytorium lub jako szablony.
