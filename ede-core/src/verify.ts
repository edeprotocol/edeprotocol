import {
  Hash, CT, SubstrateId, SessionId,
  SignatureEvidence, HashChainEvidence,
  Csl, AnyCslEvent, Flux, Settlement, Session, Substrate, Channel,
  VerifyContext, InvariantResult, InvariantViolation, InvariantSuiteResult,
  isFluxEvent, isSessionEvent, isSubstrateEvent, isChannelEvent, isSettlementEvent,
  isHumanClass, isGuardRole, is_pq_suite
} from './types.js';
import { hash } from './crypto.js';

export function verify_ct_conservation(csl: Csl, ctx: VerifyContext): InvariantResult {
  const violations: InvariantViolation[] = [];
  for (const event of csl.events) {
    if (!isSettlementEvent(event)) continue;
    const s = event.proof.claim;
    const total_dist = s.distributions.reduce((sum, d) => sum + d.ct_amount, 0n);
    if (s.total_fluxed !== total_dist + s.fees) {
      violations.push({ code: "CT_MISMATCH", message: `Settlement CT mismatch: ${s.total_fluxed} != ${total_dist} + ${s.fees}` });
    }
  }
  return { name: "CT_CONSERVATION", ok: violations.length === 0, violations };
}

export function verify_bilateral_attestation(csl: Csl, ctx: VerifyContext): InvariantResult {
  const violations: InvariantViolation[] = [];
  for (const event of csl.events) {
    if (!isFluxEvent(event)) continue;
    const flux = event.proof.claim;
    const sigs = event.proof.evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
    if (sigs.length < 2) {
      violations.push({ code: "MISSING_BILATERAL_SIG", message: `Flux ${flux.id} needs 2 signatures, has ${sigs.length}` });
    }
  }
  return { name: "BILATERAL_ATTESTATION", ok: violations.length === 0, violations };
}

export function verify_append_only(csl: Csl, ctx: VerifyContext): InvariantResult {
  const violations: InvariantViolation[] = [];
  if (csl.events.length === 0) return { name: "APPEND_ONLY", ok: true, violations };

  const genesis = hash("EDE_GENESIS_v5") as Hash;
  let expected_prev = genesis;

  for (let i = 0; i < csl.events.length; i++) {
    const event = csl.events[i];
    const hc = event.proof.evidence.find(e => e.type === "HASH_CHAIN") as HashChainEvidence | undefined;
    if (!hc) {
      violations.push({ code: "MISSING_HASH_CHAIN", message: `Event ${i} missing hash chain` });
      continue;
    }
    if (hc.prev !== expected_prev) {
      violations.push({ code: "HASH_CHAIN_BROKEN", message: `Event ${i} hash chain broken` });
    }
    expected_prev = hc.current;
  }
  return { name: "APPEND_ONLY", ok: violations.length === 0, violations };
}

export function verify_substrate_sovereignty(csl: Csl, ctx: VerifyContext): InvariantResult {
  const violations: InvariantViolation[] = [];
  for (const event of csl.events) {
    if (!isChannelEvent(event)) continue;
    const ch = event.proof.claim;
    const sigs = event.proof.evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
    const parties = new Set(sigs.map(s => s.party));
    if (!parties.has(ch.from)) violations.push({ code: "MISSING_FROM_CONSENT", message: `Channel ${ch.id} missing consent from ${ch.from}` });
    if (!parties.has(ch.to)) violations.push({ code: "MISSING_TO_CONSENT", message: `Channel ${ch.id} missing consent from ${ch.to}` });
  }
  return { name: "SUBSTRATE_SOVEREIGNTY", ok: violations.length === 0, violations };
}

export function verify_pq_compliance(csl: Csl, ctx: VerifyContext): InvariantResult {
  const violations: InvariantViolation[] = [];
  for (const event of csl.events) {
    if (isSubstrateEvent(event)) {
      const sigs = event.proof.evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
      if (!sigs.some(s => is_pq_suite(s.suite))) {
        violations.push({ code: "SUBSTRATE_NOT_PQ", message: "Substrate registration requires PQ signature" });
      }
    }
    if (isSettlementEvent(event)) {
      const sigs = event.proof.evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
      if (!sigs.every(s => is_pq_suite(s.suite))) {
        violations.push({ code: "SETTLEMENT_NOT_PQ", message: "Settlement requires all PQ signatures" });
      }
    }
  }
  return { name: "PQ_COMPLIANCE", ok: violations.length === 0, violations };
}

