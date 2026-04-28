# 01. Architektura przekrojowa

## Status dokumentu

- Status: dokument bazowy dla prototypu i dalszych decyzji ADR.
- Data: 2026-04-25.
- Zakres: frontend, backend, PostGIS, opcjonalny GeoServer, importy, walidacja, raporty, książka drogi i obszary GUS.
- Poza zakresem: zmiana implementacji, migracje bazy danych, finalna opinia prawna.

## Założenia architektoniczne

1. System referencyjny jest centralnym mechanizmem lokalizacji obiektów drogowych. Geometria mapowa nie zastępuje referencji liniowej, punktowej lub odcinkowej.
2. W prototypie PostGIS jest podstawowym źródłem danych przestrzennych dla warstw roboczych, opublikowanych i referencyjnych.
3. GeoServer jest komponentem opcjonalnym. Może publikować warstwy WMS/WFS i style dla danych opublikowanych, ale nie prowadzi walidacji, wersji roboczych ani logiki biznesowej.
4. Backend Spring Boot jest jedynym miejscem zapisu przez API, walidacji biznesowej, publikacji wersji roboczych i audytu.
5. Frontend Angular orkiestruje pracę eksperta na mapie, tabeli i formularzu. Nie jest źródłem prawdy dla statusów, historii ani walidacji końcowej.
6. Import tworzy dane robocze. Finalny zapis do stanu opublikowanego wymaga walidacji, usunięcia błędów blokujących i operacji publikacji.
7. Książka drogi, mapy techniczno-eksploatacyjne i raporty korzystają ze stanu opublikowanego, nie bezpośrednio z importu ani wersji roboczej.
8. Obszary GUS/TERYT są częściowo przygotowane jako kontekst terytorialny i raportowy, ale wymagają weryfikacji prawnej przed oznaczeniem jako zgodne.

## Odpowiedzialności warstw

| Warstwa | Odpowiedzialność | Czego nie robi |
| --- | --- | --- |
| Frontend Angular | Widok GIS/CAD, synchronizacja mapa-tabela-formularz, edycja wersji roboczych, podgląd walidacji, obsługa importu | Nie zapisuje bezpośrednio do bazy, nie publikuje warstw, nie rozstrzyga walidacji końcowej |
| Backend Spring Boot | API, przypadki użycia, walidacje domenowe, publikacja draftów, audyt, integracja importów i raportów | Nie renderuje map, nie przechowuje logiki UI, nie deleguje reguł domenowych do GeoServera |
| PostGIS | Prototypowe źródło danych przestrzennych: referencje, obiekty, wersje robocze, stan opublikowany, geometrie importowe | Nie zastępuje API aplikacyjnego i nie jest edytowany bezpośrednio przez frontend |
| GeoServer opcjonalny | Publikacja warstw opublikowanych, style SLD/GeoCSS, WMS/WFS do odczytu | Nie obsługuje WFS-T, workflow draftów, audytu ani walidacji biznesowej |
| Magazyn plików | Materiały źródłowe importu, załączniki, dowody zmian, eksporty raportów | Nie przechowuje statusu domenowego bez metadanych w bazie |
| Integracje zewnętrzne | Pobranie lub import danych z systemów źródłowych, GUGiK, GUS/TERYT, plików eksperckich | Nie omijają walidacji i publikacji aplikacyjnej |

## Główne przepływy danych

### Praca eksperta na danych opublikowanych

1. Frontend pobiera listę dróg, odcinków i obiektów z backendu.
2. Mapa pobiera geometrię przez backend lub przez opcjonalny GeoServer z widoków opublikowanych.
3. Tabela, mapa i formularz używają tych samych identyfikatorów obiektów oraz statusów.
4. Raporty, w tym książka drogi, bazują na stanie opublikowanym i historii publikacji.

### Edycja wersji roboczej

