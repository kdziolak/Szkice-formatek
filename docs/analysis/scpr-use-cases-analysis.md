# Analiza przypadków użycia SCPR - rejestr zmian i awarii

## Cel

Dokument porządkuje wymagania wejściowe do projektu diagramów `draw.io` dla procesu zarządzania rejestrem zmian i awarii stacji ciągłego pomiaru ruchu w systemie ZID.

## Źródło wejściowe

- Główne źródło: `C:\Users\k.dziolak\Desktop\Użytkownik otwiera w module ZID rej.txt`
- Uzupełniający kontekst repozytorium:
- `docs/architecture/system-overview.md`
- `docs/domain/domain-model.md`
- `docs/domain/object-lifecycle.md`
- `docs/ux/data-management-mode.md`
- `docs/ux/design-principles.md`
- `docs/ux/screen-map.md`

## Zakres źródła TXT

Plik TXT opisuje:

- wejścia do rejestru awarii i zmian stacji SCPR,
- przegląd danych bieżących i historycznych,
- filtrowanie rejestru,
- rejestrację zgłoszenia awarii lub zmiany,
- aktualizację zgłoszenia awarii,
- aktualizację zgłoszenia zmiany,
- zamknięcie zgłoszenia,
- usunięcie błędnie zarejestrowanego zgłoszenia,
- monitoring aktywnych awarii i generowanie zestawień.

## Lista przypadków użycia

| ID | Nazwa | Pochodzenie |
| --- | --- | --- |
| `SCN_SCPR_00` | Otwiera i przegląda rejestr awarii i zmian stacji SCPR | opis ogólny z wprowadzenia do TXT |
| `SCN_SCPR_00A` | Filtruje rejestr wg stacji, typu, statusu i zakresu dat | opis ogólny z wprowadzenia do TXT |
| `UC_ZID_02_07_01` | Rejestruje zgłoszenie awarii / zmiany stacji ciągłego pomiaru ruchu | wprost z TXT |
| `UC_ZID_02_07_02` | Aktualizuje zgłoszenie awarii stacji | wprost z TXT |
| `UC_ZID_02_07_03` | Aktualizuje zgłoszenie zmiany stacji | wprost z TXT |
| `UC_ZID_02_07_04` | Zamyka zgłoszenie awarii lub zmiany | wprost z TXT |
| `UC_ZID_02_07_05` | Usuwa błędnie zarejestrowane zgłoszenie awarii / zmiany | wprost z TXT |
| `UC_ZID_02_07_06` | Monitoruje aktywne zgłoszenia awarii i generuje zestawienia | wprost z TXT |

## Aktorzy

| Aktor | Rola w procesie |
| --- | --- |
| `Uprawniony użytkownik ZID` | przegląda, filtruje, dodaje, aktualizuje, zamyka i usuwa zgłoszenia |
| `Użytkownik modułu IRD` | otwiera widok rejestru w analogicznym kontekście integracyjnym |
| `System ZID` | waliduje dane, zapisuje rejestr, nadaje identyfikatory i statusy, prowadzi historię i audyt |
| `Rejestr historyczny / stan na datę` | kontekst danych historycznych dostępnych do przeglądu |

## Encje biznesowe

### Encje wynikające wprost z TXT

- `StacjaPomiaruRuchu`
- `StanowiskoPomiarowe`
- `ZgloszenieAwarii`
- `ZgloszenieZmiany`
- `RejestrAwariiIZmian`
- `HistoriaAwarii`
- `HistoriaZmianKonfiguracyjnych`
- `JednostkaZglaszajaca`
- `RodzajAwarii`
- `RodzajZmiany`
- `ZestawienieAktywnychAwarii`
- `DziennikAudytowy`

### Encje wymagane przez projekt diagramów

- `RejestrZdarzen`
- `HistoriaStatusu`
- `Uzytkownik`
- `JednostkaOrganizacyjna`

### ZAŁOŻENIE PROJEKTOWE

Poniższe encje nie zostały nazwane w TXT, ale są potrzebne do odwzorowania wymagań zadania i integracji GIS:

