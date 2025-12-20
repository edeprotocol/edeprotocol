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
