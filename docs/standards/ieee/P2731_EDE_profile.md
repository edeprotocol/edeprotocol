# IEEE P2731 → EDE profile (BCI functional model)

This profile aligns the P2731 functional BCI model with the EDE+ stack (NIR/NIL/CSL/CT). It allows vendors and labs to declare compliance without waiting for the final IEEE publication.

## Goals
- Provide a lossless mapping between P2731 entities and EDE interoperability primitives.
- Keep transport/tooling decoupled (EDE ≠ MCP); this profile is about objects and proofs.
- Make "describe-in-P2731, speak-EDE" straightforward for vendors and labs.

## Canonical mappings

### P2731 entity/context → NIR
- **Entities**: Map P2731 device/context descriptors to NIR `entity` objects with class `H`/`H+`/`SO`.
- **IO profile**: Use `io_profile` to specify modality and channel topology; reference the same string in NIL payloads.
- **Liveness/NAL**: Declare `liveness` expectations and Neuro Attestation Layer (NAL) requirements.
- **Crypto suites**: Advertise supported signature/encryption suites matching the conformance signature profile.

### P2731 signals/features/commands → NIL
- **Signals**: Map P2731 signal classes to NIL `opcode` + `payload` entries.
- **Commands**: Express actuator or stimulation commands as NIL intents with risk/load/latency annotations.
- **Bounded risk**: Use NIL metadata for risk classification and operator confirmation requirements.

### P2731 runs/logs/outcomes → CSL
- **Runs/logs**: Emit CSL events capturing NIL/NIR exchange logs and CT deltas.
- **Outcomes**: Align P2731 trial outcomes with CSL `event` records referencing `pack_id` or session ids.
- **Proofs**: Include content hashes and signature suites for downstream verification and reproducibility.

## Profile object
The companion schema `schemas/profiles/ede_p2731_profile_v1.schema.json` defines a machine-readable profile object that vendors can publish or attach to DID documents.

### Fields (overview)
- `profile_id`: Stable identifier (DID/URI).
- `entity`: NIR-facing descriptor mapping P2731 entity names to NIR classes.
- `io_profile`: Modality + channels + sampling; must be consistent with NIL payloads.
- `capabilities`: Commands, signals, and supported opcodes (NIL side).
- `assurance`: Signature suites, liveness requirements, and attestation references.
- `outcomes`: How results/logs are bound into CSL/CT flows.

## Publication flow
1. Produce a P2731 profile object for the device or lab.
2. Publish via resolver (`did:neuro` or `did:ede`) with attested capabilities.
3. Gateways (HTTP/MCP/Agent Protocol) can project the profile into their respective transports without altering the semantics.
