/**
 * EDE Core — Public API
 */

// Types
export * from './types';

// Crypto utilities
export * from './crypto';

// Operations (proof producers)
export {
  register_substrate,
  authorize_channel,
  flow,
  settle_ct,
  append_to_csl,
  create_substrate_event,
  create_channel_event,
  create_flux_event,
  create_settlement_event
} from './operations';

export type {
  RegisterSubstrateParams,
  AuthorizeChannelParams,
  FlowParams,
  SettleCtParams
} from './operations';

// Verification
export {
  verify_proof,
  verify_all_proofs,
  verify_ct_conservation,
  verify_bilateral_attestation,
  verify_append_only,
  verify_substrate_sovereignty,
  verify_pq_compliance,
  verify_topology_neutrality,
  verify_all_invariants,
  derive_state
} from './verify';

export type { InvariantResults, DerivedState } from './verify';
