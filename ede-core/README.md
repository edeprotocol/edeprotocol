# EDE Core — Proof System Implementation

```
EDE is not a state machine.
EDE is not an event log.
EDE is a PROOF SYSTEM.
```

## Philosophy

Every operation produces a **proof**. Every proof is independently verifiable. State is derived from proofs. Invariants are theorems on proofs.

This means:
- No centralized state to corrupt
- Any node can verify any proof
- Any node can derive consistent state
- Invariants are mathematically guaranteed

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        OPERATIONS                           │
│  register_substrate → Proof<Substrate>                      │
│  authorize_channel  → Proof<Channel>                        │
│  flow               → Proof<Flux>                           │
│  settle_ct          → Proof<Settlement>                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         PROOFS                              │
│  { claim: T, evidence: Evidence[], verify(): boolean }      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          CSL                                │
│  Append-only log of verified proofs                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       INVARIANTS                            │
│  Theorems verified on the proof set                         │
│  - CT Conservation                                          │
│  - Bilateral Attestation                                    │
│  - Append-Only (Hash Chain)                                 │
│  - Substrate Sovereignty                                    │
│  - Post-Quantum Compliance                                  │
│  - Topology Neutrality                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DERIVED STATE                           │
│  Computed from proofs by any verifier                       │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```typescript
import {
  register_substrate,
  authorize_channel,
  flow,
  settle_ct,
  verify_all_invariants,
  derive_state
} from 'ede-core';

// 1. Register substrates
const h_plus = register_substrate({ ... });
const agent = register_substrate({ ... });

// 2. Authorize channel
const channel = authorize_channel({
  from: h_plus.claim.id,
  to: agent.claim.id,
  budget_ct: 1000n,
  ...
});

// 3. Flow CT
const flux = flow({
  channel: channel.claim.id,
  ct_delta: 500n,
  ...
});

// 4. Settle
const settlement = settle_ct({
  channel: channel.claim.id,
  distributions: [...],
  ...
});

// 5. Verify invariants
const results = verify_all_invariants(csl);
// results.all_valid === true
```

## Evidence Types

Every proof contains evidence:

| Type | Purpose |
|------|---------|
| `SIGNATURE` | Cryptographic attestation (PQ required for root-of-trust) |
| `HASH_CHAIN` | Append-only integrity |
| `INCLUSION` | Merkle proof of existence |
| `BIO_BINDING` | Neuro-liveness correlation |
| `ORACLE` | External attestation |

## Invariants

These are the theorems that must hold for any valid CSL:

| Invariant | Guarantee |
|-----------|-----------|
| CT Conservation | `Σ(ct_in) = Σ(ct_out) + fees` for every settlement |
| Bilateral Attestation | Every flux has signatures from both endpoints |
| Append-Only | Hash chain is unbroken from genesis |
| Substrate Sovereignty | Every channel has consent from both parties |
| PQ Compliance | All root-of-trust ops have post-quantum signatures |
| Topology Neutrality | CSL format is valid regardless of network |

## Files

```
ede-core/
├── src/
│   ├── types.ts       # Core type definitions
│   ├── crypto.ts      # Crypto primitives (replace for production)
│   ├── operations.ts  # Four proof-producing operations
│   ├── verify.ts      # Verification and invariant checks
│   └── index.ts       # Public API
└── tests/
    └── invariants.test.ts  # Full lifecycle test
```

## Running Tests

```bash
cd ede-core
npm install
npx ts-node tests/invariants.test.ts
```

## Production Notes

The crypto module (`crypto.ts`) contains placeholder implementations. For production:

1. Replace `hash()` with actual SHA3-256 or BLAKE3
2. Replace `verify_signature()` with real PQ verification (Dilithium, Falcon)
3. Replace `sign()` with real PQ signing
4. Implement full Merkle proof generation/verification

## License

Apache-2.0
