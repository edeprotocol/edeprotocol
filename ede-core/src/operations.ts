/**
 * EDE Core Operations
 * 
 * Four operations. Each produces a proof.
 * 
 * 1. register_substrate  → Proof<Substrate>
 * 2. authorize_channel   → Proof<Channel>
 * 3. flow                → Proof<Flux>
 * 4. settle_ct           → Proof<Settlement>
 */

import {
  Substrate, SubstrateId, SubstrateClass, SubstrateCrypto, IoProfile, StabilityProfile,
  Channel, ChannelId, ChannelState,
  Flux, FluxId, ObservedMetrics,
  Settlement, Distribution,
  CT, Hash, Timestamp,
  Proof, Evidence, SignatureEvidence, HashChainEvidence, InclusionEvidence, BioBindingEvidence,
  CryptoSuiteId, Signature, NalProof,
  is_pq_suite, VerificationResult,
  Csl, AnyCslEvent, SubstrateRegisteredEvent, ChannelAuthorizedEvent, FluxEvent, ChannelSettledEvent
} from './types';

import { hash, verify_signature, generate_id, now } from './crypto';
import { verify_proof } from './verify';

// =============================================================================
// REGISTER SUBSTRATE
// =============================================================================

export interface RegisterSubstrateParams {
  class: SubstrateClass;
  io: IoProfile;
  stability: StabilityProfile;
  crypto: SubstrateCrypto;
  initial_ct?: CT;
  ttl?: Timestamp;
  // Proof elements
  self_signature: Signature;
  prev_hash: Hash;
}

export function register_substrate(
  params: RegisterSubstrateParams
): Proof<Substrate> {
  
  // Derive substrate ID from crypto
  const id: SubstrateId = `did:ede:${generate_id(params.crypto.public_keys.get(params.crypto.primary_suite)!)}`;
  
  const claim: Substrate = {
    id,
    class: params.class,
    io: params.io,
    stability: params.stability,
    crypto: params.crypto,
    ct_balance: params.initial_ct ?? 0n,
    registered_at: now(),
    ttl: params.ttl
  };
  
  const evidence: Evidence[] = [
    {
      type: "SIGNATURE",
      suite: params.self_signature.suite,
      party: id,
      signature: params.self_signature
    },
    {
      type: "HASH_CHAIN",
      hash_suite: "SHA3_256",
      prev: params.prev_hash,
      current: hash(claim)
    }
  ];
  
  return {
    claim,
    evidence,
    verify: () => verify_substrate_registration(claim, evidence)
  };
}

function verify_substrate_registration(claim: Substrate, evidence: Evidence[]): VerificationResult {
  // Rule 1: Must have at least one PQ signature
  const sig_evidence = evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
  const has_pq = sig_evidence.some(e => is_pq_suite(e.suite));
  if (!has_pq) {
    return { valid: false, reason: "No post-quantum signature for substrate registration" };
  }
  
  // Rule 2: Primary suite must be PQ
  if (!is_pq_suite(claim.crypto.primary_suite)) {
    return { valid: false, reason: "Primary crypto suite must be post-quantum" };
  }
  
  // Rule 3: Signature must verify
  for (const sig of sig_evidence) {
    const pk = claim.crypto.public_keys.get(sig.suite);
    if (!pk) {
      return { valid: false, reason: `No public key for suite ${sig.suite}` };
    }
    if (!verify_signature(sig.signature, claim, pk)) {
      return { valid: false, reason: "Signature verification failed" };
    }
  }
  
  // Rule 4: Hash chain must be valid
  const hash_evidence = evidence.find(e => e.type === "HASH_CHAIN") as HashChainEvidence | undefined;
  if (!hash_evidence) {
    return { valid: false, reason: "Missing hash chain evidence" };
  }
  if (hash_evidence.current !== hash(claim)) {
    return { valid: false, reason: "Hash chain mismatch" };
  }
  
  // Rule 5: H+ must have neural_coupling
  if (claim.class === "H_PLUS" && (claim.io.neural_coupling === undefined || claim.io.neural_coupling <= 0)) {
    return { valid: false, reason: "H+ substrate must have neural_coupling > 0" };
  }
  
  return { valid: true };
}

// =============================================================================
// AUTHORIZE CHANNEL
// =============================================================================

export interface AuthorizeChannelParams {
  from: SubstrateId;
  to: SubstrateId;
  budget_ct: CT;
  max_bps: number;
  expires: Timestamp;
  nal_required: boolean;
  pocw_required: boolean;
  crypto_suite: CryptoSuiteId;
  // Proof elements
  sig_from: Signature;
  sig_to: Signature;
  from_inclusion: InclusionEvidence;
  to_inclusion: InclusionEvidence;
  prev_hash: Hash;
}

