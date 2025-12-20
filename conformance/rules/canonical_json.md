# Canonical JSON (EDE+ conformance rule)

EDE+ artifacts must be canonicalized before hashing or signing. We adopt RFC 8785 (JCS) with deterministic UTF-8 encoding so that any compliant implementation yields identical byte sequences.

## Steps
1. Parse JSON with no transformations (preserve numbers and booleans as-is).
2. Sort object members lexicographically by key (codepoint order).
3. Emit strings with minimal escaping and UTF-8 encoding.
4. Disallow "NaN", "Infinity", or non-finite numbers.
5. Avoid insignificant whitespace; serialized output must be byte-identical across platforms.

## Why
- Stable hashes for CSL/CT events.
- Reproducible signatures across gateways and resolvers.
- Deterministic test vectors for the conformance suite.

Refer to `conformance/cli/ede-lint` for a reference implementation of canonicalization and hashing.