- `Zalacznik`
- `LokalizacjaGIS`
- `OdcinekReferencyjny`
- `SlownikStatusow`
- `SlownikTypowAwarii`
- `SlownikTypowZmian`

## Dane wejściowe i wyjściowe

### Dane wejściowe wynikające z TXT

- stacja SCPR,
- stanowisko,
- typ zgłoszenia: `awaria` lub `zmiana`,
- data i godzina zgłoszenia,
- jednostka zgłaszająca,
- rodzaj awarii lub rodzaj zmiany,
- opis zdarzenia,
- data i godzina wystąpienia,
- data i godzina usunięcia lub zakończenia,
- status realizacji,
- kryteria filtrów: stacja, typ zgłoszenia, status, zakres dat.

### ZAŁOŻENIE PROJEKTOWE

Na potrzeby diagramów i UI przyjęto dodatkowe pola:

- numer zgłoszenia,
- priorytet,
- autor wpisu,
- załączniki,
- odcinek drogi,
- lokalizacja GIS,
- powiązanie z jednostką organizacyjną,
- metadane audytowe utworzenia i modyfikacji.

### Dane wyjściowe procesu

- nowy wpis w rejestrze awarii i zmian,
- nadany identyfikator zgłoszenia,
- status początkowy lub końcowy,
- zaktualizowany stan obowiązujący stacji dla zgłoszeń typu zmiana,
- wpis w historii i audycie,
- zaktualizowana lista zgłoszeń,
- zestawienie aktywnych awarii.

## Statusy

### Statusy wynikające wprost z TXT

- `Zgłoszona`
- `W trakcie usuwania`
- `Usunięta`
- `Rozwiązana`
- `Zrealizowana`
- `Wprowadzona`

### ZAŁOŻENIE PROJEKTOWE

Na potrzeby diagramu stanów i walidacji przyjęto dodatkowe statusy techniczne lub pośrednie:

- `W realizacji`
- `Usunięte błędnie`
- `Aktywne`
- `Zamknięte`

Dodatkowe statusy są pomocnicze i zostały oznaczone jako projektowe, ponieważ TXT nie definiuje pełnego słownika przejść.

## Procesy główne

### 1. Przegląd i filtrowanie rejestru

- wejście do rejestru z drzewa warstw,
- wejście z listy stacji SCPR,
- wejście z karty obiektu na mapie,
- wejście z modułu IRD,
- ustawienie daty podglądu historycznego,
- filtracja listy zgłoszeń,
- przejście do szczegółów i historii dla wybranej stacji.

### 2. Rejestracja zgłoszenia

- wybór stacji i stanowiska,
- wskazanie typu zgłoszenia,
- uzupełnienie danych wymaganych,
- walidacja kompletności i spójności,
- zapis do rejestru,
- nadanie identyfikatora i statusu początkowego.

### 3. Aktualizacja zgłoszenia awarii

- odszukanie istniejącego zgłoszenia,
- korekta typu awarii, dat, statusu i opisu,
- walidacja chronologii i powiązania ze stacją,
- zapis zmian wraz z autorem i czasem modyfikacji.

### 4. Aktualizacja zgłoszenia zmiany

- odszukanie zgłoszenia zmiany,
- korekta rodzaju zmiany i parametrów obowiązujących po zmianie,
- walidacja kompletności,
- aktualizacja stanu obowiązującego stacji,
- zapis do historii zmian konfiguracyjnych.

### 5. Zamknięcie zgłoszenia

- wybór akcji zamknięcia,
- podanie daty i godziny zakończenia,
- wybór statusu końcowego zależnego od typu zgłoszenia,
- walidacja chronologii,
- zapis do historii,
- odświeżenie widoków i obliczenie czasu trwania awarii.

### 6. Usunięcie błędnego zgłoszenia

- wybór zgłoszenia do usunięcia,
- ostrzeżenie o nieodwracalności operacji,
- podanie przyczyny usunięcia,
- weryfikacja uprawnień i stanu zgłoszenia,
- trwałe usunięcie z rejestru operacyjnego,
- zapis faktu usunięcia w audycie.

### 7. Monitoring aktywnych awarii