export function authorize_channel(
  params: AuthorizeChannelParams
): Proof<Channel> {
  
  const id: ChannelId = `ch_${generate_id(params.from + params.to + now())}`;
  
  const claim: Channel = {
    id,
    from: params.from,
    to: params.to,
    reserved_ct: params.budget_ct,
    consumed_ct: 0n,
    max_bps: params.max_bps,
    expires: params.expires,
    state: "OPEN",
    nal_required: params.nal_required,
    pocw_required: params.pocw_required,
    crypto_suite: params.crypto_suite,
    authorized_at: now()
  };
  
  const evidence: Evidence[] = [
    {
      type: "SIGNATURE",
      suite: params.sig_from.suite,
      party: params.from,
      signature: params.sig_from
    },
    {
      type: "SIGNATURE",
      suite: params.sig_to.suite,
      party: params.to,
      signature: params.sig_to
    },
    params.from_inclusion,
    params.to_inclusion,
    {
      type: "HASH_CHAIN",
      hash_suite: "SHA3_256",
      prev: params.prev_hash,
      current: hash(claim)
    }
  ];
  
  return {
    claim,
    evidence,
    verify: () => verify_channel_authorization(claim, evidence)
  };
}

function verify_channel_authorization(claim: Channel, evidence: Evidence[]): VerificationResult {
  // Rule 1: Channel suite must be PQ
  if (!is_pq_suite(claim.crypto_suite)) {
    return { valid: false, reason: "Channel crypto suite must be post-quantum" };
  }
  
  // Rule 2: Must have bilateral signatures
  const sigs = evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
  const from_sig = sigs.find(s => s.party === claim.from);
  const to_sig = sigs.find(s => s.party === claim.to);
  
  if (!from_sig || !to_sig) {
    return { valid: false, reason: "Missing bilateral signatures" };
  }
  
  // Rule 3: At least one signature must be PQ
  if (!is_pq_suite(from_sig.suite) && !is_pq_suite(to_sig.suite)) {
    return { valid: false, reason: "At least one signature must be post-quantum" };
  }
  
  // Rule 4: Both substrates must exist (inclusion proofs)
  const inclusions = evidence.filter(e => e.type === "INCLUSION") as InclusionEvidence[];
  if (inclusions.length < 2) {
    return { valid: false, reason: "Missing substrate inclusion proofs" };
  }
  
  // Rule 5: Budget must be positive
  if (claim.reserved_ct <= 0n) {
    return { valid: false, reason: "Channel budget must be positive" };
  }
  
  // Rule 6: Expiry must be in future
  if (new Date(claim.expires) <= new Date(claim.authorized_at)) {
    return { valid: false, reason: "Channel expiry must be in future" };
  }
  
  return { valid: true };
}

// =============================================================================
// FLOW
// =============================================================================

export interface FlowParams {
  channel: ChannelId;
  from: SubstrateId;
  to: SubstrateId;
  ct_delta: CT;
  observed: ObservedMetrics;
  // Proof elements
  sig_from: Signature;
  sig_to: Signature;
  channel_inclusion: InclusionEvidence;
  nal_proof?: NalProof;
  prev_hash: Hash;
}

export function flow(
  params: FlowParams
): Proof<Flux> {
  
  const id: FluxId = `fx_${generate_id(params.channel + now())}`;
  
  const claim: Flux = {
    id,
    channel: params.channel,
    from: params.from,
    to: params.to,
    ct_delta: params.ct_delta,
    observed: params.observed,
    timestamp: now()
  };
  
  const evidence: Evidence[] = [
    {
      type: "SIGNATURE",
      suite: params.sig_from.suite,
      party: params.from,
      signature: params.sig_from
    },
    {
      type: "SIGNATURE",
      suite: params.sig_to.suite,
      party: params.to,
      signature: params.sig_to
    },
    params.channel_inclusion,
    {
      type: "HASH_CHAIN",
      hash_suite: "SHA3_256",
      prev: params.prev_hash,
      current: hash(claim)
    }
  ];
  
  // Add bio-binding if NAL proof provided
  if (params.nal_proof) {
    evidence.push({
      type: "BIO_BINDING",
      substrate: params.from,
      nal_proof: params.nal_proof,
      time_window: [params.sig_from.timestamp, claim.timestamp],
      io_correlation: params.nal_proof.coupling_score
    });
  }
  
  return {
    claim,
    evidence,
    verify: () => verify_flux(claim, evidence)
  };
}

