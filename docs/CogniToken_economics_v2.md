# CogniToken v2 – Cognitive Economics



CogniToken defines a **unit of cognitive cost** for:



- Individual NIL intents

- Full CSL sessions



It is **ledger-agnostic** and can be implemented:



- Purely as a metric inside a closed system

- Mirrored by an on-chain token (CGN) for open economies



---



## 1. Intuition



In an AI-native economy, **compute is cheap** and **verified human cognition is scarce**.



CogniToken measures:



- How much **information** was processed

- For how **long**

- At what **load**

- With what **risk**

- Under what **fatigue**



---



## 2. Cost Formula (Intent-Level)



We define the cognitive cost of a single intent as:



```text

cogni_cost_intent =

  α · I · (1 + fatigue_factor)

+ β · (T / 1000)

+ γ · L · (1 - e^(−S / τ))

+ δ · C^κ

+ ε · B

````



Where:



* `I` – information_bits



* `T` – duration_ms



* `L` – cognitive_load_estimate (0–1)



* `S` – switching_count (context switches in the session)



* `C` – criticality (1 = low, 2 = medium, 3 = high, 4 = critical)



* `B` – bandwidth_utilization (0–1)



* `α, β, γ, δ, ε, κ, τ` – coefficients derived from `cognitive_profile.cost_coefficients` in NIR



* `fatigue_factor` – session-level variable based on elapsed time and average load



This makes:



* Fatigue increase cost **non-linearly**

* Critical actions exponentially more expensive (`C^κ`)

* Frequent context switching more expensive via `(1 - e^(−S / τ))`



---



## 3. Session-Level Cost



For a session:



```text

cogni_cost_session = Σ cogni_cost_intent_i  +  ζ · F

```



Where:



* `Σ cogni_cost_intent_i` – sum over all intents

* `F` – session-level fatigue index (0–1)

* `ζ` – global coefficient



A session with many small low-risk intents may cost less than a short, critical high-risk decision burst.



---



## 4. Imagination Index



CSL also tracks an **imagination index**:



* Ratio of **exploratory** to **exploitative** intents

* Diversity of agent calls

* Semantic distance between intents



High imagination index sessions may be:



* Rewarded (creative work)

* Penalized (if the goal is narrow execution)



The spec does **not** fix the formula; it provides recommended signals.



---



## 5. Off-Chain vs On-Chain



### Off-Chain



Every system implementing EDE MUST:



* Compute CogniToken units off-chain for:



  * Intents

  * Sessions



### Optional On-Chain Mirror (CGN)



Systems MAY define a token (CGN) that:



* Mirrors CogniToken units at a chosen rate

* Enables:



  * Markets for cognitive sessions

  * Yield for staked attention

  * Settlement between organizations



The protocol does **not** require any specific blockchain.



---



## 6. Example



For an intent:



```json

{

  "information_bits": 220.0,

  "duration_ms": 850,

  "cognitive_load_estimate": 0.72,

  "risk_level": "HIGH",

  "switching_count": 3,

  "bandwidth_utilization": 0.65

}

```



With a typical H+ profile:



* `α = 1.0`

* `β = 0.3`

* `γ = 0.5`

* `δ = 1.8`

* `ε = 0.2`

* `κ = 1.4`

* `τ = 5`

* `fatigue_factor = 0.2`



The system can compute `cogni_cost_intent` and log it into CSL.



---



## 7. Implementation Notes



* Coefficients SHOULD be calibrated using:



  * Empirical BCI data

  * Task performance metrics

* Different verticals (trading, surgery, art) MAY define profiles:



  * "Trader H+ Profile"

  * "Surgical H+ Profile"

  * "Creative H+ Profile"



All profiles remain compatible at protocol level.
