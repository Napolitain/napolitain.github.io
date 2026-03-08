import type { CollectionEntry } from 'astro:content';

import {
  graphicsDifficultyMeta,
  graphicsFamilies,
  graphicsFamilyValues,
  graphicsKindMeta,
  getGraphicsFamilyTrail,
  type GraphicsDifficultyId,
  type GraphicsFamilyId,
  type GraphicsKindId,
} from './graphics-meta';

type GraphicsEntry = CollectionEntry<'graphics'>;

interface BaseTopic {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  family: GraphicsFamilyId;
  kind: GraphicsKindId;
  difficulty: GraphicsDifficultyId;
  visualization?: string;
  prerequisiteSlugs: string[];
  relatedSlugs: string[];
  enableSlugs: string[];
}

export interface GraphicsTopicLink {
  slug: string;
  title: string;
  description: string;
  family: GraphicsFamilyId;
  familyLabel: string;
  kind: GraphicsKindId;
  kindLabel: string;
  difficulty: GraphicsDifficultyId;
  difficultyLabel: string;
}

export interface GraphicsTopicCardData extends GraphicsTopicLink {
  tags: string[];
  visualization?: string;
  familyDescription: string;
  familyParentId?: GraphicsFamilyId;
  familyParentLabel?: string;
  familyTrailLabels: string[];
  prerequisiteSlugs: string[];
  relatedSlugs: string[];
  enableSlugs: string[];
  prerequisiteTopics: GraphicsTopicLink[];
  relatedTopics: GraphicsTopicLink[];
  enabledTopics: GraphicsTopicLink[];
  familyTopics: GraphicsTopicLink[];
  pathIds: string[];
  searchText: string;
}

export interface GraphicsFamilySection {
  id: GraphicsFamilyId;
  label: string;
  description: string;
  parentLabel?: string;
  note?: string;
  topicCount: number;
  topicSlugs: string[];
  childFamilyIds: GraphicsFamilyId[];
}

export interface GraphicsLearningPath {
  id: string;
  title: string;
  description: string;
  slugs: string[];
  steps: GraphicsTopicLink[];
}

export interface GraphicsStats {
  totalTopics: number;
  totalFamilies: number;
  totalPaths: number;
  totalConcepts: number;
  totalAlgorithms: number;
  totalTechniques: number;
}

export interface GraphicsDirectoryData {
  topics: GraphicsTopicCardData[];
  families: GraphicsFamilySection[];
  paths: GraphicsLearningPath[];
  stats: GraphicsStats;
  topicBySlug: Map<string, GraphicsTopicCardData>;
}

const graphicsPathDefinitions = [
  {
    id: 'filtering-stack',
    title: 'Filtering and edges',
    description: 'Move from raw pixels through noise reduction, edge emphasis, and multi-stage edge pipelines.',
    slugs: [
      'image-processing-fundamentals',
      'gaussian-blur',
      'median-filter',
      'bilateral-filter',
      'laplacian-log',
      'thresholding',
      'sobel-edge-detection',
      'canny-edge-detection',
    ],
  },
  {
    id: 'mask-analysis',
    title: 'Mask analysis and cleanup',
    description: 'Build a binary mask, explore connectivity, then repair or simplify it with morphology-aware tools.',
    slugs: [
      'image-processing-fundamentals',
      'thresholding',
      'flood-fill',
      'connected-components-labeling',
      'dilation',
      'erosion',
      'opening-closing',
      'distance-transform',
      'skeletonization',
    ],
  },
  {
    id: 'sampling-textures',
    title: 'Sampling and textures',
    description: 'Learn how image data is resampled, reconstructed, and stabilized across magnification and minification.',
    slugs: [
      'bilinear-bicubic-interpolation',
      'mipmaps',
      'color-spaces',
      'gamma-correction',
    ],
  },
  {
    id: 'color-pipeline',
    title: 'Color and tone pipeline',
    description: 'Track how values move from color spaces and gamma into dynamic-range compression, equalization, dithering, and compositing.',
    slugs: [
      'color-spaces',
      'gamma-correction',
      'histogram-equalization',
      'tone-mapping',
      'dithering',
      'alpha-compositing',
      'bloom',
    ],
  },
  {
    id: 'raster-pipeline',
    title: 'Raster pipeline',
    description: 'Follow the classic rendering path from clipping and rasterization into visibility, shadows, occlusion, and temporal cleanup.',
    slugs: [
      'clipping',
      'rasterization',
      'barycentric-interpolation',
      'z-buffer',
      'shadow-mapping',
      'ssao',
      'taa',
      'bloom',
    ],
  },
  {
    id: 'geometry-and-implicit',
    title: 'Geometry and alternate rendering',
    description: 'Bridge parametric geometry with implicit surfaces and ray-marched rendering ideas.',
    slugs: [
      'bezier-curves',
      'ray-marching-sdf',
    ],
  },
] as const;

