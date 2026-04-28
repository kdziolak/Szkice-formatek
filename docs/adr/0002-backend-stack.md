# ADR 0002: Backend Stack

- Status: Accepted
- Data: 2026-03-30
- Aktualizacja: 2026-04-25 dla vertical slice RoadGIS Platform

## Kontekst

Backend musi obsługiwać logikę domenową systemu drogowego, walidację zmian, import, eksport, historię, raporty oraz publikację danych przestrzennych dla frontendu GIS. Wymagane są:

- stabilność transakcyjna i czytelny model warstwowy,
- możliwość implementacji walidacji biznesowych oraz geometrycznych,
- prosty start lokalny dla prototypu,
- granica integracyjna pod docelowy układ PostGIS, GeoServer i MS SQL,
- dobra obsługa REST API, migracji i dokumentacji kontraktu.

## Decyzja

Wybieramy backend oparty o:

- Java 21 jako główną platformę uruchomieniową,
- Spring Boot 4.0.x jako framework aplikacyjny,
- Maven jako standard budowania i zależności,
- Spring Web do API REST,
- Spring Validation i Spring Actuator do walidacji kontraktów i diagnostyki,
- Flyway do wersjonowania migracji bazy,
- PostgreSQL + PostGIS jako źródło danych prototypu,
- GeoTools do operacji geoprzestrzennych, transformacji i wsparcia import/export,
- Springdoc OpenAPI do publikacji kontraktu developerskiego.

Backend pozostaje modularnym monolitem. Granice biznesowe są wydzielone pakietami `api`, `application`, `domain`, `infrastructure` i `validation`, ale runtime i wdrożenie pozostają wspólne.

## Relacja Do MS SQL

AGENTS.md wskazuje MS SQL jako docelową bazę opisową. W tym vertical slice używamy PostGIS jako jednego źródła danych, żeby lokalne uruchomienie mapy, walidacji, importu i eksportu było możliwe bez dodatkowej administracji bazowej.

Decyzja produkcyjna pozostaje otwarta:

- PostGIS powinien przechowywać geometrie, indeksy przestrzenne, warstwy mapowe i dane referencyjne.
- MS SQL może przechowywać dane opisowe, konfigurację, historię, raportowanie i integracje administracyjne.
- Backend musi utrzymać warstwę aplikacyjną między UI a bazami, żeby nie mieszać logiki biznesowej z publikacją GIS.

## Uzasadnienie

- Java i Spring Boot są stabilnym wyborem dla aplikacji administracyjnych i danych krytycznych.
- Modularny monolit zmniejsza złożoność operacyjną na starcie, a jednocześnie pozwala budować wyraźne granice domenowe.
- PostGIS skraca drogę do działającej mapy, walidacji geometrii i eksportu GeoJSON.
- Flyway upraszcza kontrolowane wdrażanie schematów.
- GeoTools dobrze wspiera formaty i transformacje potrzebne w GIS.
- Docelowe rozdzielenie MS SQL/PostGIS można wprowadzić bez zmiany kontraktu frontendowego.

## Konsekwencje

Pozytywne:

- szybki lokalny start przez Docker Compose,
- spójny vertical slice mapa, tabela, formularz, walidacja i eksport,
- czytelna granica między logiką biznesową a publikacją GIS,
- łatwiejsza diagnostyka i wersjonowanie schematu danych.

Negatywne:

- prototyp nie odzwierciedla jeszcze pełnego docelowego podziału PostGIS/MS SQL,
- potrzebna będzie decyzja migracyjna dla danych opisowych,
- operacje przestrzenne wymagają ostrożnego podziału odpowiedzialności między SQL, backend i GeoServer.

## Odrzucone Alternatywy

### MS SQL Jako Jedyna Baza Prototypu

Odrzucone dla pierwszego vertical slice, bo utrudnia szybkie uruchomienie warstw GeoJSON i walidacji przestrzennej bez dodatkowej konfiguracji spatial.

### Node.js / NestJS

Odrzucone, bo główny nacisk pada na spójny model transakcyjny, integracje administracyjne oraz biblioteki geoprzestrzenne wygodne w ekosystemie JVM.

### Mikroserwisy Od Pierwszego Wydania

Odrzucone, bo na tym etapie domena jest silnie powiązana, a koszt operacyjny i integracyjny przewyższyłby korzyści.
