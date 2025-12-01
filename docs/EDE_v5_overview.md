# EDE Protocol v5 – Overview



EDE v5 defines the **semantic and economic stack** for an AI-native world where:



- Humans (H)

- Augmented humans (H+)

- Autonomous agents



co-exist and share the same economic graph.



---



## Why Distinguish H / H+ / Agents?



By 2035–2045, the boundary between "human" and "machine" will be blurred by:



- Brain–Computer Interfaces (BCI)

- Cognitive prosthetics

- Continuous human–agent teaming



For economic, legal and technical reasons, the system must distinguish:



- **H – Human:**  

  Biological human, no persistent augmentation.  

  Cognitive work is limited by baseline bandwidth.



- **H+ – Augmented Human:**  

  Biological human with persistent augmentation:

  - Implants or high-bandwidth non-invasive BCI

  - Extended cognition via always-on agent swarms

  - Access to additional sensory / memory channels



- **Agent:**  

  Purely synthetic entity:

  - No biological substrate

  - May have access to massive compute and data

  - Must be bounded and observable



**EDE defines the rules of the game for this triad.**



---



## The Four Core Bricks



EDE v5 is structured around four core bricks:



1. **NIR – Neural Identity Registry**

2. **NIL – Neuro-Intent Language**

3. **CogniToken – Cognitive Economics**

4. **CSL – Cognitive Session Ledger**



Together they answer:



> "Who is acting, what do they intend, how much cognitive work did it cost, and how is this recorded?"



---



### 1. NIR – Neural Identity Registry (v2)



NIR defines a **neural DID (did:neuro)** for any entity:



- `entity_type ∈ { H, H_PLUS, AGENT }`

- Cognitive profile (bandwidth class, certified capacity)

- Liveness protocol (neuro-physiological challenge-response)

- Augmentation profile (BCI type, capabilities)

- Linked wallets / accounts

- Compliance flags (neurorights, consent status, jurisdiction)

- Delegation chain



NIR is **ledger-agnostic**:  

it can be implemented on a DLT, in a KYC system, or a mixed architecture.



---



### 2. NIL – Neuro-Intent Language (v2)



NIL is the **universal intent schema** that connects brain-level intent to agents and tools.



It defines:



- **NIL_Intent** – discrete intents  

  ("execute this command once")



- **NIL_Stream** – streaming intents  

  (speech, continuous control, thought flows)



- **NIL_Feedback** – feedback / stimulation packets  

  (what is written back into the sensory / cortical loop)



- **NIL_Orchestration** – multi-agent coordination  

  (consensus, delegation, rollback)



NIL is meant to plug into:



- Model Context Protocol (MCP)  

- Agent Protocol  

- Any Large Action Model or multi-agent orchestrator



---



### 3. CogniToken – Cognitive Economics (v2)



CogniToken defines **how expensive** a mental action is.



High-level idea:



- Each NIL intent has a **cognitive cost**

- Cost depends on:

  - Information content

  - Duration

  - Cognitive load

  - Criticality / risk

  - Switching overhead

  - Bandwidth utilization

  - Fatigue



CogniToken is first an **off-chain metric** (a unit),  

which can be mirrored by an on-chain token if needed.



---



### 4. CSL – Cognitive Session Ledger (v2)



CSL defines a **session** as a first-class object:



- Time-bounded interval of augmented cognition

- Contains many NIL intents

- Tracks:

  - Duration

  - Average focus / load

  - Risk profile

  - Checkpoints and rollback points

  - Total cognitive cost

  - An "imagination index"



A CSL session can be used to:



- Prove 3 hours of high-intensity co-piloting with agents

- Prove a creative run

- Build a **portfolio of augmented life sessions**



---



## One Sentence Definition



> **"EDE v5 is the protocol layer that defines how a human becomes an augmented, economically visible entity – and how this is measured, priced and logged."**



This repo contains the first public, open, coherent version of that stack.
