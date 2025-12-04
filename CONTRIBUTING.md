# Contributing to EDE Protocol

## What We Welcome

### Protocol Feedback
- Critiques of NIR / NIL / CogniToken / CSL specifications
- Edge cases not covered by current schemas
- Invariant violations or logical inconsistencies
- Security concerns (especially quantum resilience)

### Implementations
- Alternative implementations in any language
- Partial implementations (single component)
- Validation tools
- Test suites

### Examples
- Real-world session traces (anonymized)
- H+ operator scenarios
- SO (agent) integration patterns
- Multi-substrate coordination examples

### Documentation
- Clarifications to existing specs
- Translations
- Tutorials for specific use cases

---

## How to Contribute

### For Protocol Feedback

1. Open an issue with prefix: `[NIR]`, `[NIL]`, `[CT]`, or `[CSL]`
2. Describe the concern or suggestion
3. If proposing a change, include:
   - Current behavior
   - Proposed behavior
   - Rationale
   - Impact on other components

### For Implementations

1. Open an issue with prefix: `[IMPL]`
2. Describe scope (full / partial, which components)
3. Link to repository or include code
4. We will review and potentially link from main README

### For Examples

1. Validate against schemas first:
   ```bash
   ajv validate -s schemas/csl_event_v2.schema.json -d your_example.json
   ```
2. Open a PR adding to `examples/`
3. Include brief description of the scenario

---

## Code Style (for ede-core contributions)

- TypeScript with strict mode
- No external dependencies in core
- All types explicitly defined
- Tests for every invariant
- Comments explain "why", not "what"

---

## Review Process

1. Maintainers review within 7 days
2. Feedback provided via GitHub comments
3. Accepted contributions merged to `main`
4. Significant protocol changes require RFC process

---

## RFC Process (for protocol changes)

For changes that affect:
- Schema structure
- Invariants
- Cryptographic requirements
- Substrate class definitions

Process:
1. Open issue with `[RFC]` prefix
2. Include full proposal with rationale
3. 14-day comment period
4. Maintainer decision with written rationale
5. If accepted, implementation PR follows

---

## Code of Conduct

- Technical discussion only
- No ad hominem
- Assume good faith
- Disagreement is welcome; hostility is not

---

## Questions

Open an issue with `[QUESTION]` prefix or email: protocol@edeprotocol.org
