# Example: Multi-entity squad (H / H+ / SO / SSI)

Context: 2034, H+ operator coordinating a synthetic squad and a supra-system
for AI infra capital allocation.

- NIR:
  - H:   did:ede:h:0xuser123
  - H+:  did:ede:hplus:0xop42
  - SO:  did:ede:so:coreweave_risk_squad
  - SSI: did:ede:ssi:ai_infra_committee

- Flow:
  1. H (baseline) requests an infra allocation review via a classic interface.
  2. H+ picks it up in a high-bandwidth BCI session.
  3. H+ delegates deep risk analysis to the SO squad (NIL `DELEGATE_TASK`).
  4. SO squad runs scenario trees, emits NIL feedback and FLUX events with CT.
  5. SSI cluster receives a summary NIL intent and final CT settlement.

Artifacts:
- NIR entities: created/updated via `nir_v2.schema.json`.
- Intents: `nil_intent_v2.schema.json` (with `source_class` / `target_class`).
- Streams (for H+): `nil_stream_v1.schema.json` (BCI continuous control).
- Feedback (visual / neural): `nil_feedback_v1.schema.json`.
- Session log: `csl_session_v2.schema.json` (see `example_h_plus_operator_session.json`).
