# Backend

Backend jest modularnym monolitem Spring Boot odpowiedzialnym za logike domenowa, workflow draft/publish, walidacje i API.

## Pakiety
- `app/` - bootstrap aplikacji,
- `config/` - konfiguracja techniczna,
- `common/` - komponenty wspolne,
- `reference/` - slowniki i dane referencyjne,
- `infrastructure/` - model infrastruktury drogowej,
- `editing/` - drafty i publikacja,
- `validation/` - reguly walidacyjne,
- `importexport/` - importy i eksporty,
- `reports/` - raporty i widoki raportowe,
- `attachments/` - zalaczniki.

## Java 21 lokalnie
Backend lokalnie uruchamiamy przez repo-local JDK 21 z katalogu `.local-runtime/jdk-21`.

1. Zainstaluj repo-local runtime:
   `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap\install-jdk21.ps1`
2. Sprawdz konfiguracje:
   `powershell -ExecutionPolicy Bypass -File .\scripts\dev\doctor.ps1`
3. Uruchom testy unit:
   `powershell -ExecutionPolicy Bypass -File .\scripts\dev\backend-unit.ps1`

## Testy integracyjne
- Lokalna maszyna nie jest zakladanym runtime dla Dockera/Testcontainers.
- `.\mvnw.cmd -P integration-tests verify` nie jest wspierana lokalnie na tym workstation.
- Testy integracyjne sa uruchamiane w GitHub Actions na Java 21 i runnerze z Dockerem.

## Migracje Flyway

Zrodlem prawdy dla migracji MS SQL jest `db/mssql/migrations`. Modul backendu pakuje te migracje do `classpath:db/migration` przez sekcje `build.resources` w `backend/pom.xml`, a aplikacja uruchamia Flyway z `spring.flyway.locations=classpath:db/migration`.

Nie nalezy dodawac drugiej recznie utrzymywanej kopii migracji w `backend/src/main/resources/db/migration`.
