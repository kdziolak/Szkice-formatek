# SCPR - rejestr zmian i awarii

## Cel

Pakiet diagramów opisuje proces zarządzania rejestrem zmian i awarii stacji ciągłego pomiaru ruchu w systemie ZID. Materiał jest przygotowany jako wejście dla analizy biznesowej, projektu UX/UI, modelowania domeny i implementacji.

## Źródło wejściowe

- plik źródłowy: `C:\Users\k.dziolak\Desktop\Użytkownik otwiera w module ZID rej.txt`
- kontekst repozytorium:
- `docs/architecture/system-overview.md`
- `docs/domain/domain-model.md`
- `docs/domain/object-lifecycle.md`
- `docs/ux/data-management-mode.md`
- `docs/ux/design-principles.md`
- `docs/ux/screen-map.md`

## Plik główny

- `docs/diagrams/scpr-rejestr-zmian-i-awarii.drawio`

## Lista stron

1. `01 Mapa kontekstowa`
2. `02 Utworzenie zgłoszenia`
3. `03 Aktualizacja zgłoszenia`
4. `04 Zamknięcie zgłoszenia`
5. `05 Rejestr zmian stacji`
6. `06 Stany zgłoszenia`
7. `07 Model danych`
8. `08 Widoki UI`
9. `09 Macierz UC`
10. `10 Legenda`

## Zawartość diagramów

- Strona 1 pokazuje aktorów, system ZID, stacje SCPR, rejestry, historię oraz powiązania z GIS i systemem referencyjnym.
- Strona 2 pokazuje proces utworzenia zgłoszenia awarii z walidacjami, statusem początkowym i historią.
- Strona 3 pokazuje proces aktualizacji zgłoszenia awarii lub zmiany.
- Strona 4 pokazuje proces zamknięcia zgłoszenia wraz z walidacją statusu końcowego i blokadą edycji.
- Strona 5 pokazuje rejestr zmian stacji oraz rozróżnienie rodzajów zmian.
- Strona 6 pokazuje diagram stanów oparty na statusach wynikających z TXT i oznaczonych założeniach projektowych.
- Strona 7 pokazuje model danych koncepcyjny.
- Strona 8 pokazuje uproszczone widoki UI wynikające z procesu.
- Strona 9 pokazuje macierz przypadków użycia do diagramów.
- Strona 10 pokazuje legendę i konwencję kolorów oraz kształtów.

## Założenia projektowe

1. Elementy oznaczone w diagramach jako `ZAŁOŻENIE PROJEKTOWE` nie wynikają literalnie z TXT, lecz z wymagań końcowych zadania albo z reguł domenowych repozytorium.
2. Rejestr został przedstawiony jako wspólny moduł dla awarii i zmian, z rozróżnieniem typu zgłoszenia.
3. Założono synchronizację `mapa ↔ tabela ↔ formularz`, zgodnie z dokumentami UX w repozytorium.
4. Założono obecność historii statusów, dziennika audytowego oraz kontrolowanej korekty administracyjnej po zamknięciu zgłoszenia.
5. Założono możliwość powiązania stacji z odcinkiem referencyjnym i lokalizacją GIS.

## Jak otworzyć plik

1. Otwórz `docs/diagrams/scpr-rejestr-zmian-i-awarii.drawio` w `diagrams.net` lub `draw.io Desktop`.
2. Przejdź między stronami za pomocą zakładek na dole edytora.
3. W przypadku potrzeby szybkiego przeglądu rozpocznij od strony `10 Legenda`, a następnie wróć do stron procesowych.

## Jak aktualizować diagramy

1. Zaktualizuj najpierw dokument `docs/analysis/scpr-use-cases-analysis.md`.
2. Uzupełnij `docs/analysis/scpr-diagram-coverage-matrix.md`, jeśli pojawią się nowe przypadki użycia.
3. Zachowaj polskie nazewnictwo biznesowe na diagramach.
4. Każde nowe założenie dopisz także do `docs/analysis/scpr-open-questions.md`.
5. Po zmianach wykonaj podstawową walidację XML pliku `.drawio` i sprawdź liczbę stron.
