# Qwen 3.5 9B on Kaggle via ngrok

## Cel

Ta instrukcja opisuje lokalna konfiguracje Codex dla agentow Qwen uruchamianych na Kaggle i wystawionych przez ngrok jako OpenAI-compatible API.

Nie commituj realnych URL-i ngrok, tokenow ani API key. Po kazdym restarcie sesji Kaggle sprawdz healthcheck, model i aktualny URL tunelu.

## Model

Domyslny model dla agentow Qwen:

```text
Qwen/Qwen3.5-9B
```

Ten identyfikator jest uzywany w:

- `.codex/config.toml`
- `.codex/agents/qwen_kaggle_worker.toml`
- `.codex/agents/qwen_kaggle_explorer.toml`
- `tools/proxy/responses_to_chat_proxy.py`

## Zmienne lokalne

Windows PowerShell:

```powershell
$env:QWEN_KAGGLE_BASE_URL="https://e2af-34-87-235-47.ngrok-free.app/v1"
$env:QWEN_KAGGLE_API_KEY="..."
$env:QWEN_MODEL_ID="bartowski/Qwen_Qwen3.5-9B-GGUF"
$env:PROXY_API_KEY="..."
```

Linux/macOS:

```bash
export QWEN_KAGGLE_BASE_URL="https://example.ngrok-free.app"
export QWEN_KAGGLE_API_KEY="..."
export QWEN_MODEL_ID="Qwen/Qwen3.5-9B"
export PROXY_API_KEY="..."
```

## Preferowany tryb dla Codex

Uzywaj lokalnego proxy jako stabilnego endpointu dla Codex:

```bash
python tools/proxy/responses_to_chat_proxy.py
```

Provider `qwen_kaggle_proxy` w `.codex/config.toml` wskazuje na:

```text
http://127.0.0.1:8765/v1
```

Proxy przekazuje ruch do `QWEN_KAGGLE_BASE_URL` i uwierzytelnia lokalnego klienta przez `PROXY_API_KEY`.

## Tryb bezposredni

Provider `qwen_kaggle_direct` wskazuje na `${QWEN_KAGGLE_BASE_URL}/v1`, ale moze wymagac recznego override w Codex, jesli aktualna wersja klienta nie rozwija zmiennych srodowiskowych w `base_url`.

## Kontrola

```bash
curl "$QWEN_KAGGLE_BASE_URL/health"
```

```bash
curl -s "$QWEN_KAGGLE_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $QWEN_KAGGLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen3.5-9B","messages":[{"role":"user","content":"Return ok."}],"max_tokens":32}'
```

Jesli `/v1/responses` nie dziala bezposrednio na Kaggle, uruchom `tools/proxy`.
