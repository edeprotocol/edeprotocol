# EDE Protocol

**Entity Differentiation Engine — Protocol Stack for the Cognitive Economy**

```
┌─────────────────────────────────────────────────────────────────┐
│  EDE defines how H (humans), H+ (augmented), SO (synthetic      │
│  operators) and, in later stages, SSI (supra-systems)           │
│  are typed, measured, and settled.                              │
│                                                                 │
│  It is not hardware. It is not an app.                          │
│  It is the semantic, identity, and economic rail.               │
└─────────────────────────────────────────────────────────────────┘
```

> **EDE = the protocol layer that makes cognitive work legible, attributable, and settleable across biological and synthetic substrates.**

---

## Why this matters now

If AGI, H+ and synthetic operators are real, someone has to decide:

- **Who is allowed in the loop** (H vs H+ vs SO) for high-impact decisions.
- **How neuro-intent is translated** into actions across agent swarms.
- **How fused cognition is metered and settled** as an economic primitive.

If this layer is not shared, it will be re-implemented as:
- a closed internal protocol in 1–2 AGI labs,
- or a proprietary brain/agent OS.

EDE is the attempt to make that layer:
- **spec-level**, not product-level,
- **crypto-verifiable**, not trust-me,
- **substrate-agnostic** (neurons / silicon / quantum / photonic).

---

## Protocol Stack

```
Layer 3 │ CSL        │ Cognitive Session Ledger    │ Proof log, settlement
Layer 2 │ CogniToken │ CT units                    │ E/I/R normalized cost
Layer 1 │ NIL        │ Neuro-Intent Language       │ Intent ↔ Action binding  
Layer 0 │ NIR        │ Neural Identity Registry    │ Entity typing, liveness
────────┴────────────┴─────────────────────────────┴─────────────────────────
         Substrate    │ BCI / Wearables / Agents   │ Hardware (out of scope)
```

### NIR — Neural Identity Registry

Types entities into substrate classes with verifiable liveness:

| Class | Definition | Liveness Proof |
|-------|------------|----------------|
| `H` | Baseline human | Biometric |
| `H+` | Augmented human (BCI, neural interface) | Neuro-liveness (NAL) |
| `SO` | Synthetic operator (agent, swarm) | Proof-of-Cognitive-Work (PoCW) |

```json
{
  "$schema": "https://schema.edeprotocol.org/nir_v2.schema.json",
  "substrate_id": "did:ede:0x7f3a...",
  "class": "H_PLUS",
  "crypto": {
    "primary_suite": "PQ_DILITHIUM_3",
    "public_key": "..."
  },
  "io_profile": {
    "neural_coupling": 0.87,
    "max_bps": 150000,
    "latency_ms": 12
  }
}
```

### NIL — Neuro-Intent Language

Standard packets for intent → action binding. Machine-parseable, no human interpretation required.

```json
{
  "$schema": "https://schema.edeprotocol.org/nil_intent_v2.schema.json",
  "intent_id": "int_9x8f...",
  "source": "did:ede:0x7f3a...",
  "target": "did:ede:agent:0x4e2b...",
  "opcode": "DELEGATE_TASK",
  "payload": {
    "task_type": "research",
    "constraints": ["max_cost_ct:500", "deadline:3600s"]
  },
  "signature": {
    "suite": "PQ_DILITHIUM_3",
    "sig": "..."
  }
}
```

### CogniToken (CT)

Unit of account for cognitive work. Not a cryptocurrency — a measurement standard.

```
CT = normalized(E, I, R)

where:
  E = energy (joules)
  I = information (bits, post-entropy)
  R = reliability (0-1)
```

CT flows through channels between substrates. Conservation invariant: `Σ(ct_in) = Σ(ct_out) + fees`.

### CSL — Cognitive Session Ledger

Append-only proof log. Every operation produces a verifiable proof.

