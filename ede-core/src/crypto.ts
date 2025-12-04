/**
 * EDE Core — Crypto Utilities
 * 
 * This module provides crypto primitives.
 * In production, replace with actual PQ implementations.
 */

import { Hash, Timestamp, Signature } from './types';

// =============================================================================
// HASHING
// =============================================================================

/**
 * Hash any object to a deterministic hex string.
 * Production: use actual SHA3-256 or BLAKE3
 */
export function hash(data: unknown): Hash {
  // Deterministic JSON serialization
  const json = JSON.stringify(data, Object.keys(data as object).sort());
  
  // Simple hash for demonstration (replace with real implementation)
  let h = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    h = ((h << 5) - h) + char;
    h = h & h; // Convert to 32-bit integer
  }
  
  // Convert to hex, pad to 64 chars
  const hex = Math.abs(h).toString(16).padStart(64, '0');
  return `0x${hex}` as Hash;
}

/**
 * Verify hash chain integrity
 */
export function verify_hash_chain(prev: Hash, current: Hash, data: unknown): boolean {
  const computed = hash({ prev, data });
  return computed === current;
}

// =============================================================================
// SIGNATURES
// =============================================================================

/**
 * Verify a signature against data and public key.
 * Production: implement actual PQ verification (Dilithium, Falcon, etc.)
 */
export function verify_signature(
  signature: Signature,
  data: unknown,
  public_key: string
): boolean {
  // In production, this would:
  // 1. Deserialize the signature based on suite
  // 2. Hash the data
  // 3. Verify using suite-specific algorithm
  
  // For now, we just check structure exists
  return (
    signature.suite !== undefined &&
    signature.public_key === public_key &&
    signature.signature.length > 0
  );
}

/**
 * Sign data with a private key.
 * Production: implement actual PQ signing
 */
export function sign(
  suite: import('./types').CryptoSuiteId,
  data: unknown,
  private_key: string,
  public_key: string
): Signature {
  // In production, this would use actual PQ algorithms
  const data_hash = hash(data);
  
  return {
    suite,
    public_key,
    signature: `sig_${data_hash}_${private_key.slice(0, 8)}`, // Placeholder
    timestamp: now()
  };
}

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generate a unique ID from seed data.
 */
export function generate_id(seed: string): string {
  const h = hash(seed + now() + Math.random());
  return h.slice(2, 18); // 16 hex chars
}

// =============================================================================
// TIMESTAMPS
// =============================================================================

/**
 * Current timestamp in ISO 8601 format.
 */
export function now(): Timestamp {
  return new Date().toISOString();
}

/**
 * Check if timestamp is in the past.
 */
export function is_past(t: Timestamp): boolean {
  return new Date(t) < new Date();
}

/**
 * Check if timestamp is in the future.
 */
export function is_future(t: Timestamp): boolean {
  return new Date(t) > new Date();
}

// =============================================================================
// MERKLE PROOFS
// =============================================================================

export interface MerkleNode {
  hash: Hash;
  left?: MerkleNode;
  right?: MerkleNode;
}

/**
 * Build a Merkle tree from a list of hashes.
 */
export function build_merkle_tree(hashes: Hash[]): MerkleNode | null {
  if (hashes.length === 0) return null;
  if (hashes.length === 1) return { hash: hashes[0] };
  
  const nodes: MerkleNode[] = hashes.map(h => ({ hash: h }));
  
  while (nodes.length > 1) {
    const next: MerkleNode[] = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] ?? left; // Duplicate if odd
      const parent: MerkleNode = {
        hash: hash({ left: left.hash, right: right.hash }),
        left,
        right
      };
      next.push(parent);
    }
    nodes.length = 0;
    nodes.push(...next);
  }
  
  return nodes[0];
}

/**
 * Generate a Merkle proof for an item at index.
 */
export function generate_merkle_proof(
  hashes: Hash[],
  index: number
): { root: Hash; path: Hash[] } {
  const tree = build_merkle_tree(hashes);
  if (!tree) throw new Error("Cannot generate proof for empty tree");
  
  // Simplified: just return root and the item's hash
  // Production: generate full sibling path
  return {
    root: tree.hash,
    path: [hashes[index]]
  };
}

/**
 * Verify a Merkle proof.
 */
export function verify_merkle_proof(
  root: Hash,
  leaf: Hash,
  path: Hash[],
  index: number
): boolean {
  // Simplified verification
  // Production: walk the path and compute root
  return path.includes(leaf);
}
