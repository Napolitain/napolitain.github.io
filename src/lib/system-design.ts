import type { CollectionEntry } from 'astro:content';

import {
  getSystemDesignFamilyTrail,
  systemDesignDifficultyMeta,
  systemDesignFamilies,
  systemDesignFamilyValues,
  systemDesignKindMeta,
  type SystemDesignDifficultyId,
  type SystemDesignFamilyId,
  type SystemDesignKindId,
} from './system-design-meta';

type SystemDesignEntry = CollectionEntry<'system-design'>;

interface BaseTopic {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  family: SystemDesignFamilyId;
  kind: SystemDesignKindId;
  difficulty: SystemDesignDifficultyId;
  prerequisiteSlugs: string[];
  relatedSlugs: string[];
  enableSlugs: string[];
}

export interface SystemDesignTopicLink {
  slug: string;
  title: string;
  description: string;
  family: SystemDesignFamilyId;
  familyLabel: string;
  kind: SystemDesignKindId;
  kindLabel: string;
  difficulty: SystemDesignDifficultyId;
  difficultyLabel: string;
}

export interface SystemDesignTopicCardData extends SystemDesignTopicLink {
  tags: string[];
  familyDescription: string;
  familyParentId?: SystemDesignFamilyId;
  familyParentLabel?: string;
  familyTrailLabels: string[];
  prerequisiteSlugs: string[];
  relatedSlugs: string[];
  enableSlugs: string[];
  prerequisiteTopics: SystemDesignTopicLink[];
  relatedTopics: SystemDesignTopicLink[];
  enabledTopics: SystemDesignTopicLink[];
  familyTopics: SystemDesignTopicLink[];
  pathIds: string[];
  searchText: string;
}

export interface SystemDesignFamilySection {
  id: SystemDesignFamilyId;
  label: string;
  description: string;
  parentLabel?: string;
  note?: string;
  topicCount: number;
  topicSlugs: string[];
  childFamilyIds: SystemDesignFamilyId[];
}

export interface SystemDesignLearningPath {
  id: string;
  title: string;
  description: string;
  slugs: string[];
  steps: SystemDesignTopicLink[];
}

export interface SystemDesignStats {
  totalTopics: number;
  totalFamilies: number;
  totalPaths: number;
  totalDesigns: number;
  totalBuildingBlocks: number;
  totalFoundations: number;
}

export interface SystemDesignDirectoryData {
  topics: SystemDesignTopicCardData[];
  families: SystemDesignFamilySection[];
  paths: SystemDesignLearningPath[];
  stats: SystemDesignStats;
  topicBySlug: Map<string, SystemDesignTopicCardData>;
}

const systemDesignPathDefinitions = [
  {
    id: 'traffic-control-core',
    title: 'Traffic control core',
    description: 'Start with a production-grade rate limiter, then expand into retries, circuit breaking, and load shedding as the system design track grows.',
    slugs: [
      'designing-a-rate-limiter',
      'idempotency-and-retries',
      'circuit-breakers',
      'load-shedding',
    ],
  },
  {
    id: 'global-policy-enforcement',
    title: 'Global policy enforcement',
    description: 'Learn how policy definition, distributed enforcement, and multi-region coordination fit together for large control surfaces.',
    slugs: [
      'designing-a-rate-limiter',
      'feature-flags-control-plane',
      'distributed-locking',
      'global-quotas',
    ],
  },
] as const;

function uniqueSlugs(slugs: string[]): string[] {
  return [...new Set(slugs.filter(Boolean))];
}

function toBaseTopic(entry: SystemDesignEntry): BaseTopic {
  return {
    slug: entry.slug,
    title: entry.data.title,
    description: entry.data.description,
    tags: entry.data.tags,
    family: entry.data.family,
    kind: entry.data.kind,
    difficulty: entry.data.difficulty,
    prerequisiteSlugs: entry.data.prerequisites,
    relatedSlugs: entry.data.related,
    enableSlugs: entry.data.enables,
  };
}

function toTopicLink(topic: BaseTopic): SystemDesignTopicLink {
  return {
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    family: topic.family,
    familyLabel: systemDesignFamilies[topic.family].label,
    kind: topic.kind,
    kindLabel: systemDesignKindMeta[topic.kind].label,
    difficulty: topic.difficulty,
    difficultyLabel: systemDesignDifficultyMeta[topic.difficulty].label,
  };
}

function compareLinks(a: SystemDesignTopicLink, b: SystemDesignTopicLink): number {
  const familyOrder = systemDesignFamilies[a.family].order - systemDesignFamilies[b.family].order;
  if (familyOrder !== 0) {
    return familyOrder;
  }

  const kindOrder = systemDesignKindMeta[a.kind].order - systemDesignKindMeta[b.kind].order;
  if (kindOrder !== 0) {
    return kindOrder;
  }

  const difficultyOrder = systemDesignDifficultyMeta[a.difficulty].order - systemDesignDifficultyMeta[b.difficulty].order;
  if (difficultyOrder !== 0) {
    return difficultyOrder;
  }

  return a.title.localeCompare(b.title);
}

