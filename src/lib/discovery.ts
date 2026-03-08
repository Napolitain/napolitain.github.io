import type { CollectionEntry } from 'astro:content';

import { getReadingTime } from './blog-utils';
import type { DsaDirectoryData, DsaLearningPath, DsaTopicCardData } from './dsa';
import type { GraphicsDirectoryData, GraphicsLearningPath, GraphicsTopicCardData } from './graphics';

type AtlasSection = 'dsa' | 'graphics';

type PathWithSteps = DsaLearningPath | GraphicsLearningPath;
type TopicWithTags = DsaTopicCardData | GraphicsTopicCardData;
type AtlasTopicForBlogLinks = Pick<
  DsaTopicCardData | GraphicsTopicCardData,
  'title' | 'description' | 'tags' | 'familyLabel' | 'kindLabel' | 'difficultyLabel'
>;

const SECTION_LABELS: Record<AtlasSection, string> = {
  dsa: 'DSA Atlas',
  graphics: 'Graphics Atlas',
};

const DEFAULT_PATH_IDS: Record<AtlasSection, string[]> = {
  dsa: ['graph-toolkit', 'range-query-toolkit'],
  graphics: ['filtering-stack', 'raster-pipeline'],
};

const STOPWORDS = new Set([
  'about',
  'across',
  'after',
  'algorithm',
  'also',
  'atlas',
  'because',
  'before',
  'between',
  'built',
  'from',
  'have',
  'into',
  'just',
  'more',
  'most',
  'need',
  'only',
  'page',
  'same',
  'site',
  'that',
  'their',
  'them',
  'these',
  'they',
  'this',
  'through',
  'topic',
  'topics',
  'using',
  'want',
  'when',
  'where',
  'with',
  'without',
]);

export interface DiscoveryCardLink {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
  badges: string[];
}

export interface BlogPostPreview {
  title: string;
  description: string;
  date: Date;
  tags: string[];
  slug: string;
  readingTime: string;
}

export interface AtlasHistoryItemInput {
  href: string;
  title: string;
  section: AtlasSection;
}

export interface AtlasHistoryItem extends AtlasHistoryItemInput {
  sectionLabel: string;
  visitedAt: number;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOPWORDS.has(token));
}

function buildTokenSet(values: string[]): Set<string> {
  return new Set(values.flatMap(tokenize));
}

