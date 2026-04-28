# 04. Wytyczne UI/UX

## Status dokumentu

- Status: wytyczne przekrojowe dla ekranów GIS i formularzy ewidencyjnych.
- Data: 2026-04-25.
- Zakres: mapa, tabela, formularz, import, walidacja, wersje robocze, książka drogi, GUS.
- Poza zakresem: szczegółowy design system komponentów i finalne makiety wszystkich ekranów.

## Charakter aplikacji

UI ma przypominać profesjonalną aplikację desktopową klasy GIS/CAD/Office. Priorytetem jest szybka praca eksperta, porównywanie danych i naprawa błędów, a nie marketingowa prezentacja systemu.

Widok podstawowy powinien składać się z:

- mapy jako głównego kontekstu przestrzennego,
- tabeli jako szybkiego indeksu obiektów,
- formularza jako miejsca edycji atrybutów i referencji,
- panelu walidacji jako listy problemów prowadzących do konkretnego obiektu, pola lub miejsca na mapie,
- paska statusu pokazującego aktywną wersję roboczą, stan publikacji, układ współrzędnych i zakres filtra.

## Synchronizacja mapa-tabela-formularz

| Akcja użytkownika | Wymagane zachowanie |
| --- | --- |
| Kliknięcie obiektu na mapie | Zaznaczenie tego samego rekordu w tabeli i otwarcie formularza szczegółów |
| Zaznaczenie rekordu w tabeli | Podświetlenie geometrii na mapie, przewinięcie formularza do sekcji identyfikacji |
| Kliknięcie błędu walidacji | Fokus na obiekcie, polu formularza i fragmencie mapy powiązanym z błędem |
| Zmiana filtra drogi lub odcinka | Jednoczesna zmiana zakresu mapy, tabeli i listy walidacji |
| Zmiana statusu wersji roboczej | Odświeżenie stylu mapy, liczników tabeli i dostępnych akcji formularza |

Nie wolno tworzyć widoków, w których mapa, tabela i formularz pokazują różne zakresy bez jawnego komunikatu.

## System referencyjny w UI

System referencyjny musi być widoczny dla operatora przy każdej edycji obiektu.

Minimalne elementy UI:

- selektor drogi,
- selektor odcinka,
- pozycja punktowa albo zakres od-do,
- informacja o układzie współrzędnych geometrii,
- wskaźnik zgodności geometrii z referencją,
- akcja przeliczenia referencji z geometrii,
- akcja podglądu geometrii względem osi drogi.

Jeżeli obiekt ma geometrię, ale nie ma powiązania referencyjnego, formularz pokazuje błąd blokujący publikację. Jeżeli ma referencję, ale geometria leży poza tolerancją, panel walidacji prowadzi do korekty geometrii albo potwierdzenia wyjątku.

## Wersje robocze i dane opublikowane

Wersje robocze muszą być odróżnione wizualnie od danych opublikowanych.

| Stan | Styl w tabeli | Styl na mapie | Akcje |
| --- | --- | --- | --- |
| Opublikowany | Neutralny status i data publikacji | Stabilna symbolika warstwy produkcyjnej | Podgląd, utworzenie zmiany roboczej |
| Nowy w drafcie | Etykieta `Nowy` i identyfikator draftu | Niebieski obrys lub podświetlenie robocze | Edycja, walidacja, odrzucenie |
| Zmieniony w drafcie | Etykieta `Zmieniony` i liczba zmian | Bursztynowy obrys z podglądem różnic | Porównanie, edycja, walidacja |
| Do archiwizacji | Etykieta `Archiwizacja` | Szary styl przerywany | Cofnięcie decyzji, publikacja po walidacji |
| Błąd blokujący | Etykieta `Błąd` | Czerwone oznaczenie problemu, nie jako typ obiektu | Naprawa wskazanego pola lub geometrii |

Kolor nie może być jedynym nośnikiem informacji. Każdy status wymaga etykiety, ikony albo komunikatu tekstowego.

## Symbolika mapy

Symbolika mapowa wynika z logiki infrastruktury drogowej:

