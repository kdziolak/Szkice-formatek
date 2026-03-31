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

W kolejnym etapie warto dodac pierwszy pion funkcjonalny: odczyt listy odcinkow drogowych wraz z kontraktem API i testem integracyjnym.
