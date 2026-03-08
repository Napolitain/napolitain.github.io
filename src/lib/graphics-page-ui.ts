import type { GraphicsLearningPath, GraphicsTopicCardData, GraphicsTopicLink } from './graphics';

interface GraphicsCompareCardDefinition {
  label?: string;
  slug?: string;
  badge?: string;
  whenToChoose: string;
  insteadChoose: string;
}

interface GraphicsCompareBlockDefinition {
  title: string;
  description: string;
  items: GraphicsCompareCardDefinition[];
}

export interface GraphicsCompareCard {
  label: string;
  href?: string;
  badge: string;
  whenToChoose: string;
  insteadChoose: string;
}

export interface GraphicsCompareBlockData {
  title: string;
  description: string;
  items: GraphicsCompareCard[];
}

export interface GraphicsPathProgressData {
  path: GraphicsLearningPath;
  stepNumber: number;
  totalSteps: number;
  previous?: GraphicsTopicLink;
  next?: GraphicsTopicLink;
}

export interface GraphicsNextStepRailData {
  isFoundational: boolean;
  buildFirst: GraphicsTopicLink[];
  primaryPath?: GraphicsPathProgressData;
  bestNext?: GraphicsTopicLink;
  additionalNextTopics: GraphicsTopicLink[];
}