function verify_flux(claim: Flux, evidence: Evidence[]): VerificationResult {
  // Rule 1: Must have bilateral signatures
  const sigs = evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
  const from_sig = sigs.find(s => s.party === claim.from);
  const to_sig = sigs.find(s => s.party === claim.to);
  
  if (!from_sig || !to_sig) {
    return { valid: false, reason: "Missing bilateral signatures" };
  }
  
  // Rule 2: CT delta must be positive
  if (claim.ct_delta <= 0n) {
    return { valid: false, reason: "CT delta must be positive" };
  }
  
  // Rule 3: Channel must exist (inclusion proof)
  const channel_inclusion = evidence.find(e => e.type === "INCLUSION");
  if (!channel_inclusion) {
    return { valid: false, reason: "Missing channel inclusion proof" };
  }
  
  // Rule 4: Hash chain must be valid
  const hash_evidence = evidence.find(e => e.type === "HASH_CHAIN") as HashChainEvidence | undefined;
  if (!hash_evidence || hash_evidence.current !== hash(claim)) {
    return { valid: false, reason: "Hash chain invalid" };
  }
  
  return { valid: true };
}

// =============================================================================
// SETTLE CT
// =============================================================================

export interface SettleCtParams {
  channel: ChannelId;
  distributions: Distribution[];
  fees: CT;
  // Proof elements
  sig_from: Signature;
  sig_to: Signature;
  from: SubstrateId;
  to: SubstrateId;
  total_fluxed: CT;
  channel_inclusion: InclusionEvidence;
  prev_hash: Hash;
}

export function settle_ct(
  params: SettleCtParams
): Proof<Settlement> {
  
  const claim: Settlement = {
    channel: params.channel,
    total_fluxed: params.total_fluxed,
    fees: params.fees,
    distributions: params.distributions,
    settled_at: now()
  };
  
  const evidence: Evidence[] = [
    {
      type: "SIGNATURE",
      suite: params.sig_from.suite,
      party: params.from,
      signature: params.sig_from
    },
    {
      type: "SIGNATURE",
      suite: params.sig_to.suite,
      party: params.to,
      signature: params.sig_to
    },
    params.channel_inclusion,
    {
      type: "HASH_CHAIN",
      hash_suite: "SHA3_256",
      prev: params.prev_hash,
      current: hash(claim)
    }
  ];
  
  return {
    claim,
    evidence,
    verify: () => verify_settlement(claim, evidence, params.total_fluxed)
  };
}

function verify_settlement(claim: Settlement, evidence: Evidence[], expected_total: CT): VerificationResult {
  // Rule 1: Must have bilateral PQ signatures
  const sigs = evidence.filter(e => e.type === "SIGNATURE") as SignatureEvidence[];
  if (sigs.length < 2) {
    return { valid: false, reason: "Missing bilateral signatures" };
  }
  
  const has_pq = sigs.some(s => is_pq_suite(s.suite));
  if (!has_pq) {
    return { valid: false, reason: "Settlement requires at least one PQ signature" };
  }
  
  // Rule 2: CT CONSERVATION — the critical invariant
  const distributed = claim.distributions.reduce((sum, d) => sum + d.ct_amount, 0n);
  const total_out = distributed + claim.fees;
  
  if (total_out !== expected_total) {
    return { 
      valid: false, 
      reason: `CT conservation violated: in=${expected_total}, out=${total_out}` 
    };
  }
  
  // Rule 3: Fees must be non-negative
  if (claim.fees < 0n) {
    return { valid: false, reason: "Fees cannot be negative" };
  }
  
  // Rule 4: All distributions must be positive
  for (const d of claim.distributions) {
    if (d.ct_amount <= 0n) {
      return { valid: false, reason: "Distribution amounts must be positive" };
    }
  }
  
  return { valid: true };
}

// =============================================================================
// CSL OPERATIONS
// =============================================================================

export function append_to_csl(csl: Csl, event: AnyCslEvent): Csl {
  // Verify the proof before appending
  const result = event.proof.verify();
  if (!result.valid) {
    throw new Error(`Cannot append invalid event: ${result.reason}`);
  }
  
  return {
    events: [...csl.events, event],
    head: hash(event)
  };
}

export function create_substrate_event(proof: Proof<Substrate>, prev_hash: Hash): SubstrateRegisteredEvent {
  return {
    id: hash({ ...proof.claim, prev: prev_hash }),
    type: "SUBSTRATE_REGISTERED",
    timestamp: now(),
    proof
  };
}

export function create_channel_event(proof: Proof<Channel>, prev_hash: Hash): ChannelAuthorizedEvent {
  return {
    id: hash({ ...proof.claim, prev: prev_hash }),
    type: "CHANNEL_AUTHORIZED",
    timestamp: now(),
    proof
  };
}

export function create_flux_event(proof: Proof<Flux>, prev_hash: Hash): FluxEvent {
  return {
    id: hash({ ...proof.claim, prev: prev_hash }),
    type: "FLUX",
    timestamp: now(),
    proof
  };
}

export function create_settlement_event(proof: Proof<Settlement>, prev_hash: Hash): ChannelSettledEvent {
  return {
    id: hash({ ...proof.claim, prev: prev_hash }),
    type: "CHANNEL_SETTLED",
    timestamp: now(),
    proof
  };
}
