# Import dzialek do draftu - specyfikacja storyboardu

## Cel

Dokument formalizuje storyboard procesu importu dzialek z pliku Excel pochodzacego z SAP HANA do obszaru roboczego systemu ZID.
Zakres obejmuje widok operatora, logike przejsc pomiedzy stanami ekranu oraz podstawowe reguly walidacji i prezentacji wyniku.

## Zakres procesu

Proces obejmuje:

1. wejscie do funkcji importu dzialek,
2. wskazanie kontekstu terytorialnego i pliku zrodlowego,
3. analize pliku i pobranie danych przestrzennych z GUGiK,
4. podglad mapy i tabeli dzialek,
5. walidacje, konflikty i raport,
6. potwierdzenie zapisu,
7. zapis do draftu i prezentacje wyniku.

Proces nie obejmuje:

- publikacji warstwy,
- edycji finalnej ewidencji,
- konfiguracji GeoServer,
- obslugi innych typow importu niz warstwa dzialek.

## Aktor i cel biznesowy

- Aktor glowny: operator lub analityk danych ewidencyjnych pracujacy w systemie GIS zarzadzania infrastruktura drogowa.
- Cel biznesowy: zasilic obszar roboczy aktualnym zestawem dzialek powiazanych z jednostka terytorialna i kontekstem drogowym, z zachowaniem walidacji oraz raportowalnosci.

## Warunki wejsciowe

- Uzytkownik jest w module zarzadzania danymi.
- System zna jednostke administracji drogowej lub pozwala ja wskazac.
- Operator ma plik Excel z SAP HANA zawierajacy identyfikatory dzialek.
- Dostepne jest polaczenie do zrodla danych GUGiK dla geometrii i danych opisowych.

## Warunki wyjsciowe

- Dane zostaly zapisane do `draft` / `obszar roboczy`, albo
- proces zakonczyl sie bledem i nie wykonano zapisu, albo
- proces zakonczyl sie czesciowym sukcesem z ostrzezeniami oraz raportem.

## Zrodla danych i odpowiedzialnosc

- `SAP HANA / Excel`: zrodlo listy dzialek i danych inicjujacych import.
- `GUGiK`: zrodlo geometrii dzialki oraz uzupelniajacych danych opisowych.
- `ZID`: miejsce walidacji procesu, prezentacji konfliktow i zapisu do draftu.

## Reguly domenowe

1. Import konczy sie zapisem do wersji roboczej, nie do publikacji.
2. Mapa jest glownym kontekstem przestrzennym, ale musi byc zsynchronizowana z tabela i panelem walidacji.
3. Dzialki moga zostac rozpoznane jako nowe, aktualizowane, archiwizowane, odrzucone lub dodane spoza pliku.
4. Walidacja musi rozrozniac bledy blokujace od ostrzezen i informacji.
5. Kontekst terytorialny musi byc widoczny przed uruchomieniem analizy.
6. System musi sprawdzac zgodnosc pola obowiazkowego identyfikatora dzialki oraz zgodnosc numeru drogi.
7. Dzialki spoza pliku, ale nalezace do tej samej jednostki terytorialnej, moga byc dolaczone na podstawie danych z GUGiK.

## Uklad referencyjny ekranu

Kazdy kluczowy ekran storyboardu powinien zachowac wspolny uklad:

- lewa kolumna: kroki procesu, kontekst terytorialny, panel zrodla danych,
- srodek: mapa jako glowny obszar pracy, a pod mapa tabela dzialek,
- prawa kolumna: podsumowanie warstwy, statusy, walidacja i konflikty,
- dol: staly pasek akcji.

## Ekrany i wymagania

### 01 Wejscie do importu dzialek

- Cel: wejscie do procesu i pokazanie stanu pustego.
- Wymagania:
  - aktywny jest pierwszy krok procesu,
  - mapa i tabela sa nieaktywne lub puste,
  - akcje typu `Analizuj`, `Zapisz do draftu` sa zablokowane,
  - widoczny jest punkt startowy procesu importu.

### 02 Kontekst i wybor pliku

- Cel: ustawienie kontekstu i wskazanie pliku.
- Wymagania:
  - operator wybiera jednostke terytorialna,
  - operator wskazuje jednostke administracji drogowej,
  - operator wybiera plik Excel z SAP HANA,
  - UI pokazuje nazwe pliku, date lub znacznik wyboru oraz gotowosc do analizy.

### 03 Analiza pliku i pobranie danych z GUGiK

- Cel: pokazac przetwarzanie i kontrole techniczno-biznesowe.
- Wymagania:
  - widoczny jest stan postepu,
  - system komunikuje co sprawdza: format, pole obowiazkowe, numer drogi, lookup GUGiK,
  - po prawej stronie widoczne sa liczniki i pierwsze wyniki kontroli,
  - pasek akcji nie sugeruje jeszcze finalnego zapisu.

