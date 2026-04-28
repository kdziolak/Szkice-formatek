# Frontend

Frontend jest projektowany jako aplikacja Angular z warstwami `core`, `shared`, `shell` i zestawem modulow `features/*`.

## Glowne obszary

- `dashboard/` - widok startowy i KPI,
- `data-management/` - praca na mapie, tabeli i filtrach,
- `object-editor/` - formularze i szczegoly obiektu,
- `reference-binding/` - laczenie z danymi referencyjnymi,
- `import/` - importy i monitoring wsadow,
- `validation/` - prezentacja bledow i statusu walidacji,
- `reports/` - uruchamianie i pobieranie raportow,
- `administration/` - slowniki, uprawnienia, konfiguracja.

Kolejny etap powinien dodac minimalny shell aplikacji z routingiem, mapa OpenLayers i lista odcinkow drogowych.

## Zaimplementowany vertical slice: wprowadzanie obiektow

Aktualny frontend zawiera pierwszy pionowy wycinek trybu zarzadzania danymi:

- `src/app/features/data-management/` sklada ekspercki workspace `mapa + tabela + formatka + walidacja`,
- `src/app/map/object-entry-map.component.ts` obsluguje OpenLayers, selekcje obiektow oraz rysowanie geometrii punktowej, liniowej i powierzchniowej,
- `src/app/state/object-entry-workspace.store.ts` synchronizuje zaznaczenie i stan roboczy miedzy mapa, tabela i formularzem,
- `src/app/core/mock-object-entry-api.service.ts` symuluje docelowy przeplyw draft commands do czasu implementacji backendu.

Mock API jest celowo ograniczony do warstwy frontendu. Nie zastepuje docelowej logiki backendu: walidacja domenowa, historia zmian, konflikty draftu i publikacja produkcyjna pozostaja odpowiedzialnoscia Spring Boot + MS SQL.

Walidacja widoczna w tym MVP jest pre-checkiem interfejsu. Nie nalezy jej traktowac jako kanonicznej walidacji domenowej ani jako finalnego kontraktu API.

### Uruchamianie

```powershell
npm install
npm run build
npm run start
```

Widok startowy jest dostepny pod sciezka `/zarzadzanie-danymi`.
