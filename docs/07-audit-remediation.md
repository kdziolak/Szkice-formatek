# 07. Wdrozenie raportu audytowego

## Status

- Data: 2026-04-27.
- Zakres: stabilizacja po audycie pionu MVP Reference + RoadSection + Draft Save.
- Cel: wdrozyc najbezpieczniejsze elementy P1/P2 bez zmiany granic domenowych MVP.

## Podzial pracy agentowej

| Agent | Zakres | Wynik |
| --- | --- | --- |
| qwen_colab_explorer backend | API, obsluga bledow, security, testy backendu | Wskazal brak Spring Security, potrzebe ProblemDetail i ryzyko mapowania 404 po tresci wyjatku |
| qwen_colab_explorer frontend | Store, API service, widok data-management | Wskazal duzy template/store, brak modelu bledow/retry i surowe tabele HTML |
| worker DevOps | CI/CD | Dodal workflow GitHub Actions dla backendu i frontendu |
| qwen_colab_explorer security | Spring Security/JWT | Wskazal punkty konfiguracji security, testy MockMvc i operator context |
| qwen_colab_explorer Testcontainers | Flyway/PostGIS/SQL IT | Wskazal migracje, seedy, indeksy i round-trip workspace/road-section |
| Codex main | Decyzje architektoniczne, integracja, walidacja | Wdrozyl kontrakt bledow, security MVP, Testcontainers, dokumentacje i testy |

## Wdrozono

1. CI/CD:
   - dodano `.github/workflows/ci.yml`;
   - backend uruchamia Java 21 i `mvn verify`;
   - frontend uruchamia Node 22, `npm ci`, lint, testy headless i build.

2. Obsluga bledow API:
   - dodano centralny `ApiExceptionHandler`;
   - bledy zwracane sa jako `application/problem+json`;
   - dodano typowany `NotFoundException`, aby 404 nie zalezalo od tresci komunikatu.

3. Stabilizacja bazy:
   - dodano migracje `V3__audit_stabilization_indexes.sql`;
   - dodano indeksy dla stanow roboczych, historii zmian oraz walidacji obiektow i odcinkow drogi.

4. Kontrakt i dokumentacja:
   - OpenAPI opisuje `ProblemDetail` i wspolne odpowiedzi bledow;
   - dokument kontraktu API opisuje statusy bledow MVP.

5. Security MVP:
   - dodano Spring Security i OAuth2 Resource Server;
   - domyslnie security jest wylaczone przez `ROADGIS_SECURITY_ENABLED=false`;
   - po wlaczeniu security `GET /api/**` wymaga roli viewer/editor, a zapisy roli editor;
   - operator operacji jest ustalany z JWT w trybie secure.

6. Testcontainers/PostGIS:
   - dodano Failsafe i zaleznosci Testcontainers;
   - dodano `RoadInfraRepositoryIT` dla Flyway, PostGIS, seedow, indeksow i draft round-trip;
   - `mvn verify` uruchamia testy integracyjne `*IT`.

## Odroczono Swiadomie

| Obszar | Powod |
| --- | --- |
| Refaktor `RoadInfraRepository` | Plik jest duzy, ale dziala; rozdzial na repozytoria domenowe powinien isc z testami integracyjnymi SQL |
| Refaktor `RoadInfraService` | Wymaga ustalenia granic use case'ow workspace/object/road-section |
| Pelny IAM i logowanie UI | Security MVP obsluguje token pass-through i role, ale nie dostarcza flow logowania |
| PrimeNG `p-table` i retry UI | Dotyczy ergonomii frontendu; wymaga osobnej paczki, aby nie rozbijac stabilizacji backend/CI |

## Backlog Audytowy

1. P1: rozbicie `RoadInfraRepository` na repozytoria domenowe.
2. P1: rozbicie `RoadInfraService` na czytelne use case'y workspace/object/road-section.
3. P2: model bledow i retry w frontend API service/store.
4. P2: wydzielenie komponentow tabeli, mapy i formularza w `data-management`.
5. P2: paginacja i filtrowanie backendowe dla list.
6. P2: pelny IAM/logowanie UI po wyborze dostawcy tozsamosci.
