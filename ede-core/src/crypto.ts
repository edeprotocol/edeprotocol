import { Hash, Signature, CryptoSuiteId, Timestamp, SubstrateId, ChannelId, FluxId, SessionId } from './types.js';

// PLACEHOLDER - Replace with SHA3-256/BLAKE3 in production
export function hash(data: unknown): Hash {
  const str = JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h = h & h;
  }
  return `0x${Math.abs(h).toString(16).padStart(64, '0')}` as Hash;
}

// PLACEHOLDER - Replace with real PQ verification
export function verify_signature(data: unknown, signature: Signature): boolean {
  return !!(signature.suite && signature.public_key && signature.signature);
}

// PLACEHOLDER - Replace with real PQ signing
export function sign(data: unknown, suite: CryptoSuiteId, private_key: string): Signature {
  return {
    suite,
    public_key: `pub_${private_key.slice(0, 8)}`,
    signature: `sig_${hash(data).slice(2, 18)}_${Date.now()}`,
    timestamp: now()
  };
}

export function build_merkle_tree(leaves: Hash[]): Hash {
  if (leaves.length === 0) return hash("empty_tree") as Hash;
  if (leaves.length === 1) return leaves[0];
  const next: Hash[] = [];
  for (let i = 0; i < leaves.length; i += 2) {
    next.push(hash({ left: leaves[i], right: leaves[i + 1] || leaves[i] }));
  }
  return build_merkle_tree(next);
}

export function generate_merkle_proof(leaves: Hash[], index: number): { root: Hash; path: Hash[] } {
  const path: Hash[] = [];
  let idx = index;
  let level = [...leaves];
  while (level.length > 1) {
    const sibling = idx % 2 === 0 ? idx + 1 : idx - 1;
    if (sibling < level.length) path.push(level[sibling]);
    const next: Hash[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(hash({ left: level[i], right: level[i + 1] || level[i] }));
    }
    level = next;
    idx = Math.floor(idx / 2);
  }
  return { root: level[0], path };
}

export function generate_id(prefix: string): string {
  return `${prefix}${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
}

export function generate_substrate_id(): SubstrateId { return `did:ede:${generate_id('')}` as SubstrateId; }
export function generate_channel_id(): ChannelId { return `ch_${generate_id('')}` as ChannelId; }
export function generate_flux_id(): FluxId { return `fx_${generate_id('')}` as FluxId; }
export function generate_session_id(): SessionId { return `sess_${generate_id('')}` as SessionId; }

export function now(): Timestamp { return new Date().toISOString(); }