function countOverlap(sourceTokens: Set<string>, values: string[]): number {
  let score = 0;

  for (const token of buildTokenSet(values)) {
    if (sourceTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

function toDiscoveryCard(section: AtlasSection, path: PathWithSteps): DiscoveryCardLink {
  return {
    href: `/${section}?path=${path.id}`,
    eyebrow: SECTION_LABELS[section],
    title: path.title,
    description: path.description,
    meta: `${path.steps.length} topic${path.steps.length === 1 ? '' : 's'}`,
    badges: path.steps.slice(0, 3).map(step => step.title),
  };
}

function scorePath(
  sourceTokens: Set<string>,
  path: PathWithSteps,
  topicBySlug: Map<string, TopicWithTags>,
): number {
  if (sourceTokens.size === 0) {
    return 0;
  }

  const topicTags = path.slugs.flatMap(slug => topicBySlug.get(slug)?.tags ?? []);
  const pathTexts = [
    path.title,
    path.description,
    ...path.steps.flatMap(step => [step.title, step.description]),
    topicTags.join(' '),
  ];

  return countOverlap(sourceTokens, pathTexts);
}

function selectPathCards(
  section: AtlasSection,
  paths: PathWithSteps[],
  topicBySlug: Map<string, TopicWithTags>,
  sourceTokens: Set<string>,
  limit: number,
): DiscoveryCardLink[] {
  const fallbackIds = DEFAULT_PATH_IDS[section];
  const pathById = new Map(paths.map(path => [path.id, path]));
  const selected = new Set<string>();
  const orderedPaths = paths
    .map(path => ({
      path,
      score: scorePath(sourceTokens, path, topicBySlug),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.path.title.localeCompare(b.path.title);
    });

  for (const entry of orderedPaths) {
    if (entry.score <= 0 || selected.size >= limit) {
      continue;
    }

    selected.add(entry.path.id);
  }

  for (const fallbackId of fallbackIds) {
    if (selected.size >= limit) {
      break;
    }

    if (pathById.has(fallbackId)) {
      selected.add(fallbackId);
    }
  }

  for (const path of paths) {
    if (selected.size >= limit) {
      break;
    }

    selected.add(path.id);
  }

  return [...selected]
    .map(id => pathById.get(id))
    .filter((path): path is PathWithSteps => Boolean(path))
    .slice(0, limit)
    .map(path => toDiscoveryCard(section, path));
}

function toBlogPostPreview(entry: CollectionEntry<'blog'>): BlogPostPreview {
  return {
    title: entry.data.title,
    description: entry.data.description,
    date: entry.data.date,
    tags: entry.data.tags,
    slug: entry.slug,
    readingTime: getReadingTime(entry.body),
  };
}

export function getHomepageDiscoveryCards(
  dsaDirectory: DsaDirectoryData,
  graphicsDirectory: GraphicsDirectoryData,
): DiscoveryCardLink[] {
  return [
    ...selectPathCards('dsa', dsaDirectory.paths, dsaDirectory.topicBySlug, new Set(), 2),
    ...selectPathCards('graphics', graphicsDirectory.paths, graphicsDirectory.topicBySlug, new Set(), 2),
    {
      href: '/search',
      eyebrow: 'Discovery',
      title: 'Search the whole site',
      description: 'Search blog posts, atlas topics, graphics demos, and experiments from one place instead of jumping between sections.',
      meta: 'Unified search',
      badges: ['Blog', 'DSA', 'Graphics'],
    },
  ];
}

export function getBlogAtlasSuggestions(
  entry: CollectionEntry<'blog'>,
  dsaDirectory: DsaDirectoryData,
  graphicsDirectory: GraphicsDirectoryData,
): DiscoveryCardLink[] {
  const sourceTokens = buildTokenSet([
    entry.data.title,
    entry.data.description,
    entry.data.tags.join(' '),
    entry.body.slice(0, 2_000),
  ]);

  return [
    ...selectPathCards('dsa', dsaDirectory.paths, dsaDirectory.topicBySlug, sourceTokens, 2),
    ...selectPathCards('graphics', graphicsDirectory.paths, graphicsDirectory.topicBySlug, sourceTokens, 2),
    {
      href: '/search',
      eyebrow: 'Discovery',
      title: 'Search across the whole site',
      description: 'Jump from writing into the atlases, demos, and other content when you want a faster way to connect the dots.',
      meta: 'Unified search',
      badges: ['Ctrl+K', 'Pagefind'],
    },
  ];
}

export function getBlogPostsForAtlasTopic(
  topic: AtlasTopicForBlogLinks,
  posts: CollectionEntry<'blog'>[],
  limit: number = 3,
): BlogPostPreview[] {
  const sourceTokens = buildTokenSet([
    topic.title,
    topic.description,
    topic.tags.join(' '),
    topic.familyLabel,
    topic.kindLabel,
    topic.difficultyLabel,
  ]);

  const rankedPosts = [...posts]
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map(post => ({
      post,
      score: countOverlap(sourceTokens, [
        post.data.title,
        post.data.description,
        post.data.tags.join(' '),
        post.body.slice(0, 1_500),
      ]),
    }));

  const matchingPosts = rankedPosts
    .filter(entry => entry.score > 0)
    .slice(0, limit)
    .map(entry => entry.post);

  const selectedPosts = (matchingPosts.length > 0 ? matchingPosts : rankedPosts.slice(0, limit).map(entry => entry.post))
    .slice(0, limit);

  return selectedPosts.map(toBlogPostPreview);
}

export function createAtlasHistoryItem(input: AtlasHistoryItemInput): AtlasHistoryItem {
  return {
    ...input,
    sectionLabel: SECTION_LABELS[input.section],
    visitedAt: Date.now(),
  };
}
