import AhoCorasickVisualization from '@/components/dsa/visualizations/AhoCorasickVisualization.svelte';
import BacktrackingVisualization from '@/components/dsa/visualizations/BacktrackingVisualization.svelte';
import BfsVisualization from '@/components/dsa/visualizations/BfsVisualization.svelte';
import BinaryLiftingVisualization from '@/components/dsa/visualizations/BinaryLiftingVisualization.svelte';
import BinarySearchVisualization from '@/components/dsa/visualizations/BinarySearchVisualization.svelte';
import BloomCuckooVisualization from '@/components/dsa/visualizations/BloomCuckooVisualization.svelte';
import BPlusTreeVisualization from '@/components/dsa/visualizations/BPlusTreeVisualization.svelte';
import BTreeVisualization from '@/components/dsa/visualizations/BTreeVisualization.svelte';
import BitManipulationVisualization from '@/components/dsa/visualizations/BitManipulationVisualization.svelte';
import BridgesArticulationVisualization from '@/components/dsa/visualizations/BridgesArticulationVisualization.svelte';
import BstVisualization from '@/components/dsa/visualizations/BstVisualization.svelte';
import CacheEvictionVisualization from '@/components/dsa/visualizations/CacheEvictionVisualization.svelte';
import ConsistentHashingVisualization from '@/components/dsa/visualizations/ConsistentHashingVisualization.svelte';
import ConvexHullTrickVisualization from '@/components/dsa/visualizations/ConvexHullTrickVisualization.svelte';
import CountMinSketchVisualization from '@/components/dsa/visualizations/CountMinSketchVisualization.svelte';
import DequeVisualization from '@/components/dsa/visualizations/DequeVisualization.svelte';
import DifferenceArrayVisualization from '@/components/dsa/visualizations/DifferenceArrayVisualization.svelte';
import DfsVisualization from '@/components/dsa/visualizations/DfsVisualization.svelte';
import DijkstraVisualization from '@/components/dsa/visualizations/DijkstraVisualization.svelte';
import DpVisualization from '@/components/dsa/visualizations/DpVisualization.svelte';
import DsuRollbackVisualization from '@/components/dsa/visualizations/DsuRollbackVisualization.svelte';
import EulerTourVisualization from '@/components/dsa/visualizations/EulerTourVisualization.svelte';
import EulerianPathVisualization from '@/components/dsa/visualizations/EulerianPathVisualization.svelte';
import ExternalMergeSortVisualization from '@/components/dsa/visualizations/ExternalMergeSortVisualization.svelte';
import FenwickTreeVisualization from '@/components/dsa/visualizations/FenwickTreeVisualization.svelte';
import FloydWarshallVisualization from '@/components/dsa/visualizations/FloydWarshallVisualization.svelte';
import GraphFundamentalsVisualization from '@/components/dsa/visualizations/GraphFundamentalsVisualization.svelte';
import GreedyVisualization from '@/components/dsa/visualizations/GreedyVisualization.svelte';
import HashMapVisualization from '@/components/dsa/visualizations/HashMapVisualization.svelte';
import HashMergeJoinVisualization from '@/components/dsa/visualizations/HashMergeJoinVisualization.svelte';
import HeavyLightDecompositionVisualization from '@/components/dsa/visualizations/HeavyLightDecompositionVisualization.svelte';
import HeapVisualization from '@/components/dsa/visualizations/HeapVisualization.svelte';
import HyperLogLogVisualization from '@/components/dsa/visualizations/HyperLogLogVisualization.svelte';
import KmpVisualization from '@/components/dsa/visualizations/KmpVisualization.svelte';
import LiChaoTreeVisualization from '@/components/dsa/visualizations/LiChaoTreeVisualization.svelte';
import LinkedListVisualization from '@/components/dsa/visualizations/LinkedListVisualization.svelte';
import LowestCommonAncestorVisualization from '@/components/dsa/visualizations/LowestCommonAncestorVisualization.svelte';
import LsmTreeVisualization from '@/components/dsa/visualizations/LsmTreeVisualization.svelte';
import MergeSortVisualization from '@/components/dsa/visualizations/MergeSortVisualization.svelte';
import ManacherVisualization from '@/components/dsa/visualizations/ManacherVisualization.svelte';
import MosAlgorithmVisualization from '@/components/dsa/visualizations/MosAlgorithmVisualization.svelte';
import MonotonicQueueVisualization from '@/components/dsa/visualizations/MonotonicQueueVisualization.svelte';
import MonotonicStackVisualization from '@/components/dsa/visualizations/MonotonicStackVisualization.svelte';
import MstVisualization from '@/components/dsa/visualizations/MstVisualization.svelte';
import PersistentSegmentTreeVisualization from '@/components/dsa/visualizations/PersistentSegmentTreeVisualization.svelte';
import PrefixSumVisualization from '@/components/dsa/visualizations/PrefixSumVisualization.svelte';
import QueueVisualization from '@/components/dsa/visualizations/QueueVisualization.svelte';
import QuickSortVisualization from '@/components/dsa/visualizations/QuickSortVisualization.svelte';
import RabinKarpVisualization from '@/components/dsa/visualizations/RabinKarpVisualization.svelte';
import SegmentTreeVisualization from '@/components/dsa/visualizations/SegmentTreeVisualization.svelte';
import SkipListVisualization from '@/components/dsa/visualizations/SkipListVisualization.svelte';
import SparseTableVisualization from '@/components/dsa/visualizations/SparseTableVisualization.svelte';
import SuffixArrayVisualization from '@/components/dsa/visualizations/SuffixArrayVisualization.svelte';
import SuffixAutomatonVisualization from '@/components/dsa/visualizations/SuffixAutomatonVisualization.svelte';
import TarjanSccVisualization from '@/components/dsa/visualizations/TarjanSccVisualization.svelte';
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
  BloomCuckooVisualization,
  BPlusTreeVisualization,
  BTreeVisualization,
  BitManipulationVisualization,
  BridgesArticulationVisualization,
  BstVisualization,
  CacheEvictionVisualization,
  ConsistentHashingVisualization,
  ConvexHullTrickVisualization,
  CountMinSketchVisualization,
  DequeVisualization,
  DifferenceArrayVisualization,
  DfsVisualization,
  DijkstraVisualization,
  DpVisualization,
  DsuRollbackVisualization,
  EulerTourVisualization,
  EulerianPathVisualization,
  ExternalMergeSortVisualization,
  FenwickTreeVisualization,
  FloydWarshallVisualization,
  GraphFundamentalsVisualization,
  GreedyVisualization,
  HashMapVisualization,
  HashMergeJoinVisualization,
  HeavyLightDecompositionVisualization,
  HeapVisualization,
  HyperLogLogVisualization,
  KmpVisualization,
  LiChaoTreeVisualization,
  LinkedListVisualization,
  LowestCommonAncestorVisualization,
  LsmTreeVisualization,
  ManacherVisualization,
  MergeSortVisualization,
  MosAlgorithmVisualization,
  MonotonicQueueVisualization,
  MonotonicStackVisualization,
  MstVisualization,
  PersistentSegmentTreeVisualization,
  PrefixSumVisualization,
  QueueVisualization,
  QuickSortVisualization,
  RabinKarpVisualization,
  SegmentTreeVisualization,
  SkipListVisualization,
  SparseTableVisualization,
  SuffixArrayVisualization,
  SuffixAutomatonVisualization,
  TarjanSccVisualization,
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
