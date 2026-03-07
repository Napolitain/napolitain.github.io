import type { CollectionEntry } from 'astro:content';

import {
  dsaFamilies,
  dsaFamilyValues,
  dsaKindMeta,
  dsaDifficultyMeta,
  getFamilyTrail,
  type DsaDifficultyId,
  type DsaFamilyId,
  type DsaKindId,
} from './dsa-meta';

type DsaEntry = CollectionEntry<'dsa'>;

interface BaseTopic {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  family: DsaFamilyId;
  kind: DsaKindId;
  difficulty: DsaDifficultyId;
  visualization?: string;
  prerequisiteSlugs: string[];
  relatedSlugs: string[];
  enableSlugs: string[];
}

export interface DsaTopicLink {
  slug: string;
  title: string;
  description: string;
  family: DsaFamilyId;
  familyLabel: string;
  kind: DsaKindId;
  kindLabel: string;
  difficulty: DsaDifficultyId;
  difficultyLabel: string;
}

export interface DsaTopicCardData extends DsaTopicLink {
  tags: string[];
  visualization?: string;
  familyDescription: string;
  familyParentId?: DsaFamilyId;
  familyParentLabel?: string;
  familyTrailLabels: string[];
  prerequisiteSlugs: string[];
  relatedSlugs: string[];
  enableSlugs: string[];
  prerequisiteTopics: DsaTopicLink[];
  relatedTopics: DsaTopicLink[];
  enabledTopics: DsaTopicLink[];
  familyTopics: DsaTopicLink[];
  pathIds: string[];
  searchText: string;
}

export interface DsaFamilySection {
  id: DsaFamilyId;
  label: string;
  description: string;
  parentLabel?: string;
  note?: string;
  topicCount: number;
  topicSlugs: string[];
  childFamilyIds: DsaFamilyId[];
}

export interface DsaLearningPath {
  id: string;
  title: string;
  description: string;
  slugs: string[];
  steps: DsaTopicLink[];
}

export interface DsaStats {
  totalTopics: number;
  totalFamilies: number;
  totalPaths: number;
  totalAlgorithms: number;
  totalStructures: number;
  totalTechniques: number;
}

export interface DsaDirectoryData {
  topics: DsaTopicCardData[];
  families: DsaFamilySection[];
  paths: DsaLearningPath[];
  stats: DsaStats;
  topicBySlug: Map<string, DsaTopicCardData>;
}

