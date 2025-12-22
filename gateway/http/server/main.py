import hashlib
import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("GATEWAY_DB", BASE_DIR / "gateway.db"))
SCHEMA_ROOT = Path(__file__).resolve().parents[2] / "schemas"

app = FastAPI(title="EDE Gateway", version="0.1.0")


def canonical_hash(payload: Any) -> str:
    canonical = json.dumps(payload, separators=(",", ":"), sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schema_id TEXT NOT NULL,
            hash TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS csl_chain (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_hash TEXT NOT NULL,
            prev_hash TEXT,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    return conn


def list_schemas() -> Dict[str, Path]:
    registry: Dict[str, Path] = {}
    for path in SCHEMA_ROOT.rglob("*.schema.json"):
        try:
            data = json.loads(path.read_text())
            schema_id = data.get("$id") or path.name
            registry[schema_id] = path
        except Exception:
            continue
    return registry


SCHEMA_REGISTRY = list_schemas()


class IngestRequest(BaseModel):
    document: Dict[str, Any]
    sidecar_sig: Optional[Dict[str, Any]] = None


class CSLAppendRequest(BaseModel):
    event: Dict[str, Any]


def detect_schema(doc: Dict[str, Any]) -> Optional[Path]:
    if "$schema" in doc and doc["$schema"] in SCHEMA_REGISTRY:
        return SCHEMA_REGISTRY[doc["$schema"]]
    doc_type = doc.get("type")
    if doc_type:
        for sid, path in SCHEMA_REGISTRY.items():
            if sid.endswith(f"{doc_type.lower()}.schema.json") or sid.lower().endswith(doc_type.lower()):
                return path
    # heuristic: nir vs nil intent vs csl session
    if "substrate_id" in doc and "io_profile" in doc:
        return SCHEMA_REGISTRY.get("https://schema.edeprotocol.org/nir_v2.schema.json")
    if "intent" in doc and "payload" in doc:
        return SCHEMA_REGISTRY.get("https://schema.edeprotocol.org/nil_intent_v2.schema.json")
    if "events" in doc and isinstance(doc.get("events"), list):
        return SCHEMA_REGISTRY.get("https://schema.edeprotocol.org/csl_session_v2.schema.json")
    return None


def validate_against_schema(schema_path: Path, doc: Dict[str, Any]) -> str:
    import jsonschema

    schema = json.loads(schema_path.read_text())
    jsonschema.validate(instance=doc, schema=schema)
    return schema.get("$id") or schema_path.name


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/version")
def version():
    git_sha = os.environ.get("GIT_SHA", "unknown")
    return {"name": "ede-gateway", "version": app.version, "git_sha": git_sha}


@app.post("/ingest")
def ingest(req: IngestRequest):
    schema_path = detect_schema(req.document)
    if not schema_path:
        raise HTTPException(status_code=400, detail="schema_not_detected")
    try:
        schema_id = validate_against_schema(schema_path, req.document)
    except Exception as exc:  # jsonschema exceptions
        raise HTTPException(status_code=422, detail=str(exc))

    doc_hash = canonical_hash(req.document)
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO documents (schema_id, hash, payload, created_at) VALUES (?, ?, ?, ?)",
        (schema_id, doc_hash, json.dumps(req.document), datetime.utcnow().isoformat()),
    )
    doc_id = cur.lastrowid
    conn.commit()
    return {"id": doc_id, "hash": doc_hash, "schema_id": schema_id}


@app.get("/docs/{doc_id}")
def get_document(doc_id: int):
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT payload FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="not_found")
    return json.loads(row[0])


@app.post("/csl/append")
def append_csl(req: CSLAppendRequest):
    event_hash = canonical_hash(req.event)
    conn = get_conn()
    cur = conn.cursor()
    prev = cur.execute("SELECT event_hash FROM csl_chain ORDER BY id DESC LIMIT 1").fetchone()
    prev_hash = prev[0] if prev else None
    cur.execute(
        "INSERT INTO csl_chain (event_hash, prev_hash, payload, created_at) VALUES (?, ?, ?, ?)",
        (event_hash, prev_hash, json.dumps(req.event), datetime.utcnow().isoformat()),
    )
    conn.commit()
    return {"event_hash": event_hash, "prev_hash": prev_hash}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=False)
