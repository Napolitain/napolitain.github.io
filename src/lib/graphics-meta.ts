import {
  dsaDifficultyMeta,
  dsaDifficultyValues,
  dsaKindMeta,
  type DsaDifficultyId,
} from './dsa-meta';

export const graphicsFamilyValues = [
  'foundations',
  'filtering',
  'analysis',
  'morphology',
  'sampling',
  'color',
  'geometry',
  'rendering',
  'lighting',
  'post-processing',
] as const;

export type GraphicsFamilyId = typeof graphicsFamilyValues[number];
export const graphicsKindValues = [
  'concept',
  'algorithm',
  'technique',
] as const;

export type GraphicsKindId = typeof graphicsKindValues[number];
export type GraphicsDifficultyId = DsaDifficultyId;

export const graphicsKindMeta: Record<GraphicsKindId, { label: string; order: number }> = {
  concept: dsaKindMeta.concept,
  algorithm: dsaKindMeta.algorithm,
  technique: dsaKindMeta.technique,
};
export const graphicsDifficultyValues = dsaDifficultyValues;
export const graphicsDifficultyMeta = dsaDifficultyMeta;

export const graphicsFamilies: Record<GraphicsFamilyId, {
  label: string;
  description: string;
  parentId?: GraphicsFamilyId;
  order: number;
}> = {
  foundations: {
    label: 'Foundations',
    description: 'Pixels, neighborhoods, masks, and the mental model behind local image-processing operators.',
    order: 0,
  },
  filtering: {
    label: 'Filtering & convolution',
    description: 'Neighborhood sampling, blur kernels, and other continuous-image transforms.',
    parentId: 'foundations',
    order: 1,
  },
  analysis: {
    label: 'Segmentation & edges',
    description: 'Turn raw pixels into masks, boundaries, and simpler structural signals.',
    parentId: 'foundations',
    order: 2,
  },
  morphology: {
    label: 'Morphology',
    description: 'Binary-mask operators such as dilation, erosion, opening, and closing.',
    parentId: 'analysis',
    order: 3,
  },
  sampling: {
    label: 'Sampling & reconstruction',
    description: 'Resampling images, choosing mip levels, and reconstructing signals across scales.',
    order: 4,
  },
  color: {
    label: 'Color & tone',
    description: 'Color spaces, gamma, tone mapping, compositing, and distribution-aware image remapping.',
    order: 5,
  },
  geometry: {
    label: 'Geometry & curves',
    description: 'Clip shapes, interpolate across primitives, and reason about parametric geometry.',
    order: 6,
  },
  rendering: {
    label: 'Rendering pipeline',
    description: 'Rasterization, visibility, and alternate image synthesis strategies such as ray marching.',
    order: 7,
  },
  lighting: {
    label: 'Lighting & visibility',
    description: 'Shadowing, occlusion, and how scene depth influences shading decisions.',
    parentId: 'rendering',
    order: 8,
  },
  'post-processing': {
    label: 'Post-processing',
    description: 'Full-frame effects such as bloom and temporal anti-aliasing layered after base rendering.',
    parentId: 'rendering',
    order: 9,
  },
};

export function getGraphicsFamilyTrail(familyId: GraphicsFamilyId): GraphicsFamilyId[] {
  const trail: GraphicsFamilyId[] = [familyId];
  let current = graphicsFamilies[familyId].parentId;

  while (current) {
    trail.unshift(current);
    current = graphicsFamilies[current].parentId;
  }

  return trail;
}

export function getGraphicsFamilyDescendantIds(familyId: GraphicsFamilyId): GraphicsFamilyId[] {
  return graphicsFamilyValues.filter(candidate => getGraphicsFamilyTrail(candidate).includes(familyId));
}
