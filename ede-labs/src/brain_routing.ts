import { Substrate, SubstrateClass } from '@edeprotocol/ede-core';

export interface RankedCandidate {
  entity: Substrate;
  score: number;
}

export function rankSoCandidates(entities: Substrate[], options: { minBrainR?: number; minContextTokens?: number } = {}): RankedCandidate[] {
  const soClasses: SubstrateClass[] = ['SO', 'SSI'];
  let candidates = entities.filter(e => soClasses.includes(e.class));

  if (candidates.length === 0) return [];

  if (options.minBrainR !== undefined) {
    candidates = candidates.filter(e => (e.io.brain_temporal_alignment_r ?? 0) >= options.minBrainR!);
  }

  if (options.minContextTokens !== undefined) {
    candidates = candidates.filter(e => (e.io.max_context_tokens ?? 0) >= options.minContextTokens!);
  }

  if (candidates.length === 0) return [];

  const maxR = Math.max(...candidates.map(e => e.io.brain_temporal_alignment_r ?? 0)) || 1;
  const maxCtx = Math.max(...candidates.map(e => e.io.max_context_tokens ?? 0)) || 1;

  return candidates
    .map(e => ({
      entity: e,
      score: 0.7 * ((e.io.brain_temporal_alignment_r ?? 0) / maxR) + 0.3 * ((e.io.max_context_tokens ?? 0) / maxCtx)
    }))
    .sort((a, b) => b.score - a.score);
}
