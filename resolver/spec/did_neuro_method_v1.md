# did:neuro method specification (v1)

The `did:neuro` method is a BCI-facing alias for EDE identifiers. It resolves to Neuro Interface Records (NIR) with attestable capabilities and is backward compatible with `did:ede` subjects.

## DID format
```
did:neuro:<method-specific-id>
```
- `method-specific-id` MUST be base58btc or UUID-like without uppercase characters.
- Implementations MAY expose an alias between `did:neuro` and `did:ede` for the same subject.

## DID Document requirements
- MUST include a `service` entry for NIL/NIR endpoints.
- MUST include `capabilities` describing supported profiles (e.g., P2731 mapping).
- MUST carry signatures following `conformance/rules/signature_profile.md` after canonicalization.

## Resolver behaviors
- `GET /.well-known/did/neuro/{did}` returns the latest signed NIR document and capability registry entries.
- `POST /nir/register` registers or updates the DID document with signatures.
- `POST /nir/attest` appends attestations (NAL, capability proofs, lab endorsements).

## Security considerations
- All returned documents are canonicalized and hashed before signing.
- Attestations reference the same `did:neuro` subject to avoid replay.
- Implementations SHOULD support PQ-safe suites (e.g., `PQ_DILITHIUM_3`).
