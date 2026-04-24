# Screen Map

## Glowne obszary nawigacyjne

- dashboard operacyjny,
- zarzadzanie danymi,
- edytor obiektu,
- powiazywanie referencji,
- import i walidacja,
- raporty,
- administracja.

## Przeplyw uzytkownika

Typowy przebieg pracy:

1. otwarcie dashboardu lub wyszukiwarki danych,
2. przejscie do widoku mapy albo tabeli,
3. otwarcie formularza obiektu,
4. zapis do draftu,
5. walidacja,
6. publikacja lub raportowanie.

## Przeplyw specjalizowany: import dzialek do draftu

Ten przeplyw jest osobnym storyboardem roboczym dla importu dzialek z SAP HANA do obszaru roboczego:

1. `01 Wejscie do importu dzialek`,
2. `02 Kontekst i wybor pliku`,
3. `03 Analiza pliku i pobranie danych z GUGiK`,
4. `04 Podglad mapy i tabela dzialek`,
5. `05 Walidacja, konflikty i raport`,
6. `06 Potwierdzenie zapisu do draftu`,
7. `07 Wynik operacji: sukces / sukces z ostrzezeniami / blad`.

Szczegoly tego przebiegu sa opisane w:

- `docs/ux/stitch-import-dzialek-storyboard.md`,
- `docs/ux/import-dzialek-do-draftu-spec.md`.
