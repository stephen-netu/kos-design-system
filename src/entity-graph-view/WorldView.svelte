<script lang="ts">
  import type { WorldSnapshot, EntityFilter } from './types';
  import { snapshotToGraphSchema, snapshotToMetrics, snapshotToTimeline, entityStateStr, filterEntities } from './types';
  import type { GraphSchema } from '../n0-node-graph/types';
  import type { Tab } from '../u0-primitives/tabs/tabs-types';
  import type { MetricCardProps, TimelineEntry } from '../d0-data-viz/types';
  import GraphEditor from '../n0-node-graph/GraphEditor.svelte';
  import MetricCard from '../d0-data-viz/MetricCard.svelte';
  import Timeline from '../d0-data-viz/Timeline.svelte';
  import Tabs from '../u0-primitives/tabs/Tabs.svelte';

  interface WorldViewProps {
    snapshot: WorldSnapshot;
    filter?: EntityFilter;
    readonly?: boolean;
    'aria-label'?: string;
  }

  let {
    snapshot,
    filter,
    readonly = false,
    'aria-label': ariaLabel = 'Entity Graph View',
  }: WorldViewProps = $props();

  // Derived data for visualizations
  let graphSchema = $derived(snapshotToGraphSchema(snapshot));
  let metrics = $derived(snapshotToMetrics(snapshot));
  let timelineEntries = $derived(snapshotToTimeline(snapshot));

  // Filtered entity/edge counts
  let entityCount = $derived(
    filter
      ? filterEntities(Object.values(snapshot.entities), filter).length
      : Object.keys(snapshot.entities).length
  );
  let edgeCount = $derived(Object.keys(snapshot.edges).length);

  // Tab configuration — MUST be $derived so labels react to count changes
  let tabs = $derived<Tab[]>([
    { id: 'graph', label: `Graph (${entityCount})` },
    { id: 'metrics', label: `Metrics (${metrics.length})` },
    { id: 'timeline', label: `Timeline (${timelineEntries.length})` },
  ]);
  let activeTab = $state('graph');
</script>

<div class="entity-graph-view" role="region" aria-label={ariaLabel}>
  <div class="entity-graph-view__header">
    <h2 class="entity-graph-view__title">
      Entity Graph
      <span class="entity-graph-view__sequence">#{snapshot.sequence}</span>
    </h2>
    <div class="entity-graph-view__stats">
      <span class="entity-graph-view__stat">{entityCount} entities</span>
      <span class="entity-graph-view__stat">{edgeCount} edges</span>
    </div>
  </div>

  <Tabs {tabs} bind:activeId={activeTab} />

  <div class="entity-graph-view__content">
    {#if activeTab === 'graph'}
      <div class="entity-graph-view__graph">
        <GraphEditor
          schema={graphSchema}
          readonly={readonly}
          snapToGrid={false}
        />
      </div>
    {:else if activeTab === 'metrics'}
      <div class="entity-graph-view__metrics">
        {#if metrics.length === 0}
          <p class="entity-graph-view__empty">No scalar metrics available</p>
        {:else}
          <div class="entity-graph-view__metrics-grid">
            {#each metrics as metric (metric.label)}
              <MetricCard {...metric} />
            {/each}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'timeline'}
      <div class="entity-graph-view__timeline">
        {#if timelineEntries.length === 0}
          <p class="entity-graph-view__empty">No state transitions recorded</p>
        {:else}
          <Timeline entries={timelineEntries} orientation="vertical" />
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .entity-graph-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 400px;
    background: var(--color-surface, #1a1a1a);
    border-radius: var(--radius-lg, 8px);
    overflow: hidden;
  }

  .entity-graph-view__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-default, #333);
  }

  .entity-graph-view__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary, #e5e5e5);
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .entity-graph-view__sequence {
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-secondary, #888);
  }

  .entity-graph-view__stats {
    display: flex;
    gap: 16px;
  }

  .entity-graph-view__stat {
    font-size: 13px;
    color: var(--color-text-secondary, #888);
  }

  .entity-graph-view__content {
    flex: 1;
    overflow: auto;
    padding: 16px;
  }

  .entity-graph-view__graph {
    height: 100%;
    min-height: 300px;
  }

  .entity-graph-view__metrics {
    padding: 8px;
  }

  .entity-graph-view__metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .entity-graph-view__timeline {
    padding: 8px;
  }

  .entity-graph-view__empty {
    color: var(--color-text-secondary, #888);
    font-size: 14px;
    text-align: center;
    padding: 40px;
  }
</style>
