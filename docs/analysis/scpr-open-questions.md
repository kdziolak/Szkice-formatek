# Otwarte kwestie - SCPR rejestr zmian i awarii

## Braki i niejednoznaczności w TXT

1. TXT nie definiuje pełnego słownika statusów przejściowych dla zgłoszeń typu `zmiana`.
2. TXT nie rozstrzyga, czy awaria i zmiana mają być modelowane jako jedna encja z polem typu, czy jako dwa osobne agregaty.
3. TXT nie opisuje szczegółowo, czy usunięcie błędnego zgłoszenia ma być fizycznym usunięciem rekordu, czy logicznym wycofaniem z pełnym śladem audytowym.
4. TXT nie określa, czy monitoring aktywnych awarii jest liczony na bieżąco, czy oparty o utrzymywany widok lub zestawienie materializowane.
5. TXT nie opisuje formalnego modelu powiadomień po aktualizacji zgłoszenia.
6. TXT nie rozstrzyga, czy użytkownik może dołączać załączniki do zgłoszenia i na jakich etapach.
7. TXT nie wskazuje, czy istnieje reguła blokująca utworzenie drugiej aktywnej awarii dla tej samej stacji.

## ZAŁOŻENIA PROJEKTOWE przyjęte do diagramów

1. Rejestr został przedstawiony jako jeden moduł obejmujący `awarie` i `zmiany`, z rozróżnieniem typu zgłoszenia.
2. Dodanie `załącznika` w procesie aktualizacji zostało przyjęte jako rozszerzenie projektowe, bo zadanie końcowe wyraźnie tego oczekuje.
3. Panel filtrów pokazuje także `priorytet`, `odcinek drogi` i `rodzaj awarii / zmiany`, choć TXT literalnie wymienia tylko część tych kryteriów.
4. Po zamknięciu zgłoszenia zwykła edycja jest zablokowana, a korekta pozostaje dostępna jedynie w trybie administracyjnym z historią zmian.
5. Dla diagramu stanów przyjęto pomocnicze statusy `W realizacji`, `Aktywne`, `Zamknięte` i `Usunięte błędnie`.
6. Różnicę pomiędzy `zmianą techniczną`, `zmianą administracyjną` i `korektą danych ewidencyjnych` pokazano jako klasyfikację projektową rozszerzającą ogólne pojęcie `zmiana`.
7. Powiązanie stacji z `OdcinkiemReferencyjnym` i `LokalizacjaGIS` zostało pokazane, ponieważ wynika z domeny systemu ZID i wymagań zadania, mimo że TXT nie opisuje tego wprost.

## Decyzje do potwierdzenia z klientem

1. Czy numer zgłoszenia ma mieć osobną sekwencję dla awarii i zmian, czy wspólny identyfikator rejestrowy.
2. Czy zamknięte zgłoszenie może być ponownie otwarte, czy tylko korygowane administracyjnie.
3. Jakie dokładnie statusy końcowe są dopuszczalne dla zgłoszeń typu `zmiana`.
4. Czy stacja może mieć równolegle aktywną awarię i aktywną zmianę.
5. Czy moduł IRD jedynie otwiera rejestr w odpowiednim kontekście, czy również tworzy i aktualizuje zgłoszenia.
6. Czy raport aktywnych awarii ma być dostępny jako eksport plikowy, wydruk, czy widok ekranowy.
7. Jakie role organizacyjne mają prawo usuwać zgłoszenia i czy wymagana jest zasada czterech oczu.
8. Czy historia zmian ma być pokazywana według `daty zgłoszenia`, `daty obowiązywania`, czy obu tych osi czasu równocześnie.
