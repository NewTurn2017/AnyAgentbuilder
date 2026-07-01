from fastapi import FastAPI
import os

app = FastAPI()
AGENT_RUNTIME = os.getenv("AGENT_RUNTIME", "mock")

@app.get("/health")
def health():
    return {"status": "ok", "runtime": "mock", "domain_key": "library"}

@app.get("/state/bootstrap")
def bootstrap():
    return {"public_context": {}}

@app.get("/state")
def state():
    return {"public_context": {}}

@app.get("/state/stream")
def stream():
    return "state.snapshot\nstate.delta"

@app.post("/chat")
def chat():
    return {"assistant_message": "", "active_agent": "", "events": []}
