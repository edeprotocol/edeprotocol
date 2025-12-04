# EDE Protocol Roadmap

## Current: v5.x — Protocol Specification

**Status:** Draft, open for feedback

| Component | Version | Status |
|-----------|---------|--------|
| NIR | v2 | Stable draft |
| NIL | v2 | Stable draft |
| CogniToken | v2 | Stable draft |
| CSL | v2 | Stable draft |
| Quantum resilience | v1 | Integrated |

**Deliverables:**
- JSON Schema definitions for all components
- Protocol specification documents
- Example payloads and sessions

---

## Next: v6 — Reference Implementation

**Target:** Q2 2025

**Scope:**
- `ede-core`: Proof system implementation
  - 4 operations: `register_substrate`, `authorize_channel`, `flow`, `settle_ct`
  - Invariant verification
  - CSL event generation
- `ede-validate`: Schema validation CLI
- `ede-sdk`: TypeScript SDK for NIR + NIL

**Success criteria:**
- Pass all invariant tests
- Validate real session traces
- <1000 lines of core code

---

## v7 — Multi-Domain Deployment

**Target:** Q4 2025

**Scope:**
- At least 2 independent deployments
- Cross-domain CT settlement
- Interoperability test suite

**Domains:**
- BCI lab integration (H+ operators)
- Agent framework integration (SO entities)
- Settlement infrastructure (CT oracles)

---

## v8 — SSI Readiness (Supra-Systems)

**Target:** 2026

**Scope:**
- SSI envelopes to represent clusters of H+ / SO as single entities
- Aggregated CT and CSL views over multiple substrates and domains
- Additional invariants for cross-entity governance and settlement
- Multi-operator proofs and collective identity verification

**Research required:**
- Collective identity proofs
- Attribution in multi-substrate operations
- Governance for protocol evolution
- Cross-cluster fusion episodes
- Economic models for supra-entity settlement

---

## Long-term Vision

```
2025  │ v5-v6  │ Specs + reference impl (H / H+ / SO)
2026  │ v7-v8  │ Multi-domain + SSI readiness
2027+ │ v9+    │ Standard body submission (IEEE, W3C)
2030+ │        │ Default rail for cognitive economy
2040+ │        │ SSI clusters as civilization-scale infra
```

---

## Non-Goals (Explicitly Out of Scope)

- Hardware specifications
- Low-level neural decoding
- Cryptocurrency or token speculation
- Consumer applications
- Jurisdiction-specific compliance (handled by L2)

---

## How to Influence the Roadmap

1. Open an issue with `[ROADMAP]` prefix
2. Propose concrete changes with rationale
3. Reference existing protocol components

We prioritize feedback from:
- Active implementers
- Domain experts (BCI, agents, settlement)
- Organizations with deployment intent