### 04 Podglad mapy i tabela dzialek

- Cel: przedstawic wynik analizy w trybie roboczym.
- Wymagania:
  - mapa jest glownym obszarem wizualnym,
  - tabela dzialek jest widoczna pod mapa,
  - wybor w tabeli i na mapie jest logicznie powiazany,
  - panel po prawej stronie pokazuje statusy dzialek oraz podstawowe liczniki,
  - widoczne sa statusy: nowe, aktualizowane, archiwizowane, odrzucone, poza plikiem.

### 05 Walidacja, konflikty i raport

- Cel: odseparowac problemy blokujace od ostrzezen.
- Wymagania:
  - prawa kolumna jest rozbudowana do listy problemow,
  - bledy blokujace sa wyrazniejsze niz ostrzezenia,
  - kazda pozycja problemu ma zwiazek z dzialka, grupa dzialek albo regula,
  - uzytkownik widzi, czy zapis do draftu jest mozliwy.

### 06 Potwierdzenie zapisu do draftu

- Cel: jawnie zamknac decyzje operatora.
- Wymagania:
  - widoczny jest blok lub modal potwierdzenia,
  - system pokazuje liczby dzialek: dodane, aktualizowane, archiwizowane, odrzucone,
  - nazwa celu zapisu wskazuje `draft` / `obszar roboczy`,
  - decyzja zapisu jest odseparowana od walidacji.

### 07 Wynik operacji: sukces / sukces z ostrzezeniami / blad

- Cel: pokazac finalny stan procesu i dalsze akcje.
- Wymagania:
  - system rozroznia trzy wyniki: sukces, sukces z ostrzezeniami, blad,
  - widoczny jest raport lub mozliwosc jego pobrania,
  - widoczna jest akcja przejscia do draftu,
  - ekran nie moze sugerowac publikacji do produkcji.

## Reguly walidacji

### Bledy blokujace

- brak pliku,
- nieobslugiwany format pliku,
- brak wymaganego pola identyfikatora dzialki,
- niespojnosc numeru drogi,
- brak mozliwosci pobrania danych wymaganych z GUGiK,
- pusty wynik analizy uniemozliwiajacy zapis.

### Ostrzezenia

- czesc dzialek nie zostala odnaleziona,
- czesc dzialek znajduje sie poza oczekiwanym zakresem,
- czesc danych opisowych jest niepelna,
- czesc dzialek zostanie dodana spoza pliku na podstawie tej samej jednostki terytorialnej.

### Informacje

- liczba dzialek pobranych z pliku,
- liczba dzialek uzupelnionych z GUGiK,
- liczba dzialek w konflikcie z danymi istniejacymi,
- liczba rekordow przygotowanych do zapisu.

## Slownik statusow dzialki

- `Nowa`: dzialka zostanie dodana do draftu.
- `Aktualizowana`: dzialka istnieje i otrzyma aktualizacje danych.
- `Archiwizowana`: dzialka powinna zostac oznaczona jako nieaktywna w kontekscie roboczym.
- `Odrzucona`: dzialka nie przechodzi walidacji lub nie moze zostac prawidlowo powiazana.
- `Poza plikiem`: dzialka nie wystepowala w Excelu, ale zostala dolaczona z GUGiK w ramach tego samego obszaru.

## Kryteria akceptacji storyboardu

1. Istnieje 7 ekranow pokrywajacych caly proces od wejscia do wyniku.
2. Kazdy ekran zachowuje logike desktop GIS: lewa kolumna, mapa z tabela, prawa kolumna, dolny pasek akcji.
3. Uzytkownik zawsze wie, na ktorym jest kroku procesu.
4. Co najmniej jeden ekran pokazuje blad blokujacy.
5. Co najmniej jeden ekran pokazuje sukces z ostrzezeniami.
6. Zapis zawsze wskazuje `draft` / `obszar roboczy`.
7. Role `SAP HANA` i `GUGiK` sa odroznialne w etykietach i podsumowaniach.

## Powiazanie ze storyboardem Stitch

- Projekt Stitch: `ZID - Import dzialek z SAP HANA do draftu`
- Id projektu: `6399955334151103980`
- Identyfikatory ekranow zostaly zapisane w pliku `docs/ux/stitch-import-dzialek-storyboard.md`
- Szkic procesu w draw.io znajduje sie w pliku `docs/ux/import-dzialek-do-draftu-process.drawio`

## Dalsze wykorzystanie

Ten dokument moze byc bezposrednio wykorzystany jako:

- baza do review biznesowego,
- podklad do makiety w Figma,
- wejscie do specyfikacji analitycznej,
- material do planowania implementacji frontendowej.
