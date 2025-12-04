import {
  SubstrateId, ChannelId, Hash, Timestamp, CT, CryptoSuiteId, Signature,
  Evidence, SignatureEvidence, HashChainEvidence, InclusionEvidence, BioBindingEvidence, NalProof,
  Proof, Substrate, Channel, Session, SessionParticipant, Flux, Settlement,
  Csl, AnyCslEvent, SubstrateClass, ParticipantRole, is_pq_suite
} from './types.js';
import { hash, now, generate_id } from './crypto.js';

export interface RegisterSubstrateParams {
  class: SubstrateClass;
  label?: string;
  io: { max_bps: number; latency_ms: number; neural_coupling?: number };
  stability: { drift_rate: number; fault_rate: number; uptime_ratio: number };
  crypto: { supported_suites: CryptoSuiteId[]; primary_suite: CryptoSuiteId; public_keys: Record<string, string> };
  initial_ct: CT;
  signature: Signature;
}

export function register_substrate(params: RegisterSubstrateParams, prev_hash: Hash): Proof<Substrate> {
  const ts = now();
  const id = `did:ede:${hash(params.crypto.public_keys).slice(2, 18)}` as SubstrateId;

  const substrate: Substrate = {
    id, class: params.class, label: params.label, io: params.io, stability: params.stability,
    crypto: { supported_suites: params.crypto.supported_suites, primary_suite: params.crypto.primary_suite, public_keys: new Map(Object.entries(params.crypto.public_keys)) },
    ct_balance: params.initial_ct, registered_at: ts
  };

  const evidence: Evidence[] = [
    { type: "SIGNATURE", suite: params.signature.suite, party: id, signature: params.signature } as SignatureEvidence,
    { type: "HASH_CHAIN", hash_suite: "SHA3_256", prev: prev_hash, current: hash({ substrate, prev: prev_hash }) } as HashChainEvidence
  ];

  return {
    claim: substrate, evidence, created_at: ts,
    verify() {
      const sig = evidence.find(e => e.type === "SIGNATURE") as SignatureEvidence;
      if (!sig || !is_pq_suite(sig.suite)) return { valid: false, reason: "Root-of-trust requires PQ signature" };
      if (substrate.class === "H_PLUS" && (!substrate.io.neural_coupling || substrate.io.neural_coupling <= 0)) return { valid: false, reason: "H+ requires neural_coupling > 0" };
      return { valid: true };
    }
  };
}

export interface AuthorizeChannelParams {
  from: SubstrateId; to: SubstrateId; budget_ct: CT; max_bps: number; expires: Timestamp;
  nal_required: boolean; crypto_suite: CryptoSuiteId;
  from_signature: Signature; to_signature: Signature;
  from_inclusion: { root: Hash; path: Hash[]; index: number };
  to_inclusion: { root: Hash; path: Hash[]; index: number };
}

export function authorize_channel(params: AuthorizeChannelParams, prev_hash: Hash): Proof<Channel> {
  const ts = now();
  const id = `ch_${generate_id('')}` as ChannelId;

  const channel: Channel = {
    id, from: params.from, to: params.to, reserved_ct: params.budget_ct, consumed_ct: 0n,
    max_bps: params.max_bps, expires: params.expires, state: "OPEN",
    nal_required: params.nal_required, crypto_suite: params.crypto_suite, authorized_at: ts
  };

  const evidence: Evidence[] = [
    { type: "SIGNATURE", suite: params.from_signature.suite, party: params.from, signature: params.from_signature } as SignatureEvidence,
    { type: "SIGNATURE", suite: params.to_signature.suite, party: params.to, signature: params.to_signature } as SignatureEvidence,
    { type: "INCLUSION", hash_suite: "SHA3_256", root: params.from_inclusion.root, path: params.from_inclusion.path, index: params.from_inclusion.index } as InclusionEvidence,
    { type: "HASH_CHAIN", hash_suite: "SHA3_256", prev: prev_hash, current: hash({ channel, prev: prev_hash }) } as HashChainEvidence
  ];

  return {
    claim: channel, evidence, created_at: ts,
    verify() {
      if (!is_pq_suite(channel.crypto_suite)) return { valid: false, reason: "Channel requires PQ suite" };
      const sigs = evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
      if (sigs.length < 2) return { valid: false, reason: "Bilateral signatures required" };
      return { valid: true };
    }
  };
}

export interface CreateSessionParams {
  domain?: string;
  participants: { entity_id: SubstrateId; class: SubstrateClass; role: ParticipantRole; initial_ct_balance?: CT }[];
  signature: Signature;
}

export function create_session(params: CreateSessionParams, prev_hash: Hash): Proof<Session> {
  const ts = now();
  const id = `sess_${generate_id('')}` as any;

  const session: Session = {
    id, domain: params.domain,
    participants: params.participants.map(p => ({ entity_id: p.entity_id, class: p.class, role: p.role, initial_ct_balance: p.initial_ct_balance })),
    created_at: ts
  };

  const evidence: Evidence[] = [
    { type: "SIGNATURE", suite: params.signature.suite, party: params.participants[0]?.entity_id || ("unknown" as SubstrateId), signature: params.signature } as SignatureEvidence,
    { type: "HASH_CHAIN", hash_suite: "SHA3_256", prev: prev_hash, current: hash({ session, prev: prev_hash }) } as HashChainEvidence
  ];

  return {
    claim: session, evidence, created_at: ts,
    verify() {
      if (session.participants.length === 0) return { valid: false, reason: "Session needs participants" };
      return { valid: true };
    }
  };
}

