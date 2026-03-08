import BilateralFilterVisualization from '@/components/graphics/visualizations/BilateralFilterVisualization.svelte';
import BilinearBicubicVisualization from '@/components/graphics/visualizations/BilinearBicubicVisualization.svelte';
import BloomVisualization from '@/components/graphics/visualizations/BloomVisualization.svelte';
import BarycentricInterpolationVisualization from '@/components/graphics/visualizations/BarycentricInterpolationVisualization.svelte';
import BezierCurvesVisualization from '@/components/graphics/visualizations/BezierCurvesVisualization.svelte';
import CannyEdgeVisualization from '@/components/graphics/visualizations/CannyEdgeVisualization.svelte';
import ClippingVisualization from '@/components/graphics/visualizations/ClippingVisualization.svelte';
import ColorSpacesVisualization from '@/components/graphics/visualizations/ColorSpacesVisualization.svelte';
import ConnectedComponentsVisualization from '@/components/graphics/visualizations/ConnectedComponentsVisualization.svelte';
import DilationVisualization from '@/components/graphics/visualizations/DilationVisualization.svelte';
import DistanceTransformVisualization from '@/components/graphics/visualizations/DistanceTransformVisualization.svelte';
import DitheringVisualization from '@/components/graphics/visualizations/DitheringVisualization.svelte';
import ErosionVisualization from '@/components/graphics/visualizations/ErosionVisualization.svelte';
import FloodFillVisualization from '@/components/graphics/visualizations/FloodFillVisualization.svelte';
import GammaCorrectionVisualization from '@/components/graphics/visualizations/GammaCorrectionVisualization.svelte';
import GaussianBlurVisualization from '@/components/graphics/visualizations/GaussianBlurVisualization.svelte';
import HistogramEqualizationVisualization from '@/components/graphics/visualizations/HistogramEqualizationVisualization.svelte';
import LaplacianLogVisualization from '@/components/graphics/visualizations/LaplacianLogVisualization.svelte';
import MedianFilterVisualization from '@/components/graphics/visualizations/MedianFilterVisualization.svelte';
import MipmapsVisualization from '@/components/graphics/visualizations/MipmapsVisualization.svelte';
import OpeningClosingVisualization from '@/components/graphics/visualizations/OpeningClosingVisualization.svelte';
import RasterizationVisualization from '@/components/graphics/visualizations/RasterizationVisualization.svelte';
import RayMarchingSdfVisualization from '@/components/graphics/visualizations/RayMarchingSdfVisualization.svelte';
import ShadowMappingVisualization from '@/components/graphics/visualizations/ShadowMappingVisualization.svelte';
import SkeletonizationVisualization from '@/components/graphics/visualizations/SkeletonizationVisualization.svelte';
import SobelEdgeVisualization from '@/components/graphics/visualizations/SobelEdgeVisualization.svelte';
import SsaoVisualization from '@/components/graphics/visualizations/SsaoVisualization.svelte';
import TaaVisualization from '@/components/graphics/visualizations/TaaVisualization.svelte';
import ThresholdingVisualization from '@/components/graphics/visualizations/ThresholdingVisualization.svelte';
import ToneMappingVisualization from '@/components/graphics/visualizations/ToneMappingVisualization.svelte';
import ZBufferVisualization from '@/components/graphics/visualizations/ZBufferVisualization.svelte';
import AlphaCompositingVisualization from '@/components/graphics/visualizations/AlphaCompositingVisualization.svelte';

export const graphicsVisualizations = {
  AlphaCompositingVisualization,
  BarycentricInterpolationVisualization,
  BilateralFilterVisualization,
  BilinearBicubicVisualization,
  BloomVisualization,
  CannyEdgeVisualization,
  ClippingVisualization,
  ColorSpacesVisualization,
  ConnectedComponentsVisualization,
  DilationVisualization,
  DistanceTransformVisualization,
  DitheringVisualization,
  ErosionVisualization,
  FloodFillVisualization,
  GammaCorrectionVisualization,
  GaussianBlurVisualization,
  HistogramEqualizationVisualization,
  LaplacianLogVisualization,
  MedianFilterVisualization,
  MipmapsVisualization,
  OpeningClosingVisualization,
  RasterizationVisualization,
  RayMarchingSdfVisualization,
  ShadowMappingVisualization,
  SkeletonizationVisualization,
  SobelEdgeVisualization,
  SsaoVisualization,
  TaaVisualization,
  ThresholdingVisualization,
  ToneMappingVisualization,
  ZBufferVisualization,
} as const;

export type GraphicsVisualizationName = keyof typeof graphicsVisualizations;
