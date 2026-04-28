# 02. Model domenowy

## Status dokumentu

- Status: przekrojowy opis modelu domenowego dla prototypu.
- Data: 2026-04-25.
- Zakres: drogi, odcinki, obiekty infrastruktury, system referencyjny, wersje robocze, walidacja, książka drogi i kontekst GUS.
- Poza zakresem: finalny schemat bazy i kompletna klasyfikacja prawna obiektów.

## Zasady modelu

1. System referencyjny jest obowiązkowy dla obiektów ewidencyjnych. Sama geometria nie wystarcza do uznania lokalizacji za poprawną.
2. Obiekt infrastruktury może być punktowy, liniowy albo powierzchniowy. Typ geometrii jest częścią kontraktu domenowego.
3. Każdy obiekt kluczowy ma status, historię zmian, datę obowiązywania i źródło pochodzenia.
4. Import i edycja ekspercka pracują na wersjach roboczych. Stan opublikowany powstaje dopiero po walidacji i publikacji.
5. Książka drogi i mapy techniczno-eksploatacyjne odczytują dane opublikowane oraz historię publikacji.
6. GUS/TERYT jest modelem pomocniczym dla kontekstu terytorialnego i raportów, ale zakres pól oraz obowiązków sprawozdawczych wymaga weryfikacji prawnej.

## Główne agregaty

| Agregat | Rola | Kluczowe relacje |
| --- | --- | --- |
| `Road` | Droga jako byt ewidencyjny i raportowy | Ma odcinki, klasę, zarządcę, jednostki terytorialne |
| `RoadSection` | Odcinek drogi w systemie referencyjnym | Należy do drogi, ma kilometraż/pikietaż, geometrię osi, status |
| `ReferenceRoute` | Ciąg referencyjny używany do lokalizacji obiektów | Składa się z odcinków i punktów referencyjnych |
| `ReferencePoint` | Punkt układu referencyjnego | Służy do obliczania lokalizacji punktowej i zakresów liniowych |
| `ReferenceBinding` | Powiązanie obiektu z systemem referencyjnym | Wskazuje drogę, odcinek, pozycję od-do lub punkt |
| `InfrastructureObject` | Ewidencyjny obiekt infrastruktury drogowej | Ma typ, geometrię, status, referencję, wersje i atrybuty |
| `TechnicalElement` | Element składowy obiektu, np. wyposażenie, urządzenie, fragment konstrukcji | Należy do obiektu lub odcinka, może mieć własną geometrię |
| `DraftVersion` | Wersja robocza zmian | Zawiera zmiany, importy, problemy walidacyjne i decyzję publikacji |
| `ImportBatch` | Partia importu danych | Tworzy rekordy robocze i ślad źródła |
| `ValidationIssue` | Problem wykryty przez walidację | Dotyczy obiektu, pola, geometrii, referencji lub partii importu |
| `PublicationEvent` | Zdarzenie publikacji | Łączy wersję roboczą ze stanem opublikowanym i audytem |
| `RoadBookSnapshot` | Migawka danych do książki drogi | Powstaje ze stanu opublikowanego i historii zmian |
| `GusTerritorialUnit` | Jednostka terytorialna GUS/TERYT | Pomaga grupować drogi, odcinki i raporty |

## Cykl życia obiektu

| Status | Znaczenie | Reguły |
| --- | --- | --- |
| `DRAFT` | Obiekt lub zmiana istnieje tylko w wersji roboczej | Widoczny jako roboczy, nie trafia do raportów oficjalnych |
| `VALIDATED` | Dane przeszły walidację bez błędów blokujących | Nadal wymagają publikacji |
| `PUBLISHED` | Obiekt jest częścią stanu obowiązującego | Źródło dla map opublikowanych, książki drogi i raportów |
| `REJECTED` | Zmiana została odrzucona | Pozostaje w audycie z powodem odrzucenia |
| `ARCHIVED` | Obiekt historyczny, nieaktywny w stanie bieżącym | Może być używany w historii i raportach archiwalnych |

Status nie zastępuje dat obowiązywania. Obiekt opublikowany może mieć zakres ważności, a obiekt archiwalny musi zachować odniesienie do poprzedniej wersji.

## Lokalizacja i geometria

| Element | Wymaganie |
| --- | --- |
| `referenceBinding.roadId` | Obowiązkowy dla obiektów przypisanych do drogi |
| `referenceBinding.sectionId` | Obowiązkowy, gdy obiekt jest lokalizowany na odcinku |
| `referenceBinding.positionFrom` / `positionTo` | Obowiązkowe dla obiektów liniowych i zakresowych |
| `referenceBinding.pointPosition` | Obowiązkowe dla obiektów punktowych, jeżeli nie występuje zakres |
| `geometry.type` | `Point`, `LineString`, `Polygon` albo ich wariant wieloczęściowy zgodny z typem obiektu |
| `geometry.srid` | Jawny SRID; brak SRID jest błędem blokującym importu lub publikacji |
| `geometry.source` | Źródło geometrii: import, pomiar, digitalizacja, korekta eksperta, integracja zewnętrzna |

