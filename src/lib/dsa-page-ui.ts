import type { DsaLearningPath, DsaTopicCardData, DsaTopicLink } from './dsa';

interface DsaCompareCardDefinition {
  label?: string;
  slug?: string;
  badge?: string;
  whenToChoose: string;
  insteadChoose: string;
}

interface DsaCompareBlockDefinition {
  title: string;
  description: string;
  items: DsaCompareCardDefinition[];
}

export interface DsaCompareCard {
  label: string;
  href?: string;
  badge: string;
  whenToChoose: string;
  insteadChoose: string;
}

export interface DsaCompareBlockData {
  title: string;
  description: string;
  items: DsaCompareCard[];
}

export interface DsaPathProgressData {
  path: DsaLearningPath;
  stepNumber: number;
  totalSteps: number;
  previous?: DsaTopicLink;
  next?: DsaTopicLink;
}

export interface DsaNextStepRailData {
  isFoundational: boolean;
  buildFirst: DsaTopicLink[];
  primaryPath?: DsaPathProgressData;
  bestNext?: DsaTopicLink;
  additionalNextTopics: DsaTopicLink[];
}

const dsaCompareBlocks: Record<string, DsaCompareBlockDefinition> = {
  'prefix-sum': {
    title: 'Choose the lightest range-query tool that still fits',
    description: 'Prefix sums are the baseline. The right upgrade depends on whether updates or richer queries matter.',
    items: [
      {
        slug: 'prefix-sum',
        whenToChoose: 'The array is static and range sums are the only thing you need.',
        insteadChoose: 'Updates must stay fast or the query is not just a sum.',
      },
      {
        slug: 'fenwick-tree',
        whenToChoose: 'You need dynamic prefix or range sums and want the smallest implementation that still gives `O(log n)` updates.',
        insteadChoose: 'You need more general merge functions, range updates, or richer tree-based extensions.',
      },
      {
        slug: 'segment-tree',
        whenToChoose: 'Updates and queries are both dynamic, and the aggregate is richer than a plain prefix-style sum.',
        insteadChoose: 'The data is static or prefix-style sums are enough.',
      },
    ],
  },
  'fenwick-tree': {
    title: 'Compare the main range-query structures',
    description: 'Fenwick trees sit in the middle: stronger than prefix sums, lighter than segment trees.',
    items: [
      {
        slug: 'prefix-sum',
        whenToChoose: 'The array never changes and `O(1)` range sums are the whole goal.',
        insteadChoose: 'Point updates must stay sublinear.',
      },
      {
        slug: 'fenwick-tree',
        whenToChoose: 'You want dynamic sums with a tiny implementation and good constants.',
        insteadChoose: 'The query operator is not naturally prefix-based.',
      },
      {
        slug: 'segment-tree',
        whenToChoose: 'You need range minima/maxima, lazy propagation, or more general merge logic.',
        insteadChoose: 'All you need is sum-like behavior and minimal code.',
      },
      {
        slug: 'sparse-table',
        whenToChoose: 'The data is static and idempotent range queries should be as fast as possible.',
        insteadChoose: 'Updates matter at all.',
      },
    ],
  },
  'segment-tree': {
    title: 'Use a segment tree only when you need its extra power',
    description: 'The heavier structure is worth it when the query or update model stops being prefix-friendly.',
    items: [
      {
        slug: 'fenwick-tree',
        whenToChoose: 'You only need dynamic sums or prefix-style aggregates and want a lighter structure.',
        insteadChoose: 'Range updates, general associative merges, or tree flattening tricks are coming next.',
      },
      {
        slug: 'segment-tree',
        whenToChoose: 'You need flexible merge operations, lazy propagation, or advanced variants like persistent or Li Chao trees.',
        insteadChoose: 'The array is static or sum-only logic is enough.',
      },
      {
        slug: 'sparse-table',
        whenToChoose: 'Queries are static, idempotent, and should be as close to instant as possible.',
        insteadChoose: 'The structure needs to handle updates.',
      },
    ],
  },
  'sparse-table': {
    title: 'Static queries are where sparse tables shine',
    description: 'The price of `O(1)` query time is that the data cannot change afterward.',
    items: [
      {
        slug: 'prefix-sum',
        whenToChoose: 'The problem is only static range sums and the simplest structure wins.',
        insteadChoose: 'You need minima, maxima, or other idempotent range queries beyond sums.',
      },
      {
        slug: 'sparse-table',
        whenToChoose: 'The array is immutable and you want very fast static range queries.',
        insteadChoose: 'Any update must be supported.',
      },
      {
        slug: 'segment-tree',
        whenToChoose: 'The data changes or the query pattern needs dynamic structure.',
        insteadChoose: 'The workload is entirely read-only.',
      },
    ],
  },
  'skip-list': {
    title: 'Pick the ordered structure that matches the environment',
    description: 'Skip lists compete with trees by trading strict deterministic balancing for simple randomized structure.',
    items: [
      {
        slug: 'binary-search-tree',
        whenToChoose: 'You are teaching or reasoning from the classic ordered-tree mental model.',
        insteadChoose: 'You want a production-ready balanced ordered set without extra balancing rules.',
      },
      {
        slug: 'skip-list',
        whenToChoose: 'A pointer-based, randomized ordered set fits the implementation or system ergonomics best.',
        insteadChoose: 'You need page-oriented storage behavior or stronger deterministic balancing.',
      },
      {
        slug: 'b-plus-tree',
        whenToChoose: 'The structure lives on storage pages and range scans must be first-class.',
        insteadChoose: 'The data stays in memory and simpler pointer logic matters more.',
      },
    ],
  },
  'b-tree': {
    title: 'Choose the storage index that matches the workload',
    description: 'B-Trees minimize page depth, but practical engines often push farther toward range scans or write optimization.',
    items: [
      {
        slug: 'binary-search-tree',
        whenToChoose: 'The structure is in memory and page-level storage costs are not the bottleneck.',
        insteadChoose: 'Disk or page reads dominate the cost model.',
      },
      {
        slug: 'b-tree',
        whenToChoose: 'You want the core page-aware ordered-search structure and a clean bridge from classic trees to storage indexes.',
        insteadChoose: 'Range scans or write-heavy buffering dominate the design.',
      },
      {
        slug: 'b-plus-tree',
        whenToChoose: 'Point lookups and especially ordered scans are the main indexed workload.',
        insteadChoose: 'You are learning the general page-aware tree idea first.',
      },
      {
        slug: 'lsm-tree',
        whenToChoose: 'Write throughput matters more than maintaining one eagerly updated on-disk tree.',
        insteadChoose: 'Predictable indexed reads and scans are the main priority.',
      },
    ],
  },
  'b-plus-tree': {
    title: 'Range-scan workloads are where B+ Trees separate themselves',
    description: 'Once the problem becomes "route quickly, then scan in order," the linked-leaf design pays for itself.',
    items: [
      {
        slug: 'b-tree',
        whenToChoose: 'You want the underlying page-aware tree mechanics without specializing the leaf layout yet.',
        insteadChoose: 'Ordered scans are a first-class workload.',
      },
      {
        slug: 'b-plus-tree',
        whenToChoose: 'Database-style point lookups and range scans both matter, and sequential leaf traversal is valuable.',
        insteadChoose: 'The workload is overwhelmingly write-heavy.',
      },
      {
        slug: 'lsm-tree',
        whenToChoose: 'Write buffering, SSTables, and compaction are a better fit than eagerly updating a page index.',
        insteadChoose: 'Predictable scan behavior and point reads matter more.',
      },
    ],
  },
  'lsm-tree': {
    title: 'Write-optimized storage is a different trade-off, not a free upgrade',
    description: 'LSM Trees win by postponing order maintenance, then paying for it later with read and compaction complexity.',
    items: [
      {
        slug: 'b-plus-tree',
        whenToChoose: 'Ordered reads, point lookups, and range scans should remain predictable on the foreground path.',
        insteadChoose: 'Background compaction and write buffering are acceptable trade-offs.',
      },
      {
        slug: 'lsm-tree',
        whenToChoose: 'The workload is write-heavy enough that buffered writes and compaction are worth the extra read complexity.',
        insteadChoose: 'The system needs simpler read paths or more direct page-level updates.',
      },
      {
        slug: 'external-merge-sort',
        whenToChoose: 'You are reasoning about the merge-heavy I/O pattern that compaction is built from.',
        insteadChoose: 'The question is about a long-lived indexed storage layout, not a sorting pass.',
      },
    ],
  },
  'bloom-cuckoo-filters': {
    title: 'Choose the membership filter that matches the contract',
    description: 'Both structures answer "definitely absent or maybe present," but they optimize different operational needs.',
    items: [
      {
        label: 'Bloom filter',
        badge: 'Filter variant',
        whenToChoose: 'The simplest approximate membership structure is enough and you do not need deletions.',
        insteadChoose: 'Dynamic deletes or bucket-based fingerprint placement matter.',
      },
      {
        label: 'Cuckoo filter',
        badge: 'Filter variant',
        whenToChoose: 'You want approximate membership plus deletion support and are willing to manage relocation logic.',
        insteadChoose: 'The simplest bit-array design is preferable or insert failures must never trigger rebuild logic.',
      },
      {
        slug: 'count-min-sketch',
        whenToChoose: 'The question is about per-key frequency, not set membership.',
        insteadChoose: 'The system only needs to reject negative lookups quickly.',
      },
      {
        slug: 'hyperloglog',
        whenToChoose: 'The goal is counting distinct keys rather than testing whether one key may exist.',
        insteadChoose: 'You still need per-key membership checks.',
      },
    ],
  },
  'count-min-sketch': {
    title: 'Frequency estimation is a different sketch problem',
    description: 'Count-Min Sketch is the "how often?" sketch, not the "have I seen it?" or "how many unique?" sketch.',
    items: [
      {
        slug: 'bloom-cuckoo-filters',
        whenToChoose: 'The system only needs approximate membership tests in front of a slower lookup.',
        insteadChoose: 'Admission, heavy hitters, or frequency ranking matter more than membership.',
      },
      {
        slug: 'count-min-sketch',
        whenToChoose: 'You need compact per-key frequency estimates and can tolerate one-sided overestimation.',
        insteadChoose: 'Exact counts or distinct counting are the real goal.',
      },
      {
        slug: 'hyperloglog',
        whenToChoose: 'The only question is how many unique keys were seen, not how many times each key appeared.',
        insteadChoose: 'Individual key frequency needs to survive the sketch.',
      },
    ],
  },
  'hyperloglog': {
    title: 'Pick the sketch that matches the question',
    description: 'HyperLogLog is great at distinct counting, but it is not a replacement for frequency or membership structures.',
    items: [
      {
        slug: 'bloom-cuckoo-filters',
        whenToChoose: 'The question is "might this key be present?" before touching slower storage.',
        insteadChoose: 'The real metric is distinct-user or unique-key count.',
      },
      {
        slug: 'count-min-sketch',
        whenToChoose: 'You need approximate per-item frequency rather than a global unique count.',
        insteadChoose: 'The system only needs distinct cardinality.',
      },
      {
        slug: 'hyperloglog',
        whenToChoose: 'The metric is cardinality and the exact set would be too large to store.',
        insteadChoose: 'Membership or frequency still matters.',
      },
    ],
  },
  'cache-eviction-strategies': {
    title: 'Match the cache policy to the workload',
    description: 'The right policy depends on whether recency, long-term popularity, adaptation, or admission quality is the dominant signal.',
    items: [
      {
        label: 'LRU',
        badge: 'Policy variant',
        whenToChoose: 'Recent accesses are the best predictor and you want the simplest `O(1)` implementation.',
        insteadChoose: 'Short scans or one-hit traffic keep flushing genuinely hot items.',
      },
      {
        label: 'LFU',
        badge: 'Policy variant',
        whenToChoose: 'Stable hot keys should survive even if they are quiet for a short period.',
        insteadChoose: 'Old popularity quickly becomes stale.',
      },
      {
        label: 'ARC',
        badge: 'Policy variant',
        whenToChoose: 'The workload swings between recency-heavy and frequency-heavy behavior and the cache should adapt.',
        insteadChoose: 'The implementation must stay as simple as possible.',
      },
      {
        label: 'TinyLFU',
        badge: 'Policy variant',
        whenToChoose: 'Admission quality matters, especially when many one-hit arrivals compete with a smaller hot set.',
        insteadChoose: 'Approximate counting and segmented cache policy feel like too much machinery for the workload.',
      },
    ],
  },
  'consistent-hashing': {
    title: 'Separate distributed placement from local cache policy',
    description: 'Consistent hashing decides which machine owns the key. It is not a replacement for the local data structure or eviction policy.',
    items: [
      {
        slug: 'hash-map',
        whenToChoose: 'The question is local key lookup inside one process or one machine.',
        insteadChoose: 'The mapping must remain stable while the cluster changes.',
      },
      {
        slug: 'consistent-hashing',
        whenToChoose: 'Adding or removing machines should move only nearby keys instead of reshuffling the whole keyspace.',
        insteadChoose: 'The problem is local eviction or local membership, not distributed ownership.',
      },
      {
        slug: 'cache-eviction-strategies',
        whenToChoose: 'The system has already chosen the owning machine and now needs to decide what survives in memory on that machine.',
        insteadChoose: 'The real problem is placement across the cluster.',
      },
    ],
  },
  'hash-join-merge-join': {
    title: 'Choose the join operator that matches the data layout',
    description: 'Hash join and merge join can produce the same rows while paying very different preparation costs.',
    items: [
      {
        label: 'Hash join',
        badge: 'Join operator',
        whenToChoose: 'The join is an equality join, one side fits in memory, and no useful order already exists.',
        insteadChoose: 'Sorted order already exists or should be preserved for downstream work.',
      },
      {
        label: 'Merge join',
        badge: 'Join operator',
        whenToChoose: 'Both sides are already sorted or sorting them still pays off because ordered pipelines matter.',
        insteadChoose: 'Hashing one side is cheaper than creating sorted inputs.',
      },
      {
        slug: 'external-merge-sort',
        whenToChoose: 'You need the disk-aware sorting pipeline that often makes merge join possible at scale.',
        insteadChoose: 'The inputs are already ordered or hash join is the better operator.',
      },
    ],
  },
  'external-merge-sort': {
    title: 'Use external sorting when the data outgrows RAM',
    description: 'The comparison is not just "sort or not." It is whether ordered disk passes are cheaper than alternative operators or layouts.',
    items: [
      {
        slug: 'merge-sort',
        whenToChoose: 'The whole dataset fits comfortably in memory and plain in-memory recursion is enough.',
        insteadChoose: 'Sorting spills beyond RAM and disk passes dominate.',
      },
      {
        slug: 'external-merge-sort',
        whenToChoose: 'The data exceeds RAM and sequential multi-pass I/O is the practical way to produce sorted order.',
        insteadChoose: 'The problem is really about maintaining a long-lived index or a write-optimized store.',
      },
      {
        slug: 'hash-join-merge-join',
        whenToChoose: 'The sorted order will immediately feed a merge join or another ordered database operator.',
        insteadChoose: 'The workload is not actually paying for order downstream.',
      },
    ],
  },
} as const;

