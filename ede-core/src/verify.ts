/**
 * EDE Core — Verification & Invariants
 * 
 * Invariants are theorems on the proof set.
 * If all proofs verify and all invariants hold, the system is consistent.
 */

import {
  Proof, Evidence, VerificationResult,
  Csl, AnyCslEvent,
  CT, Hash,
  is_pq_suite
} from './types';

import { hash } from './crypto';

// =============================================================================
// PROOF VERIFICATION
// =============================================================================

/**
 * Verify any proof by calling its verify method.
 */
export function verify_proof<T>(proof: Proof<T>): VerificationResult {
  return proof.verify();
}

/**
 * Verify all proofs in a CSL.
 */
export function verify_all_proofs(csl: Csl): VerificationResult {
  for (const event of csl.events) {
    const result = event.proof.verify();
    if (!result.valid) {
      return {
        valid: false,
        reason: `Event ${event.id} failed verification: ${result.reason}`
      };
    }
  }
  return { valid: true };
}

// =============================================================================
// INVARIANT 1: CT CONSERVATION
// =============================================================================

/**
 * Verify that CT is conserved across all settlements in the CSL.
 * 
 * For every settlement: Σ(ct_in) = Σ(ct_out) + fees
 */
export function verify_ct_conservation(csl: Csl): VerificationResult {
  const settlements = csl.events.filter(e => e.type === "CHANNEL_SETTLED");
  
  for (const event of settlements) {
    const settlement = event.proof.claim;
    const distributed = settlement.distributions.reduce(
      (sum, d) => sum + d.ct_amount,
      0n
    );
    const total_out = distributed + settlement.fees;
    
    if (total_out !== settlement.total_fluxed) {
      return {
        valid: false,
        reason: `CT conservation violated in settlement ${event.id}: ` +
                `fluxed=${settlement.total_fluxed}, out=${total_out}`
      };
    }
  }
  
  return { valid: true };
}

// =============================================================================
// INVARIANT 2: BILATERAL ATTESTATION
// =============================================================================

/**
 * Verify that every flux has bilateral signatures.
 */
export function verify_bilateral_attestation(csl: Csl): VerificationResult {
  const fluxes = csl.events.filter(e => e.type === "FLUX");
  
  for (const event of fluxes) {
    const flux = event.proof.claim;
    const evidence = event.proof.evidence;
    
    const signatures = evidence.filter(e => e.type === "SIGNATURE");
    const parties = new Set(signatures.map(s => (s as any).party));
    
    if (!parties.has(flux.from) || !parties.has(flux.to)) {
      return {
        valid: false,
        reason: `Flux ${event.id} missing bilateral signatures`
      };
    }
  }
  
  return { valid: true };
}

// =============================================================================
// INVARIANT 3: APPEND-ONLY (HASH CHAIN INTEGRITY)
// =============================================================================

/**
 * Verify that the CSL forms a valid hash chain.
 */
export function verify_append_only(csl: Csl): VerificationResult {
  if (csl.events.length === 0) {
    return { valid: true };
  }
  
  let prev_hash: Hash = "0x" + "0".repeat(64) as Hash; // Genesis
  
  for (const event of csl.events) {
    const hash_evidence = event.proof.evidence.find(
      e => e.type === "HASH_CHAIN"
    );
    
    if (!hash_evidence) {
      return {
        valid: false,
        reason: `Event ${event.id} missing hash chain evidence`
      };
    }
    
    const hc = hash_evidence as { prev: Hash; current: Hash };
    
    if (hc.prev !== prev_hash) {
      return {
        valid: false,
        reason: `Hash chain broken at event ${event.id}: ` +
                `expected prev=${prev_hash}, got ${hc.prev}`
      };
    }
    
    prev_hash = hc.current;
  }
  
  // Verify head matches
  if (prev_hash !== csl.head) {
    return {
      valid: false,
      reason: `CSL head mismatch: expected ${prev_hash}, got ${csl.head}`
    };
  }
  
  return { valid: true };
}

// =============================================================================
// INVARIANT 4: SUBSTRATE SOVEREIGNTY
// =============================================================================

/**
 * Verify that every channel has signatures from both endpoints.
 */
export function verify_substrate_sovereignty(csl: Csl): VerificationResult {
  const channels = csl.events.filter(e => e.type === "CHANNEL_AUTHORIZED");
  
  for (const event of channels) {
    const channel = event.proof.claim;
    const evidence = event.proof.evidence;
    
    const signatures = evidence.filter(e => e.type === "SIGNATURE");
    const parties = new Set(signatures.map(s => (s as any).party));
    
    if (!parties.has(channel.from) || !parties.has(channel.to)) {
      return {
        valid: false,
        reason: `Channel ${event.id} missing consent from both parties`
      };
    }
  }
  
  return { valid: true };
}

