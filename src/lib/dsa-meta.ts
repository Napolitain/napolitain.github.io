export const dsaFamilyValues = [
  'graph',
  'tree',
  'range-query',
  'linear',
  'search',
  'sorting',
  'strategy',
  'string',
  'lookup',
  'bitwise',
] as const;

export type DsaFamilyId = typeof dsaFamilyValues[number];

export const dsaKindValues = [
  'concept',
  'data-structure',
  'algorithm',
  'technique',
] as const;

export type DsaKindId = typeof dsaKindValues[number];

export const dsaDifficultyValues = [
  'intro',
  'intermediate',
  'advanced',
] as const;

export type DsaDifficultyId = typeof dsaDifficultyValues[number];

export const dsaFamilies: Record<DsaFamilyId, {
  label: string;
  description: string;
  parentId?: DsaFamilyId;
  order: number;
}> = {
  graph: {
    label: 'Graphs',
    description: 'Nodes, edges, traversal, connectivity, and shortest paths.',
    order: 0,
  },
  tree: {
    label: 'Trees',
    description: 'Hierarchies and constrained graphs. A tree is a connected acyclic graph.',
    parentId: 'graph',
    order: 1,
  },
  'range-query': {
    label: 'Range queries',
    description: 'Static and dynamic range aggregates via indexed trees, segment trees, and precomputed tables.',
    order: 2,
  },
  linear: {
    label: 'Linear structures',
    description: 'State that flows from one end to the other: lists, deques, stacks, and windows.',
    order: 3,
  },
  search: {
    label: 'Search',
    description: 'Monotonic predicates, ordered data, and pruning search space aggressively.',
    order: 4,
  },
  sorting: {
    label: 'Sorting',
    description: 'Partition, merge, and reorder data so later operations become easier.',
    order: 5,
  },
  strategy: {
    label: 'Problem-solving strategies',
    description: 'Reusable paradigms like greedy choice, backtracking, and dynamic programming.',
    order: 6,
  },
  string: {
    label: 'Strings',
    description: 'Prefix-aware structures and text-centric search strategies.',
    order: 7,
  },
  lookup: {
    label: 'Lookup & hashing',
    description: 'Fast membership tests, key/value indexing, and amortized constant-time access.',
    order: 8,
  },
  bitwise: {
    label: 'Bitwise',
    description: 'Compact state, masks, parity tricks, and low-level arithmetic.',
    order: 9,
  },
};

export const dsaKindMeta: Record<DsaKindId, { label: string; order: number }> = {
  concept: { label: 'Concept', order: 0 },
  'data-structure': { label: 'Data structure', order: 1 },
  algorithm: { label: 'Algorithm', order: 2 },
  technique: { label: 'Technique', order: 3 },
};

export const dsaDifficultyMeta: Record<DsaDifficultyId, { label: string; order: number }> = {
  intro: { label: 'Intro', order: 0 },
  intermediate: { label: 'Intermediate', order: 1 },
  advanced: { label: 'Advanced', order: 2 },
};

export function getFamilyTrail(familyId: DsaFamilyId): DsaFamilyId[] {
  const trail: DsaFamilyId[] = [familyId];
  let current = dsaFamilies[familyId].parentId;

  while (current) {
    trail.unshift(current);
    current = dsaFamilies[current].parentId;
  }

  return trail;
}

export function getFamilyDescendantIds(familyId: DsaFamilyId): DsaFamilyId[] {
  return dsaFamilyValues.filter(candidate => getFamilyTrail(candidate).includes(familyId));
}