function uniqueSlugs(slugs: string[]): string[] {
  return [...new Set(slugs.filter(Boolean))];
}

function toBaseTopic(entry: GraphicsEntry): BaseTopic {
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

function compareLinks(a: GraphicsTopicLink, b: GraphicsTopicLink): number {
  const familyOrder = graphicsFamilies[a.family].order - graphicsFamilies[b.family].order;
  if (familyOrder !== 0) {
    return familyOrder;
  }

  const difficultyOrder = graphicsDifficultyMeta[a.difficulty].order - graphicsDifficultyMeta[b.difficulty].order;
  if (difficultyOrder !== 0) {
    return difficultyOrder;
  }

  return a.title.localeCompare(b.title);
}

function compareTopics(a: BaseTopic, b: BaseTopic): number {
  return compareLinks(toTopicLink(a), toTopicLink(b));
}

function toTopicLink(topic: BaseTopic): GraphicsTopicLink {
  return {
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    family: topic.family,
    familyLabel: graphicsFamilies[topic.family].label,
    kind: topic.kind,
    kindLabel: graphicsKindMeta[topic.kind].label,
    difficulty: topic.difficulty,
    difficultyLabel: graphicsDifficultyMeta[topic.difficulty].label,
  };
}

function resolveLinks(slugs: string[], topicBySlug: Map<string, BaseTopic>): GraphicsTopicLink[] {
  return uniqueSlugs(slugs)
    .map(slug => topicBySlug.get(slug))
    .filter((topic): topic is BaseTopic => Boolean(topic))
    .map(toTopicLink)
    .sort(compareLinks);
}

export function buildGraphicsDirectory(entries: GraphicsEntry[]): GraphicsDirectoryData {
  const baseTopics = entries.map(toBaseTopic).sort(compareTopics);
  const topicBySlug = new Map(baseTopics.map(topic => [topic.slug, topic]));

  const paths = graphicsPathDefinitions
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

    const familyMeta = graphicsFamilies[topic.family];
    const familyTrailLabels = getGraphicsFamilyTrail(topic.family).map(familyId => graphicsFamilies[familyId].label);
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
      visualization: topic.visualization,
      familyDescription: familyMeta.description,
      familyParentId: familyMeta.parentId,
      familyParentLabel: familyMeta.parentId ? graphicsFamilies[familyMeta.parentId].label : undefined,
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
        graphicsKindMeta[topic.kind].label,
        graphicsDifficultyMeta[topic.difficulty].label,
        ...pathSearchText,
        ...linkedSearchText,
      ].join(' ').toLowerCase(),
    } satisfies GraphicsTopicCardData;
  });

  const resolvedTopicBySlug = new Map(resolvedTopics.map(topic => [topic.slug, topic]));

  const families = graphicsFamilyValues
    .map(familyId => {
      const familyMeta = graphicsFamilies[familyId];
      const topicsInFamily = resolvedTopics
        .filter(topic => topic.family === familyId)
        .map(topic => topic.slug);

      return {
        id: familyId,
        label: familyMeta.label,
        description: familyMeta.description,
        parentLabel: familyMeta.parentId ? graphicsFamilies[familyMeta.parentId].label : undefined,
        note: familyMeta.parentId ? `Special case of ${graphicsFamilies[familyMeta.parentId].label}` : undefined,
        topicCount: topicsInFamily.length,
        topicSlugs: topicsInFamily,
        childFamilyIds: graphicsFamilyValues.filter(candidate => graphicsFamilies[candidate].parentId === familyId),
      } satisfies GraphicsFamilySection;
    })
    .filter(section => section.topicCount > 0)
    .sort((a, b) => graphicsFamilies[a.id].order - graphicsFamilies[b.id].order);

  const stats: GraphicsStats = {
    totalTopics: resolvedTopics.length,
    totalFamilies: families.length,
    totalPaths: paths.length,
    totalConcepts: resolvedTopics.filter(topic => topic.kind === 'concept').length,
    totalAlgorithms: resolvedTopics.filter(topic => topic.kind === 'algorithm').length,
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
