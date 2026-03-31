# Frontend

Frontend jest projektowany jako aplikacja Angular z warstwami `core`, `shared`, `shell` i zestawem modulow `features/*`.

## Runtime lokalny
Frontend lokalnie uruchamiamy przez repo-local Node 22.12.0 z katalogu `.local-runtime/node-22.12.0`.

1. Zainstaluj repo-local runtime:
   `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap\install-node22.ps1`
2. Sprawdz lokalne srodowisko:
   `powershell -ExecutionPolicy Bypass -File .\scripts\dev\doctor.ps1`
3. Uruchom frontendowy workflow:
   `powershell -ExecutionPolicy Bypass -File .\scripts\dev\frontend-check.ps1`

## Glowne obszary

- `dashboard/` - widok startowy i KPI,
- `data-management/` - praca na mapie, tabeli i filtrach,
- `object-editor/` - formularze i szczegoly obiektu,
- `reference-binding/` - laczenie z danymi referencyjnymi,
- `import/` - importy i monitoring wsadow,
- `validation/` - prezentacja bledow i statusu walidacji,
- `reports/` - uruchamianie i pobieranie raportow,
- `administration/` - slowniki, uprawnienia, konfiguracja.