```json
{
  "event_id": "evt_3k9m...",
  "type": "FLUX",
  "timestamp": "2025-12-04T10:30:00Z",
  "proof": {
    "claim": { "channel": "ch_1a2b", "ct_delta": 150 },
    "evidence": [
      { "type": "SIGNATURE", "suite": "PQ_DILITHIUM_3", "from": "..." },
      { "type": "SIGNATURE", "suite": "PQ_DILITHIUM_3", "to": "..." },
      { "type": "HASH_CHAIN", "prev": "0x...", "current": "0x..." }
    ]
  }
}
```

---

## Core Properties

| Property | Guarantee |
|----------|-----------|
| **Quantum-resilient** | Post-quantum signatures required for all root-of-trust operations |
| **Crypto-agile** | Suite field on every signature; no hardcoded algorithms |
| **Substrate-agnostic** | Works for neurons, silicon, quantum, photonic |
| **Topology-neutral** | Single node to Dyson swarm; CSL is format, not network |
| **Bilateral attestation** | Every flux signed by both endpoints |
| **CT conservation** | Provable; no CT created or destroyed except by settlement |

---

## Repository Structure (EDE+)

```
edeprotocol/
├── conformance/               # Canonical JSON, signature profile, lint CLI, vectors
│   ├── cli/ede-lint/          # TS CLI: validate, canonicalize, signature field checks
│   ├── rules/                 # Conformance rules
│   └── test_vectors/          # Valid / invalid examples (NIR, NIL, CSL, CT)
├── resolver/                  # did:neuro resolver (FastAPI) + OpenAPI spec
│   ├── server/
│   └── spec/
├── gateway/                   # Optional adapters (HTTP, MCP, Agent Protocol)
├── docs/
│   ├── standards/ieee/        # P2794 → CSL Evidence Pack, P2731 → EDE profile
│   └── profiles/              # Tables and mappings
├── schemas/                   # JSON Schemas (NIR/NIL/CSL/CT + IEEE/P2731 profiles)
├── ede-core/                  # L0/L1 normative implementation
├── ede-labs/                  # L2 experimental (NOT normative)
├── README.md | ROADMAP.md | CONTRIBUTING.md
```

### Conformance toolkit

- **Schema validation**: `conformance/cli/ede-lint` uses AJV (Draft-07) to validate JSON artifacts against schemas under `schemas/`.
- **Canonical hashing**: the CLI canonicalizes JSON, hashes it, and surfaces the digest for signing or verification.
- **Signature profile enforcement**: verifies a `signature` object contains suite metadata (e.g., `PQ_DILITHIUM_3`) to keep signatures crypto-agile.

Run from repo root:

```bash
cd conformance/cli/ede-lint
npm install
npm run build && node dist/index.js --schema ../../schemas/nil_intent_v2.schema.json --data sample.json
```

### did:neuro resolver

Minimal FastAPI resolver that serves `did:neuro` documents and capability attestations:

```bash
cd resolver/server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

OpenAPI for the resolver lives in `resolver/openapi.yaml`.

---

## Validate Schemas

All schemas follow JSON Schema Draft-07.

```bash
# Install validator
npm install -g ajv-cli

# Validate an entity
ajv validate -s schemas/nir_v2.schema.json -d your_entity.json

