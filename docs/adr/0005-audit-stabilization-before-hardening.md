# ADR 0005: Stabilizacja audytowa przed utwardzeniem produkcyjnym

## Status

Accepted

## Context

Raport audytowy wskazal, ze pion MVP Reference + RoadSection + Draft Save jest
funkcjonalnie spojny, ale wymaga stabilizacji operacyjnej przed kolejnymi
rozszerzeniami. Najwyzsze ryzyka dotycza braku CI/CD, centralnej obslugi bledow,
braku testow integracyjnych SQL, braku security oraz zbyt duzych klas
repozytorium i serwisu.

## Decision

W pierwszym kroku wdrazamy niskoryzykowne elementy stabilizacji:

- CI/CD dla backendu i frontendu;
- centralny kontrakt bledow `ProblemDetail`;
- typowany blad braku zasobu;
- indeksy wspierajace workspace, historie zmian i walidacje;
- dokumentacje wdrozenia audytu i backlog dalszego utwardzenia.

Nie wdrazamy w tej samej paczce Spring Security, duzego refaktoru repozytorium
ani Testcontainers, poniewaz wymagaja osobnych decyzji architektonicznych i
szerszej walidacji.

## Consequences

- API ma jednolity format bledow dla klienta frontendowego.
- Pipeline moze wykrywac regresje backendu i frontendu przed scaleniem.
- Baza ma indeksy dla najczesciej dotykanych danych roboczych i walidacyjnych.
- Kolejne prace audytowe maja jawny backlog i mniejszy blast radius.