const dsaPathDefinitions = [
  {
    id: 'graph-toolkit',
    title: 'Graph toolkit',
    description: 'Start with graph shape, then layer traversal, connectivity structure, and both single-source and all-pairs path algorithms.',
    slugs: [
      'graph-fundamentals',
      'tree-fundamentals',
      'queue',
      'bfs-breadth-first-search',
      'dfs-depth-first-search',
      'topological-sort',
      'union-find',
      'tarjan-scc',
      'bridges-articulation-points',
      'eulerian-path',
      'zero-one-bfs',
      'heap',
      'dijkstra',
      'floyd-warshall',
      'minimum-spanning-tree',
    ],
  },
  {
    id: 'weighted-paths',
    title: 'Weighted shortest paths',
    description: 'See the spectrum from plain BFS to deque-based 0-1 BFS to priority-queue shortest paths and dense all-pairs DP.',
    slugs: [
      'graph-fundamentals',
      'queue',
      'bfs-breadth-first-search',
      'deque',
      'zero-one-bfs',
      'heap',
      'dijkstra',
      'floyd-warshall',
    ],
  },
  {
    id: 'linear-toolkit',
    title: 'Linear toolkit',
    description: 'Learn how sequence-shaped data unlocks queues, stacks, windows, and fast pointer manipulations.',
    slugs: [
      'linked-list',
      'queue',
      'deque',
      'stack',
      'two-pointers',
      'monotonic-queue',
      'hash-map',
    ],
  },
  {
    id: 'ordered-structures',
    title: 'Ordered structures',
    description: 'See how order can come from sorted arrays, search trees, skip lists, disk-friendly indexes, heaps, and prefix trees.',
    slugs: [
      'binary-search',
      'tree-fundamentals',
      'binary-search-tree',
      'skip-list',
      'b-tree',
      'b-plus-tree',
      'treap',
      'heap',
      'trie',
    ],
  },
  {
    id: 'storage-engines',
    title: 'Storage engines',
    description: 'Compare fanout-heavy indexes, write-optimized trees, and external-memory sorting in one storage-oriented path.',
    slugs: [
      'binary-search',
      'binary-search-tree',
      'skip-list',
      'b-tree',
      'b-plus-tree',
      'lsm-tree',
      'external-merge-sort',
    ],
  },
  {
    id: 'range-query-toolkit',
    title: 'Range-query toolkit',
    description: 'Start with static prefix tricks, then move into offline, persistent, dynamic, and precomputed range-query structures.',
    slugs: [
      'prefix-sum',
      'difference-array',
      'fenwick-tree',
      'segment-tree',
      'sparse-table',
      'mos-algorithm',
      'persistent-segment-tree',
      'li-chao-tree',
    ],
  },
  {
    id: 'tree-query-toolkit',
    title: 'Rooted tree queries',
    description: 'Flatten subtrees, jump through ancestors, and break tree paths into array segments instead of climbing naively.',
    slugs: [
      'tree-fundamentals',
      'dfs-depth-first-search',
      'euler-tour-technique',
      'prefix-sum',
      'fenwick-tree',
      'segment-tree',
      'binary-lifting',
      'lowest-common-ancestor',
      'heavy-light-decomposition',
      'persistent-segment-tree',
    ],
  },
  {
    id: 'string-matching',
    title: 'String matching',
    description: 'Move from prefix reuse and rolling hashes to suffix-based indexing and automata.',
    slugs: [
      'kmp',
      'z-algorithm',
      'rabin-karp',
      'manacher',
      'trie',
      'aho-corasick',
      'suffix-array',
      'suffix-automaton',
    ],
  },
  {
    id: 'strategy-playbook',
    title: 'Strategy playbook',
    description: 'A reusable set of problem-solving moves for brute-force search, greedy choices, memoized state, and advanced DP optimization.',
    slugs: [
      'dfs-depth-first-search',
      'backtracking',
      'greedy',
      'dynamic-programming',
      'convex-hull-trick',
      'bit-manipulation',
    ],
  },
  {
    id: 'graph-structure',
    title: 'Graph structure',
    description: 'Go beyond traversal into SCCs, critical edges, degree structure, and other non-shortest-path graph properties.',
    slugs: [
      'graph-fundamentals',
      'dfs-depth-first-search',
      'union-find',
      'tarjan-scc',
      'bridges-articulation-points',
      'eulerian-path',
    ],
  },
  {
    id: 'tree-path-queries',
    title: 'Tree path queries',
    description: 'Build the full ladder from ancestor queries to heavy-light decomposition and historical segment trees.',
    slugs: [
      'tree-fundamentals',
      'lowest-common-ancestor',
      'binary-lifting',
      'segment-tree',
      'heavy-light-decomposition',
      'persistent-segment-tree',
    ],
  },
  {
    id: 'substring-toolkit',
    title: 'Substring toolkit',
    description: 'Compare rolling hashes, sorted suffixes, automata, and palindrome-specific structure.',
    slugs: [
      'rabin-karp',
      'manacher',
      'suffix-array',
      'suffix-automaton',
    ],
  },
  {
    id: 'offline-toolkit',
    title: 'Offline toolkit',
    description: 'See how reordering queries, rolling back state, and preserving versions can replace online complexity.',
    slugs: [
      'prefix-sum',
      'mos-algorithm',
      'union-find',
      'dsu-rollback',
      'persistent-segment-tree',
    ],
  },
  {
    id: 'dp-optimization',
    title: 'DP optimization',
    description: 'Turn transition formulas into line queries and move from hull geometry to dynamic Li Chao trees.',
    slugs: [
      'dynamic-programming',
      'convex-hull-trick',
      'li-chao-tree',
    ],
  },
  {
    id: 'probabilistic-systems',
    title: 'Probabilistic systems',
    description: 'Learn how approximate membership, frequency, and cardinality structures trade tiny errors for massive scale.',
    slugs: [
      'hash-map',
      'bloom-cuckoo-filters',
      'count-min-sketch',
      'hyperloglog',
    ],
  },
  {
    id: 'cache-distribution',
    title: 'Cache & distribution',
    description: 'Connect local eviction policy with distributed key placement and system-scale cache design.',
    slugs: [
      'hash-map',
      'linked-list',
      'queue',
      'cache-eviction-strategies',
      'consistent-hashing',
    ],
  },
  {
    id: 'database-operators',
    title: 'Database operators',
    description: 'See how external sorting and join strategies turn in-memory algorithms into database execution plans.',
    slugs: [
      'hash-map',
      'merge-sort',
      'heap',
      'external-merge-sort',
      'hash-join-merge-join',
    ],
  },
] as const;

