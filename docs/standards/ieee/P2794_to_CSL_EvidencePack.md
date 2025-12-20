# IEEE P2794 → CSL Evidence Pack mapping (EDE+)

This note aligns the IEEE P2794 "Minimum Reporting Requirements for In Vivo Neural Interface Research" with the EDE+ Content Signing Layer (CSL). It is intended as an adoption rail for laboratories that must export regulatory, publication, or funding dossiers while keeping EDE v5 compatibility.

## Objectives
- Treat the P2794 Evidence Pack as the canonical export for labs adopting EDE+.
- Preserve CSL semantics for verifiability (hashes, signatures, attestations).
- Keep mapping lossless for downstream regulatory review and reproducibility.

## Evidence Pack structure
The accompanying schema `schemas/ieee/p2794_evidence_pack_v1.schema.json` expresses the wire format. Fields:

| Field | Purpose | CSL anchoring |
| --- | --- | --- |
| `pack_id` | Stable identifier for the pack, referenced by CT/CSL events. | Used as the `subject` in CSL events. |
| `study_meta` | Species, cohort, protocol references, IRB/ethics pointers. | Included in canonicalized body hashed in CSL envelope. |
| `device_meta` | Interface class, channels, placement, sampling configuration. | Provides device context for NIL/NIR claims. |
| `session_refs[]` | Array of CSL session ids + content-addressed hashes. | Connects pack to CSL session logs. |
| `outcomes[]` | Endpoint + metric + result + confidence (per P2794). | Each entry may be signed individually or as a bundle. |
| `data_availability` | Location, minimization flags, access constraints. | Explicit disclosure for reviewers; feed into NIL/CSL access proofs. |
| `signatures[]` | PI / lab / ethics endorsements. | Must follow the signature profile in `conformance/rules/signature_profile.md`. |

## Export + attestation flow
1. Collect session artifacts (NIR, NIL, CT, CSL) and compute canonical hashes.
2. Construct the P2794 Evidence Pack JSON.
3. Canonicalize (RFC 8785) and hash; emit CSL event referencing `pack_id` and content hash.
4. Attach signatures according to the signature profile (e.g., `PQ_DILITHIUM_3`).
5. Publish via the resolver/gateway; verifiers can replay hashes and signatures.

## Compatibility notes
- Existing `did:ede` identifiers remain valid; `did:neuro` can alias the same subject.
- NIL/NIR payloads do not change; the pack is a higher-level bundle for auditors.
- Conformance rules (canonical JSON, signature profile, test vectors) ensure deterministic verification across implementations.
