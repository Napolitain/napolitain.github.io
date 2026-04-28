export const systemDesignFamilyValues = [
  'distributed-systems',
  'traffic-management',
  'control-plane',
  'storage',
  'messaging',
  'reliability',
  'observability',
] as const;

export type SystemDesignFamilyId = typeof systemDesignFamilyValues[number];

export const systemDesignKindValues = [
  'foundation',
  'building-block',
  'end-to-end-design',
  'trade-off',
] as const;

export type SystemDesignKindId = typeof systemDesignKindValues[number];

export const systemDesignDifficultyValues = [
  'intro',
  'intermediate',
  'advanced',
] as const;

export type SystemDesignDifficultyId = typeof systemDesignDifficultyValues[number];

export const systemDesignFamilies: Record<SystemDesignFamilyId, {
  label: string;
  description: string;
  parentId?: SystemDesignFamilyId;
  order: number;
}> = {
  'distributed-systems': {
    label: 'Distributed systems',
    description: 'Coordinating state, traffic, and correctness across many nodes, processes, and regions.',
    order: 0,
  },
  'traffic-management': {
    label: 'Traffic management',
    description: 'Admission control, protection mechanisms, and shaping request flow before downstream systems melt.',
    parentId: 'distributed-systems',
    order: 1,
  },
  'control-plane': {
    label: 'Control plane',
    description: 'Policy authoring, configuration distribution, versioning, and safe rollout of behavior changes.',
    parentId: 'distributed-systems',
    order: 2,
  },
  storage: {
    label: 'State & storage',
    description: 'Partitioning, durability, replication, and choosing the right storage shape for the request path.',
    parentId: 'distributed-systems',
    order: 3,
  },
  messaging: {
    label: 'Messaging & async workflows',
    description: 'Queues, event streams, and off-path pipelines that separate enforcement from analytics and recovery.',
    parentId: 'distributed-systems',
    order: 4,
  },
  reliability: {
    label: 'Reliability',
    description: 'Timeouts, retries, graceful degradation, and fault isolation under partial failure.',
    parentId: 'distributed-systems',
    order: 5,
  },
  observability: {
    label: 'Observability',
    description: 'Metrics, tracing, audits, and feedback loops that keep the design operable at production scale.',
    parentId: 'distributed-systems',
    order: 6,
  },
};

export const systemDesignKindMeta: Record<SystemDesignKindId, { label: string; order: number }> = {
  foundation: { label: 'Foundation', order: 0 },
  'building-block': { label: 'Building block', order: 1 },
  'end-to-end-design': { label: 'End-to-end design', order: 2 },
  'trade-off': { label: 'Trade-off', order: 3 },
};

export const systemDesignDifficultyMeta: Record<SystemDesignDifficultyId, { label: string; order: number }> = {
  intro: { label: 'Intro', order: 0 },
  intermediate: { label: 'Intermediate', order: 1 },
  advanced: { label: 'Advanced', order: 2 },
};

export function getSystemDesignFamilyTrail(familyId: SystemDesignFamilyId): SystemDesignFamilyId[] {
  const trail: SystemDesignFamilyId[] = [familyId];
  let current = systemDesignFamilies[familyId].parentId;

  while (current) {
    trail.unshift(current);
    current = systemDesignFamilies[current].parentId;
  }

  return trail;
}

export function getSystemDesignFamilyDescendantIds(familyId: SystemDesignFamilyId): SystemDesignFamilyId[] {
  return systemDesignFamilyValues.filter(candidate => getSystemDesignFamilyTrail(candidate).includes(familyId));
}
