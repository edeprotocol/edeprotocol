import { SubstrateId, ChannelId, SessionId, CT, CryptoSuiteId, Substrate, Session, Flux, SubstrateClass, ParticipantRole } from '../types.js';

export interface NirEntityJson {
  version: string;
  substrate_id: string;
  class: string;
  crypto: { primary_suite: string; public_key: string };
  io_profile: { max_bps: number; latency_ms: number; neural_coupling?: number };
}

export function importNirEntity(json: NirEntityJson): Substrate {
  return {
    id: json.substrate_id as SubstrateId,
    class: json.class as SubstrateClass,
    io: { max_bps: json.io_profile.max_bps, latency_ms: json.io_profile.latency_ms, neural_coupling: json.io_profile.neural_coupling },
    stability: { drift_rate: 0, fault_rate: 0, uptime_ratio: 1 },
    crypto: { supported_suites: [json.crypto.primary_suite as CryptoSuiteId], primary_suite: json.crypto.primary_suite as CryptoSuiteId, public_keys: new Map([[json.crypto.primary_suite as CryptoSuiteId, json.crypto.public_key]]) },
    ct_balance: 0n,
    registered_at: new Date().toISOString()
  };
}

export function exportNirEntity(s: Substrate): NirEntityJson {
  const pk = s.crypto.public_keys.get(s.crypto.primary_suite) || '';
  return {
    version: '2.0',
    substrate_id: s.id,
    class: s.class,
    crypto: { primary_suite: s.crypto.primary_suite, public_key: pk },
    io_profile: { max_bps: s.io.max_bps, latency_ms: s.io.latency_ms, neural_coupling: s.io.neural_coupling }
  };
}