Zmiana geometrii wymaga ponownego przeliczenia albo potwierdzenia powiązania referencyjnego. Zmiana referencji wymaga sprawdzenia, czy geometria nadal leży w tolerancji od osi lub obszaru drogi.

## Obiekt infrastruktury

Minimalny zestaw pól domenowych:

| Pole | Znaczenie |
| --- | --- |
| `objectId` | Stabilny identyfikator techniczny |
| `businessId` | Identyfikator ewidencyjny używany w raportach i książce drogi |
| `objectType` | Typ obiektu ze słownika domenowego |
| `geometryType` | Punkt, linia albo powierzchnia |
| `status` | Status cyklu życia |
| `referenceBinding` | Powiązanie z drogą, odcinkiem i lokalizacją referencyjną |
| `geometry` | Geometria w PostGIS z jawnym SRID |
| `attributes` | Atrybuty typowe dla klasy obiektu |
| `validFrom` / `validTo` | Zakres obowiązywania wersji |
| `source` | Źródło danych i materiał dowodowy |
| `version` | Wersja do kontroli współbieżności |

## Wersje robocze

Wersja robocza grupuje zmiany w logiczny pakiet pracy. Może powstać z importu, edycji ręcznej albo korekty danych opublikowanych.

| Element wersji roboczej | Wymaganie |
| --- | --- |
| Zakres | Droga, odcinek, obszar mapy, typ obiektu albo partia importu |
| Autor i właściciel | Użytkownik lub zespół odpowiedzialny za przygotowanie zmian |
| Źródło | Plik, system zewnętrzny, ręczna edycja lub korekta walidacyjna |
| Lista zmian | Dodania, modyfikacje, archiwizacje i odrzucenia |
| Wynik walidacji | Aktualny zestaw błędów, ostrzeżeń i informacji |
| Publikacja | Jednoznaczne zdarzenie przeniesienia do stanu opublikowanego |

Dwie wersje robocze nie powinny równolegle publikować zmian do tego samego obiektu bez wykrycia konfliktu. Konflikt wymaga decyzji operatora albo reguły scalania opisanej w API.

## Walidacja domenowa

Walidacja dzieli się na techniczną i domenową.

| Typ walidacji | Przykłady | Wynik |
| --- | --- | --- |
| Techniczna | format pliku, SRID, typ geometrii, wymagane kolumny, poprawność JSON/GeoJSON | Może zablokować import |
| Referencyjna | brak drogi, brak odcinka, zakres poza odcinkiem, konflikt z kilometrażem | Blokuje publikację |
| Geometryczna | samoprzecięcia, pusta geometria, niezgodny typ, odległość od osi powyżej tolerancji | Blokuje lub ostrzega zależnie od reguły |
| Atrybutowa | brak klasy obiektu, niepoprawny status, niespójne daty obowiązywania | Zwykle blokuje publikację |
| Raportowa | brak pól wymaganych do książki drogi lub map techniczno-eksploatacyjnych | Blokuje raport albo oznacza niekompletność |
| GUS | brak lub nieaktualny kod TERYT, niejednoznaczna jednostka, niepotwierdzony zakres sprawozdania | Wymaga weryfikacji prawnej przed publikacją raportu |

## Książka drogi

Książka drogi jest widokiem raportowym na stan opublikowany. Model musi umożliwiać:

- identyfikację drogi i odcinków,
- wykaz podstawowych parametrów technicznych,
- wykaz obiektów infrastruktury i elementów technicznych,
- historię zmian, przeglądów i publikacji,
- powiązanie z materiałami źródłowymi,
- odtworzenie stanu na dzień.

Zakres pól książki drogi jest częściowo przygotowany w dokumentacji i wymaga porównania z aktualnym stanem prawnym przed wdrożeniem produkcyjnym.

## GUS i TERYT

Model `GusTerritorialUnit` powinien przechowywać co najmniej:

- kod TERYT,
- nazwę jednostki,
- typ jednostki,
- datę obowiązywania,
- źródło i datę aktualizacji,
- relację do drogi lub odcinka.

W prototypie dane GUS służą do filtrowania i agregacji. Funkcje sprawozdawcze GUS są oznaczone jako częściowo przygotowane i wymagają weryfikacji prawnej dotyczącej zakresu, formularzy, częstotliwości i odpowiedzialności zarządcy drogi.
