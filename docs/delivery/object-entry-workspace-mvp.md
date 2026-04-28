# Object Entry Workspace MVP

## Cel

Pierwszy pionowy wycinek frontendu realizuje wprowadzanie obiektow infrastruktury drogowej do systemu w trybie roboczym. Zakres obejmuje profesjonalny workspace GIS z mapa, tabela, formatka szczegolow, panelem powiazan referencyjnych i panelem walidacji.

## Zakres implementacji

- Angular standalone application z routingiem do `/zarzadzanie-danymi`.
- OpenLayers jako glowny komponent mapowy dla selekcji i rysowania geometrii.
- PrimeNG jako warstwa kontrolek enterprise dla polecen i tabeli.
- Tailwind/global CSS jako system layoutu, tokenow i spojnosc wizualna desktop GIS.
- Signal-based store synchronizujacy mape, tabele i formatke.
- Mock API dla operacji draft: start create, update attributes, update geometry, bind reference, validate, publish.

Mock jest adapterem rozwojowym do UI, a nie kontraktem biznesowym. Docelowy adapter frontendu powinien zostac przepiety na contract-first API dla draft commands, gdy OpenAPI zostanie rozszerzone o przeplyw wprowadzania obiektow.

## Granice odpowiedzialnosci

Frontend odpowiada za:

- stan widoku i aktywna selekcje,
- interakcje mapowe,
- prezentacje draft/published,
- lokalne komunikaty walidacyjne mocka,
- ergonomie przeplywu eksperckiego.

Backend docelowo odpowiada za:

- rzeczywisty zapis komend draftu,
- walidacje domenowa i techniczna,
- konfliktowanie zmian,
- historie i audyt,
- publikacje do stanu referencyjnego.

GeoServer docelowo odpowiada za:

- warstwy publikowane,
- style mapowe,
- WMS/WFS/WMTS,
- warstwy raportowe.

## Przyjete zalozenia mock API

- `draftId`, `objectId` i `businessId` sa rozdzielone.
- Obiekt moze miec geometrie `point`, `line` albo `polygon`.
- Geometria w komponencie mapowym pracuje w EPSG:3857.
- Obiekt bez powiazania z systemem referencyjnym nie przechodzi publikacji.
- Publikacja wymaga wczesniejszej poprawnej walidacji.
- Dane przykladowe sa deterministyczne i nie sa kontraktem backendu.
- Walidacja mocka jest tylko pre-checkiem UI. Kanoniczna walidacja musi nalezec do backendu.
- UI nie gwarantuje trwalosci, audytu, kontroli konfliktow ani publikacji produkcyjnej.

## Zachowania akceptacyjne

- Klik wiersza tabeli podswietla obiekt na mapie i otwiera formatke.
- Klik obiektu na mapie synchronizuje tabele i formatke.
- Utworzenie nowego obiektu aktywuje narzedzie rysowania odpowiednie do geometrii.
- Narysowana geometria zapisuje sie do draftu i przechodzi do warstwy roboczej.
- Zmiana formularza oznacza pole jako dirty i aktualizuje draft.
- Wybor kandydata referencyjnego zapisuje powiazanie do draftu.
- Walidacja pokazuje bledy i ostrzezenia w panelu walidacji.
- Publikacja jest mozliwa dopiero po poprawnej walidacji.

## Ryzyka

- Mock nie obejmuje docelowych konfliktow wielouzytkownikowych.
- Walidacja mocka jest uproszczona i musi zostac zastapiona walidacja backendowa.
- Obecny frontend obsluguje jeden aktywny draft w workspace.
- Styl GeoServer nie jest jeszcze artefaktem konfiguracyjnym; mapa uzywa lokalnej stylizacji OpenLayers dla MVP.
- Do czasu podpiecia prawdziwych uslug trzeba recznie pilnowac zgodnosci SRID i semantyki statusow z dokumentami domenowymi.

## Nastepny krok

Nastepnym pionem powinno byc dodanie backendowego kontraktu draft commands w OpenAPI oraz implementacja minimalnych endpointow Spring Boot dla tworzenia draftu, zapisu komend, walidacji i publikacji.
