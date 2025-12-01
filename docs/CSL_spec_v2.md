# CSL v2 – Cognitive Session Ledger Specification



CSL defines **sessions** of augmented cognition.



A session is:



> A time-bounded sequence of NIL packets (intents, streams, feedback) with a coherent goal and context.



---



## 1. Goals



- Represent sessions as **portable objects**

- Attach **cognitive cost** and **imagination index**

- Track **checkpoints** and possible **rollback points**

- Support **post-incident recovery** and forensics



---



## 2. Session Structure



Schema: `schemas/csl_session_v2.schema.json`



High-level:



```json

{

  "session_id": "csl_session_123",

  "subject_neuro_did": "did:neuro:mainnet:hplus-001",

  "created_at": "2032-04-10T20:15:00Z",

  "ended_at": "2032-04-10T23:15:00Z",

  "purpose": "H_PLUS_COPILOT_TRADING",

  "metadata": {

    "description": "3h intensive co-pilot trading with agent squad.",

    "tags": ["TRADING", "H_PLUS", "AGENT_SQUAD"]

  },

  "stats": {

    "total_intents": 145,

    "total_streams": 24,

    "average_cognitive_load": 0.68,

    "max_cognitive_load": 0.94,

    "average_risk_level": "HIGH",

    "imagination_index": 0.74

  },

  "cogni_cost": {

    "total_cost_units": 12950.3,

    "currency": "COGNI_UNIT_V2"

  },

  "checkpoints": [

    {

      "checkpoint_id": "chk_001",

      "timestamp": "2032-04-10T21:00:00Z",

      "cognitive_state_hash": "0xabc...",

      "rollback_eligible": true,

      "retention_days": 90

    }

  ],

  "events": [

    {

      "event_type": "NIL_INTENT",

      "ref_id": "nil_intent_001"

    },

    {

      "event_type": "NIL_STREAM",

      "ref_id": "nil_stream_005"

    }

  ],

  "incident": {

    "has_incident": false

  }

}

````



---



## 3. Checkpoints and Recovery



Checkpoints allow:



* Controlled rollback to a previous cognitive state

* Forensics after an incident



Key parameters:



* `cognitive_state_hash` – hash of serialized state

* `rollback_eligible` – whether rollback is allowed

* `retention_days` – how long the snapshot is kept



EDE does not standardize how the **state** itself is stored.

It only standardizes how checkpoints are **referenced** and **counted**.



---



## 4. Incident Section



If something goes wrong:



```json

"incident": {

  "has_incident": true,

  "incident_type": "UNINTENDED_ACTION",

  "description": "Position opened with wrong leverage.",

  "related_intent_ids": ["nil_intent_045"],

  "post_mortem": {

    "completed": false

  }

}

```



This can be used for:



* Insurance

* Legal processes

* Model updates and safety fine-tuning



---



## 5. Example



See:



* `examples/example_h_plus_operator_session.json`
