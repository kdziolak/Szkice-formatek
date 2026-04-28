# System Overview

## Cel systemu

RoadGIS Platform to centralna platforma GIS do zarzadzania infrastruktura drogowa w Polsce. System ma wspierac jednoczesnie prace ewidencyjna, operacyjna i raportowa, laczac widok mapy, tabeli oraz formularza biznesowego.

## Zakres biznesowy

System obejmuje:

- ewidencje drog krajowych oraz ich odcinkow funkcjonalnych,
- utrzymanie obiektow liniowych i punktowych powiazanych z pasem drogowym,
- prowadzenie ksiazki drogi i map techniczno-eksploatacyjnych,
- import, walidacje i publikacje danych przestrzennych,
- obsluge zalacznikow i materialow dowodowych,
- przygotowanie raportow oraz eksportow do dalszych procesow urzedowych i operacyjnych.

## Interesariusze

- operator GIS odpowiedzialny za wprowadzanie i aktualizacje danych,
- inspektor lub administrator merytoryczny zatwierdzajacy zmiany,
- analityk i raportujacy korzystajacy z danych referencyjnych,
- administrator systemu utrzymujacy slowniki, integracje i konfiguracje,
- zewnetrzne systemy publikacyjne lub raportowe konsumujace dane przez API i uslugi mapowe.

## Glówne zdolnosci systemu

1. Edycja danych drogowych w trybie roboczym z kontrola wersji.
2. Powiazywanie obiektow z referencjami, slownikami i jednostkami organizacyjnymi.
3. Walidacja topologii, atrybutow i spojnosci biznesowej przed publikacja.
4. Publikacja danych do warstw mapowych i raportow eksploatacyjnych.
5. Import oraz eksport danych z formatow roboczych i urzedowych.
6. Audyt zmian oraz obsluga zalacznikow dla obiektow i procesow.

## Architektura wysokiego poziomu

Platforma jest projektowana jako modularny monolit z wydzielona usluga GIS:

- `frontend/` odpowiada za interfejs SPA do pracy tabelarycznej, formularzowej i mapowej,
- `backend/` realizuje API, logike biznesowa, walidacje, workflow draft/publish i integracje,
- `geoserver/` publikuje warstwy WMS/WFS i style dla potrzeb mapy oraz zewnetrznych konsumentow,
- `db/` przechowuje dane transakcyjne, referencyjne i migracje dla MS SQL Server.

Takie rozdzielenie pozwala utrzymac jasna granice: backend jest wlascicielem modelu domenowego i procesu zmian, natomiast GeoServer sluzy do publikacji i renderowania danych przestrzennych.

## Moduly domenowe backendu

| Modul | Odpowiedzialnosc |
| --- | --- |
| `reference` | slowniki, jednostki, klasyfikacje i dane referencyjne |
| `infrastructure` | obiekty drogowe, odcinki, elementy techniczne i geometrie |
| `editing` | drafty, konflikty, workflow roboczy i publikacja |
| `validation` | walidacje atrybutowe, topologiczne i kompletosci |
| `importexport` | importy wsadowe, eksporty, mapowanie formatow |
| `reports` | materializacja widokow raportowych i generacja dokumentow |
| `attachments` | pliki, zdjecia, skany i metadane zalacznikow |
| `common` / `config` / `app` | wspolna infrastruktura aplikacyjna |

## Kluczowe przeplywy

### 1. Edycja danych

Operator otwiera obiekt w trybie roboczym, system tworzy lub dolacza do draftu, a backend zapisuje zmiany wraz z kontekstem audytowym. Po walidacji zmiany moga zostac opublikowane do modelu referencyjnego.

### 2. Przeglad mapowy

Frontend pobiera dane biznesowe z backendu, a warstwy referencyjne i publikacyjne z GeoServera. Uzytkownik moze filtrowac warstwy, przegladac obiekty na mapie oraz przechodzic do formularza i tabeli.

### 3. Import i walidacja

Plik importowy jest rejestrowany jako zadanie. Backend parsuje dane, porownuje je z aktualnym stanem, zapisuje propozycje zmian i publikuje raport walidacyjny przed decyzja o wdrozeniu.

### 4. Raportowanie

Raporty sa budowane na podstawie opublikowanego stanu danych, z mozliwoscia sledzenia daty publikacji, zakresu terytorialnego i wersji danych.

## Integracje

- GeoServer dla publikacji warstw mapowych,
- magazyn plikow dla zalacznikow i eksportow,
- system tozsamosci i autoryzacji organizacji,
- zrodla zewnetrzne dla danych referencyjnych lub importow okresowych.

## Wymagania jakosciowe

- spojny model danych dla pracy mapowej i tabelarycznej,
- pelna audytowalnosc zmian i identyfikacja autora publikacji,
- dobra wydajnosc dla duzych wolumenow danych i warstw przestrzennych,
- odporne importy wsadowe z czytelnym raportowaniem bledow,
- separacja danych roboczych od danych opublikowanych,
- mozliwosc etapowego rozwoju bez przedwczesnego rozbijania na mikroserwisy.

## Ograniczenia i zalozenia startowe

- glowna baza operacyjna to MS SQL Server,
- system obsluguje dane przestrzenne zgodne z krajowymi standardami referencyjnymi,
- publikacja mapowa nie moze omijac reguly domenowej zapisanej w backendzie,
- etap startowy skupia sie na przygotowaniu struktury repo, dokumentacji i kontraktow architektonicznych.
