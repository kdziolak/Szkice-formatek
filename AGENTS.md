# AGENTS.md

## Projekt

To repozytorium zawiera system GIS do zarządzania infrastrukturą drogową w Polsce.

Projekt jest:
- polskojęzyczny na poziomie biznesowym i UI
- technicznie implementowany z użyciem standardowego nazewnictwa developerskiego
- oparty o Angular + Tailwind + PrimeNG + OpenLayers na frontendzie
- oparty o Java + Spring Boot + GeoTools na backendzie
- wykorzystujący GeoServer jako warstwę publikacji usług GIS
- wykorzystujący MS SQL jako bazę danych opisowych

## Priorytet biznesowy

Najważniejsze cele systemu:
1. prowadzenie ewidencji drogowej
2. wsparcie książki drogi
3. wsparcie map techniczno-eksploatacyjnych
4. powiązanie obiektów z systemem referencyjnym
5. ergonomiczna praca ekspercka na mapie, tabeli i formularzu

## Zasady domenowe

Zawsze respektuj:
- system referencyjny jest centralnym mechanizmem lokalizacji obiektów
- obiekty mogą być punktowe, liniowe lub powierzchniowe
- obiekty muszą mieć historię zmian i status
- import może tworzyć dane robocze, ale finalny zapis wymaga walidacji
- mapa nie może być przypadkowa wizualnie; stylizacja musi odpowiadać logice infrastruktury drogowej
- UI ma przypominać profesjonalne aplikacje desktopowe klasy GIS / CAD / Office
- tabela, mapa i formularz muszą być zsynchronizowane

## Zasady architektoniczne

- Nie mieszaj odpowiedzialności frontend/backend/GeoServer/MS SQL.
- Frontend odpowiada za UX, orkiestrację interakcji, prezentację i stan widoku.
- Backend odpowiada za logikę biznesową, walidację, use case’y, API i integrację.
- GeoServer odpowiada za publikację warstw i usług mapowych.
- MS SQL odpowiada za dane opisowe, historię, konfigurację i raportowanie.

## Sposób pracy

Gdy dostajesz zadanie:
1. Najpierw przeczytaj istniejące pliki dokumentacyjne w `docs/`.
2. Zidentyfikuj, których warstw dotyczy zmiana.
3. Zaproponuj plan.
4. Wprowadzaj zmiany małymi krokami.
5. Po każdej większej zmianie uruchom odpowiednie testy lub walidację.
6. Jeśli zmieniasz architekturę albo kontrakt, zaktualizuj dokumentację i ADR.

## Standard wyników

Każda większa odpowiedź lub commit-ready zmiana powinna zawierać:
- zakres wykonanej pracy
- listę zmienionych plików
- uruchomione komendy
- wynik walidacji
- ryzyka lub otwarte kwestie
- proponowany następny krok

## Reguły dla frontendu

- Używaj Angular feature modules lub stand-alone organization zgodnie z istniejącą strukturą.
- PrimeNG stosuj do kontrolek enterprise.
- Tailwind stosuj do layoutu, spacingu i systemowej spójności widoku.
- OpenLayers jest jedyną biblioteką mapową dla głównych operacji mapowych.
- Nie twórz ciężkich komponentów typu “god component”.
- Rozdzielaj kontenery widoków od komponentów prezentacyjnych.
- Walidację formularzy organizuj czytelnie i spójnie.
- Pamiętaj o zsynchronizowaniu mapa ↔ tabela ↔ formularz.

## Reguły dla backendu

- Stosuj czytelny podział na controller / application service / domain / infrastructure.
- Nie umieszczaj logiki biznesowej w kontrolerach.
- Walidacje domenowe i walidacje techniczne rozdzielaj.
- Operacje geometryczne umieszczaj w warstwach dedykowanych.
- DTO trzymaj oddzielnie od modelu domenowego.
- Każda zmiana kontraktu API wymaga aktualizacji dokumentacji OpenAPI.

## Reguły dla bazy danych

- Baza opisowa to MS SQL.
- Migracje muszą być wersjonowane.
- Nazwy tabel i kolumn mają być spójne i przewidywalne.
- Historia zmian i statusy są obowiązkowe dla kluczowych encji.
- Nie wrzucaj logiki biznesowej do przypadkowych procedur bez uzasadnienia.

## Reguły dla GeoServer

- Style trzymaj jako osobne artefakty konfiguracyjne.
- Warstwy i workspace’y nazywaj konsekwentnie.
- Dokumentuj zależność stylów od typów obiektów i skali.
- Każda nowa warstwa powinna mieć opis przeznaczenia i źródła danych.

## Czego nie robić