export interface FlowParams {
  channel: ChannelId; session_id?: string; from: SubstrateId; to: SubstrateId; ct_delta: CT; is_critical?: boolean;
  observed: { actual_bps: number; error_rate: number; energy_joules: number };
  from_signature: Signature; to_signature: Signature;
  channel_inclusion: { root: Hash; path: Hash[]; index: number };
  nal_proof?: NalProof;
}

export function flow(params: FlowParams, prev_hash: Hash): Proof<Flux> {
  const ts = now();
  const id = `fx_${generate_id('')}` as any;

  const flux: Flux = {
    id, channel: params.channel, session_id: params.session_id as any, from: params.from, to: params.to,
    ct_delta: params.ct_delta, is_critical: params.is_critical, observed: params.observed, timestamp: ts
  };

  const evidence: Evidence[] = [
    { type: "SIGNATURE", suite: params.from_signature.suite, party: params.from, signature: params.from_signature } as SignatureEvidence,
    { type: "SIGNATURE", suite: params.to_signature.suite, party: params.to, signature: params.to_signature } as SignatureEvidence,
    { type: "INCLUSION", hash_suite: "SHA3_256", root: params.channel_inclusion.root, path: params.channel_inclusion.path, index: params.channel_inclusion.index } as InclusionEvidence,
    { type: "HASH_CHAIN", hash_suite: "SHA3_256", prev: prev_hash, current: hash({ flux, prev: prev_hash }) } as HashChainEvidence
  ];

  if (params.nal_proof) {
    evidence.push({ type: "BIO_BINDING", substrate: params.from, nal_proof: params.nal_proof, time_window: [ts, ts], io_correlation: params.nal_proof.coupling_score } as BioBindingEvidence);
  }

  return {
    claim: flux, evidence, created_at: ts,
    verify() {
      const sigs = evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
      if (sigs.length < 2) return { valid: false, reason: "Bilateral signatures required" };
      if (flux.ct_delta <= 0n) return { valid: false, reason: "CT delta must be positive" };
      return { valid: true };
    }
  };
}

export interface SettleCtParams {
  channel: ChannelId; total_fluxed: CT; fees: CT;
  distributions: { substrate: SubstrateId; ct_amount: CT }[];
  from_signature: Signature; to_signature: Signature;
  channel_inclusion: { root: Hash; path: Hash[]; index: number };
}

export function settle_ct(params: SettleCtParams, prev_hash: Hash): Proof<Settlement> {
  const ts = now();

  const settlement: Settlement = {
    channel: params.channel, total_fluxed: params.total_fluxed, fees: params.fees,
    distributions: params.distributions, settled_at: ts
  };

  const evidence: Evidence[] = [
    { type: "SIGNATURE", suite: params.from_signature.suite, party: params.distributions[0]?.substrate || ("unknown" as SubstrateId), signature: params.from_signature } as SignatureEvidence,
    { type: "SIGNATURE", suite: params.to_signature.suite, party: params.distributions[1]?.substrate || ("unknown" as SubstrateId), signature: params.to_signature } as SignatureEvidence,
    { type: "HASH_CHAIN", hash_suite: "SHA3_256", prev: prev_hash, current: hash({ settlement, prev: prev_hash }) } as HashChainEvidence
  ];

  return {
    claim: settlement, evidence, created_at: ts,
    verify() {
      const sigs = evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
      if (!sigs.every(s => is_pq_suite(s.suite))) return { valid: false, reason: "Settlement requires PQ signatures" };
      const total_dist = settlement.distributions.reduce((s, d) => s + d.ct_amount, 0n);
      if (settlement.total_fluxed !== total_dist + settlement.fees) return { valid: false, reason: "CT conservation violation" };
      return { valid: true };
    }
  };
}

export function create_empty_csl(): Csl {
  return { events: [], head: hash("EDE_GENESIS_v5") as Hash };
}

export function append_to_csl(csl: Csl, event: AnyCslEvent): Csl {
  const result = event.proof.verify();
  if (!result.valid) throw new Error(`Invalid proof: ${result.reason}`);
  return { events: [...csl.events, event], head: event.id };
}

export function create_substrate_event(proof: Proof<Substrate>, prev: Hash): AnyCslEvent {
  return { id: hash({ type: "SUBSTRATE_REGISTERED", proof, prev }) as Hash, type: "SUBSTRATE_REGISTERED", timestamp: now(), proof } as any;
}

export function create_channel_event(proof: Proof<Channel>, prev: Hash): AnyCslEvent {
  return { id: hash({ type: "CHANNEL_AUTHORIZED", proof, prev }) as Hash, type: "CHANNEL_AUTHORIZED", timestamp: now(), proof } as any;
}

export function create_session_event(proof: Proof<Session>, prev: Hash): AnyCslEvent {
  return { id: hash({ type: "SESSION_CREATED", proof, prev }) as Hash, type: "SESSION_CREATED", timestamp: now(), proof } as any;
}

export function create_flux_event(proof: Proof<Flux>, prev: Hash): AnyCslEvent {
  return { id: hash({ type: "FLUX", proof, prev }) as Hash, type: "FLUX", timestamp: now(), proof } as any;
}

export function create_settlement_event(proof: Proof<Settlement>, prev: Hash): AnyCslEvent {
  return { id: hash({ type: "CHANNEL_SETTLED", proof, prev }) as Hash, type: "CHANNEL_SETTLED", timestamp: now(), proof } as any;
}
