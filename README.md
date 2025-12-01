# EDE Protocol – Entity Differentiation Engine (v5 Draft)

EDE is a protocol stack that defines **how a biological human (H) becomes an economically visible augmented human (H+) in an AI–native world**.



It does **not** define hardware or low-level neural decoding.  

It defines the **semantic, economic and identity layer** between:



- **H** – baseline human

- **H+** – augmented human (BCI, cognitive prosthetics, extended cognition)

- **Agents** – autonomous AI systems and agent swarms



---



## Vision



> **EDE = the protocol layer that defines how a human becomes an augmented, economically visible entity.**



Hardware labs (Neuralink, Synchron, Chinese BCI players, Meta EMG, etc.) will compete on implants, sensors and decoding models.



EDE focuses on what they leave **empty**:



- How an entity is **typed** (H / H+ / Agent)

- How **neuro-intent** is translated into **agent actions**

- How **cognitive work** is **measured, priced and proven**

- How **sessions of augmented life** are recorded as portable economic objects



---



## EDE v5 Components



This repo contains four main building blocks:



1. **NIR v2 – Neural Identity Registry**  

   - `docs/NIR_spec_v2.md`  

   - `schemas/nir_v2.schema.json`  

   Self-sovereign identity for H / H+ / Agents, anchored in neural liveness and cognitive capabilities.



2. **NIL v2 – Neuro-Intent Language**  

   - `docs/NIL_spec_v2.md`  

   - `schemas/nil_intent_v2.schema.json`  

   - `schemas/nil_stream_v1.schema.json`  

   - `schemas/nil_feedback_v1.schema.json`  

   A universal schema for **intent packets**, **streaming intents**, **feedback (stimulation)** and **multi-agent orchestration**.



3. **CogniToken v2 – Cognitive Economics**  

   - `docs/CogniToken_economics_v2.md`  

   A non-linear cost model for mental commands and sessions.  

   It can be implemented purely off-chain, with an optional on-chain reference token.



4. **CSL v2 – Cognitive Session Ledger**  

   - `docs/CSL_spec_v2.md`  

   - `schemas/csl_session_v2.schema.json`  

   - `examples/example_h_plus_operator_session.json`  

   The ledger of **augmented sessions**: duration, intents, focus, risk, checkpoints and imagination index.



---



## Status



- **Stage:** Protocol design (draft v5)

- **Scope:** Semantic, identity and economic layer (H / H+ / Agents)

- **Out of scope:**

  - Raw neural signals

  - Decoding models

  - Implant hardware



---



## How to Use This Repo



- **Labs / BCI Companies**  

  - Use `NIR` to register users as H / H+ and to anchor neuro-liveness.  

  - Use `NIL` as the interface between decoded intent and your agent stack (MCP, Agent Protocol, custom LAMs).



- **Agent Frameworks / OS Vendors**  

  - Use `NIL` packets as the standard input for tool calls.  

  - Use `CSL` to log cognitive sessions and build "augmented portfolios".



- **Crypto / DePIN / Identity Projects**  

  - Use `CogniToken` as the **off-chain metric** model.  

  - Optionally define an on-chain token that mirrors CogniToken units.



---



## Files



- High-level overview:  

  - `docs/EDE_v5_overview.md`



- Core specs:  

  - `docs/NIR_spec_v2.md`  

  - `docs/NIL_spec_v2.md`  

  - `docs/CogniToken_economics_v2.md`  

  - `docs/CSL_spec_v2.md`



- Machine-readable schemas:  

  - `schemas/*.schema.json`



- Examples:  

  - `examples/example_h_plus_operator_session.json`  

  - `examples/example_multi_agent_squad.md`



PRs, critiques and alternative implementations are welcome.
