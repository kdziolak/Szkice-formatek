# ADR 0006: Security MVP JWT

## Status

Accepted

## Context

Raport audytowy wskazal brak podstawowego uwierzytelniania i autoryzacji API.
Jednoczesnie aplikacja musi pozostac wygodna do lokalnego podgladu pionu MVP,
bez wymuszania pelnego systemu IAM i ekranu logowania w tym kroku.

MVP obsluguje operacje eksperckie na danych drogowych: odczyt, workspace,
zapis roboczy i finalizacje. Backend musi umiec odroznic role odczytowe od
edytorskich oraz przypisac autora operacji do operatora z tokenu, kiedy security
jest wlaczone.

## Decision

Wprowadzamy Spring Security z OAuth2 Resource Server i JWT jako docelowym
mechanizmem autoryzacji API.

- `ROADGIS_SECURITY_ENABLED=false` pozostaje wartoscia domyslna dla pracy dev.
- Po wlaczeniu security endpointy health oraz Swagger/OpenAPI sa publiczne.
- `GET /api/**` wymaga roli `ROADGIS_VIEWER` albo `ROADGIS_EDITOR`.
- `POST`, `PUT`, `PATCH` i `DELETE /api/**` wymagaja roli `ROADGIS_EDITOR`.
- Role sa czytane z claimu `roles`.
- Wartosc bez prefiksu, np. `ROADGIS_EDITOR`, jest mapowana do authority
  `ROLE_ROADGIS_EDITOR`; wartosci juz zaczynajace sie od `ROLE_` pozostaja bez
  zmiany.
- Operator operacji jest pobierany z `preferred_username`, a gdy go brakuje z
  `sub`.
- Pole `createdBy` pozostaje w kontrakcie dla kompatybilnosci, ale w trybie
  secure backend nadpisuje autora operacji principalem JWT.

Frontend w tym pakiecie nie dostaje ekranu logowania. Dodaje jedynie interceptor,
ktory przekazuje `Authorization: Bearer <token>`, jesli token jest zapisany w
`localStorage['roadgis.auth.token']`.

## Consequences

- Lokalny podglad aplikacji dziala jak dotychczas bez tokenu.
- API ma minimalne, testowalne reguly uprawnien dla viewer/editor.
- Kolejny krok IAM moze skupic sie na providerze tozsamosci i logowaniu UI,
  bez zmiany podstawowego kontraktu ról API.
- Testy security i Testcontainers tworza podstawe pod bezpieczniejszy refaktor
  repozytorium oraz service layer.

## Deferred

- wybor produkcyjnego dostawcy tozsamosci;
- ekran logowania i odswiezanie tokenu w frontendzie;
- bardziej granularne role domenowe;
- audyt sesji i centralny rejestr operatorow.
