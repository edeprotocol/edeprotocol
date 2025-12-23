# Schema resolution strategy

EDE+ components resolve schemas deterministically using `$id` first, then lightweight type hints.

1. **Primary key**: `$id` in the JSON Schema. All schemas in `schemas/` include `$id`.
2. **Payload hint**: if payload carries `$schema`, it is used to pick the schema.
3. **Type hint**: if payload includes a `type` string, a registry lookup is performed against schema IDs containing that string (case-insensitive).
4. **Heuristics**: resolver/gateway/ede-lint fall back to structural hints (e.g., `substrate_id+io_profile` → NIR v2, `intent+payload` → NIL intent v2, `events[]` → CSL session v2).

Sidecar signatures live in `*.sig.json` files and are **not** part of the validated payload.

Both the Gateway and `ede-lint` use the same lookup order to avoid ambiguity.
