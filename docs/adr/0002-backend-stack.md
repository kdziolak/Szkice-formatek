# ADR 0002: Backend Stack

- Status: Accepted
- Data: 2026-03-30

## Kontekst

Backend musi obslugiwac logike domenowa systemu drogowego, walidacje zmian, integracje z MS SQL Server i proces publikacji danych przestrzennych. Wymagane sa:

- stabilnosc transakcyjna i czytelny model warstwowy,
- mozliwosc implementacji walidacji biznesowych i geometrii,
- integracja z SQL Server, importami wsadowymi i GeoServerem,
- dobra obsluga API REST oraz zadan asynchronicznych.

## Decyzja

Wybieramy backend oparty o:

- Java 21 jako glowna platforme uruchomieniowa,
- Spring Boot 3.x jako framework aplikacyjny,
- Maven jako standard budowania i zaleznosci,
- Spring Web do API REST,
- Spring Validation i Spring Actuator do walidacji kontraktow i diagnostyki,
- Spring JDBC / Spring Data JDBC do pracy z MS SQL Server i zapytaniami specyficznymi dla danych przestrzennych,
- Flyway do wersjonowania migracji bazy,
- GeoTools do operacji geoprzestrzennych, transformacji i wsparcia import/export.

Backend pozostaje modularnym monolitem. Granice biznesowe sa wydzielone pakietami domenowymi, ale runtime i wdrozenie pozostaja wspolne.

## Uzasadnienie

- Java i Spring Boot to stabilny wybor dla aplikacji administracyjnych i danych krytycznych.
- Modularny monolit zmniejsza zlozonosc operacyjna na starcie, a jednoczesnie pozwala budowac wyrazne granice domenowe.
- SQL Server w obszarze danych drogowych zwykle wymaga wiekszej kontroli nad SQL niz daje klasyczne ORM, dlatego preferowane jest JDBC z jawna kontrola zapytan.
- Flyway upraszcza kontrolowane wdrazanie schematow.
- GeoTools dobrze wspiera formaty i transformacje potrzebne w GIS.

## Konsekwencje

Pozytywne:

- dobra przewidywalnosc runtime i transakcji,
- czytelna granica miedzy logika biznesowa a publikacja GIS,
- latwiejsza diagnostyka i wersjonowanie schematu danych.

Negatywne:

- wiecej pracy recznej przy mapowaniu rekordow i SQL niz przy pelnym ORM,
- potrzeba pilnowania architektury modulowej wewnatrz jednego wdrozenia,
- operacje przestrzenne nadal wymagaja ostroznego podzialu odpowiedzialnosci miedzy SQL, backend i GeoServer.

## Odrzucone alternatywy

### Node.js / NestJS

Odrzucone, bo glowny nacisk pada na spojny model transakcyjny, integracje z SQL Server oraz biblioteki geoprzestrzenne wygodne w ekosystemie JVM.

### Mikroserwisy od pierwszego wydania

Odrzucone, bo na tym etapie domena jest zbyt silnie powiazana, a koszt operacyjny i integracyjny przewyzszylby korzysci.
