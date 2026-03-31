# ADR 0001: Frontend Stack

- Status: Accepted
- Data: 2026-03-30

## Kontekst

System ma obslugiwac jednoczesnie:

- prace na duzych tabelach i formularzach biznesowych,
- nawigacje po zlozonych ekranach administracyjnych,
- widok mapy z warstwami tematycznymi i selekcja obiektow,
- dlugowieczny rozwoj zespolowy w stylu enterprise.

Potrzebujemy technologii, ktora dobrze wspiera silnie ustrukturyzowany interfejs biznesowy, czytelny podzial na feature slices i integracje z komponentami mapowymi.

## Decyzja

Wybieramy frontend oparty o:

- Angular jako framework SPA,
- TypeScript jako jezyk implementacji,
- PrimeNG jako biblioteke komponentow biznesowych,
- Tailwind CSS do layoutu, tokenow i szybkiej kompozycji widokow,
- OpenLayers do obslugi mapy, warstw i interakcji przestrzennych,
- RxJS i Angular Signals do reaktywnego zarzadzania stanem widoku.

Architektura kodu bedzie oparta o `core`, `shared`, `shell` oraz `features/*`, aby oddzielic infrastrukture aplikacji od modułów biznesowych.

## Uzasadnienie

- Angular dobrze wspiera duze aplikacje formularzowo-procesowe, routing i zaleznosci DI.
- PrimeNG przyspiesza budowe tabel, drzew, formularzy i ekranow administracyjnych.
- Tailwind pozwala kontrolowac system spacingu, layout oraz warstwe wizualna bez rozrastania dedykowanego CSS.
- OpenLayers jest dojrzala biblioteka do pracy z WMS, WFS, wektorami i projekcjami.
- Połączenie sygnalow i RxJS daje czytelny model dla danych lokalnych oraz strumieni asynchronicznych.

## Konsekwencje

Pozytywne:

- szybki start dla ekranow biznesowych i mapowych,
- dobra modularnosc i czytelny podzial odpowiedzialnosci,
- szerokie wsparcie dla integracji enterprise i komponentow UI.

Negatywne:

- wyzszy prog wejscia niz w prostszych frameworkach komponentowych,
- potrzeba utrzymywania dyscypliny architektonicznej przy rosnacej liczbie feature'ow,
- PrimeNG wymaga kontroli spojnosc wizualnej i ograniczenia nadmiarowych wzorcow.

## Odrzucone alternatywy

### React + MUI + MapLibre

Odrzucone na etapie startowym, bo wymaga wiekszej dyscypliny architektonicznej wlasnymi konwencjami, a ekranom tabelaryczno-formularzowym bardziej sluzy ustrukturyzowany model Angulara.

### Vue + Vuetify + Leaflet

Odrzucone, bo Leaflet gorzej odpowiada na potrzeby bardziej zaawansowanej pracy z projekcjami, duza liczba warstw i danymi publikowanymi przez serwisy GIS.
