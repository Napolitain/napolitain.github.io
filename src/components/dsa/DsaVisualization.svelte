<script lang="ts">
  import { dsaVisualizations, type DsaVisualizationName } from '@/lib/dsa-visualizations';

  export let name: DsaVisualizationName | undefined;

  $: Visualization = name ? dsaVisualizations[name] : undefined;
</script>

{#if Visualization}
  <svelte:component this={Visualization} />
{/if}