function uniqueSlugs(slugs: string[]): string[] {
  return [...new Set(slugs.filter(Boolean))];
}

function toBaseTopic(entry: DsaEntry): BaseTopic {
  return {
    slug: entry.slug,
    title: entry.data.title,
    description: entry.data.description,
    tags: entry.data.tags,
    family: entry.data.family,
    kind: entry.data.kind,
    difficulty: entry.data.difficulty,
    visualization: entry.data.visualization,
    prerequisiteSlugs: entry.data.prerequisites,
    relatedSlugs: entry.data.related,
    enableSlugs: entry.data.enables,
  };
}

function compareLinks(a: DsaTopicLink, b: DsaTopicLink): number {
  const familyOrder = dsaFamilies[a.family].order - dsaFamilies[b.family].order;
  if (familyOrder !== 0) {
    return familyOrder;
  }

  const difficultyOrder = dsaDifficultyMeta[a.difficulty].order - dsaDifficultyMeta[b.difficulty].order;
  if (difficultyOrder !== 0) {
    return difficultyOrder;
  }

  return a.title.localeCompare(b.title);
}

function compareTopics(a: BaseTopic, b: BaseTopic): number {
  return compareLinks(toTopicLink(a), toTopicLink(b));
}

function toTopicLink(topic: BaseTopic): DsaTopicLink {
  return {
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    family: topic.family,
    familyLabel: dsaFamilies[topic.family].label,
    kind: topic.kind,
    kindLabel: dsaKindMeta[topic.kind].label,
    difficulty: topic.difficulty,
    difficultyLabel: dsaDifficultyMeta[topic.difficulty].label,
  };
}

function resolveLinks(slugs: string[], topicBySlug: Map<string, BaseTopic>): DsaTopicLink[] {
  return uniqueSlugs(slugs)
    .map(slug => topicBySlug.get(slug))
    .filter((topic): topic is BaseTopic => Boolean(topic))
    .map(toTopicLink)
    .sort(compareLinks);
}

