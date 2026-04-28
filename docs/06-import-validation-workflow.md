# 06. Workflow importu i walidacji

## Status dokumentu

- Status: opis procesu dla prototypu i dalszej implementacji.
- Data: 2026-04-25.
- Zakres: import danych, wersje robocze, walidacja, publikacja, PostGIS, opcjonalny GeoServer, książka drogi i GUS.
- Poza zakresem: konkretne mapowania wszystkich formatów importowych i implementacja konektorów.

## Źródła importu

| Źródło | Przykłady danych | Status |
| --- | --- | --- |
| Pliki eksperckie | XLSX, CSV, GeoJSON, SHP, GPKG | Dozwolone w prototypie po mapowaniu kolumn i SRID |
| Systemy wewnętrzne | SAP HANA, rejestry zarządcy, eksporty tabelaryczne | Wymagają adaptera i rejestrowania źródła |
| GUGiK i geoportale | Podkłady, warstwy referencyjne, dane pomocnicze | Wymagają potwierdzenia licencji i zasad użycia |
| PostGIS | Dane opublikowane, referencyjne i robocze | Prototypowe źródło danych przestrzennych |
| GUS/TERYT | Jednostki terytorialne, kody, agregacje | Częściowo przygotowane; raporty wymagają weryfikacji prawnej |
| Edycja ręczna | Korekta geometrii, referencji i atrybutów | Zawsze zapisywana do wersji roboczej |

## Zasada nadrzędna

Import nigdy nie zapisuje danych bezpośrednio do stanu opublikowanego. Każda partia importu tworzy lub uzupełnia wersję roboczą, przechodzi walidację i wymaga świadomej publikacji.

## Przepływ importu

1. Operator wybiera zakres importu: droga, odcinek, obszar mapy, typ obiektu albo jednostka terytorialna.
2. System tworzy `ImportBatch` i przypisuje go do `DraftVersion`.
3. Backend zapisuje oryginalny materiał źródłowy oraz metadane źródła.
4. Parser sprawdza strukturę pliku lub odpowiedzi systemu zewnętrznego.
5. Dane trafiają do strefy staging w PostGIS.
6. Geometrie są normalizowane do zatwierdzonego SRID.
7. System mapuje typy obiektów i atrybuty na słowniki domenowe.
8. Backend wyznacza albo weryfikuje `ReferenceBinding`.
9. System porównuje rekordy z danymi opublikowanymi i innymi wersjami roboczymi.
10. Walidacja techniczna i domenowa tworzy listę `ValidationIssue`.
11. Operator naprawia błędy w mapie, tabeli i formularzu.
12. Po braku błędów blokujących operator publikuje wersję roboczą.
13. Backend zapisuje `PublicationEvent`, aktualizuje stan opublikowany i zamyka draft.
14. Warstwy mapowe i raporty odczytują nowy stan opublikowany. GeoServer, jeżeli jest używany, publikuje tylko widoki opublikowane.

## Poziomy problemów walidacyjnych

| Poziom | Znaczenie | Efekt |
| --- | --- | --- |
| `BLOCKER` | Problem uniemożliwia publikację albo bezpieczny import | Publikacja zablokowana |
| `WARNING` | Dane mogą być opublikowane tylko po świadomej decyzji lub późniejszym uzupełnieniu | Publikacja możliwa, jeżeli reguły organizacji na to pozwalają |
| `INFO` | Informacja techniczna lub sugestia poprawy | Nie blokuje publikacji |

## Reguły walidacyjne

| Obszar | Reguła | Poziom domyślny |
| --- | --- | --- |
| Plik źródłowy | Brak wymaganego arkusza, kolumny lub geometrii | `BLOCKER` |
| SRID | Brak SRID albo nieobsługiwany układ współrzędnych | `BLOCKER` |
| Typ geometrii | Obiekt punktowy ma linię lub poligon, obiekt liniowy ma punkt | `BLOCKER` |
| Poprawność geometrii | Pusta geometria, samoprzecięcie, błędny pierścień poligonu | `BLOCKER` albo `WARNING` zależnie od typu |
| System referencyjny | Brak drogi, odcinka, pozycji albo zakresu | `BLOCKER` |
| Tolerancja referencji | Geometria leży poza ustaloną tolerancją od osi lub odcinka | `BLOCKER` lub `WARNING` |
| Konflikt publikacji | Import modyfikuje obiekt zmieniony po utworzeniu draftu | `BLOCKER` |
| Status | Niepoprawne przejście statusu, np. archiwizacja bez powodu | `BLOCKER` |
| Historia | Brak autora, daty, źródła lub powodu zmiany | `BLOCKER` |
| Książka drogi | Brak pola wymaganego do raportu książki drogi | `WARNING` albo `BLOCKER` po decyzji prawnej |
| GUS/TERYT | Brak kodu TERYT lub niepotwierdzony zakres raportu | `WARNING`; raport oficjalny zablokowany do weryfikacji prawnej |
| Licencja źródła | Brak potwierdzenia warunków użycia danych | `WARNING` albo `BLOCKER` według polityki organizacji |

