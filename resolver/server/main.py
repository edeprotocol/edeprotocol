from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import hashlib
import json

app = FastAPI(title="EDE+ did:neuro resolver", version="0.1.0")


class Signature(BaseModel):
    suite: str
    signer: Optional[str] = None
    signature: Optional[str] = None
    created: Optional[str] = None
    purpose: Optional[str] = None


class RegisterRequest(BaseModel):
    did: str
    document: Dict
    signatures: List[Signature] = Field(default_factory=list)


class AttestationRequest(BaseModel):
    did: str
    attestation: Dict
    signature: Optional[str] = None


def canonical_hash(payload: Dict) -> str:
    canonical = json.dumps(payload, separators=(",", ":"), sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def get_conn() -> Optional[sqlite3.Connection]:
    if os.environ.get("RESOLVER_IN_MEMORY"):
        return None
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS nir_records (
            did TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            signatures TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS attestations (
            did TEXT NOT NULL,
            payload TEXT NOT NULL,
            signature TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    return conn


class Registry:
    def __init__(self) -> None:
        self.memory_documents: Dict[str, Dict] = {}
        self.memory_signatures: Dict[str, List[Dict]] = {}
        self.memory_attestations: Dict[str, List[Dict]] = {}
        self.conn = get_conn()

    def register(self, did: str, document: Dict, signatures: List[Signature]) -> str:
        content_hash = canonical_hash(document)
        if self.conn:
            cur = self.conn.cursor()
            cur.execute(
                "REPLACE INTO nir_records (did, payload, signatures, created_at) VALUES (?, ?, ?, datetime('now'))",
                (did, json.dumps(document), json.dumps([s.model_dump() for s in signatures]),),
            )
            self.conn.commit()
        else:
            self.memory_documents[did] = document
            self.memory_signatures[did] = [s.model_dump() for s in signatures]
        return content_hash

    def add_attestation(self, did: str, attestation: Dict, signature: Optional[str]) -> None:
        if self.conn:
            cur = self.conn.cursor()
            cur.execute(
                "INSERT INTO attestations (did, payload, signature, created_at) VALUES (?, ?, ?, datetime('now'))",
                (did, json.dumps(attestation), signature),
            )
            self.conn.commit()
        else:
            if did not in self.memory_documents:
                raise KeyError("did_not_found")
            entry = {"attestation": attestation, "signature": signature}
            self.memory_attestations.setdefault(did, []).append(entry)

    def resolve(self, did: str) -> Dict:
        if self.conn:
            cur = self.conn.cursor()
            row = cur.execute("SELECT payload, signatures FROM nir_records WHERE did=?", (did,)).fetchone()
            if not row:
                raise KeyError("did_not_found")
            payload = json.loads(row[0])
            signatures = json.loads(row[1]) if row[1] else []
            attest_rows = cur.execute("SELECT payload, signature FROM attestations WHERE did=?", (did,)).fetchall()
            attestations = [
                {"attestation": json.loads(a[0]), "signature": a[1]} for a in attest_rows
            ]
        else:
            if did not in self.memory_documents:
                raise KeyError("did_not_found")
            payload = self.memory_documents[did]
            signatures = self.memory_signatures.get(did, [])
            attestations = self.memory_attestations.get(did, [])
        return {"did": did, "document": payload, "signatures": signatures, "attestations": attestations}


registry = Registry()
app = FastAPI(title="EDE+ did:neuro resolver", version="0.2.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/version")
def version():
    git_sha = os.environ.get("GIT_SHA", "unknown")
    return {"name": "ede-resolver", "version": app.version, "git_sha": git_sha}
class Registry:
    def __init__(self) -> None:
        self.documents: Dict[str, Dict] = {}
        self.signatures: Dict[str, List[Dict]] = {}
        self.attestations: Dict[str, List[Dict]] = {}

    def register(self, did: str, document: Dict, signatures: List[Signature]) -> str:
        self.documents[did] = document
        self.signatures[did] = [s.model_dump() for s in signatures]
        content_hash = canonical_hash(document)
        return content_hash

    def add_attestation(self, did: str, attestation: Dict, signature: Optional[str]) -> None:
        if did not in self.documents:
            raise KeyError("did_not_found")
        entry = {"attestation": attestation, "signature": signature}
        self.attestations.setdefault(did, []).append(entry)

    def resolve(self, did: str) -> Dict:
        if did not in self.documents:
            raise KeyError("did_not_found")
        return {
            "did": did,
            "document": self.documents[did],
            "signatures": self.signatures.get(did, []),
            "attestations": self.attestations.get(did, []),
        }


registry = Registry()

@app.get("/.well-known/did/neuro/{did}")
def resolve_did(did: str):
    try:
        return registry.resolve(did)
    except KeyError:
        raise HTTPException(status_code=404, detail="did not found")


@app.post("/nir/register")
def register(req: RegisterRequest):
    content_hash = registry.register(req.did, req.document, req.signatures)
    return {"status": "ok", "hash": content_hash}


@app.post("/nir/attest")
def attest(req: AttestationRequest):
    try:
        registry.add_attestation(req.did, req.attestation, req.signature)
    except KeyError:
        raise HTTPException(status_code=404, detail="did not found")
    return {"status": "ok"}


@app.get("/")
def health():
    return {"status": "ready", "dids": len(registry.documents)}
