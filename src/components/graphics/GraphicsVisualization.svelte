<script lang="ts">
  import { graphicsVisualizations, type GraphicsVisualizationName } from '@/lib/graphics-visualizations';

  export let name: GraphicsVisualizationName | undefined;

  $: Visualization = name ? graphicsVisualizations[name] : undefined;
</script>

{#if Visualization}
  <svelte:component this={Visualization} />
{/if}