- oś drogi jest warstwą orientacyjną i powinna mieć najwyższą czytelność przy pracy referencyjnej,
- odcinki drogi pokazują zakres obowiązywania danych i filtrów,
- obiekty punktowe mają czytelne ikony zależne od typu,
- obiekty liniowe są rysowane zgodnie z przebiegiem i nie powinny mylić się z osią drogi,
- obiekty powierzchniowe mają wypełnienie półprzezroczyste i wyraźny obrys,
- problemy walidacyjne są warstwą nakładkową, a nie alternatywną symboliką typów obiektów.

Jeżeli używany jest GeoServer, style warstw opublikowanych powinny być utrzymywane jako osobne artefakty konfiguracyjne. Drafty i wyniki walidacji mogą być renderowane przez frontend lub backend, ale muszą być oznaczone jako robocze.

## Tabela

Tabela jest narzędziem eksperckim, nie tylko listą podglądową.

Minimalne kolumny dla obiektów:

- identyfikator ewidencyjny,
- typ obiektu,
- droga,
- odcinek,
- lokalizacja referencyjna,
- status,
- źródło danych,
- data ostatniej zmiany,
- liczba błędów blokujących,
- liczba ostrzeżeń,
- status wersji roboczej.

Tabela musi wspierać sortowanie, filtrowanie po drodze/odcinku/statusie/typie, zaznaczanie wielu rekordów i przejście do obiektu na mapie.

## Formularz

Formularz powinien być podzielony na stałe sekcje:

1. Identyfikacja.
2. Lokalizacja referencyjna.
3. Geometria i źródło.
4. Atrybuty typu obiektu.
5. Status i historia.
6. Walidacja.
7. Załączniki i materiały źródłowe.

Komunikaty błędów muszą wskazywać konkretną naprawę. Przykład poprawnego komunikatu: `Brak odcinka referencyjnego. Wybierz odcinek albo użyj akcji wyznaczenia odcinka z geometrii.` Przykład niepoprawny: `Niepoprawne dane.`

## Import

Ekran importu powinien prowadzić operatora przez kolejne kroki:

1. Wybór źródła i zakresu.
2. Mapowanie kolumn i typów obiektów.
3. Podgląd geometrii i SRID.
4. Utworzenie wersji roboczej.
5. Walidacja techniczna i domenowa.
6. Naprawa błędów.
7. Publikacja albo odrzucenie partii.

Import nigdy nie powinien kończyć się cichym zapisem do stanu opublikowanego. Po imporcie użytkownik musi widzieć liczbę obiektów nowych, zmienionych, odrzuconych, z błędami blokującymi i z ostrzeżeniami.

## Książka drogi

Widok książki drogi powinien jasno wskazywać:

- drogę i zakres odcinków,
- datę stanu danych,
- czy raport bazuje na danych opublikowanych,
- braki blokujące wygenerowanie kompletnej książki,
- historię publikacji wpływających na raport,
- materiały źródłowe i załączniki.

Nie wolno generować raportu książki drogi z wersji roboczej bez oznaczenia `podgląd roboczy`.

## GUS i raportowanie terytorialne

Funkcje GUS powinny być widoczne jako częściowo przygotowane do czasu zatwierdzenia prawnego. UI może pokazywać kod TERYT, jednostkę terytorialną i agregacje pomocnicze, ale raporty oznaczone jako oficjalne muszą być zablokowane, jeżeli brakuje zatwierdzonego mapowania pól.

Minimalny komunikat dla funkcji niezatwierdzonej: `Zakres raportu GUS wymaga weryfikacji prawnej przed użyciem oficjalnym.`

## Dostępność i praca klawiaturą

- Wszystkie akcje tabeli i formularza muszą być dostępne z klawiatury.
- Fokus powinien przechodzić z listy walidacji do właściwego pola formularza.
- Kolory statusów muszą mieć tekstową alternatywę.
- Komunikaty błędów muszą być czytelne dla czytników ekranu.
- Gęsty układ ekspercki nie może wymuszać poziomego przewijania podstawowych formularzy na typowych ekranach biurowych.