function compareTopics(a: BaseTopic, b: BaseTopic): number {
  return compareLinks(toTopicLink(a), toTopicLink(b));
}

function resolveLinks(slugs: string[], topicBySlug: Map<string, BaseTopic>): SystemDesignTopicLink[] {
  return uniqueSlugs(slugs)
    .map(slug => topicBySlug.get(slug))
    .filter((topic): topic is BaseTopic => Boolean(topic))
    .map(toTopicLink)
    .sort(compareLinks);
}

export function buildSystemDesignDirectory(entries: SystemDesignEntry[]): SystemDesignDirectoryData {
  const baseTopics = entries.map(toBaseTopic).sort(compareTopics);
  const topicBySlug = new Map(baseTopics.map(topic => [topic.slug, topic]));

  const paths = systemDesignPathDefinitions
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

    const familyMeta = systemDesignFamilies[topic.family];
    const familyTrailLabels = getSystemDesignFamilyTrail(topic.family).map(familyId => systemDesignFamilies[familyId].label);
    const familyTopics = baseTopics
      .filter(other => other.slug !== topic.slug && other.family === topic.family)
      .sort(compareTopics)
      .map(toTopicLink);

    const pathIds = pathIdsBySlug.get(topic.slug) ?? [];
    const pathSearchText = paths
      .filter(path => pathIds.includes(path.id))
      .flatMap(path => [path.title, path.description]);
    const linkedSearchText = [
      ...prerequisiteTopics,
      ...relatedTopics,
      ...enabledTopics,
    ].flatMap(other => [
      other.title,
      other.description,
      other.familyLabel,
      other.kindLabel,
      other.difficultyLabel,
    ]);

    return {
      ...toTopicLink(topic),
      tags: topic.tags,
      familyDescription: familyMeta.description,
      familyParentId: familyMeta.parentId,
      familyParentLabel: familyMeta.parentId ? systemDesignFamilies[familyMeta.parentId].label : undefined,
      familyTrailLabels,
      prerequisiteSlugs: topic.prerequisiteSlugs,
      relatedSlugs: uniqueSlugs([...topic.relatedSlugs, ...reciprocalRelated]),
      enableSlugs: uniqueSlugs([...topic.enableSlugs, ...reverseEnables]),
      prerequisiteTopics,
      relatedTopics,
      enabledTopics,
      familyTopics,
      pathIds,
      searchText: [
        topic.title,
        topic.slug.replace(/-/g, ' '),
        topic.description,
        topic.tags.join(' '),
        familyMeta.label,
        familyMeta.description,
        ...familyTrailLabels,
        systemDesignKindMeta[topic.kind].label,
        systemDesignDifficultyMeta[topic.difficulty].label,
        ...pathSearchText,
        ...linkedSearchText,
      ].join(' ').toLowerCase(),
    } satisfies SystemDesignTopicCardData;
  });

  const resolvedTopicBySlug = new Map(resolvedTopics.map(topic => [topic.slug, topic]));

  const families = systemDesignFamilyValues
    .map(familyId => {
      const familyMeta = systemDesignFamilies[familyId];
      const topicsInFamily = resolvedTopics
        .filter(topic => topic.family === familyId)
        .map(topic => topic.slug);

      return {
        id: familyId,
        label: familyMeta.label,
        description: familyMeta.description,
        parentLabel: familyMeta.parentId ? systemDesignFamilies[familyMeta.parentId].label : undefined,
        note: familyMeta.parentId ? `Specialized slice of ${systemDesignFamilies[familyMeta.parentId].label}` : undefined,
        topicCount: topicsInFamily.length,
        topicSlugs: topicsInFamily,
        childFamilyIds: systemDesignFamilyValues.filter(candidate => systemDesignFamilies[candidate].parentId === familyId),
      } satisfies SystemDesignFamilySection;
    })
    .filter(section => section.topicCount > 0)
    .sort((a, b) => systemDesignFamilies[a.id].order - systemDesignFamilies[b.id].order);

  const stats: SystemDesignStats = {
    totalTopics: resolvedTopics.length,
    totalFamilies: families.length,
    totalPaths: paths.length,
    totalDesigns: resolvedTopics.filter(topic => topic.kind === 'end-to-end-design').length,
    totalBuildingBlocks: resolvedTopics.filter(topic => topic.kind === 'building-block').length,
    totalFoundations: resolvedTopics.filter(topic => topic.kind === 'foundation').length,
  };

  return {
    topics: resolvedTopics,
    families,
    paths,
    stats,
    topicBySlug: resolvedTopicBySlug,
  };
}
