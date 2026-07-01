# 도서관 예약 도우미

Generated mock app for the `library` agentic operations domain.

## Run backend

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
AGENT_RUNTIME=mock uvicorn main:app --reload --port 8000
```

## Run frontend

```bash
cd frontend
npm install
VITE_API_BASE=http://127.0.0.1:8000 npm run dev
```

## QA

```bash
curl -i http://127.0.0.1:8000/health
curl -i -X POST http://127.0.0.1:8000/chat -H 'content-type: application/json' -d '{"thread_id":"demo","message":"도서관 스터디룸 예약하고 싶어요"}'
```

Mock mode is the default local path. It does not import or call OpenAI. A real Agents SDK extension should be added behind `AGENT_RUNTIME=openai` with typed context, guarded tools, and session storage.