export function buildDsaDirectory(entries: DsaEntry[]): DsaDirectoryData {
  const baseTopics = entries.map(toBaseTopic).sort(compareTopics);
  const topicBySlug = new Map(baseTopics.map(topic => [topic.slug, topic]));

  const paths = dsaPathDefinitions
    .map(path => ({
      ...path,
      steps: resolveLinks(path.slugs as string[], topicBySlug),
    }))
    .filter(path => path.steps.length > 0);

  const pathIdsBySlug = new Map<string, string[]>();
  for (const path of paths) {
    for (const step of path.steps) {
      const current = pathIdsBySlug.get(step.slug) ?? [];
      pathIdsBySlug.set(step.slug, [...current, path.id]);
    }
  }

  const resolvedTopics = baseTopics.map(topic => {
    const reciprocalRelated = baseTopics
      .filter(other => other.relatedSlugs.includes(topic.slug))
      .map(other => other.slug);

    const reverseEnables = baseTopics
      .filter(other => other.prerequisiteSlugs.includes(topic.slug))
      .map(other => other.slug);

    const prerequisiteTopics = resolveLinks(topic.prerequisiteSlugs, topicBySlug);
    const relatedTopics = resolveLinks(
      [...topic.relatedSlugs, ...reciprocalRelated].filter(slug => !topic.prerequisiteSlugs.includes(slug)),
      topicBySlug,
    ).filter(other => other.slug !== topic.slug);
    const enabledTopics = resolveLinks(
      [...topic.enableSlugs, ...reverseEnables],
      topicBySlug,
    ).filter(other => other.slug !== topic.slug);

    const familyMeta = dsaFamilies[topic.family];
    const familyTrailLabels = getFamilyTrail(topic.family).map(familyId => dsaFamilies[familyId].label);
    const familyTopics = baseTopics
      .filter(other => other.slug !== topic.slug && other.family === topic.family)
      .sort(compareTopics)
      .map(toTopicLink);

    const allLinkedTitles = [
      ...prerequisiteTopics,
      ...relatedTopics,
      ...enabledTopics,
    ].map(other => other.title);

    return {
      ...toTopicLink(topic),
      tags: topic.tags,
      visualization: topic.visualization,
      familyDescription: familyMeta.description,
      familyParentId: familyMeta.parentId,
      familyParentLabel: familyMeta.parentId ? dsaFamilies[familyMeta.parentId].label : undefined,
      familyTrailLabels,
      prerequisiteSlugs: topic.prerequisiteSlugs,
      relatedSlugs: uniqueSlugs([...topic.relatedSlugs, ...reciprocalRelated]),
      enableSlugs: uniqueSlugs([...topic.enableSlugs, ...reverseEnables]),
      prerequisiteTopics,
      relatedTopics,
      enabledTopics,
      familyTopics,
      pathIds: pathIdsBySlug.get(topic.slug) ?? [],
      searchText: [
        topic.title,
        topic.description,
        topic.tags.join(' '),
        familyMeta.label,
        familyMeta.description,
        ...allLinkedTitles,
      ].join(' ').toLowerCase(),
    } satisfies DsaTopicCardData;
  });

  const resolvedTopicBySlug = new Map(resolvedTopics.map(topic => [topic.slug, topic]));

  const families = dsaFamilyValues
    .map(familyId => {
      const familyMeta = dsaFamilies[familyId];
      const topicsInFamily = resolvedTopics
        .filter(topic => topic.family === familyId)
        .map(topic => topic.slug);

      return {
        id: familyId,
        label: familyMeta.label,
        description: familyMeta.description,
        parentLabel: familyMeta.parentId ? dsaFamilies[familyMeta.parentId].label : undefined,
        note: familyMeta.parentId ? `Special case of ${dsaFamilies[familyMeta.parentId].label}` : undefined,
        topicCount: topicsInFamily.length,
        topicSlugs: topicsInFamily,
        childFamilyIds: dsaFamilyValues.filter(candidate => dsaFamilies[candidate].parentId === familyId),
      } satisfies DsaFamilySection;
    })
    .filter(section => section.topicCount > 0)
    .sort((a, b) => dsaFamilies[a.id].order - dsaFamilies[b.id].order);

  const stats: DsaStats = {
    totalTopics: resolvedTopics.length,
    totalFamilies: families.length,
    totalPaths: paths.length,
    totalAlgorithms: resolvedTopics.filter(topic => topic.kind === 'algorithm').length,
    totalStructures: resolvedTopics.filter(topic => topic.kind === 'data-structure').length,
    totalTechniques: resolvedTopics.filter(topic => topic.kind === 'technique').length,
  };

  return {
    topics: resolvedTopics,
    families,
    paths,
    stats,
    topicBySlug: resolvedTopicBySlug,
  };
}
