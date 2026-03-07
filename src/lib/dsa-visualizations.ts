import AhoCorasickVisualization from '@/components/dsa/visualizations/AhoCorasickVisualization.svelte';
import BacktrackingVisualization from '@/components/dsa/visualizations/BacktrackingVisualization.svelte';
import BfsVisualization from '@/components/dsa/visualizations/BfsVisualization.svelte';
import BinaryLiftingVisualization from '@/components/dsa/visualizations/BinaryLiftingVisualization.svelte';
import BinarySearchVisualization from '@/components/dsa/visualizations/BinarySearchVisualization.svelte';
import BitManipulationVisualization from '@/components/dsa/visualizations/BitManipulationVisualization.svelte';
import BstVisualization from '@/components/dsa/visualizations/BstVisualization.svelte';
import DequeVisualization from '@/components/dsa/visualizations/DequeVisualization.svelte';
import DifferenceArrayVisualization from '@/components/dsa/visualizations/DifferenceArrayVisualization.svelte';
import DfsVisualization from '@/components/dsa/visualizations/DfsVisualization.svelte';
import DijkstraVisualization from '@/components/dsa/visualizations/DijkstraVisualization.svelte';
import DpVisualization from '@/components/dsa/visualizations/DpVisualization.svelte';
import EulerTourVisualization from '@/components/dsa/visualizations/EulerTourVisualization.svelte';
import FenwickTreeVisualization from '@/components/dsa/visualizations/FenwickTreeVisualization.svelte';
import GraphFundamentalsVisualization from '@/components/dsa/visualizations/GraphFundamentalsVisualization.svelte';
import GreedyVisualization from '@/components/dsa/visualizations/GreedyVisualization.svelte';
import HashMapVisualization from '@/components/dsa/visualizations/HashMapVisualization.svelte';
import HeapVisualization from '@/components/dsa/visualizations/HeapVisualization.svelte';
import KmpVisualization from '@/components/dsa/visualizations/KmpVisualization.svelte';
import LinkedListVisualization from '@/components/dsa/visualizations/LinkedListVisualization.svelte';
import LowestCommonAncestorVisualization from '@/components/dsa/visualizations/LowestCommonAncestorVisualization.svelte';
import MergeSortVisualization from '@/components/dsa/visualizations/MergeSortVisualization.svelte';
import MonotonicQueueVisualization from '@/components/dsa/visualizations/MonotonicQueueVisualization.svelte';
import MonotonicStackVisualization from '@/components/dsa/visualizations/MonotonicStackVisualization.svelte';
import MstVisualization from '@/components/dsa/visualizations/MstVisualization.svelte';
import PrefixSumVisualization from '@/components/dsa/visualizations/PrefixSumVisualization.svelte';
import QueueVisualization from '@/components/dsa/visualizations/QueueVisualization.svelte';
import QuickSortVisualization from '@/components/dsa/visualizations/QuickSortVisualization.svelte';
import SegmentTreeVisualization from '@/components/dsa/visualizations/SegmentTreeVisualization.svelte';
import SparseTableVisualization from '@/components/dsa/visualizations/SparseTableVisualization.svelte';
import TopoSortVisualization from '@/components/dsa/visualizations/TopoSortVisualization.svelte';
import TreeFundamentalsVisualization from '@/components/dsa/visualizations/TreeFundamentalsVisualization.svelte';
import TreapVisualization from '@/components/dsa/visualizations/TreapVisualization.svelte';
import TrieVisualization from '@/components/dsa/visualizations/TrieVisualization.svelte';
import TwoPointersVisualization from '@/components/dsa/visualizations/TwoPointersVisualization.svelte';
import UnionFindVisualization from '@/components/dsa/visualizations/UnionFindVisualization.svelte';
import ZAlgorithmVisualization from '@/components/dsa/visualizations/ZAlgorithmVisualization.svelte';
import ZeroOneBfsVisualization from '@/components/dsa/visualizations/ZeroOneBfsVisualization.svelte';

export const dsaVisualizations = {
  AhoCorasickVisualization,
  BacktrackingVisualization,
  BfsVisualization,
  BinaryLiftingVisualization,
  BinarySearchVisualization,
  BitManipulationVisualization,
  BstVisualization,
  DequeVisualization,
  DifferenceArrayVisualization,
  DfsVisualization,
  DijkstraVisualization,
  DpVisualization,
  EulerTourVisualization,
  FenwickTreeVisualization,
  GraphFundamentalsVisualization,
  GreedyVisualization,
  HashMapVisualization,
  HeapVisualization,
  KmpVisualization,
  LinkedListVisualization,
  LowestCommonAncestorVisualization,
  MergeSortVisualization,
  MonotonicQueueVisualization,
  MonotonicStackVisualization,
  MstVisualization,
  PrefixSumVisualization,
  QueueVisualization,
  QuickSortVisualization,
  SegmentTreeVisualization,
  SparseTableVisualization,
  TopoSortVisualization,
  TreeFundamentalsVisualization,
  TreapVisualization,
  TrieVisualization,
  TwoPointersVisualization,
  UnionFindVisualization,
  ZAlgorithmVisualization,
  ZeroOneBfsVisualization,
} as const;

export type DsaVisualizationName = keyof typeof dsaVisualizations;
