# Responses to Chat Proxy

## Cel

Ten proxy jest minimalnym adapterem dla sytuacji, w której Codex wymaga endpointu `/v1/responses`, a mały model Qwen Coder uruchomiony w Colabie wystawia tylko `/v1/chat/completions`.

To nie jest pełna implementacja OpenAI Responses API. Adapter obsługuje praktyczny zakres: `input`, `instructions`, `model`, `temperature`, `max_output_tokens`, `/health`, `/v1/models`, `/v1/chat/completions` i `/v1/responses`.

## Kiedy jest potrzebny

- Codex custom provider oczekuje `wire_api = "responses"`.
- Colab/vLLM odpowiada na `/v1/chat/completions`, ale nie obsługuje `/v1/responses`.
- Chcesz stabilny lokalny URL dla Codex, mimo że publiczny URL tunelu Colaba zmienia się po restarcie.

## Instalacja

Windows PowerShell:

```powershell
py -3.10 -m venv .venv-proxy
.\.venv-proxy\Scripts\Activate.ps1
pip install fastapi uvicorn httpx
```

Linux/macOS:

```bash
python3.10 -m venv .venv-proxy
source .venv-proxy/bin/activate
pip install fastapi uvicorn httpx
```

## .env.example

```bash
QWEN_COLAB_BASE_URL=https://example-tunnel.trycloudflare.com
QWEN_COLAB_API_KEY=replace-with-colab-api-key
QWEN_MODEL_ID=Qwen/Qwen2.5-Coder-1.5B-Instruct
PROXY_API_KEY=replace-with-local-proxy-key
PROXY_HOST=127.0.0.1
PROXY_PORT=8765
PROXY_TIMEOUT_SECONDS=120
```

Nie commituj realnych wartości sekretów.

## Uruchomienie

Windows PowerShell:

```powershell
$env:QWEN_COLAB_BASE_URL="https://example-tunnel.trycloudflare.com"
$env:QWEN_COLAB_API_KEY="..."
$env:QWEN_MODEL_ID="Qwen/Qwen2.5-Coder-1.5B-Instruct"
$env:PROXY_API_KEY="..."
$env:PROXY_HOST="127.0.0.1"
$env:PROXY_PORT="8765"
$env:PROXY_TIMEOUT_SECONDS="120"
python tools\proxy\responses_to_chat_proxy.py
```

Linux/macOS:

```bash
export QWEN_COLAB_BASE_URL="https://example-tunnel.trycloudflare.com"
export QWEN_COLAB_API_KEY="..."
export QWEN_MODEL_ID="Qwen/Qwen2.5-Coder-1.5B-Instruct"
export PROXY_API_KEY="..."
export PROXY_HOST="127.0.0.1"
export PROXY_PORT="8765"
export PROXY_TIMEOUT_SECONDS="120"
python tools/proxy/responses_to_chat_proxy.py
```

## Testy

```bash
curl http://127.0.0.1:8765/health
```

```bash
curl -s http://127.0.0.1:8765/v1/chat/completions \
  -H "Authorization: Bearer $PROXY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen2.5-Coder-1.5B-Instruct","messages":[{"role":"user","content":"Return ok."}]}'
```

```bash
curl -s http://127.0.0.1:8765/v1/responses \
  -H "Authorization: Bearer $PROXY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen2.5-Coder-1.5B-Instruct","instructions":"Be concise.","input":"Return ok.","max_output_tokens":32}'
```

## Konfiguracja Codex

Profile `qwen-colab-worker` i `qwen-colab-readonly` w `.codex/config.toml` wskazują na:

```toml
[model_providers.qwen_colab_proxy]
base_url = "http://127.0.0.1:8765/v1"
env_key = "PROXY_API_KEY"
wire_api = "responses"
```

## Troubleshooting

- `401/403`: `PROXY_API_KEY` nie pasuje do nagłówka `Authorization: Bearer ...`.
- Timeout Colaba: sprawdź, czy notebook nadal działa i czy model nie ładuje się po restarcie.
- Błędny URL tunelu: zaktualizuj `QWEN_COLAB_BASE_URL` i uruchom proxy ponownie.
- Nieobsługiwany format requestu: adapter obsługuje tylko string albo listę wiadomości w `input`.
- Brak modelu: ustaw `QWEN_MODEL_ID` zgodnie z notebookiem.
- Błąd JSON: Colab zwrócił HTML, traceback albo stronę błędu tunelu zamiast JSON.
- Proxy działa, ale Codex nie akceptuje odpowiedzi: uruchom test `/v1/responses`, sprawdź `output_text` i oznacz jako `VERIFY_WITH_CURRENT_CODEX_VERSION`.