# Validate an intent packet
ajv validate -s schemas/nil_intent_v2.schema.json -d your_intent.json
```

---

## Who Uses EDE

### BCI / Neural Interface Labs

- Register H+ operators with NIR
- Use neuro-liveness (NAL) for identity verification
- Log sessions to CSL for attribution and compliance

### Agent Frameworks / Agentic OS

- Accept NIL packets as standard input
- Use SO registration for agent identity
- Settle cognitive work in CT units

### Infrastructure / Settlement

- Implement CSL as proof log
- Provide CT ↔ compute ↔ fiat oracles
- Build audit tools on CSL events

---

## Quick Start

**1. Define an entity (NIR)**

```json
{
  "substrate_id": "did:ede:your_id",
  "class": "SO",
  "crypto": {
    "primary_suite": "PQ_DILITHIUM_3",
    "public_key": "base64..."
  },
  "io_profile": {
    "max_bps": 1000000000,
    "latency_ms": 1
  }
}
```

**2. Send an intent (NIL)**

```json
{
  "intent_id": "int_unique",
  "source": "did:ede:your_id",
  "target": "did:ede:target_id",
  "opcode": "EXECUTE",
  "payload": { "action": "search", "query": "..." },
  "signature": { "suite": "PQ_DILITHIUM_3", "sig": "..." }
}
```

**3. Log to CSL**

Every operation produces a proof. Append to your CSL implementation.

---

## Roadmap

| Version | Milestone |
|---------|-----------|
| v5.x | Protocol specs stabilized (current) |
| v6 | Reference implementation (ede-core) |
| v7 | Multi-domain deployments (H / H+ / SO) |
| v8 | SSI readiness (supra-systems) |

See [ROADMAP.md](ROADMAP.md) for details.

---

## 2040 Matrix

Who and what EDE actually governs:

| Dimension | H (humans) | H+ (augmented) | SO (synthetic operators) | SSI (supra-systems) |
|-----------|------------|----------------|--------------------------|---------------------|
| **Identity** | NIR: class = H | NIR: class = H_PLUS | NIR: class = SO | NIR: class = SSI (envelopes) |
| **Intent** | NIL (low-bandwidth) | NIL (high-bandwidth neuro) | NIL drives swarms | NIL multi-entity policies |
| **Cognition** | CT via CSL (optional) | CT via CSL (default) | CT via CSL (symmetric) | Aggregated CT across clusters |
| **Fusion** | — | FusionProofs (H+ + SO) | FusionProofs (H+ + SO) | Cross-cluster fusion (future) |

EDE does not define:
- which AGI runs,
- which BCI or wearable is used.

EDE defines:
- how these entities are **typed**,
- how their intent is **expressed**,
- how their fused cognition is **metered and proven**.

---

## SSI (Supra-Systems) — Reserved Class

EDE v5 focuses on three active classes:

- **H** — baseline humans
- **H+** — augmented humans (BCI / high-signal interfaces)
- **SO** — synthetic operators / agent swarms

A fourth class is reserved:

- **SSI** — supra-systems (clusters of H+ and/or SO treated as a single economic entity)

In v5, SSI is **not fully specified**:
- it appears in the type system and roadmap,
- it reuses the same primitives (NIR / NIL / CT / CSL),
- but concrete patterns (governance, envelopes, multi-operator proofs) are left for v8+.

**Rationale:** Supra-systems will emerge once H+ / SO clusters are real. The protocol reserves the namespace now, without overfitting too early.

---

## If this works

If H+ and synthetic operators become real economic actors, then:

- someone will control the **registry** of who is allowed in the loop,
- someone will control the **language** that binds their intent to agents,
- someone will control the **unit** that prices their fused cognition.

EDE is designed as an open, spec-level candidate for that layer.

Any lab, agent OS, or infra provider that adopts it early gets a shared standard instead of reinventing a private one.

If EDE becomes the de-facto standard:
- **CT** becomes the primitive unit of "cognitive work",
- **NIR** becomes the canonical registry of H / H+ / SO,
- **CSL** becomes the neutral record of augmented sessions.

---

## Integration Partners

EDE is in v5 draft. We are opening integration slots for:

- **AGI / Agentic OS teams** — Use NIL as your intent standard
- **BCI / Neural interface labs** — Use NIR for H+ identity
- **Settlement infrastructure** — Implement CSL + CT oracles

**Contact:** [protocol@edeprotocol.org](mailto:protocol@edeprotocol.org)

---

## License

Apache-2.0. See [LICENSE](LICENSE).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

We welcome:
- Protocol critiques
- Alternative implementations
- New examples (H+ / SO scenarios)
- Invariant test cases

---

```
EDE does not ask what you are.
EDE asks what you can prove.
```