// =============================================================================
// INVARIANT 5: POST-QUANTUM COMPLIANCE
// =============================================================================

/**
 * Verify that all root-of-trust operations have PQ signatures.
 */
export function verify_pq_compliance(csl: Csl): VerificationResult {
  const root_of_trust_types = [
    "SUBSTRATE_REGISTERED",
    "CHANNEL_AUTHORIZED",
    "CHANNEL_SETTLED"
  ];
  
  for (const event of csl.events) {
    if (!root_of_trust_types.includes(event.type)) continue;
    
    const signatures = event.proof.evidence.filter(e => e.type === "SIGNATURE");
    const has_pq = signatures.some(s => is_pq_suite((s as any).suite));
    
    if (!has_pq) {
      return {
        valid: false,
        reason: `Root-of-trust event ${event.id} (${event.type}) lacks PQ signature`
      };
    }
  }
  
  return { valid: true };
}

// =============================================================================
// INVARIANT 6: TOPOLOGY NEUTRALITY
// =============================================================================

/**
 * Verify that CSL contains only canonical event types.
 * (The format is valid regardless of network topology)
 */
export function verify_topology_neutrality(csl: Csl): VerificationResult {
  const valid_types = [
    "SUBSTRATE_REGISTERED",
    "CHANNEL_AUTHORIZED",
    "FLUX",
    "CHANNEL_SETTLED"
  ];
  
  for (const event of csl.events) {
    if (!valid_types.includes(event.type)) {
      return {
        valid: false,
        reason: `Unknown event type: ${event.type}`
      };
    }
  }
  
  return { valid: true };
}

// =============================================================================
// VERIFY ALL INVARIANTS
// =============================================================================

export interface InvariantResults {
  ct_conservation: VerificationResult;
  bilateral_attestation: VerificationResult;
  append_only: VerificationResult;
  substrate_sovereignty: VerificationResult;
  pq_compliance: VerificationResult;
  topology_neutrality: VerificationResult;
  all_valid: boolean;
}

/**
 * Verify all invariants on a CSL.
 */
export function verify_all_invariants(csl: Csl): InvariantResults {
  const results: InvariantResults = {
    ct_conservation: verify_ct_conservation(csl),
    bilateral_attestation: verify_bilateral_attestation(csl),
    append_only: verify_append_only(csl),
    substrate_sovereignty: verify_substrate_sovereignty(csl),
    pq_compliance: verify_pq_compliance(csl),
    topology_neutrality: verify_topology_neutrality(csl),
    all_valid: false
  };
  
  results.all_valid = Object.entries(results)
    .filter(([k]) => k !== 'all_valid')
    .every(([, v]) => (v as VerificationResult).valid);
  
  return results;
}

// =============================================================================
// DERIVE STATE FROM PROOFS
// =============================================================================

export interface DerivedState {
  substrates: Map<string, any>;
  channels: Map<string, any>;
  ct_balances: Map<string, CT>;
}

/**
 * Derive system state from CSL proofs.
 * 
 * This is how any node can reconstruct state from proofs alone.
 */
export function derive_state(csl: Csl): DerivedState {
  const state: DerivedState = {
    substrates: new Map(),
    channels: new Map(),
    ct_balances: new Map()
  };
  
  for (const event of csl.events) {
    switch (event.type) {
      case "SUBSTRATE_REGISTERED": {
        const substrate = event.proof.claim;
        state.substrates.set(substrate.id, substrate);
        state.ct_balances.set(substrate.id, substrate.ct_balance);
        break;
      }
      
      case "CHANNEL_AUTHORIZED": {
        const channel = event.proof.claim;
        state.channels.set(channel.id, channel);
        // Lock CT from source
        const from_balance = state.ct_balances.get(channel.from) ?? 0n;
        state.ct_balances.set(channel.from, from_balance - channel.reserved_ct);
        break;
      }
      
      case "FLUX": {
        const flux = event.proof.claim;
        const channel = state.channels.get(flux.channel);
        if (channel) {
          channel.consumed_ct += flux.ct_delta;
        }
        break;
      }
      
      case "CHANNEL_SETTLED": {
        const settlement = event.proof.claim;
        const channel = state.channels.get(settlement.channel);
        if (channel) {
          channel.state = "CLOSED";
        }
        // Distribute CT
        for (const dist of settlement.distributions) {
          const current = state.ct_balances.get(dist.substrate) ?? 0n;
          state.ct_balances.set(dist.substrate, current + dist.ct_amount);
        }
        break;
      }
    }
  }
  
  return state;
}