Nie wolno:
- upraszczać projektu do demo-mapki
- ignorować książki drogi
- ignorować map techniczno-eksploatacyjnych
- proponować losowej symboliki mapowej
- pomijać historii i audytu zmian
- tworzyć ogólnikowej dokumentacji bez wartości wykonawczej
- wprowadzać niespójnego nazewnictwa
- robić zmian przekrojowych bez planu i bez aktualizacji docs

## Komendy kontrolne

Przed zakończeniem zadania uruchom odpowiednie komendy, zależnie od zakresu:

Frontend:
- install: `npm ci`
- lint: `npm run lint`
- test: `npm run test -- --watch=false`
- build: `npm run build`

Backend:
- build: `mvn clean verify`
- test: `mvn test`

Baza:
- sprawdź migracje i ich kolejność
- upewnij się, że dokumentacja schematu została zaktualizowana

## Priorytet startowy dla nowego repo

Jeśli repo jest na wczesnym etapie, zacznij od:
1. dokumentów architektury
2. ADR
3. modelu domenowego
4. bazy danych
5. kontraktów API
6. skeleton backendu
7. skeleton frontendu
8. głównego ekranu trybu zarządzania danymi

## Format odpowiedzi końcowej

Kończ większe zadania sekcją:

### Podsumowanie
### Zmienione pliki
### Uruchomione komendy
### Otwarte kwestie
### Następny krok

## Środowisko AI Coding Assistant

### Cel środowiska

Repozytorium korzysta z układu, w którym Codex jest głównym modelem decyzyjnym, Qwen 3.5 9B wystawiony z Kaggle przez ngrok jest tanim workerem, a Proxima MCP z Gemini jest konsultantem technicznym. Celem jest ograniczenie kosztu i zużycia kontekstu głównego modelu bez oddawania decyzji architektonicznych modelom pomocniczym.

### Role agentów

- Codex main model planuje prace, podejmuje decyzje architektoniczne, rozdziela zadania, wykonuje finalne review i czyta tylko wyselekcjonowany kontekst.
- `qwen_colab_explorer` / `qwen_kaggle_explorer` działa read-only, znajduje istotne pliki, streszcza przepływy i zwraca krótkie raporty.
- `qwen_colab_worker` / `qwen_kaggle_worker` wykonuje proste i średnie zadania zgodnie z planem głównego modelu.
- `gemini_consultant` korzysta z Proxima MCP do konsultacji ryzyk, wariantów i założeń.
- `final_reviewer` sprawdza finalny pakiet: plan, streszczenie eksploracji, diff, testy i ryzyka.

### Kiedy używać Codex main model

Używaj głównego Codexa do decyzji domenowych, architektury, granic frontend/backend/GeoServer/MS SQL, planowania zadań, interpretacji wymagań biznesowych, wyboru strategii testów oraz zatwierdzania finalnego diffu.

### Kiedy używać `qwen_colab_explorer` / `qwen_kaggle_explorer`

Używaj explorera przed czytaniem wielu plików przez główny model. Zlecaj mu znalezienie wejść, zależności, przepływów i plików wymagających uwagi. Explorer nie edytuje plików i nie podejmuje decyzji architektonicznych.

### Kiedy używać `qwen_colab_worker` / `qwen_kaggle_worker`

Używaj workera do boilerplate, lokalnych refaktoryzacji, prostych aktualizacji konfiguracji i zmian o jasnym zakresie. Worker musi dostać plan, listę plików oraz limit walidacji. Worker nie dotyka sekretów, nie usuwa plików i nie zmienia architektury bez instrukcji.

### Kiedy używać `gemini_consultant`

Używaj konsultanta, gdy potrzebna jest druga perspektywa: ryzyka architektury, porównanie wariantów, edge case’y, konsekwencje kosztowe albo ograniczenia Kaggle/ngrok/MCP. Gemini przez Proximę zwraca krótkie rekomendacje i ryzyka, nie pełną implementację.

### Kiedy używać `final_reviewer`

Używaj finalnego reviewera przed zakończeniem większej zmiany. Reviewer czyta tylko finalny pakiet review: plan, streszczenie eksploracji, listę zmienionych plików, diff, wyniki testów i ryzyka.

### Kiedy nie używać subagentów

Nie używaj subagentów dla drobnych jednoplikowych zmian, sekretów, decyzji wymagających pełnego kontekstu domenowego, awarii wymagającej natychmiastowej lokalnej diagnozy albo sytuacji, w której koszt przekazania kontekstu byłby większy niż samodzielna analiza.

### Reguły oszczędzania tokenów

- Nie skanuj całego repozytorium bez potrzeby.
- Nie kopiuj pełnych plików do głównego modelu, jeśli wystarczy streszczenie.
- Najpierw zleć eksplorację Qwenowi, potem czytaj selektywnie.
- Do głównego modelu przekazuj tylko plan, streszczenie eksploracji, listę istotnych plików, listę zmienionych plików, diff, wyniki testów i ryzyka.
- Gemini przez Proximę ma zwracać krótkie konsultacje, nie pełne implementacje.
- Qwen ma zwracać krótkie streszczenia, nie surowe logi.
- Przekazuj diff zamiast pełnych plików.
- Nigdy nie przesyłaj całego repo do kontekstu.

