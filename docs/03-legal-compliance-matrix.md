# 03. Macierz zgodności prawnej

## Status dokumentu

- Status: robocza macierz wymagań do weryfikacji.
- Data: 2026-04-25.
- Zakres: ewidencja dróg, książka drogi, mapy techniczno-eksploatacyjne, GUS/TERYT, źródła danych przestrzennych, audyt.
- Zastrzeżenie: dokument nie jest opinią prawną. Każdy wiersz oznaczony jako wymagający weryfikacji musi zostać sprawdzony z aktualnym tekstem aktu prawnego, interpretacją organizacji i zakresem obowiązków zarządcy drogi.

## Macierz

| Obszar | Źródło lub punkt odniesienia | Wymaganie dla systemu | Stan przygotowania | Do weryfikacji prawnej |
| --- | --- | --- | --- | --- |
| Ewidencja dróg publicznych | Ustawa o drogach publicznych, akty wykonawcze do ewidencji | System musi identyfikować drogę, odcinek, zarządcę, klasę, status i historię zmian | Częściowo przygotowane w modelu `Road`, `RoadSection`, `PublicationEvent` | Aktualny katalog wymaganych pól, odpowiedzialność za prowadzenie ewidencji, zakres danych historycznych |
| Numeracja i ewidencja dróg | Rozporządzenie dotyczące numeracji i ewidencji dróg publicznych, obiektów mostowych, tuneli, przepustów i promów | Model musi wspierać obiekty punktowe, liniowe i powierzchniowe oraz powiązanie z drogą i odcinkiem | Częściowo przygotowane przez `InfrastructureObject`, `TechnicalElement`, `ReferenceBinding` | Pełna klasyfikacja obiektów, wymagane słowniki, format identyfikatorów i minimalne atrybuty |
| System referencyjny | Przepisy ewidencyjne oraz standard organizacyjny zarządcy | Każdy obiekt ewidencyjny musi mieć lokalizację referencyjną, nie tylko geometrię | Przygotowane jako centralna zasada architektury i modelu | Tolerancje, sposób obsługi rozbieżności geometria-referencja, obowiązkowy poziom dokładności |
| Książka drogi | Przepisy o ewidencji dróg i obowiązki zarządcy | Raport ma powstawać ze stanu opublikowanego, z historią zmian i materiałami źródłowymi | Częściowo przygotowane; istnieje kierunek `RoadBookSnapshot` | Pełny zakres rozdziałów, wzór raportu, retencja, podpisy, odpowiedzialność za zatwierdzanie |
| Mapy techniczno-eksploatacyjne | Wymagania ewidencyjne i praktyka zarządców infrastruktury | System musi publikować czytelne warstwy drogi, odcinków, obiektów i elementów technicznych | Częściowo przygotowane w wytycznych UI i opcjonalnym GeoServerze | Obowiązkowe skale, symbolika, zakres warstw i forma wydruku/eksportu |
| Wersje robocze i publikacja | Wymagania audytu ewidencji i kontroli jakości | Import i edycja nie mogą od razu zmieniać stanu opublikowanego; publikacja musi być audytowana | Przygotowane jako model draft-publish | Czy wymagana jest formalna akceptacja, wieloetapowe zatwierdzanie, podpis elektroniczny lub protokół |
| Walidacja | Wymagania jakości danych i odpowiedzialności zarządcy | Publikacja jest blokowana przez błędy krytyczne; ostrzeżenia pozostają w audycie | Przygotowane w koncepcji `ValidationIssue` | Które reguły są prawnie blokujące, które organizacyjne, a które informacyjne |
| GUS/TERYT | Rejestr TERYT i publikacje GUS | System może grupować drogi i raporty według jednostek terytorialnych | Częściowo przygotowane jako `GusTerritorialUnit` | Licencja/warunki użycia, cykl aktualizacji, obowiązkowe kody, zakres raportowania GUS |
| Raporty GUS | Wymagania sprawozdawcze właściwe dla organizacji | Raporty statystyczne nie mogą być oznaczone jako zgodne bez mapowania do obowiązujących formularzy | Niezaimplementowane; przewidziany kontrakt API jako funkcja warunkowa | Formularze, terminy, jednostki miary, odpowiedzialność za wysyłkę, wymagane zatwierdzenia |
| Dane z GUGiK i geoportali | Warunki korzystania z usług i danych przestrzennych | Import lub podkład mapowy musi zachować informację o źródle i licencji | Częściowo przygotowane przez `source` i `ImportBatch` | Warunki licencyjne, dopuszczalny zakres cache, wymagane oznaczenia źródła |
| Dane osobowe i audyt użytkowników | RODO, polityki bezpieczeństwa organizacji | Logi, załączniki i materiały źródłowe nie mogą ujawniać danych osobowych bez podstawy | Do doprecyzowania | Czy załączniki zawierają dane osobowe, okres retencji, role dostępu, maskowanie |
| Dostępność i sektor publiczny | WCAG oraz wymagania organizacyjne, jeżeli system jest udostępniany publicznie | UI powinien mieć obsługę klawiatury, kontrast i czytelne komunikaty walidacji | Częściowo przygotowane w wytycznych UI | Czy system podlega formalnym wymaganiom dostępności, zakres testów i deklaracji |
| Retencja i archiwizacja | Polityki kancelaryjne, archiwalne i wewnętrzne | Dane historyczne i publikacje muszą być możliwe do odtwórczenia | Częściowo przygotowane przez statusy i `PublicationEvent` | Okresy retencji, procedura archiwizacji, usuwanie danych roboczych i importów |

## Klasy statusu zgodności

| Status | Znaczenie |
| --- | --- |
| Przygotowane | Model lub przepływ obsługuje wymaganie i czeka głównie na implementację |
| Częściowo przygotowane | Istnieje miejsce w modelu, ale brakuje pełnego zakresu pól, reguł lub decyzji prawnej |
| Do weryfikacji | Nie wolno oznaczać funkcji jako zgodnej bez potwierdzenia przez właściciela prawnego lub merytorycznego |
| Poza prototypem | Wymaganie może być istotne produkcyjnie, ale nie jest celem obecnego prototypu |

## Źródła do potwierdzenia

- ISAP, Ustawa o drogach publicznych: <https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19850140060>
- ISAP, rozporządzenie w sprawie sposobu numeracji i ewidencji dróg publicznych, obiektów mostowych, tuneli, przepustów i promów: <https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20050670582>
- GUS, TERYT: <https://stat.gov.pl/bazy-danych/systemy-informacyjne/teryt/>
- Geoportal/GUGiK, usługi WMS: <https://www.geoportal.gov.pl/uslugi/usluga-przegladania-wms/>

## Minimalna ścieżka zatwierdzenia prawnego

1. Potwierdzić, które typy dróg i obiektów są objęte pierwszym wdrożeniem.
2. Porównać słowniki domenowe z aktualnymi aktami prawnymi i wewnętrzną instrukcją zarządcy.
3. Zatwierdzić listę pól obowiązkowych dla książki drogi.
4. Zatwierdzić zakres raportów GUS albo wyłączyć je z etykiety zgodności prawnej.
5. Potwierdzić zasady korzystania z danych GUGiK, GUS i innych źródeł importowych.
6. Ustalić retencję wersji roboczych, importów, załączników i zdarzeń publikacji.
