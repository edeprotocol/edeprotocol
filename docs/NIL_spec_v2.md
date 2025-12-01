# NIL v2 – Neuro-Intent Language Specification



NIL is a **transport-agnostic intent language** that connects:



- Decoded neural states

- To agents, tools and actions



It defines four main packet types:



1. `NIL_Intent` – discrete intents

2. `NIL_Stream` – streaming intents

3. `NIL_Feedback` – feedback / stimulation

4. `NIL_Orchestration` – multi-agent coordination (planned extension)



---



## 1. Common Concepts



All NIL packets share:



- `subject_neuro_did` – the entity acting (H / H+ / Agent)

- `session_id` – link to a CSL session

- `timestamp` – ISO-8601

- `trace_id` – correlation id for audits



---



## 2. NIL_Intent (Discrete)



Schema: `schemas/nil_intent_v2.schema.json`



High-level structure:



```json

{

  "type": "NIL_INTENT_V2",

  "subject_neuro_did": "did:neuro:mainnet:hplus-001",

  "session_id": "csl_session_123",

  "timestamp": "2032-04-10T20:15:30Z",

  "intent_type": "COMMAND",

  "agent_call": {

    "protocol": "MCP",

    "tool": "booking_tool.book_flight",

    "arguments": {

      "from": "CDG",

      "to": "DXB",

      "date": "2032-05-02"

    }

  },

  "cognitive_load_estimate": 0.72,

  "risk_level": "MEDIUM",

  "information_bits": 220.0,

  "duration_ms": 850,

  "context": {

    "emotional_valence": "NEUTRAL",

    "notes": "Strong clear intent; repeated twice."

  }

}

````



Key fields:



* `intent_type` – `"COMMAND" | "QUERY" | "DELEGATION"`

* `agent_call` – mapping to the target agent / tool

* `information_bits` – estimated information content

* `duration_ms` – time spent forming the intent

* `cognitive_load_estimate` – 0.0–1.0 subjective/decoded load

* `risk_level` – `"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"`



CogniToken uses these parameters to compute cost.



---



## 3. NIL_Stream (Continuous)



Schema: `schemas/nil_stream_v1.schema.json`



Used for:



* Continuous speech decoding

* Continuous control (robotic arm, cursor)

* Long-form thought flows



High-level structure:



```json

{

  "type": "NIL_STREAM_V1",

  "subject_neuro_did": "did:neuro:mainnet:hplus-001",

  "session_id": "csl_session_123",

  "stream_id": "stream_001",

  "chunk_duration_ms": 80,

  "chunks": [

    {

      "timestamp": "2032-04-10T20:15:30.000Z",

      "partial_intent_text": "book a flight from paris",

      "confidence": 0.91

    },

    {

      "timestamp": "2032-04-10T20:15:30.080Z",

      "partial_intent_text": "to dubai tomorrow morning",

      "confidence": 0.88

    }

  ],

  "finalized": false

}

```



The agent stack may:



* Consume chunks in real time

* Reconstruct a final `NIL_Intent` for logging

* Handle corrections and cancellations



---



## 4. NIL_Feedback (Stimulation / Return Channel)



Schema: `schemas/nil_feedback_v1.schema.json`



This models **what is written back to the nervous system**:



```json

{

  "type": "NIL_FEEDBACK_V1",

  "subject_neuro_did": "did:neuro:mainnet:hplus-001",

  "session_id": "csl_session_123",

  "timestamp": "2032-04-10T20:15:31Z",

  "feedback_type": "VISUAL_OVERLAY",

  "target_region": "V1",

  "intensity": 0.35,

  "duration_ms": 120,

  "payload": {

    "semantic_summary": "Flight options: 3 candidates.",

    "risk_indicator": "LOW"

  }

}

```



NIL does **not** prescribe stimulation parameters; it defines a semantic envelope so that:



* Labs can standardize APIs

* OS vendors can mediate safety/risk



---



## 5. NIL Orchestration (Planned Extension)



Future schema (not included yet in `schemas/`):



```json

{

  "type": "NIL_ORCHESTRATION_V1",

  "subject_neuro_did": "did:neuro:mainnet:hplus-001",

  "session_id": "csl_session_123",

  "orchestration_type": "CONSENSUS",

  "agent_swarm": [

    "did:neuro:mainnet:agent-trader-001",

    "did:neuro:mainnet:agent-risk-001"

  ],

  "quorum_threshold": 0.67,

  "rollback_point": "nil_intent_id_789",

  "policy": {

    "max_loss_percent": 2.0,

    "require_human_confirmation": true

  }

}

```



This will be used for:



* Finance

* Military

* High-impact decisions



---



## 6. Transport



NIL is **transport-agnostic**.



It can be carried over:



* WebSockets

* gRPC

* Message buses

* Encrypted streams



The spec focuses on **schema**, not on transport layer.