## Obsługa konfliktów

Konflikt występuje, gdy:

- ten sam obiekt jest zmieniany w dwóch otwartych draftach,
- obiekt opublikowany zmienił się po utworzeniu draftu,
- import tworzy duplikat identyfikatora biznesowego,
- geometria nowego obiektu nachodzi na istniejący obiekt tego samego typu w niedozwolony sposób,
- zakres referencyjny dwóch obiektów jest sprzeczny z regułami domenowymi.

System powinien pokazać operatorowi konflikt w tabeli, mapie i formularzu. Publikacja konfliktu jest blokowana do czasu wyboru jednej z decyzji: scal, zastąp, zachowaj istniejący, utwórz nowy obiekt, odrzuć importowany rekord.

## Praca w PostGIS

W prototypie PostGIS przechowuje dane przestrzenne i robocze. Zalecany przepływ techniczny:

1. Oryginalny import jest rejestrowany w metadanych `ImportBatch`.
2. Surowe geometrie trafiają do `staging`.
3. Znormalizowane obiekty robocze trafiają do `draft`.
4. Walidacja korzysta z funkcji przestrzennych PostGIS oraz reguł domenowych backendu.
5. Publikacja przenosi zaakceptowany stan do `published`.
6. Historia i zdarzenia trafiają do `audit`.

Frontend i GeoServer nie zapisują bezpośrednio do tych schematów. Każda operacja zapisu przechodzi przez backend.

## Opcjonalny GeoServer

GeoServer może zostać użyty po publikacji do:

- wystawienia warstw WMS/WFS ze schematu lub widoków `published`,
- zastosowania zatwierdzonych stylów map techniczno-eksploatacyjnych,
- przyspieszenia podglądu dużych warstw opublikowanych.

GeoServer nie jest narzędziem importu, walidacji ani edycji draftów. Warstwy robocze mogą być pokazywane w UI przez API backendu albo osobne warstwy techniczne oznaczone jako nieoficjalne.

## Książka drogi po publikacji

Po publikacji system powinien:

- odnotować zdarzenie wpływające na książkę drogi,
- wskazać, które sekcje raportu zmieniły się po publikacji,
- umożliwić wygenerowanie podglądu stanu na dzień,
- pokazać braki pól raportowych jako problemy walidacyjne.

Książka drogi generowana z draftu jest tylko podglądem roboczym i musi być tak oznaczona.

## GUS po imporcie

Po imporcie system może przypisać jednostkę TERYT do drogi lub odcinka, jeżeli dane źródłowe i geometria na to pozwalają. Raporty GUS pozostają częściowo przygotowane do czasu:

- zatwierdzenia źródła TERYT,
- zatwierdzenia cyklu aktualizacji,
- zatwierdzenia formularzy lub zakresu agregacji,
- określenia odpowiedzialności za oficjalne przekazanie danych.

Brak tej decyzji nie blokuje zwykłej pracy ewidencyjnej, ale blokuje oznaczenie raportu GUS jako oficjalnego.

## Kryteria akceptacji procesu

- Import tworzy `ImportBatch` i `DraftVersion`.
- Żaden rekord importu nie trafia bezpośrednio do stanu opublikowanego.
- Każdy obiekt ma geometrię z SRID albo błąd blokujący.
- Każdy obiekt ewidencyjny ma powiązanie z systemem referencyjnym albo błąd blokujący.
- Operator widzi wyniki walidacji na mapie, w tabeli i w formularzu.
- Publikacja bez błędów blokujących zapisuje `PublicationEvent`.
- Książka drogi korzysta ze stanu opublikowanego.
- Funkcje GUS są oznaczone jako wymagające weryfikacji prawnej, dopóki nie ma zatwierdzonego mapowania.