export function verify_topology_neutrality(csl: Csl, ctx: VerifyContext): InvariantResult {
  const violations: InvariantViolation[] = [];
  const valid_types = new Set(["SUBSTRATE_REGISTERED", "CHANNEL_AUTHORIZED", "SESSION_CREATED", "FLUX", "CHANNEL_SETTLED"]);
  for (const event of csl.events) {
    if (!valid_types.has(event.type)) {
      violations.push({ code: "INVALID_EVENT_TYPE", message: `Unknown event type: ${event.type}` });
    }
  }
  return { name: "TOPOLOGY_NEUTRALITY", ok: violations.length === 0, violations };
}

export function verify_h_guard(csl: Csl, ctx: VerifyContext): InvariantResult {
  const violations: InvariantViolation[] = [];
  const sessions = new Map<SessionId, Session>();
  const fluxesBySession = new Map<SessionId, Flux[]>();

  for (const event of csl.events) {
    if (isSessionEvent(event)) sessions.set(event.proof.claim.id, event.proof.claim);
    if (isFluxEvent(event) && event.proof.claim.session_id) {
      const sid = event.proof.claim.session_id;
      const arr = fluxesBySession.get(sid) || [];
      arr.push(event.proof.claim);
      fluxesBySession.set(sid, arr);
    }
  }

  for (const [session_id, session] of sessions) {
    const fluxes = fluxesBySession.get(session_id) || [];
    const hasCritical = fluxes.some(f => f.is_critical === true || f.ct_delta >= ctx.ctCriticalThreshold);
    if (!hasCritical) continue;

    const hasHumanGuard = session.participants.some(p => isHumanClass(p.class) && isGuardRole(p.role));
    if (!hasHumanGuard) {
      violations.push({
        code: "H_GUARD_MISSING",
        message: "Critical CT flows require H/H+ in REQUESTOR or OPERATOR role",
        session_id
      });
    }
  }
  return { name: "H_GUARD_CRITICAL_CT", ok: violations.length === 0, violations };
}

export function verify_all_invariants(csl: Csl, ctx: VerifyContext): InvariantSuiteResult {
  const CT_CONSERVATION = verify_ct_conservation(csl, ctx);
  const BILATERAL_ATTESTATION = verify_bilateral_attestation(csl, ctx);
  const APPEND_ONLY = verify_append_only(csl, ctx);
  const SUBSTRATE_SOVEREIGNTY = verify_substrate_sovereignty(csl, ctx);
  const PQ_COMPLIANCE = verify_pq_compliance(csl, ctx);
  const TOPOLOGY_NEUTRALITY = verify_topology_neutrality(csl, ctx);
  const H_GUARD_CRITICAL_CT = verify_h_guard(csl, ctx);

  const all_ok = [CT_CONSERVATION, BILATERAL_ATTESTATION, APPEND_ONLY, SUBSTRATE_SOVEREIGNTY, PQ_COMPLIANCE, TOPOLOGY_NEUTRALITY, H_GUARD_CRITICAL_CT].every(r => r.ok);

  return { CT_CONSERVATION, BILATERAL_ATTESTATION, APPEND_ONLY, SUBSTRATE_SOVEREIGNTY, PQ_COMPLIANCE, TOPOLOGY_NEUTRALITY, H_GUARD_CRITICAL_CT, all_ok };
}

export interface DerivedState {
  substrates: Map<SubstrateId, Substrate>;
  channels: Map<string, Channel>;
  sessions: Map<SessionId, Session>;
  ct_balances: Map<SubstrateId, CT>;
}

export function derive_state(csl: Csl): DerivedState {
  const substrates = new Map<SubstrateId, Substrate>();
  const channels = new Map<string, Channel>();
  const sessions = new Map<SessionId, Session>();
  const ct_balances = new Map<SubstrateId, CT>();

  for (const event of csl.events) {
    if (isSubstrateEvent(event)) {
      const s = event.proof.claim;
      substrates.set(s.id, s);
      ct_balances.set(s.id, s.ct_balance);
    }
    if (isChannelEvent(event)) channels.set(event.proof.claim.id, event.proof.claim);
    if (isSessionEvent(event)) sessions.set(event.proof.claim.id, event.proof.claim);
    if (isFluxEvent(event)) {
      const ch = channels.get(event.proof.claim.channel);
      if (ch) ch.consumed_ct += event.proof.claim.ct_delta;
    }
    if (isSettlementEvent(event)) {
      const s = event.proof.claim;
      const ch = channels.get(s.channel);
      if (ch) ch.state = "CLOSED";
      for (const d of s.distributions) {
        ct_balances.set(d.substrate, (ct_balances.get(d.substrate) || 0n) + d.ct_amount);
      }
    }
  }
  return { substrates, channels, sessions, ct_balances };
}