1. Operator tworzy albo otwiera wersję roboczą dla określonego zakresu drogi, odcinka lub importu.
2. Backend zapisuje zmiany w strukturach roboczych PostGIS.
3. Każda zmiana zachowuje powiązanie z systemem referencyjnym, autorem, czasem i statusem.
4. Walidacja zwraca błędy blokujące, ostrzeżenia i informacje.
5. Publikacja przenosi zaakceptowany stan roboczy do warstw opublikowanych i zapisuje zdarzenie audytowe.

### Import

1. Import trafia do partii roboczej i strefy staging, nie do stanu opublikowanego.
2. Backend normalizuje układ współrzędnych, typ geometrii, atrybuty i powiązanie z systemem referencyjnym.
3. Konflikty z danymi opublikowanymi lub innymi draftami są oznaczane jako problemy walidacyjne.
4. Operator koryguje dane w widoku mapy, tabeli i formularza.
5. Publikacja jest możliwa dopiero po usunięciu błędów blokujących.

## Proponowany podział schematów PostGIS w prototypie

Nazwy są kierunkowe i wymagają potwierdzenia w migracjach:

| Schemat | Zawartość | Uwagi |
| --- | --- | --- |
| `reference` | drogi, odcinki, punkty referencyjne, słowniki lokalizacyjne | Źródło dla powiązań referencyjnych |
| `published` | opublikowane obiekty infrastruktury i elementy techniczne | Źródło dla raportów i warstw produkcyjnych |
| `draft` | wersje robocze, zmiany obiektów, problemy walidacyjne | Widoczne jako dane robocze w UI |
| `staging` | surowe lub znormalizowane dane importowe | Kasowanie lub archiwizacja po decyzji importowej |
| `audit` | historia publikacji, zdarzenia zmian, autorzy, źródła | Wymagana dla rozliczalności książki drogi |

## Warianty wdrożenia

### Minimalny prototyp

- Angular SPA.
- Backend Spring Boot.
- PostGIS jako źródło danych przestrzennych i referencyjnych.
- Warstwy mapowe serwowane przez backend w formacie GeoJSON lub kafelkach generowanych aplikacyjnie, jeśli zakres prototypu tego wymaga.

### Prototyp z publikacją mapową

- Minimalny prototyp.
- GeoServer podłączony do widoków `published`.
- Style warstw utrzymywane jako artefakty konfiguracyjne.
- Drafty nadal obsługiwane przez backend i frontend, nie przez GeoServer.

### Wariant docelowy do decyzji

- Potwierdzony model bazy docelowej, w tym relacja PostGIS do MS SQL opisowego i raportowego.
- Zweryfikowane wymagania prawne dla książki drogi, raportów GUS i retencji danych.
- Uzupełnione OpenAPI i ADR dla finalnych kontraktów oraz granic integracji.

## Reguły przekrojowe

- Każdy kluczowy obiekt ma identyfikator biznesowy, status, historię zmian i powiązanie referencyjne.
- Każda geometria ma jawny SRID, typ geometrii oraz źródło pochodzenia.
- Publikacja jest transakcją domenową: zapisuje stan opublikowany, zdarzenie audytu i wynik walidacji.
- Dane robocze muszą być wizualnie i kontraktowo odróżnione od danych opublikowanych.
- GeoServer, jeżeli występuje, publikuje tylko dane zatwierdzone albo techniczne warstwy podglądowe oznaczone jako nieoficjalne.
- Funkcje GUS są oznaczane jako częściowo przygotowane do czasu zatwierdzenia zakresu prawnego, źródeł i cyklu aktualizacji.

## Bramki jakości

- Zmiana kontraktu API wymaga aktualizacji dokumentu kontraktu i pliku OpenAPI przed implementacją.
- Zmiana modelu danych wymaga migracji, opisu wpływu na drafty, publikację i raporty.
- Nowa warstwa mapowa wymaga opisu przeznaczenia, źródła danych, stylu i skal widoczności.
- Nowa reguła walidacyjna wymaga kodu reguły, poziomu ważności, komunikatu dla operatora i miejsca naprawy w UI.
- Nowy raport wymaga wskazania źródła danych, statusu prawnego i zależności od stanu opublikowanego.
