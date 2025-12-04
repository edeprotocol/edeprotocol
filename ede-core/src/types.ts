/**
 * EDE Core — Proof System Implementation
 * 
 * EDE is not a state machine.
 * EDE is not an event log.
 * EDE is a PROOF SYSTEM.
 * 
 * Every operation produces a proof.
 * Every proof is independently verifiable.
 * State is derived from proofs.
 * Invariants are theorems on proofs.
 */

// =============================================================================
// PRIMITIVES
// =============================================================================

export type SubstrateId = `did:ede:${string}`;
export type ChannelId = `ch_${string}`;
export type FluxId = `fx_${string}`;
export type Hash = `0x${string}`;
export type Timestamp = string; // ISO 8601

export type CT = bigint; // 18 decimals, represents normalized(E, I, R)

// =============================================================================
// CRYPTO
// =============================================================================

export type CryptoSuiteId =
  // Post-Quantum (required for root-of-trust)
  | "PQ_DILITHIUM_3"
  | "PQ_DILITHIUM_5"
  | "PQ_FALCON_512"
  | "PQ_FALCON_1024"
  | "PQ_SPHINCS_SHA2_256"
  // Hybrid (transition)
  | "HYBRID_ED25519_DILITHIUM_3"
  | "HYBRID_ECDSA_FALCON_512"
  // Classical (auxiliary only)
  | "CLASSICAL_ED25519"
  | "CLASSICAL_ECDSA_SECP256K1"
  // Extension
  | `CUSTOM_${string}`;

export type HashSuiteId = "SHA3_256" | "SHA3_512" | "BLAKE3" | "SHA256";

export interface Signature {
  suite: CryptoSuiteId;
  public_key: string; // base64
  signature: string;  // base64
  timestamp: Timestamp;
}

export function is_pq_suite(suite: CryptoSuiteId): boolean {
  return suite.startsWith("PQ_") || suite.startsWith("HYBRID_");
}

// =============================================================================
// EVIDENCE
// =============================================================================

export type Evidence =
  | SignatureEvidence
  | HashChainEvidence
  | InclusionEvidence
  | BioBindingEvidence
  | OracleEvidence;

export interface SignatureEvidence {
  type: "SIGNATURE";
  suite: CryptoSuiteId;
  party: SubstrateId;
  signature: Signature;
}

export interface HashChainEvidence {
  type: "HASH_CHAIN";
  hash_suite: HashSuiteId;
  prev: Hash;
  current: Hash;
}

export interface InclusionEvidence {
  type: "INCLUSION";
  hash_suite: HashSuiteId;
  root: Hash;
  path: Hash[];
  index: number;
}

export interface BioBindingEvidence {
  type: "BIO_BINDING";
  substrate: SubstrateId;
  nal_proof: NalProof;
  time_window: [Timestamp, Timestamp];
  io_correlation: number; // 0-1
}

export interface OracleEvidence {
  type: "ORACLE";
  oracle_id: string;
  attestation: string; // base64
  timestamp: Timestamp;
}

export interface NalProof {
  coupling_score: number;
  bio_plausibility: number;
  noise_entropy: number;
  conduction_velocity_ms: number;
}

// =============================================================================
// PROOF
// =============================================================================

export interface Proof<T> {
  claim: T;
  evidence: Evidence[];
  verify(): VerificationResult;
}

export type VerificationResult =
  | { valid: true }
  | { valid: false; reason: string };

// =============================================================================
// SUBSTRATE
// =============================================================================

// SubstrateClass defines the entity type:
// - "H"      = baseline human
// - "H_PLUS" = augmented human (BCI, neural interface)
// - "SO"     = synthetic operator (agent, swarm)
// - "SSI"    = supra-system (envelope representing clusters of H+ and/or SO
//              as a single economic entity). Reserved for v8+; experimental in v5.
//              Core invariants are defined on H / H+ / SO.
export type SubstrateClass = "H" | "H_PLUS" | "SO" | "SSI";

export interface IoProfile {
  max_bps: number;
  latency_ms: number;
  jitter_ms?: number;
  noise_entropy?: number;
  neural_coupling?: number; // 0-1, only for H+
}

export interface StabilityProfile {
  drift_rate: number;
  fault_rate: number;
  uptime_ratio: number;
}

export interface SubstrateCrypto {
  supported_suites: CryptoSuiteId[];
  primary_suite: CryptoSuiteId;
  public_keys: Map<CryptoSuiteId, string>;
}

export interface Substrate {
  id: SubstrateId;
  class: SubstrateClass;
  io: IoProfile;
  stability: StabilityProfile;
  crypto: SubstrateCrypto;
  ct_balance: CT;
  registered_at: Timestamp;
  ttl?: Timestamp;
}

// =============================================================================
// CHANNEL
// =============================================================================

export type ChannelState = "OPEN" | "SETTLING" | "CLOSED";

export interface Channel {
  id: ChannelId;
  from: SubstrateId;
  to: SubstrateId;
  reserved_ct: CT;
  consumed_ct: CT;
  max_bps: number;
  expires: Timestamp;
  state: ChannelState;
  nal_required: boolean;
  pocw_required: boolean;
  crypto_suite: CryptoSuiteId;
  authorized_at: Timestamp;
}

// =============================================================================
// FLUX
// =============================================================================

export interface ObservedMetrics {
  actual_bps: number;
  error_rate: number;
  energy_joules: number;
}

export interface Flux {
  id: FluxId;
  channel: ChannelId;
  from: SubstrateId;
  to: SubstrateId;
  ct_delta: CT;
  observed: ObservedMetrics;
  timestamp: Timestamp;
}

// =============================================================================
// SETTLEMENT
// =============================================================================

export interface Distribution {
  substrate: SubstrateId;
  ct_amount: CT;
}

export interface Settlement {
  channel: ChannelId;
  total_fluxed: CT;
  fees: CT;
  distributions: Distribution[];
  settled_at: Timestamp;
}

// =============================================================================
// CSL EVENT TYPES
// =============================================================================

export type CslEventType =
  | "SUBSTRATE_REGISTERED"
  | "CHANNEL_AUTHORIZED"
  | "FLUX"
  | "CHANNEL_SETTLED";

export interface CslEvent<T extends CslEventType, P> {
  id: Hash;
  type: T;
  timestamp: Timestamp;
  proof: Proof<P>;
}

export type SubstrateRegisteredEvent = CslEvent<"SUBSTRATE_REGISTERED", Substrate>;
export type ChannelAuthorizedEvent = CslEvent<"CHANNEL_AUTHORIZED", Channel>;
export type FluxEvent = CslEvent<"FLUX", Flux>;
export type ChannelSettledEvent = CslEvent<"CHANNEL_SETTLED", Settlement>;

export type AnyCslEvent =
  | SubstrateRegisteredEvent
  | ChannelAuthorizedEvent
  | FluxEvent
  | ChannelSettledEvent;

// =============================================================================
// CSL (Cognitive Session Ledger)
// =============================================================================

export interface Csl {
  events: AnyCslEvent[];
  head: Hash; // hash of latest event
}