const graphicsCompareBlocks: Record<string, GraphicsCompareBlockDefinition> = {
  'image-processing-fundamentals': {
    title: 'Pick the right neighborhood operator first',
    description: 'Most image-processing pipelines start by deciding whether you want smoothing, segmentation, or binary-mask cleanup.',
    items: [
      {
        slug: 'gaussian-blur',
        whenToChoose: 'The image is noisy and you want to smooth local variation before later stages.',
        insteadChoose: 'The real goal is turning values into a mask or detecting boundaries.',
      },
      {
        slug: 'thresholding',
        whenToChoose: 'You need to turn grayscale intensity into a binary mask that later operators can clean up.',
        insteadChoose: 'The image should stay continuous rather than becoming binary.',
      },
      {
        slug: 'sobel-edge-detection',
        whenToChoose: 'You want boundaries, gradients, and edge emphasis rather than region filling.',
        insteadChoose: 'The next stage needs a smoothed image or a binary mask instead of an edge map.',
      },
    ],
  },
  'gaussian-blur': {
    title: 'Blur is for smoothing, not for mask repair',
    description: 'Gaussian blur is the continuous-image workhorse. The alternative depends on whether you want a mask or an edge map instead.',
    items: [
      {
        slug: 'gaussian-blur',
        whenToChoose: 'Noise should be smoothed while keeping the overall image continuous.',
        insteadChoose: 'The real task is binary-mask cleanup or explicit edge extraction.',
      },
      {
        slug: 'thresholding',
        whenToChoose: 'The next stage needs a binary mask instead of a softened grayscale image.',
        insteadChoose: 'Hard binarization would throw away detail too early.',
      },
      {
        slug: 'opening-closing',
        whenToChoose: 'You already have a mask and need to remove specks or fill holes without blurring boundaries.',
        insteadChoose: 'The source is still a continuous image rather than a binary mask.',
      },
      {
        slug: 'sobel-edge-detection',
        whenToChoose: 'The goal is locating strong gradients after optional smoothing, not just denoising.',
        insteadChoose: 'Edges are less important than local averaging.',
      },
    ],
  },
  'thresholding': {
    title: 'Thresholding is the bridge from tone to mask',
    description: 'Choose thresholding when the output should become binary, then decide whether later cleanup should expand, shrink, or repair that mask.',
    items: [
      {
        slug: 'gaussian-blur',
        whenToChoose: 'The image should stay continuous and only needs smoothing.',
        insteadChoose: 'You need a hard mask for later morphology.',
      },
      {
        slug: 'thresholding',
        whenToChoose: 'The pipeline needs a binary split between foreground and background.',
        insteadChoose: 'A soft grayscale representation still matters downstream.',
      },
      {
        slug: 'opening-closing',
        whenToChoose: 'The mask already exists, but noise removal or hole filling is still needed.',
        insteadChoose: 'The main missing step is still converting tone into a mask in the first place.',
      },
      {
        slug: 'sobel-edge-detection',
        whenToChoose: 'You want outlines and gradient changes, not a filled binary region.',
        insteadChoose: 'The output should represent inside vs. outside regions.',
      },
    ],
  },
  'sobel-edge-detection': {
    title: 'Edges answer a different question than blur or thresholding',
    description: 'Sobel highlights boundaries. It is most useful when the pipeline needs geometry cues rather than just denoising or mask generation.',
    items: [
      {
        slug: 'sobel-edge-detection',
        whenToChoose: 'You want a gradient map that emphasizes boundaries and direction changes.',
        insteadChoose: 'The image only needs smoothing or direct binarization.',
      },
      {
        slug: 'gaussian-blur',
        whenToChoose: 'The problem is still noise reduction rather than boundary extraction.',
        insteadChoose: 'The next stage needs edge magnitude rather than a softened image.',
      },
      {
        slug: 'thresholding',
        whenToChoose: 'The output should be a solid foreground mask, not just highlighted outlines.',
        insteadChoose: 'You need edge responses that preserve contour detail.',
      },
    ],
  },
  'dilation': {
    title: 'Expanding vs. shrinking a mask',
    description: 'Dilation, erosion, and their composites all inspect local neighborhoods, but they move boundaries in opposite directions.',
    items: [
      {
        slug: 'dilation',
        whenToChoose: 'Small gaps should close and foreground regions should expand outward.',
        insteadChoose: 'Thin noise or boundary fattening is actually a problem.',
      },
      {
        slug: 'erosion',
        whenToChoose: 'You need to trim mask boundaries or remove tiny foreground specks.',
        insteadChoose: 'The mask should grow, not shrink.',
      },
      {
        slug: 'opening-closing',
        whenToChoose: 'One primitive operation is not enough and the mask needs a composite clean-up pass.',
        insteadChoose: 'A single grow or shrink step already solves the issue.',
      },
    ],
  },
  'erosion': {
    title: 'Shrink the mask only when that is really the goal',
    description: 'Erosion is the mirror image of dilation, and opening/closing use both in sequence to clean binary masks more selectively.',
    items: [
      {
        slug: 'erosion',
        whenToChoose: 'Foreground regions should contract so tiny bright noise disappears.',
        insteadChoose: 'You actually need to bridge gaps or grow the mask.',
      },
      {
        slug: 'dilation',
        whenToChoose: 'Broken regions should reconnect and the mask should expand.',
        insteadChoose: 'Boundary shrinkage is the desired effect.',
      },
      {
        slug: 'opening-closing',
        whenToChoose: 'The mask needs a cleaner composite operation that shrinks and regrows in a controlled order.',
        insteadChoose: 'A single erosion already gives the result you want.',
      },
    ],
  },
  'opening-closing': {
    title: 'Opening and closing are deliberate two-step repairs',
    description: 'Both operators combine erosion and dilation, but the order decides whether you remove bright specks or fill small dark holes.',
    items: [
      {
        label: 'Opening = erosion then dilation',
        badge: 'Composite operator',
        whenToChoose: 'Small bright specks should disappear while larger shapes stay mostly intact.',
        insteadChoose: 'The bigger problem is small dark gaps or holes inside the foreground.',
      },
      {
        label: 'Closing = dilation then erosion',
        badge: 'Composite operator',
        whenToChoose: 'Small holes and gaps should be sealed without permanently thickening the whole shape.',
        insteadChoose: 'You are trying to remove isolated bright noise instead of fill gaps.',
      },
      {
        slug: 'gaussian-blur',
        whenToChoose: 'The source is still a continuous image and should be smoothed, not treated as a binary mask.',
        insteadChoose: 'The mask already exists and needs structural cleanup.',
      },
    ],
  },
  'median-filter': {
    title: 'Median, Gaussian, or bilateral?',
    description: 'These three filters all smooth images, but they preserve structure in very different ways.',
    items: [
      {
        slug: 'median-filter',
        whenToChoose: 'Impulse noise or isolated salt-and-pepper pixels are the main problem.',
        insteadChoose: 'The image needs softer Gaussian-like smoothing or edge-aware denoising.',
      },
      {
        slug: 'gaussian-blur',
        whenToChoose: 'A stable, isotropic weighted blur is enough and softening edges is acceptable.',
        insteadChoose: 'Impulse noise dominates or edges must stay crisper.',
      },
      {
        slug: 'bilateral-filter',
        whenToChoose: 'You want smoothing but still care about preserving strong intensity boundaries.',
        insteadChoose: 'A cheaper blur is sufficient or the image is already binary.',
      },
    ],
  },
  'bilateral-filter': {
    title: 'Edge-aware smoothing vs ordinary blur',
    description: 'Bilateral filtering spends extra work to avoid averaging across strong boundaries.',
    items: [
      {
        slug: 'bilateral-filter',
        whenToChoose: 'Noise should shrink, but edges should resist being washed away.',
        insteadChoose: 'A simpler blur is good enough or the mask is already binary.',
      },
      {
        slug: 'gaussian-blur',
        whenToChoose: 'You want predictable smoothing and do not mind some edge softening.',
        insteadChoose: 'Boundary preservation matters more than raw speed.',
      },
      {
        slug: 'median-filter',
        whenToChoose: 'The biggest issue is isolated outlier pixels rather than continuous noise.',
        insteadChoose: 'The image has textured noise where a rank filter is too aggressive.',
      },
    ],
  },
  'laplacian-log': {
    title: 'Second-derivative edges vs gradient edges',
    description: 'Laplacian-style operators react to zero crossings and rapid curvature, while Sobel and Canny focus on directed gradients.',
    items: [
      {
        slug: 'laplacian-log',
        whenToChoose: 'You want second-derivative style edge emphasis or blob-like structures after smoothing.',
        insteadChoose: 'You need a more stable thin edge map with directional gradient reasoning.',
      },
      {
        slug: 'sobel-edge-detection',
        whenToChoose: 'A simple gradient magnitude map is enough.',
        insteadChoose: 'You need multi-stage suppression and thresholding instead of a raw edge response.',
      },
      {
        slug: 'canny-edge-detection',
        whenToChoose: 'The result should be a cleaner final edge map rather than an intermediate signal.',
        insteadChoose: 'A lighter-weight operator already answers the need.',
      },
    ],
  },
  'canny-edge-detection': {
    title: 'Choose Canny when the edge map itself matters',
    description: 'Canny is a pipeline, not just a kernel, so it is heavier but more deliberate than Sobel or Laplacian-style responses.',
    items: [
      {
        slug: 'canny-edge-detection',
        whenToChoose: 'You need non-maximum suppression, hysteresis, and a cleaner final contour set.',
        insteadChoose: 'A quick gradient visualization or cheaper edge hint is enough.',
      },
      {
        slug: 'sobel-edge-detection',
        whenToChoose: 'The goal is a direct gradient map, not a fully curated edge detector.',
        insteadChoose: 'Thin final contours matter more than raw gradient strength.',
      },
      {
        slug: 'laplacian-log',
        whenToChoose: 'Second-derivative behavior or zero crossings are the main signal of interest.',
        insteadChoose: 'You want a more standard contour extraction pipeline.',
      },
    ],
  },
  'flood-fill': {
    title: 'Region growing vs connected-component labeling',
    description: 'Both topics reason about connected regions, but flood fill starts from one seed while component labeling partitions everything.',
    items: [
      {
        slug: 'flood-fill',
        whenToChoose: 'You have one seed and want to grow exactly that region.',
        insteadChoose: 'The whole image needs a full partition into region IDs.',
      },
      {
        slug: 'connected-components-labeling',
        whenToChoose: 'Every connected region should receive a label, size, or later measurement.',
        insteadChoose: 'Only one local region is relevant at a time.',
      },
      {
        slug: 'distance-transform',
        whenToChoose: 'The question is not membership, but distance to boundaries or background.',
        insteadChoose: 'Simple reachability already solves the problem.',
      },
    ],
  },
  'connected-components-labeling': {
    title: 'Partition first, then measure',
    description: 'Connected-component labeling is the natural next step once a binary mask exists and you need object-level reasoning.',
    items: [
      {
        slug: 'connected-components-labeling',
        whenToChoose: 'You need region IDs, counts, bounding boxes, or per-object measurements.',
        insteadChoose: 'Only one region from a single seed matters.',
      },
      {
        slug: 'flood-fill',
        whenToChoose: 'A single seeded region should be grown interactively or locally.',
        insteadChoose: 'Every connected region across the whole image needs labeling.',
      },
      {
        slug: 'skeletonization',
        whenToChoose: 'The goal is not just finding objects, but reducing them to centerlines after they are labeled or cleaned.',
        insteadChoose: 'Object identity is still the main missing step.',
      },
    ],
  },
  'distance-transform': {
    title: 'Distance, region ID, or skeleton?',
    description: 'These mask-analysis operators all use binary regions differently: one measures distance, one partitions, and one collapses shape to a centerline.',
    items: [
      {
        slug: 'distance-transform',
        whenToChoose: 'You need per-pixel distance to background or boundaries.',
        insteadChoose: 'The main goal is object IDs or contour thinning.',
      },
      {
        slug: 'connected-components-labeling',
        whenToChoose: 'Per-object labeling matters more than per-pixel geometry.',
        insteadChoose: 'Distance to the nearest boundary is the actual feature you need.',
      },
      {
        slug: 'skeletonization',
        whenToChoose: 'A thin centerline representation is the end product.',
        insteadChoose: 'Distance values still matter directly.',
      },
    ],
  },
  'bilinear-bicubic-interpolation': {
    title: 'Nearest, bilinear, or bicubic reconstruction',
    description: 'Interpolation determines how zoomed or transformed images are reconstructed between known samples.',
    items: [
      {
        label: 'Bilinear interpolation',
        badge: 'Current topic',
        whenToChoose: 'You want a smooth, cheap interpolation baseline for many image and texture operations.',
        insteadChoose: 'Sharper reconstruction or simpler pixel-perfect stepping is the real priority.',
      },
      {
        label: 'Bicubic interpolation',
        badge: 'Same topic',
        whenToChoose: 'You want smoother gradients and often better perceived sharpness than bilinear can provide.',
        insteadChoose: 'The extra sample cost is not worth it for the use case.',
      },
      {
        slug: 'mipmaps',
        whenToChoose: 'The problem is minification stability across scales, not just one isolated interpolation step.',
        insteadChoose: 'You are only magnifying or resampling a single image once.',
      },
    ],
  },
  'mipmaps': {
    title: 'Pick a better scale before reconstructing',
    description: 'Mipmaps solve a different problem than bilinear or bicubic interpolation: which resolution to sample from before you even start reconstructing.',
    items: [
      {
        slug: 'mipmaps',
        whenToChoose: 'Textures are being minified and aliasing or shimmer is the main concern.',
        insteadChoose: 'Only one scale is involved and reconstruction quality is the main question.',
      },
      {
        slug: 'bilinear-bicubic-interpolation',
        whenToChoose: 'The issue is how to reconstruct between samples at a chosen scale.',
        insteadChoose: 'The texture is shrinking enough that a different mip level is essential.',
      },
      {
        slug: 'taa',
        whenToChoose: 'Temporal instability survives even after spatial filtering and mip selection.',
        insteadChoose: 'The artifact is mainly static texture aliasing.',
      },
    ],
  },
  'gamma-correction': {
    title: 'Gamma, tone mapping, and equalization solve different mismatches',
    description: 'These color operators all remap values, but the mismatch they correct is different in each case.',
    items: [
      {
        slug: 'gamma-correction',
        whenToChoose: 'The issue is linear-light math vs display encoding.',
        insteadChoose: 'The main problem is dynamic range compression or contrast redistribution.',
      },
      {
        slug: 'tone-mapping',
        whenToChoose: 'HDR-like values must be compressed into a displayable range.',
        insteadChoose: 'The source already lives in a normal display range but has encoding issues.',
      },
      {
        slug: 'histogram-equalization',
        whenToChoose: 'The goal is redistributing contrast across the histogram rather than handling linear vs display space.',
        insteadChoose: 'The image pipeline is mostly about physical light response and output encoding.',
      },
    ],
  },
  'tone-mapping': {
    title: 'Compress dynamic range before polishing the result',
    description: 'Tone mapping is about fitting bright HDR-style values into a display range, not about histogram balancing or display-space encoding alone.',
    items: [
      {
        slug: 'tone-mapping',
        whenToChoose: 'The scene contains values far above normal display range and they need graceful compression.',
        insteadChoose: 'The image is already LDR and only needs contrast reshaping or gamma handling.',
      },
      {
        slug: 'gamma-correction',
        whenToChoose: 'The mismatch is between linear-light computations and display-encoded output.',
        insteadChoose: 'The scene still needs exposure compression before gamma is even relevant.',
      },
      {
        slug: 'bloom',
        whenToChoose: 'Bright highlights should visibly bleed after the main tone pipeline, not just be compressed.',
        insteadChoose: 'You still need to fit HDR values into range before adding glow.',
      },
    ],
  },
  'alpha-compositing': {
    title: 'Mixing layers is not the same as remapping colors',
    description: 'Alpha compositing combines images spatially, while gamma, tone mapping, and color-space changes remap values within one image.',
    items: [
      {
        slug: 'alpha-compositing',
        whenToChoose: 'You are layering translucent content over a background or merging render passes.',
        insteadChoose: 'The job is still remapping one image’s value distribution.',
      },
      {
        slug: 'color-spaces',
        whenToChoose: 'The problem is choosing or converting representation, not merging layers.',
        insteadChoose: 'You already have multiple layers to combine.',
      },
      {
        slug: 'bloom',
        whenToChoose: 'The glow pass already exists and now needs to be added back into the base image.',
        insteadChoose: 'There is no extra layer yet to composite.',
      },
    ],
  },
  'rasterization': {
    title: 'Rasterization vs ray marching',
    description: 'Both produce pixels, but one starts from explicit triangles and the other evaluates implicit distance fields along rays.',
    items: [
      {
        slug: 'rasterization',
        whenToChoose: 'The scene is built from explicit geometry and you want the classic real-time pipeline.',
        insteadChoose: 'Implicit surfaces or procedural distance fields are the real focus.',
      },
      {
        slug: 'ray-marching-sdf',
        whenToChoose: 'You want to render implicit shapes by stepping through a signed-distance field.',
        insteadChoose: 'Triangle coverage, interpolation, and z-buffering are the main skills to learn.',
      },
      {
        slug: 'clipping',
        whenToChoose: 'Visibility work has not even reached rasterization yet because geometry must be clipped first.',
        insteadChoose: 'Primitive coverage on screen is already the active stage.',
      },
    ],
  },
  'z-buffer': {
    title: 'Visibility after rasterization',
    description: 'Z-buffering, shadow mapping, and SSAO all rely on depth, but they use it for different visibility questions.',
    items: [
      {
        slug: 'z-buffer',
        whenToChoose: 'You need to decide which surface is visible at each screen pixel.',
        insteadChoose: 'The goal is shading shadows or ambient occlusion after visibility is already known.',
      },
      {
        slug: 'shadow-mapping',
        whenToChoose: 'Depth should be reused from the light’s point of view to cast shadows.',
        insteadChoose: 'The main missing step is still the camera-space visible surface itself.',
      },
      {
        slug: 'ssao',
        whenToChoose: 'Depth is being used to estimate local occlusion rather than front-most visibility.',
        insteadChoose: 'Primary visibility is the unresolved problem.',
      },
    ],
  },
  'ray-marching-sdf': {
    title: 'March implicit surfaces only when that representation helps',
    description: 'Ray marching is powerful for procedural implicit scenes, but it is not a replacement for every raster task.',
    items: [
      {
        slug: 'ray-marching-sdf',
        whenToChoose: 'The scene is naturally described by distance fields or procedural signed-distance operations.',
        insteadChoose: 'Explicit triangles and the standard raster pipeline are the main setting.',
      },
      {
        slug: 'rasterization',
        whenToChoose: 'You want the mainstream triangle pipeline with interpolation and depth buffering.',
        insteadChoose: 'Implicit distance estimates are the central abstraction.',
      },
      {
        slug: 'bezier-curves',
        whenToChoose: 'The focus is still geometric shape construction rather than final image synthesis from an SDF.',
        insteadChoose: 'You are ready to render those shapes through an implicit field pipeline.',
      },
    ],
  },
  'shadow-mapping': {
    title: 'Depth for visibility vs depth for lighting',
    description: 'Both z-buffering and shadow mapping use depth buffers, but one solves camera visibility and the other solves light visibility.',
    items: [
      {
        slug: 'shadow-mapping',
        whenToChoose: 'The next lighting question is whether a point is visible from the light source.',
        insteadChoose: 'Primary camera visibility is still unresolved or ambient darkening is enough.',
      },
      {
        slug: 'z-buffer',
        whenToChoose: 'You still need the front-most surface from the camera view.',
        insteadChoose: 'That surface is already known and now you want shadows.',
      },
      {
        slug: 'ssao',
        whenToChoose: 'A cheap screen-space approximation of local occlusion is enough.',
        insteadChoose: 'You need directional hard or soft shadow reasoning from a light source.',
      },
    ],
  },
  bloom: {
    title: 'Glow, dynamic range, or temporal cleanup?',
    description: 'Bloom, tone mapping, and TAA all change the final frame, but their jobs are very different.',
    items: [
      {
        slug: 'bloom',
        whenToChoose: 'Bright highlights should visibly bleed into neighboring pixels for a glow effect.',
        insteadChoose: 'The issue is fitting HDR values into range or stabilizing shimmer across frames.',
      },
      {
        slug: 'tone-mapping',
        whenToChoose: 'High dynamic range values still need to be compressed into a displayable interval.',
        insteadChoose: 'The base image is already in range and now only needs post glow.',
      },
      {
        slug: 'taa',
        whenToChoose: 'Temporal flicker and subpixel instability are the problem, not missing glow.',
        insteadChoose: 'The image is stable but lacks highlight bloom.',
      },
    ],
  },
  ssao: {
    title: 'Ambient occlusion vs hard shadowing',
    description: 'SSAO is a screen-space shading hint, not a true replacement for shadow mapping or primary depth testing.',
    items: [
      {
        slug: 'ssao',
        whenToChoose: 'You want local crevice darkening from screen-space depth alone.',
        insteadChoose: 'Directional light visibility or temporal stability matters more.',
      },
      {
        slug: 'shadow-mapping',
        whenToChoose: 'You need light-direction-aware shadows rather than contact-style ambient darkening.',
        insteadChoose: 'The scene only needs a cheap local occlusion cue.',
      },
      {
        slug: 'taa',
        whenToChoose: 'The main artifact is frame-to-frame shimmer, not missing ambient shading.',
        insteadChoose: 'Lighting depth cues are still the missing effect.',
      },
    ],
  },
  taa: {
    title: 'Temporal AA is for unstable detail, not every artifact',
    description: 'TAA stabilizes detail across frames, while mipmaps, bloom, and SSAO each solve different visual failures.',
    items: [
      {
        slug: 'taa',
        whenToChoose: 'Subpixel detail flickers across frames and temporal accumulation can stabilize it.',
        insteadChoose: 'The issue is static minification aliasing, glow, or missing occlusion.',
      },
      {
        slug: 'mipmaps',
        whenToChoose: 'Texture minification aliasing is the main source of instability.',
        insteadChoose: 'The scene still shimmers even after good spatial sampling.',
      },
      {
        slug: 'bloom',
        whenToChoose: 'Bright highlights need glow rather than temporal stabilization.',
        insteadChoose: 'Temporal instability is the visible issue.',
      },
    ],
  },
};

function dedupeTopicLinks(items: GraphicsTopicLink[]): GraphicsTopicLink[] {
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

export function getGraphicsCompareBlock(
  topicSlug: string,
  topicBySlug: Map<string, GraphicsTopicCardData>,
): GraphicsCompareBlockData | undefined {
  const definition = graphicsCompareBlocks[topicSlug];

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
        href: item.slug && item.slug !== topicSlug ? `/graphics/${item.slug}` : undefined,
        badge: item.badge ?? (item.slug === topicSlug ? 'Current topic' : linkedTopic?.familyLabel ?? 'Alternative topic'),
        whenToChoose: item.whenToChoose,
        insteadChoose: item.insteadChoose,
      } satisfies GraphicsCompareCard;
    })
    .filter((item): item is GraphicsCompareCard => Boolean(item));

  if (items.length === 0) {
    return undefined;
  }

  return {
    title: definition.title,
    description: definition.description,
    items,
  };
}

export function getGraphicsNextStepRail(
  topic: GraphicsTopicCardData,
  pathMemberships: GraphicsLearningPath[],
): GraphicsNextStepRailData {
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
    .filter((step): step is GraphicsTopicLink => Boolean(step));

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
