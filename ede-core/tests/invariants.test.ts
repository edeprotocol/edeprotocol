import { describe, it, expect } from 'vitest';
import { Hash, Signature, VerifyContext } from '../src/types.js';
import { hash, sign, generate_merkle_proof, build_merkle_tree } from '../src/crypto.js';
import { register_substrate, authorize_channel, create_session, flow, settle_ct, create_substrate_event, create_channel_event, create_session_event, create_flux_event, create_settlement_event, append_to_csl, create_empty_csl } from '../src/operations.js';
import { verify_all_invariants, derive_state } from '../src/verify.js';

const pq_sig = (d: unknown, p: string): Signature => sign(d, "PQ_DILITHIUM_3", `pk_${p}`);
const legacy_sig = (d: unknown, p: string): Signature => sign(d, "LEGACY_ED25519", `pk_${p}`);

describe('EDE Core Invariants', () => {
  it('full lifecycle: H+ → SO with session, all 7 invariants pass', () => {
    let csl = create_empty_csl();
    const genesis = csl.head;

    const h_plus = register_substrate({ class: "H_PLUS", io: { max_bps: 150000, latency_ms: 12, neural_coupling: 0.87 }, stability: { drift_rate: 0.001, fault_rate: 0.0001, uptime_ratio: 0.995 }, crypto: { supported_suites: ["PQ_DILITHIUM_3"], primary_suite: "PQ_DILITHIUM_3", public_keys: { "PQ_DILITHIUM_3": "pk_hplus" } }, initial_ct: 10000n, signature: pq_sig({}, "h_plus") }, genesis);
    expect(h_plus.verify().valid).toBe(true);
    csl = append_to_csl(csl, create_substrate_event(h_plus, genesis));

    const so = register_substrate({ class: "SO", io: { max_bps: 1e9, latency_ms: 1 }, stability: { drift_rate: 0, fault_rate: 0, uptime_ratio: 0.9999 }, crypto: { supported_suites: ["PQ_DILITHIUM_5"], primary_suite: "PQ_DILITHIUM_5", public_keys: { "PQ_DILITHIUM_5": "pk_so" } }, initial_ct: 5000n, signature: pq_sig({}, "so") }, csl.head);
    csl = append_to_csl(csl, create_substrate_event(so, csl.head));

    const sess = create_session({ domain: "AI_INFRA", participants: [{ entity_id: h_plus.claim.id, class: "H_PLUS", role: "OPERATOR", initial_ct_balance: 10000n }, { entity_id: so.claim.id, class: "SO", role: "SO_NODE", initial_ct_balance: 5000n }], signature: pq_sig({}, "h_plus") }, csl.head);
    csl = append_to_csl(csl, create_session_event(sess, csl.head));

    const merkle = build_merkle_tree([hash(h_plus.claim), hash(so.claim)] as Hash[]);
    const ch = authorize_channel({ from: h_plus.claim.id, to: so.claim.id, budget_ct: 1000n, max_bps: 100000, expires: new Date(Date.now() + 86400000).toISOString(), nal_required: true, crypto_suite: "PQ_DILITHIUM_3", from_signature: pq_sig({}, "h_plus"), to_signature: pq_sig({}, "so"), from_inclusion: { root: merkle, path: [], index: 0 }, to_inclusion: { root: merkle, path: [], index: 1 } }, csl.head);
    csl = append_to_csl(csl, create_channel_event(ch, csl.head));

    const ch_merkle = generate_merkle_proof([hash(ch.claim) as Hash], 0);
    const fx = flow({ channel: ch.claim.id, session_id: sess.claim.id, from: h_plus.claim.id, to: so.claim.id, ct_delta: 500n, is_critical: true, observed: { actual_bps: 95000, error_rate: 0.001, energy_joules: 0.5 }, from_signature: pq_sig({}, "h_plus"), to_signature: pq_sig({}, "so"), channel_inclusion: ch_merkle, nal_proof: { coupling_score: 0.85, bio_plausibility: 0.92, noise_entropy: 0.15, conduction_velocity_ms: 45 } }, csl.head);
    csl = append_to_csl(csl, create_flux_event(fx, csl.head));

    const stl = settle_ct({ channel: ch.claim.id, total_fluxed: 500n, fees: 25n, distributions: [{ substrate: so.claim.id, ct_amount: 450n }, { substrate: h_plus.claim.id, ct_amount: 25n }], from_signature: pq_sig({}, "h_plus"), to_signature: pq_sig({}, "so"), channel_inclusion: ch_merkle }, csl.head);
    csl = append_to_csl(csl, create_settlement_event(stl, csl.head));

    const ctx: VerifyContext = { ct_critical_threshold: 100n, allow_legacy_crypto: false };
    const r = verify_all_invariants(csl, ctx);
    expect(r.CT_CONSERVATION.ok).toBe(true);
    expect(r.BILATERAL_ATTESTATION.ok).toBe(true);
    expect(r.APPEND_ONLY.ok).toBe(true);
    expect(r.SUBSTRATE_SOVEREIGNTY.ok).toBe(true);
    expect(r.PQ_COMPLIANCE.ok).toBe(true);
    expect(r.TOPOLOGY_NEUTRALITY.ok).toBe(true);
    expect(r.H_GUARD_CRITICAL_CT.ok).toBe(true);
    expect(r.all_ok).toBe(true);

    const state = derive_state(csl);
    expect(state.substrates.size).toBe(2);
    expect(state.sessions.size).toBe(1);
  });

  it('H_GUARD fails when critical flux has no H/H+ operator', () => {
    let csl = create_empty_csl();
    const so1 = register_substrate({ class: "SO", io: { max_bps: 1e9, latency_ms: 1 }, stability: { drift_rate: 0, fault_rate: 0, uptime_ratio: 1 }, crypto: { supported_suites: ["PQ_DILITHIUM_3"], primary_suite: "PQ_DILITHIUM_3", public_keys: { "PQ_DILITHIUM_3": "pk_so1" } }, initial_ct: 1000n, signature: pq_sig({}, "so1") }, csl.head);
    csl = append_to_csl(csl, create_substrate_event(so1, csl.head));
    const so2 = register_substrate({ class: "SO", io: { max_bps: 1e9, latency_ms: 1 }, stability: { drift_rate: 0, fault_rate: 0, uptime_ratio: 1 }, crypto: { supported_suites: ["PQ_DILITHIUM_3"], primary_suite: "PQ_DILITHIUM_3", public_keys: { "PQ_DILITHIUM_3": "pk_so2" } }, initial_ct: 1000n, signature: pq_sig({}, "so2") }, csl.head);
    csl = append_to_csl(csl, create_substrate_event(so2, csl.head));
    const sess = create_session({ domain: "TEST", participants: [{ entity_id: so1.claim.id, class: "SO", role: "SO_NODE" }, { entity_id: so2.claim.id, class: "SO", role: "SO_NODE" }], signature: pq_sig({}, "so1") }, csl.head);
    csl = append_to_csl(csl, create_session_event(sess, csl.head));
    const merkle = build_merkle_tree([hash(so1.claim), hash(so2.claim)] as Hash[]);
    const ch = authorize_channel({ from: so1.claim.id, to: so2.claim.id, budget_ct: 1000n, max_bps: 1e6, expires: new Date(Date.now() + 86400000).toISOString(), nal_required: false, crypto_suite: "PQ_DILITHIUM_3", from_signature: pq_sig({}, "so1"), to_signature: pq_sig({}, "so2"), from_inclusion: { root: merkle, path: [], index: 0 }, to_inclusion: { root: merkle, path: [], index: 1 } }, csl.head);
    csl = append_to_csl(csl, create_channel_event(ch, csl.head));
    const ch_merkle = generate_merkle_proof([hash(ch.claim) as Hash], 0);
    const fx = flow({ channel: ch.claim.id, session_id: sess.claim.id, from: so1.claim.id, to: so2.claim.id, ct_delta: 500n, is_critical: true, observed: { actual_bps: 1e6, error_rate: 0, energy_joules: 1 }, from_signature: pq_sig({}, "so1"), to_signature: pq_sig({}, "so2"), channel_inclusion: ch_merkle }, csl.head);
    csl = append_to_csl(csl, create_flux_event(fx, csl.head));
    const ctx: VerifyContext = { ct_critical_threshold: 100n, allow_legacy_crypto: false };
    const r = verify_all_invariants(csl, ctx);
    expect(r.H_GUARD_CRITICAL_CT.ok).toBe(false);
    expect(r.H_GUARD_CRITICAL_CT.violations[0].code).toBe('H_GUARD_MISSING');
  });

  it('rejects classical signature for substrate registration', () => {
    const csl = create_empty_csl();
    const proof = register_substrate({ class: "H_PLUS", io: { max_bps: 100000, latency_ms: 10, neural_coupling: 0.8 }, stability: { drift_rate: 0, fault_rate: 0, uptime_ratio: 1 }, crypto: { supported_suites: ["PQ_DILITHIUM_3"], primary_suite: "PQ_DILITHIUM_3", public_keys: { "PQ_DILITHIUM_3": "pk" } }, initial_ct: 1000n, signature: legacy_sig({}, "bad") }, csl.head);
    expect(proof.verify().valid).toBe(false);
  });
});
