# NIR v2 – Neural Identity Registry Specification



NIR defines a **self-sovereign identity model** for:



- Humans (H)

- Augmented humans (H+)

- Agents (synthetic entities)



anchored in **neural liveness** and **cognitive profile**.



---



## 1. Goals



- Provide a **global, interoperable identifier**: `did:neuro`

- Distinguish **H / H+ / Agent** at protocol level

- Encode **cognitive capabilities** (bandwidth, stability)

- Support **neuro-liveness** challenge-response

- Enable **delegation** (H → H+ → agents)

- Carry **compliance flags** (neurorights, consent, jurisdiction)



---



## 2. DID Method – `did:neuro`



The DID string:



```text

did:neuro:<network>:<unique_id>

```



Examples:



* `did:neuro:mainnet:0xabc123...`

* `did:neuro:testnet:operator-001`



Resolution returns a JSON document matching `schemas/nir_v2.schema.json`.



---



## 3. Core Fields



At minimum, an NIR record contains:



* `neuro_did` – the DID string

* `entity_type` – `"H" | "H_PLUS" | "AGENT"`

* `cognitive_profile` – bandwidth and cost coefficients

* `liveness_protocol` – challenge-response parameters

* `augmentation_profile` – description of augmentations

* `linked_wallets` – external economic identifiers

* `compliance_flags` – neurorights and consent state

* `delegation_chain` – upstream authorities



See `schemas/nir_v2.schema.json` for exact structure.



---



## 4. Cognitive Profile



The **cognitive profile** describes the sustained capacity of the entity.



Example structure:



```json

"cognitive_profile": {

  "bandwidth_class": "BASELINE",

  "certified_bandwidth_bps": 80,

  "cost_coefficients": {

    "alpha_information": 1.0,

    "beta_time": 0.2,

    "gamma_load": 0.5,

    "delta_criticality": 2.0,

    "epsilon_bandwidth": 0.1,

    "zeta_fatigue": 0.3

  }

}

```



* `bandwidth_class` could be:



  * `BASELINE` (typical H)

  * `H_PLUS_TIER1`

  * `H_PLUS_TIER2`

  * `AGENT`



* `certified_bandwidth_bps` is an **estimated, certified** sustainable bandwidth, derived from neuro-measurements and task performance.



The cost coefficients are used by **CogniToken** to compute the cost of intents and sessions.



---



## 5. Liveness Protocol



To avoid identity theft, high-value actions require **neuro-liveness**.



Example:



```json

"liveness_protocol": {

  "challenge_type": "VISUAL_EVOKED",

  "expected_latency_ms_range": [250, 400],

  "entropy_threshold": 0.85

}

```



Possible challenge types:



* `VISUAL_EVOKED`

* `AUDITORY_P300`

* `MOTOR_IMAGERY`



The implementation is free, but NIR fixes the **parameters** that a verifier expects.



---



## 6. Augmentation Profile



Describes the augmentation:



```json

"augmentation_profile": {

  "status": "NONE | TRANSIENT | PERSISTENT",

  "devices": [

    {

      "device_type": "NON_INVASIVE_BCI | INVASIVE_BCI | EMG | WEARABLE",

      "vendor": "string",

      "model": "string",

      "bandwidth_bps": 500,

      "channels": 64

    }

  ],

  "agent_companions": [

    {

      "agent_did": "did:neuro:mainnet:agent-squad-001",

      "capabilities": ["RESEARCH", "TRADING", "AUTOMATION"]

    }

  ]

}

```



This allows any verifier to understand **why** an entity is considered H+.



---



## 7. Linked Wallets & Compliance Flags



Example:



```json

"linked_wallets": [

  {

    "type": "EVM",

    "address": "0x1234...",

    "label": "primary_cognitive_wallet"

  }

],

"compliance_flags": {

  "neurorights_respected": true,

  "consent_status": "ACTIVE",

  "jurisdiction": "EU",

  "data_minimization": true

}

```



EDE is **ledger-agnostic** – linking wallets is optional and can map to any economic system.



---



## 8. Delegation Chain



Delegation describes who can act on behalf of whom:



```json

"delegation_chain": [

  {

    "delegate_did": "did:neuro:mainnet:agent-squad-001",

    "scope": ["EXECUTE_NIL", "MANAGE_SESSIONS"],

    "expiry": "2040-01-01T00:00:00Z"

  }

]

```



This is key for:



* H delegating to H+ (when under augmentation)

* H+ delegating to agent swarms

* Auditing responsibility for actions



---



## 9. Schema



The authoritative schema is maintained in:



* `schemas/nir_v2.schema.json`