- podgląd aktywnych awarii w rejestrze i w kontekście stacji,
- filtrowanie aktywnych zgłoszeń,
- generowanie zestawienia raportowego.

## Wyjątki i walidacje

### Wynikające wprost z TXT

- brak wymaganych pól formularza,
- niespójne powiązanie stacji ze stanowiskiem,
- błędna chronologia dat,
- próba usunięcia zgłoszenia zamkniętego,
- próba usunięcia zgłoszenia wykorzystanego w raportach lub analizach,
- brak uprawnień do modyfikacji lub usunięcia,
- pusty wynik filtracji.

### ZAŁOŻENIE PROJEKTOWE

- walidacja istnienia stacji w centralnej ewidencji,
- walidacja konfliktu z innym aktywnym zgłoszeniem dla tej samej stacji,
- walidacja poprawności przejścia statusu,
- walidacja załączników i komentarzy,
- blokada zwykłej edycji po zamknięciu zgłoszenia poza trybem administracyjnym.

## Wymagane ekrany i komponenty UI

### Ekrany

- lista stacji SCPR,
- karta stacji,
- rejestr awarii i zmian,
- formularz zgłoszenia awarii,
- formularz zgłoszenia zmiany,
- szczegóły zgłoszenia,
- historia statusów i historii zmian,
- widok aktywnych awarii,
- panel filtrów,
- wejście kontekstowe z modułu IRD.

### Kluczowe komponenty

- panel warstw z akcją otwarcia rejestru,
- tabela wyników rejestru,
- panel filtrów z datą podglądu historycznego,
- mapa z wyborem stacji i przejściem do szczegółów,
- zakładka `Awarie i zmiany` na karcie stacji,
- formularz z sekcjami danych podstawowych i statusowych,
- panel historii,
- pasek akcji: dodaj, edytuj, zamknij, usuń, generuj zestawienie.

### Reguły UX wynikające z repozytorium

- mapa, tabela i formularz muszą działać w jednym kontekście pracy,
- zaznaczenie na mapie synchronizuje tabelę i panel szczegółów,
- filtracja musi działać wspólnie dla mapy i tabeli,
- walidacja ma prowadzić użytkownika do naprawy błędu.

## Mapowanie na diagramy

| Przypadek użycia | Diagram główny | Diagram uzupełniający |
| --- | --- | --- |
| `SCN_SCPR_00` | Strona 1 - mapa kontekstowa procesu | Strona 8 - widoki UI |
| `SCN_SCPR_00A` | Strona 8 - widoki UI | Strona 9 - macierz UC |
| `UC_ZID_02_07_01` | Strona 2 - proces utworzenia zgłoszenia awarii | Strona 6 - diagram stanów |
| `UC_ZID_02_07_02` | Strona 3 - proces aktualizacji zgłoszenia | Strona 6 - diagram stanów |
| `UC_ZID_02_07_03` | Strona 3 - proces aktualizacji zgłoszenia | Strona 5 - rejestr zmian stacji |
| `UC_ZID_02_07_04` | Strona 4 - proces zamknięcia zgłoszenia | Strona 6 - diagram stanów |
| `UC_ZID_02_07_05` | Strona 4 - proces zamknięcia zgłoszenia | Strona 9 - macierz UC |
| `UC_ZID_02_07_06` | Strona 1 - mapa kontekstowa procesu | Strona 8 - widoki UI |

## Najważniejsze założenia projektowe

1. Rejestr SCPR jest modelowany jako jeden obszar funkcjonalny obejmujący awarie i zmiany, z rozróżnieniem typu zgłoszenia.
2. Historia statusów i historia zmian są odrębnymi perspektywami tego samego cyklu życia zgłoszenia.
3. UI przyjmuje układ ekspercki `mapa + tabela + panel szczegółów`, zgodny z dokumentami `docs/ux`.
4. Część wymaganych przez zadanie pól i encji nie występuje wprost w TXT i została oznaczona jako `ZAŁOŻENIE PROJEKTOWE`.
5. Powiązanie z odcinkiem referencyjnym i lokalizacją GIS jest pokazane w diagramach, ponieważ wynika z zasad domenowych repozytorium, ale nie jest literalnie opisane w źródle TXT.
