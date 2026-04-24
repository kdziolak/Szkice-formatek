# Macierz pokrycia diagramów SCPR

## Źródło

- Podstawowe źródło: `C:\Users\k.dziolak\Desktop\Użytkownik otwiera w module ZID rej.txt`
- Diagram docelowy: `docs/diagrams/scpr-rejestr-zmian-i-awarii.drawio`

## Macierz

| ID | Nazwa | Źródło w TXT | Strona diagramu | Poziom pokrycia | Komentarz |
| --- | --- | --- | --- | --- | --- |
| `SCN_SCPR_00` | Otwiera i przegląda rejestr awarii i zmian stacji SCPR | akapit wstępny + opis wejść do rejestru | `01 Mapa kontekstowa`, `08 Widoki UI` | pełne | formalne ID nie występuje w TXT, scenariusz wydzielony z opisu ogólnego |
| `SCN_SCPR_00A` | Filtruje rejestr wg stacji, typu, statusu i zakresu dat | akapit wstępny | `08 Widoki UI`, `09 Macierz UC` | pełne | odwzorowano panel filtrów i kontekst danych historycznych |
| `UC_ZID_02_07_01` | Rejestruje zgłoszenie awarii / zmiany | sekcja `6.2.9.1` | `02 Utworzenie zgłoszenia`, `06 Stany zgłoszenia` | pełne | dodano decyzję o konflikcie aktywnej awarii jako założenie projektowe |
| `UC_ZID_02_07_02` | Aktualizuje zgłoszenie awarii stacji | sekcja `6.2.9.2` | `03 Aktualizacja zgłoszenia`, `06 Stany zgłoszenia` | pełne | historia i powiadomienie ujęte, powiadomienie oznaczone jako założenie projektowe |
| `UC_ZID_02_07_03` | Aktualizuje zgłoszenie zmiany stacji | sekcja `6.2.9.3` | `03 Aktualizacja zgłoszenia`, `05 Rejestr zmian stacji` | pełne | odwzorowano aktualizację stanu obowiązującego stacji |
| `UC_ZID_02_07_04` | Zamyka zgłoszenie awarii lub zmiany | sekcja `6.2.9.4` | `04 Zamknięcie zgłoszenia`, `06 Stany zgłoszenia` | pełne | blokada dalszej edycji po zamknięciu oznaczona jako założenie projektowe |
| `UC_ZID_02_07_05` | Usuwa błędnie zarejestrowane zgłoszenie | sekcja `6.2.9.5` | `04 Zamknięcie zgłoszenia`, `09 Macierz UC` | częściowe | pełny osobny diagram usunięcia nie był wymagany, operacja została opisana w macierzy, analizie i pytaniach otwartych |
| `UC_ZID_02_07_06` | Monitoruje aktywne zgłoszenia awarii i generuje zestawienia | sekcja `6.2.9.6` | `01 Mapa kontekstowa`, `08 Widoki UI` | pełne | monitoring pokazano jako kontekst rejestru i filtr aktywnych awarii |
| `BR_01` | Powiązanie zgłoszenia z konkretną stacją | opis ogólny + wszystkie UC | `01 Mapa kontekstowa`, `02 Utworzenie zgłoszenia`, `07 Model danych` | pełne | reguła spójna ze źródłem i domeną repozytorium |
| `BR_02` | Historia i audyt każdej istotnej zmiany | `6.2.9.2`, `6.2.9.3`, `6.2.9.4`, `6.2.9.5` | `03 Aktualizacja zgłoszenia`, `04 Zamknięcie zgłoszenia`, `07 Model danych` | pełne | audyt usunięcia pokazany oddzielnie od historii statusu |
| `BR_03` | Rozróżnienie awarii i zmiany | cały opis funkcji | `05 Rejestr zmian stacji`, `06 Stany zgłoszenia`, `07 Model danych` | pełne | dodatkowe rozróżnienia administracyjne i ewidencyjne są założeniem projektowym |
| `BR_04` | Dane historyczne na wskazany dzień | opis ogólny rejestru | `01 Mapa kontekstowa`, `08 Widoki UI` | pełne | wprowadzono datę podglądu historycznego |
| `BR_05` | Integracja z mapą GIS i kartą stacji | opis wejść do rejestru | `01 Mapa kontekstowa`, `08 Widoki UI` | pełne | zgodne z zasadą repo `mapa ↔ tabela ↔ formularz` |

## Uwagi

1. `UC_ZID_02_07_05` nie otrzymał osobnej strony procesu, ponieważ zadanie wymagało obowiązkowo 10 innych stron. Operacja usunięcia została więc ujęta na stronie zamknięcia jako czynność kontrolowana oraz w analizie i pytaniach otwartych.
2. Pola `załącznik`, `priorytet`, `odcinek drogi` i `lokalizacja GIS` zostały dopisane jako `ZAŁOŻENIE PROJEKTOWE`, bo zadanie końcowe ich wymaga, ale TXT nie opisuje ich literalnie.
