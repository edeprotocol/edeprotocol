# TransducerFrame → NIL mapping

This note captures a minimal transformation path between raw transducer samples, NIL streams, and higher level NIL intents. It stays within strict schemas and uses append-only CSL for provenance.

## Mapping

1. **TransducerFrame (sensor window)**
   - `channels[].samples` carry raw values; quality is expressed via `signal_quality` and must include `confidence` and `noise_floor_db`.
2. **NIL Stream**
   - Aggregate frames by channel; retain `provenance` (`device_id`, `subject_id`, `session_id`).
   - Map `signal_quality.confidence` to stream-level `confidence` (e.g., average across frames).
3. **NIL Intent thresholds**
   - Emit an intent when confidence exceeds threshold (e.g., `>=0.8`) or on explicit event markers.
   - Include `payload` describing action and `risk` derived from signal quality.
4. **CSL session**
   - Each emitted stream or intent is logged into CSL with `prev_hash` chaining based on canonical JSON hash.

## Sidecar signatures

Signatures stay in `*.sig.json` sidecars; the payload stays schema-strict.

## Example flow

```text
transducer_frame_v1.schema.json  -> validate
  │
  ├─> nil_stream_v1.schema.json  -> validate
  │
  └─> nil_intent_v2.schema.json  -> validate
        └─> csl_session_v2.schema.json (append events)
```
