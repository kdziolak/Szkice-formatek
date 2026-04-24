# Qwen Coder on Google Colab

## Cel

Notebook `qwen3_colab_server.ipynb` uruchamia tani, mały model Qwen Coder jako OpenAI-compatible endpoint dla Codex. Serwer używa FastAPI + Transformers, a nie vLLM, dzięki czemu port HTTP otwiera się od razu, a `/health` pokazuje `loading`, `ready` albo `error`.

## Wymagania

- Google Colab z GPU.
- Hugging Face dostępny z Colaba.
- Model mieszczący się w dostępnej VRAM/RAM.
- Lokalnie ustawione zmienne `QWEN_COLAB_BASE_URL`, `QWEN_COLAB_API_KEY`, `QWEN_MODEL_ID`.

## Uruchomienie krok po kroku

1. Otwórz `tools/colab/qwen3_colab_server.ipynb` w Google Colab.
2. Włącz GPU: `Runtime -> Change runtime type -> GPU`.
3. Uruchom komórkę wykrywania GPU/RAM.
4. Uruchom instalację zależności.
5. Uruchom komórkę czyszczenia: zatrzymuje stary proces serwera i sprawdza, czy port `8000` jest wolny.
6. Wybierz model. Domyślny model weryfikacyjny to `Qwen/Qwen2.5-Coder-1.5B-Instruct`.
7. Podaj `QWEN_COLAB_API_KEY` przez `getpass`.
8. Wygeneruj plik serwera i uruchom FastAPI przez `uvicorn`.
9. Uruchom komórkę diagnostyczną, potem healthcheck i test chat.
10. Uruchom tunel Cloudflare. Ngrok jest opcjonalną alternatywą.
11. Skopiuj publiczny URL tunelu do lokalnego `QWEN_COLAB_BASE_URL`.

## Wybór modelu i zasoby

- `Qwen/Qwen2.5-Coder-1.5B-Instruct`: domyślny model weryfikacyjny. Najpierw nim potwierdź, że serwer, port i tunel działają.
- `Qwen/Qwen2.5-Coder-7B-Instruct-AWQ`: opcjonalny model po udanej weryfikacji 1.5B.
- Jeśli ustawiasz `QWEN_MODEL_ID`, wybierz model mały lub kwantyzowany, który realnie mieści się w dostępnej VRAM.
- Przy CUDA OOM zmniejsz `MAX_MODEL_LEN` do `2048` i `GPU_MEMORY_UTILIZATION` do `0.70`.
- Darmowy Colab może nie utrzymać modelu stabilnie. To nie jest produkcyjny backend.

## Zmienne środowiskowe lokalnie

Windows PowerShell:

```powershell
$env:QWEN_COLAB_BASE_URL="https://example-tunnel.trycloudflare.com"
$env:QWEN_COLAB_API_KEY="..."
$env:QWEN_MODEL_ID="Qwen/Qwen2.5-Coder-1.5B-Instruct"
```

Linux/macOS:

```bash
export QWEN_COLAB_BASE_URL="https://example-tunnel.trycloudflare.com"
export QWEN_COLAB_API_KEY="..."
export QWEN_MODEL_ID="Qwen/Qwen2.5-Coder-1.5B-Instruct"
```

## Test `/health`

```bash
curl "$QWEN_COLAB_BASE_URL/health"
```

## Test `/v1/chat/completions`

```bash
curl -s "$QWEN_COLAB_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $QWEN_COLAB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen2.5-Coder-1.5B-Instruct","messages":[{"role":"user","content":"Return ok."}],"max_tokens":32}'
```

## `/v1/responses`

Serwer notebooka wystawia `/v1/chat/completions` i `/v1/responses`. Jeśli klient Codex nadal wymaga lokalnego adaptera, uruchom:

```bash
python tools/proxy/responses_to_chat_proxy.py
```

## Typowe błędy

- Brak GPU: zmień runtime Colaba albo przerwij, bo CPU będzie zbyt wolny.
- CUDA OOM: zmniejsz `MAX_MODEL_LEN`, użyj FP8, zmniejsz `gpu_memory_utilization`.
- `ConnectionRefusedError` na `127.0.0.1:8000`: serwer FastAPI nie słucha. Uruchom komórkę diagnostyczną i sprawdź `process_poll`, `port_open` oraz tail `/content/qwen_server.log`.
- `/health` pokazuje `loading`: to poprawny stan, model jeszcze się ładuje.
- `/health` pokazuje `error`: przeczytaj `error` i tail `/content/qwen_server.log`.
- `port_open_before_start: True`: poprzedni proces nadal trzyma port. Uruchom komórkę czyszczenia ponownie albo zrestartuj runtime.
- Zbyt duży model: proces serwera może zakończyć się przed `/health`; wróć do domyślnego modelu 1.5B.
- Timeout: model nadal się ładuje albo Colab uśpił runtime.
- Zmiana URL tunelu: po restarcie Colaba ustaw `QWEN_COLAB_BASE_URL` od nowa.
- Błąd ładowania modelu: sprawdź dostęp do modelu, log `/content/qwen_server.log` i komunikat `error` z `/health`.
- Zbyt mały context window: zwiększ `MAX_MODEL_LEN`, jeśli VRAM pozwala.
- Brak `/v1/responses`: użyj `tools/proxy`.
