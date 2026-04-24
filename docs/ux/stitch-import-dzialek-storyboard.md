# Storyboard Stitch: import działek z SAP HANA do draftu

## Cel

Ten dokument zapisuje wynik realizacji storyboardu procesu importu działek w Stitch.
Storyboard został przygotowany jako osobny projekt low-fidelity dla analizy biznesowej i UX procesu zasilania warstwą działek.

## Projekt Stitch

- Tytuł projektu: `ZID - Import działek z SAP HANA do draftu`
- Id projektu: `6399955334151103980`
- Typ: desktopowy storyboard procesu, low-fidelity, język polski
- Cel końcowy procesu: zapis do `draft` / `obszar roboczy`, bez publikacji

## Założenia układu

- Lewy panel: kroki procesu, kontekst terytorialny, źródło danych
- Środek: mapa jako główny obszar pracy, a pod nią tabela działek
- Prawy panel: podsumowanie warstwy, walidacja, konflikty, raport
- Dół: stały pasek akcji

## Zastosowane reguły projektowe

- Styl low-fidelity, bez sekcji marketingowych i bez układu mobilnego
- Neutralna, jasna paleta z akcentem wyłącznie dla stanów
- Gęstość i logika pracy zgodna z aplikacją GIS klasy desktop
- Widoczna synchronizacja: mapa + tabela + panel walidacji
- Rozróżnienie źródeł: `SAP HANA` jako źródło pliku Excel, `GUGiK` jako źródło geometrii i danych działki

## Ekrany storyboardu

1. `01 Wejście do importu działek`
   - Screen ID: `48254b83d9db46ca964a16fbc34ef202`
   - Rola: stan pusty, wejście do procesu, nieaktywne akcje

2. `02 Kontekst i wybór pliku`
   - Screen ID: `807a4ce7869d422e826375eb3fb65490`
   - Rola: wybór jednostki terytorialnej, jednostki administracji drogowej i pliku Excel

3. `03 Analiza pliku i pobranie danych z GUGiK`
   - Screen ID: `cd606b3d46f7400b9d146dc9fb70077b`
   - Rola: analiza pliku, sprawdzenie formatu i pól obowiązkowych, pobranie danych przestrzennych

4. `04 Podgląd mapy i tabela działek`
   - Screen ID: `299d659f767240fe90e70944e61cd35f`
   - Rola: zsynchronizowany podgląd mapy, tabeli i statusów działek

5. `05 Walidacja, konflikty i raport`
   - Screen ID: `db394b652af84a22a101bfb9427663d6`
   - Rola: błędy blokujące, ostrzeżenia, informacje i raport walidacyjny

6. `06 Potwierdzenie zapisu do draftu`
   - Screen ID: `20a2ac55d81f4f4694e47cff8b1998b4`
   - Rola: potwierdzenie zapisu oraz liczności działek dodanych, zaktualizowanych, zarchiwizowanych i odrzuconych

7. `07 Wynik operacji: sukces / sukces z ostrzeżeniami / błąd`
   - Screen ID: `594d2cea1788451f82af8dde9da4565e`
   - Rola: wynik operacji, przejście do draftu i pobranie raportu

## Design system i pliki pomocnicze

- Lokalny opis reguł szkicu: `.stitch/DESIGN.md`
- Aktywa Stitch zauważone w projekcie:
  - `assets/0c16e902eb29477b97562c9cecce8b9a` - `Vellum Infrastructure`
  - `assets/3e92537a56f743d2958e19beedcc71eb` - `Blueprint Draft`
  - `assets/c9f45a9eaef44a27b19f92df654bdc31` - `Carto Schematic`
- Rekomendowany referencyjny asset dla tego storyboardu:
  - `assets/c9f45a9eaef44a27b19f92df654bdc31` - `Carto Schematic`
  - powod: jest najblizszy docelowemu low-fidelity GIS i byl wykorzystywany przy pozniejszych iteracjach ekranow

## Artefakty robocze w Stitch

W projekcie poza ekranami kanonicznymi widoczne sa dodatkowe ekrany robocze utworzone podczas iteracji:

- `d1da3c571ac84481af8fef22a5d2b0c0` - `GIS Wireframe - Main Layout`
- `ce57c31b594642cdbe9bf3e8cb07d173` - dodatkowy wariant `01 Wejscie do importu dzialek`
- `c960b275a37a4f789acec57049707b1f` - dodatkowy wariant `04 Podglad mapy i tabela dzialek`
- `53acfe5e20a34c4a95f7881acc684ea1` - dodatkowy wariant `05 Walidacja, konflikty i raport`
- `aa7247b1fe114d62b424eb6062b7c76f` - dodatkowy wariant `06 Potwierdzenie zapisu do draftu`
- `64dd257233424949b1e89ad507756f9e` - dodatkowy wariant `07 Wynik operacji: sukces / sukces z ostrzezeniami / blad`

## Uwagi wykonawcze

- Stitch zwracał niespójne metadane listy ekranów w projekcie, ale wszystkie 7 ekranów zostało potwierdzone bezpośrednio przez odczyt `get_screen`.
- W projekcie widoczne sa takze dodatkowe artefakty robocze z wczesniejszych iteracji, w tym ekran startowy oraz duplikaty krokow 01 i 04-07.
- Aktualnie dostepne narzedzia Stitch w tej sesji nie udostepniaja usuwania ekranow, wiec porzadkujacy pass moze byc wykonany tylko czesciowo przez wskazanie zestawu kanonicznego i assetu referencyjnego.
- Operacje `create_design_system`, `update_design_system` i `apply_design_system` zwracaly blad `Request contains an invalid argument`, wiec nie udalo sie technicznie przepisac lub jawnie przypiac jednego assetu przez API.
- Próba pobrania lokalnych plików HTML i screenshotów do `.stitch/designs` nie zakończyła się poprawnie z powodu błędu połączenia po stronie pobierania.

## Co dalej

- Można wykonać drugi przebieg porządkujący ekran 04-07 jako warianty jednego układu referencyjnego.
- Można przygotować wersję pod Figma lub wersję pod specyfikację analityczną na bazie tego storyboardu.