function dedupeTopicLinks(items: DsaTopicLink[]): DsaTopicLink[] {
  const seen = new Set<string>();

  return items.filter(item => {
    if (seen.has(item.slug)) {
      return false;
    }

    seen.add(item.slug);
    return true;
  });
}

function formatSlugLabel(slug: string): string {
  return slug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDsaCompareBlock(
  topicSlug: string,
  topicBySlug: Map<string, DsaTopicCardData>,
): DsaCompareBlockData | undefined {
  const definition = dsaCompareBlocks[topicSlug];

  if (!definition) {
    return undefined;
  }

  const items = definition.items
    .map(item => {
      const linkedTopic = item.slug ? topicBySlug.get(item.slug) : undefined;

      if (item.slug && !linkedTopic && !item.label) {
        return undefined;
      }

      return {
        label: item.label ?? linkedTopic?.title ?? formatSlugLabel(item.slug ?? topicSlug),
        href: item.slug && item.slug !== topicSlug ? `/dsa/${item.slug}` : undefined,
        badge: item.badge ?? (item.slug === topicSlug ? 'Current topic' : linkedTopic?.familyLabel ?? 'Alternative topic'),
        whenToChoose: item.whenToChoose,
        insteadChoose: item.insteadChoose,
      } satisfies DsaCompareCard;
    })
    .filter((item): item is DsaCompareCard => Boolean(item));

  if (items.length === 0) {
    return undefined;
  }

  return {
    title: definition.title,
    description: definition.description,
    items,
  };
}

export function getDsaNextStepRail(
  topic: DsaTopicCardData,
  pathMemberships: DsaLearningPath[],
): DsaNextStepRailData {
  const memberships = pathMemberships
    .map(path => ({
      path,
      index: path.steps.findIndex(step => step.slug === topic.slug),
    }))
    .filter(({ index }) => index >= 0)
    .sort((a, b) => {
      const aHasNext = a.index < a.path.steps.length - 1 ? 1 : 0;
      const bHasNext = b.index < b.path.steps.length - 1 ? 1 : 0;

      if (aHasNext !== bHasNext) {
        return bHasNext - aHasNext;
      }

      if (a.path.steps.length !== b.path.steps.length) {
        return a.path.steps.length - b.path.steps.length;
      }

      if (a.index !== b.index) {
        return a.index - b.index;
      }

      return a.path.title.localeCompare(b.path.title);
    });

  const primaryMembership = memberships[0];
  const primaryPath = primaryMembership
    ? {
        path: primaryMembership.path,
        stepNumber: primaryMembership.index + 1,
        totalSteps: primaryMembership.path.steps.length,
        previous: primaryMembership.path.steps[primaryMembership.index - 1],
        next: primaryMembership.path.steps[primaryMembership.index + 1],
      }
    : undefined;

  const alternativePathNextTopics = memberships
    .slice(1)
    .map(({ path, index }) => path.steps[index + 1])
    .filter((step): step is DsaTopicLink => Boolean(step));

  const nextCandidates = dedupeTopicLinks([
    ...(primaryPath?.next ? [primaryPath.next] : []),
    ...topic.enabledTopics,
    ...alternativePathNextTopics,
    ...topic.relatedTopics,
    ...topic.familyTopics,
  ]).filter(candidate => candidate.slug !== topic.slug);

  return {
    isFoundational: topic.prerequisiteTopics.length === 0,
    buildFirst: topic.prerequisiteTopics.slice(0, 3),
    primaryPath,
    bestNext: nextCandidates[0],
    additionalNextTopics: nextCandidates.slice(1, 4),
  };
}
