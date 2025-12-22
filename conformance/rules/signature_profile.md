# Signature profile (EDE+)

This profile defines the fields and formatting rules used by EDE+ artifacts when declaring digital signatures.

## Fields
- `suite`: Signature suite identifier (e.g., `PQ_DILITHIUM_3`, `ECDSA_P256_SHA256`). Uppercase, digits, and underscores only.
- `signer`: DID/URN of the entity producing the signature.
- `signature`: Detached signature bytes encoded as base64url or hex.
- `created`: RFC 3339 timestamp for when the signature was produced (optional but recommended).
- `purpose`: Brief statement of what was signed (e.g., `pack_integrity`, `session_log`).

## Rules
1. Canonicalize the JSON body per `canonical_json.md` before hashing or signing.
2. Use SHA-256 for content hashing unless a suite specifies a stronger hash.
3. Embed the `suite` string in artifacts so verifiers can route to the correct algorithm.
4. Multiple signatures may appear; order is not semantically significant, but canonicalization sorts keys so hashes remain stable.
5. Verifiers must reject signatures lacking a supported `suite` or improperly formatted payloads.

The `ede-lint` CLI checks for the presence and format of `suite` in `signatures[]` to enforce these rules.
