export type SubstrateId = `did:ede:${string}`;
export type ChannelId = `ch_${string}`;
export type FluxId = `fx_${string}`;
export type SessionId = `sess_${string}`;
export type Hash = `0x${string}`;
export type Timestamp = string;
export type CT = bigint;

export type CryptoSuiteId =
  | "PQ_DILITHIUM_3" | "PQ_DILITHIUM_5"
  | "PQ_FALCON_512" | "PQ_FALCON_1024"
  | "HYBRID_ED25519_DILITHIUM_3"
  | "LEGACY_ED25519" | "LEGACY_ECDSA_SECP256K1";

export type HashSuiteId = "SHA3_256" | "SHA3_512" | "BLAKE3";

export interface Signature {
  suite: CryptoSuiteId;
  public_key: string;
  signature: string;
  timestamp: Timestamp;
}

export function is_pq_suite(suite: CryptoSuiteId): boolean {
  return suite.startsWith("PQ_") || suite.startsWith("HYBRID_");
}

export type Evidence =
  | SignatureEvidence
  | HashChainEvidence
  | InclusionEvidence
  | BioBindingEvidence;

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
  io_correlation: number;
}

export interface NalProof {
  coupling_score: number;
  bio_plausibility: number;
  noise_entropy: number;
  conduction_velocity_ms: number;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
}

export interface Proof<T> {
  claim: T;
  evidence: Evidence[];
  created_at: Timestamp;
  verify(): VerificationResult;
}

export type SubstrateClass = "H" | "H_PLUS" | "SO" | "SSI";
export type ParticipantRole = "REQUESTOR" | "OPERATOR" | "SO_NODE" | "SSI_CLUSTER" | "OBSERVER";
export type ChannelState = "OPEN" | "SETTLING" | "CLOSED";

export interface IoProfile {
  max_bps: number;
  latency_ms: number;
  neural_coupling?: number;
  brain_temporal_alignment_r?: number;
  max_context_tokens?: number;
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
  label?: string;
  io: IoProfile;
  stability: StabilityProfile;
  crypto: SubstrateCrypto;
  ct_balance: CT;
  registered_at: Timestamp;
}

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
  crypto_suite: CryptoSuiteId;
  authorized_at: Timestamp;
}

export interface Flux {
  id: FluxId;
  channel: ChannelId;
  session_id?: SessionId;
  from: SubstrateId;
  to: SubstrateId;
  ct_delta: CT;
  is_critical?: boolean;
  observed: { actual_bps: number; error_rate: number; energy_joules: number };
  timestamp: Timestamp;
}

export interface Settlement {
  channel: ChannelId;
  total_fluxed: CT;
  fees: CT;
  distributions: { substrate: SubstrateId; ct_amount: CT }[];
  settled_at: Timestamp;
}

export interface SessionParticipant {
  entity_id: SubstrateId;
  class: SubstrateClass;
  role: ParticipantRole;
  initial_ct_balance?: CT;
}

export interface Session {
  id: SessionId;
  domain?: string;
  participants: SessionParticipant[];
  created_at: Timestamp;
}

export type CslEventType = "SUBSTRATE_REGISTERED" | "CHANNEL_AUTHORIZED" | "SESSION_CREATED" | "FLUX" | "CHANNEL_SETTLED";

export interface CslEvent<T extends CslEventType, P> {
  id: Hash;
  type: T;
  timestamp: Timestamp;
  proof: Proof<P>;
}

export type AnyCslEvent =
  | CslEvent<"SUBSTRATE_REGISTERED", Substrate>
  | CslEvent<"CHANNEL_AUTHORIZED", Channel>
  | CslEvent<"SESSION_CREATED", Session>
  | CslEvent<"FLUX", Flux>
  | CslEvent<"CHANNEL_SETTLED", Settlement>;

export interface Csl {
  events: AnyCslEvent[];
  head: Hash;
}

export interface VerifyContext {
  ctCriticalThreshold: CT;
  allowLegacyCrypto: boolean;
  substratesById?: Map<SubstrateId, Substrate>;
}

export interface InvariantViolation {
  code: string;
  message: string;
  session_id?: string;
  details?: Record<string, unknown>;
}

export interface InvariantResult {
  name: string;
  ok: boolean;
  violations: InvariantViolation[];
}

export interface InvariantSuiteResult {
  CT_CONSERVATION: InvariantResult;
  BILATERAL_ATTESTATION: InvariantResult;
  APPEND_ONLY: InvariantResult;
  SUBSTRATE_SOVEREIGNTY: InvariantResult;
  PQ_COMPLIANCE: InvariantResult;
  TOPOLOGY_NEUTRALITY: InvariantResult;
  H_GUARD_CRITICAL_CT: InvariantResult;
  all_ok: boolean;
}

export function isFluxEvent(e: AnyCslEvent): e is CslEvent<"FLUX", Flux> { return e.type === "FLUX"; }
export function isSessionEvent(e: AnyCslEvent): e is CslEvent<"SESSION_CREATED", Session> { return e.type === "SESSION_CREATED"; }
export function isSubstrateEvent(e: AnyCslEvent): e is CslEvent<"SUBSTRATE_REGISTERED", Substrate> { return e.type === "SUBSTRATE_REGISTERED"; }
export function isChannelEvent(e: AnyCslEvent): e is CslEvent<"CHANNEL_AUTHORIZED", Channel> { return e.type === "CHANNEL_AUTHORIZED"; }
export function isSettlementEvent(e: AnyCslEvent): e is CslEvent<"CHANNEL_SETTLED", Settlement> { return e.type === "CHANNEL_SETTLED"; }
export function isHumanClass(cls: SubstrateClass): boolean { return cls === "H" || cls === "H_PLUS"; }
export function isGuardRole(role: ParticipantRole): boolean { return role === "REQUESTOR" || role === "OPERATOR"; }
