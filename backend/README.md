# Facilitation AI PoC - Backend

FastAPI backend implementing PoC endpoints for meeting facilitation features (F1, F2, F3, F4, F5, F16, F9, F10, F11, F18) with JSON storage.

## Setup

1. Python 3.11+
2. Create virtual env and install deps:

```bash
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
```

3. Copy env:

```bash
cp .env.example .env  # or create manually
```

## Run

```bash
python run.py
```

Swagger UI: http://localhost:8000/docs

## Key Endpoints

- POST `/meetings` create meeting (consent flag for F18)
- POST `/meetings/{id}/transcripts` add transcript chunk (F1 server ingestion)
- POST `/meetings/{id}/transcribe` upload audio file -> transcript chunks (F1)
- POST `/meetings/{id}/summaries/generate` 3-min window mini summary (F2)
- POST `/meetings/{id}/unresolved/extract` unresolved extraction (F3)
- POST `/meetings/{id}/proposals/generate` proposals for unresolved (F4)
- POST `/meetings/{id}/deviation/check` agenda deviation check (F5)
- POST/GET `/meetings/{id}/parking` manage parking lot (F16)
- POST/GET `/meetings/{id}/decisions` decisions (F9)
- POST/GET `/meetings/{id}/actions` actions (F10)
- POST `/meetings/{id}/summary/final` final markdown + slack text (F11)
- POST `/slack/send` send slack message (webhook) (common)

## Notes
- Storage: JSON files under `DATA_DIR/meetings`.
- ASR/LLM: stubbed in `app/services/`. Replace with real integrations.
- CORS: open for PoC.