### Zasady przekazywania kontekstu

Każde zadanie dla workera powinno zawierać: cel, ograniczenia, istotne pliki, zakazane pliki, oczekiwany format odpowiedzi, maksymalny zakres walidacji i informację, że decyzje architektoniczne wracają do Codex main model.

### Zasady raportowania wyników

Explorer raportuje: `Relevant files`, `Observed flow`, `Potential risks`, `Recommended next files to inspect`. Worker raportuje: `Changed files`, `Summary`, `Validation run`, `Validation result`, `Risks / follow-up`. Consultant raportuje: `Recommendation`, `Risks`, `Alternative`, `What to verify`. Final reviewer raportuje: `Approve / Request changes`, `Blocking issues`, `Non-blocking issues`, `Security concerns`, `Token/cost concerns`, `Final recommendation`.

### Zasady bezpieczeństwa sekretów

Nie hardcoduj tokenów, API keys, URL-i tuneli ani danych logowania. Używaj wyłącznie zmiennych środowiskowych: `QWEN_KAGGLE_BASE_URL`, `QWEN_KAGGLE_API_KEY`, `QWEN_COLAB_BASE_URL`, `QWEN_COLAB_API_KEY`, `QWEN_MODEL_ID`, `PROXY_API_KEY`, `PROXIMA_PATH`, `GEMINI_API_KEY` lub mechanizmu logowania Proximy. Zmienne `QWEN_COLAB_*` są traktowane jako fallback dla starszych konfiguracji.

### Zasady pracy z Kaggle/ngrok

Kaggle jest niestabilnym środowiskiem roboczym, nie backendem produkcyjnym. Po restarcie sprawdź GPU, healthcheck, URL tunelu ngrok, model `Qwen/Qwen3.5-9B` i API key. Jeśli `/v1/responses` nie działa, użyj lokalnego proxy z `tools/proxy`.

### Zasady pracy z MCP/Proxima

Proxima jest konsultantem read-only. Konfiguracja MCP musi używać `PROXIMA_PATH` i sekretów Gemini z env albo własnego logowania Proximy. Test kontrolny: poproś Gemini przez Proxima MCP o review architektury w 5 punktach i zwróć tylko ryzyka oraz rekomendacje.

### Minimalny workflow dla typowego zadania

1. Codex main model czyta `AGENTS.md` i właściwe dokumenty z `docs/`.
2. `qwen_colab_explorer` / `qwen_kaggle_explorer` wskazuje istotne pliki i streszcza przepływ.
3. Codex main model przygotowuje plan i granice zmiany.
4. `qwen_colab_worker` / `qwen_kaggle_worker` wykonuje prostą lub średnią zmianę, jeśli zakres jest bezpieczny.
5. Codex main model przegląda diff i uruchamia odpowiednią walidację.
6. `gemini_consultant` ocenia ryzyka, jeśli zmiana dotyka architektury, kosztów lub integracji.
7. `final_reviewer` czyta finalny pakiet review.
8. Codex main model podejmuje decyzję końcową.

### Testy integracyjne środowiska agentowego

- Test 1, eksploracja: Codex pyta `qwen_colab_explorer` / `qwen_kaggle_explorer` o istotne pliki dla małej zmiany. Oczekiwany wynik to lista plików, krótkie streszczenie i brak pełnych logów.
- Test 2, prosta zmiana: Codex zleca `qwen_colab_worker` / `qwen_kaggle_worker` zmianę w bezpiecznym pliku. Oczekiwany wynik to zmienione pliki, minimalna walidacja i krótki raport.
- Test 3, konsultacja Gemini: Codex pyta Proxima MCP o review rozwiązania. Oczekiwany wynik to rekomendacje i ryzyka bez implementacji.
- Test 4, finalny review: `final_reviewer` czyta finalny diff. Oczekiwany wynik to approve/request changes, blokery i ryzyka.
- Test 5, kontrola tokenów: główny model otrzymuje tylko streszczenie, diff i listę plików, a nie całe repozytorium.

### Jak pracować w trybie oszczędzania tokenów

Najpierw explorer, potem główny model. Najpierw streszczenie, potem selektywne czytanie plików. Nigdy nie przesyłaj pełnych logów, jeśli wystarczy końcówka błędu. Nigdy nie przesyłaj całego repo do kontekstu. Przekazuj diff zamiast pełnych plików. Qwen wykonuje tanie rozpoznanie. Gemini daje krótkie review ryzyk. Codex main podejmuje decyzje tylko na podstawie skondensowanych danych. Final reviewer dostaje tylko finalny pakiet review.
