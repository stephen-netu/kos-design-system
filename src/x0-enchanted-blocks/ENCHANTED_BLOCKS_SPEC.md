# Enchanted Blocks — Unified Spatial Content System

## Problem Statement

Three KOS apps hit the same wall: **content doesn't fit**, and **enrichment is one-way**.

- **Ryu**: Task descriptions, daemon logs, and epistemic assay results overflow their containers. We gave up on rich task content.
- **Atelier**: Notes can't display KVE bidirectional enrichment. The canvas is static, not living.
- **Nodepad** (external research): Proved spatial research works—auto-classification, inferred connections, synthesis emergence—but we never integrated it.

## Core Insight

Content fitting is a **measurement problem**. Enrichment is a **rendering problem**. Both need:
1. **Deterministic text layout** without DOM reflow (Pretext)
2. **Adaptive card sizing** that grows/shrinks with content
3. **Bidirectional value flow** between cards and the KVE
4. **Three canonical views** for different cognitive modes

## Architecture

### New Module: `x0-enchanted-blocks`

Location: `LEAP/design-system/src/x0-enchanted-blocks/`

Exports:
- `EnchantedBlock` — adaptive card component
- `EnchantedCanvas` — spatial canvas with three view modes
- `useBlockEnrichment` — KVE bidirectional hook
- `BlockClassifier` — auto-type detection (14 types from nodepad)
- `SynthesisEngine` — emergent bridging sentences

### 1. Adaptive Block Sizing (Pretext Integration)

```typescript
// block-layout.ts — DOM-free measurement
import { prepare, layout } from '@chenglou/pretext';

export interface BlockMetrics {
  minWidth: number;      // shrink-wrap width
  idealWidth: number;    // optimal reading width (~65ch)
  height: number;        // measured at target width
  lineCount: number;     // for virtualization
  hasOverflow: boolean;  // content exceeds max constraints
}

export function measureBlock(
  content: string,
  font: string,
  maxWidth: number,
  options?: { whiteSpace?: 'normal' | 'pre-wrap'; wordBreak?: 'normal' | 'keep-all' }
): BlockMetrics {
  const prepared = prepare(content, font, options);
  const { height, lineCount } = layout(prepared, maxWidth, 1.6 /* lineHeight */);
  
  // Shrink-wrap: find tightest width that doesn't increase line count
  const minWidth = measureNaturalWidth(prepared);
  
  return { minWidth, idealWidth: Math.min(520, maxWidth), height, lineCount, hasOverflow: height > 400 };
}
```

**Used by:**
- `EnchantedBlock.svelte` — auto-height cards with overflow indicators
- `VirtualCanvas.svelte` — accurate scrollbar/track sizing
- `KanbanColumn.svelte` — column height pre-calculation

### 2. The 14 Block Types (Nodepad Classification)

```typescript
export type BlockType =
  | 'claim'        // Asserted truth
  | 'question'     // Open inquiry
  | 'idea'         // Proposed concept
  | 'task'         // Action item (Ryu integration)
  | 'entity'       // Named thing (person, org, concept)
  | 'quote'        // External citation
  | 'reference'    // Link/pointer
  | 'definition'   // Term explanation
  | 'opinion'      // Subjective stance
  | 'reflection'   // Self-aware musing
  | 'narrative'    // Story/time sequence
  | 'comparison'   // Side-by-side analysis
  | 'thesis'       // Synthesized position
  | 'general';     // Unclassified

export interface EnchantedBlockData {
  id: string;
  type: BlockType;
  content: string;           // Raw user input
  annotation?: string;       // AI enrichment (what the note doesn't say)
  provenance: ProvenanceChain; // From Ryu's epistemic system
  connections: BlockConnection[]; // Inferred from content + KVE
  createdAt: number;
  modifiedAt: number;
  // Spatial state (canvas view)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}
```

**Visual encoding:**
- Color border by type (brass/copper palette)
- Icon badge (top-left)
- Annotation appears on hover/focus (subtle expansion)
- Connections shown as faint lines (opacity ∝ relevance)

### 3. Three Canonical Views

```typescript
export type CanvasView = 'tiling' | 'kanban' | 'graph';

// Tiling: BSP spatial layout (ZoneTiler)
// - Blocks auto-size to content
// - Drag dividers to resize zones
// - Blocks reflow within zones

// Kanban: Columnar by type
// - Columns: [Unsorted | Claim | Question | Idea | Task | ...]
// - Drag between columns = reclassify
// - Column height = sum of measured block heights

// Graph: Force-directed (N3 Force Graph)
// - Nodes = blocks (sized by content)
// - Edges = inferred connections
// - Synthesis nodes emerge at high centrality
```

### 4. Bidirectional KVE Enrichment

```typescript
// useBlockEnrichment.ts — Svelte 5 runes
import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext';

export function useBlockEnrichment(blockId: string) {
  const enrichment = $state<EnrichmentState>({ status: 'idle' });
  
  // Outbound: Block content → KVE
  async function contributeToKVE(content: string, type: BlockType) {
    enrichment.status = 'contributing';
    await ryu_knowledge_ingest({ 
      content, 
      type, 
      provenance: { source: 'atelier', blockId } 
    });
    enrichment.status = 'idle';
  }
  
  // Inbound: KVE → Block annotation
  async function fetchEnrichment(content: string) {
    enrichment.status = 'enriching';
    const result = await ryu_knowledge_epistemic_detail({ content });
    
    // Annotation = "something the note doesn't already say"
    enrichment.annotation = result.insights
      .filter(i => !content.toLowerCase().includes(i.text.toLowerCase()))
      .map(i => i.text)
      .join(' · ');
    
    // Inferred connections to other blocks
    enrichment.connections = result.related.map(r => ({
      targetId: r.blockId,
      strength: r.relevance,
      type: r.relationType // 'supports', 'contradicts', 'extends', 'similar'
    }));
    
    enrichment.status = 'idle';
  }
  
  return { enrichment, contributeToKVE, fetchEnrichment };
}
```

### 5. Synthesis Emergence

When enough blocks accumulate (threshold: 5+ with connection density > 0.3), the canvas offers a **synthesis**:

```typescript
export interface Synthesis {
  id: string;
  type: 'thesis';
  content: string; // Single sentence bridging tensions
  bridges: string[]; // Block IDs that this synthesizes
  confidence: number;
}

// Triggered by: canvas block count change + connection density check
// Source: ryu_think({ context: blockIds, mode: 'synthesize' })
// Presentation: Floating pill at canvas center, dismissable
// Solidify: Click → creates new 'thesis' block, auto-connected to bridged blocks
```

### 6. Component: EnchantedBlock

```svelte
<!-- EnchantedBlock.svelte -->
<script lang="ts">
  import { measureBlock } from './block-layout.js';
  import { useBlockEnrichment } from './useBlockEnrichment.svelte.js';
  
  interface Props {
    block: EnchantedBlockData;
    editable?: boolean;
    maxWidth?: number;
    onChange?: (block: EnchantedBlockData) => void;
    onTypeChange?: (type: BlockType) => void;
  }
  
  let { block, editable = false, maxWidth = 400, onChange, onTypeChange }: Props = $props();
  
  // DOM-free measurement
  const metrics = $derived(measureBlock(
    block.content,
    '14px "Sovereign Sans"',
    maxWidth,
    { whiteSpace: 'pre-wrap' }
  ));
  
  // KVE enrichment
  const { enrichment, contributeToKVE, fetchEnrichment } = useBlockEnrichment(block.id);
  
  // Debounced enrichment on content change
  $effect(() => {
    if (block.content.length > 10) {
      const timer = setTimeout(() => fetchEnrichment(block.content), 500);
      return () => clearTimeout(timer);
    }
  });
  
  let isEditing = $state(false);
  let isExpanded = $state(false);
</script>

<div 
  class="enchanted-block type-{block.type}"
  style:width="{metrics.idealWidth}px"
  style:min-height="{Math.min(metrics.height, 200)}px"
  class:expanded={isExpanded}
  class:has-annotation={!!enrichment.annotation}
>
  <!-- Type badge (click to reclassify) -->
  <button class="type-badge" onclick={() => onTypeChange?.(nextType(block.type))}>
    <Icon name={typeIcons[block.type]} />
    <span class="type-label">{block.type}</span>
  </button>
  
  <!-- Content -->
  {#if isEditing}
    <div 
      contenteditable="true"
      class="block-content editable"
      bind:innerText={block.content}
      onblur={() => { isEditing = false; contributeToKVE(block.content, block.type); }}
    />
  {:else}
    <div 
      class="block-content"
      ondblclick={() => editable && (isEditing = true)}
    >
      {@html renderMarkdown(block.content)}
    </div>
  {/if}
  
  <!-- Annotation (appears on hover/focus) -->
  {#if enrichment.annotation}
    <div class="annotation" class:visible={isExpanded}>
      <Icon name="Sparkles" />
      <span>{enrichment.annotation}</span>
    </div>
  {/if}
  
  <!-- Overflow indicator -->
  {#if metrics.hasOverflow}
    <button class="expand-hint" onclick={() => isExpanded = !isExpanded}>
      {isExpanded ? 'Collapse' : 'Expand'} ({metrics.lineCount} lines)
    </button>
  {/if}
  
  <!-- Connection handles (graph view only) -->
  <div class="connection-handles">
    {#each enrichment.connections as conn}
      <div class="connection-handle" style="--strength: {conn.strength}">
        <Icon name={relationIcons[conn.type]} />
      </div>
    {/each}
  </div>
</div>

<style>
  .enchanted-block {
    position: relative;
    background: var(--color-bg-elevated, #2a2a2a);
    border-left: 3px solid var(--type-color, #b87333);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-3, 12px);
    transition: all 0.2s ease;
  }
  
  .type-claim { --type-color: #d4943a; }
  .type-question { --type-color: #6b8ce6; }
  .type-idea { --type-color: #7cb97a; }
  .type-task { --type-color: #b87333; }
  /* ... etc for all 14 types */
  
  .annotation {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;
    font-size: var(--text-xs, 11px);
    color: var(--color-text-muted, #a09880);
    font-style: italic;
  }
  
  .enchanted-block:hover .annotation,
  .annotation.visible {
    opacity: 1;
    max-height: 100px;
    margin-top: var(--space-2, 8px);
  }
  
  .expanded {
    max-height: none;
  }
</style>
```

## Integration Points

### Ryu Tasks

Current: Task list with truncated descriptions.

With Enchanted Blocks:
- Tasks become `type: 'task'` blocks
- Full descriptions visible via measured height
- Epistemic assay results shown as annotations
- Task connections = dependencies (inferred from content)

### Atelier Notes

Current: Static markdown notes.

With Enchanted Blocks:
- Notes auto-classify into 14 types
- KVE enrichment appears as annotations
- Bidirectional: notes contribute to KVE, KVE enriches notes
- Three views: tiling (BSP), kanban (by type), graph (connections)

### BlockWriter

Current: Visual block-based writing with BSP zones.

With Enchanted Blocks:
- Each writing block is an EnchantedBlock
- Content measurement prevents overflow
- Synthesis emerges from connected blocks
- Export to thesis/node with full provenance

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Add `@chenglou/pretext` dependency to design-system
- [ ] Create `block-layout.ts` with measurement primitives
- [ ] Create `EnchantedBlock.svelte` with auto-sizing

### Phase 2: Classification (Week 2)
- [ ] Implement 14-type classifier (local regex + LLM fallback)
- [ ] Type badge UI with click-to-reclassify
- [ ] Color palette per type (brass/copper variants)

### Phase 3: Enrichment (Week 3)
- [ ] `useBlockEnrichment` hook with KVE integration
- [ ] Annotation display (hover/focus expansion)
- [ ] Connection inference from `ryu_knowledge_epistemic_detail`

### Phase 4: Canvas (Week 4)
- [ ] `EnchantedCanvas.svelte` with three view modes
- [ ] Tiling: integrate with existing ZoneTiler
- [ ] Kanban: columnar layout with drag-to-reclassify
- [ ] Graph: integrate with N3 Force Graph

### Phase 5: Synthesis (Week 5)
- [ ] Synthesis engine (density detection + `ryu_think`)
- [ ] Floating thesis pill UI
- [ ] Solidify flow (thesis block creation)

## File Structure

```
src/x0-enchanted-blocks/
├── index.ts                          # Public exports
├── ENCHANTED_BLOCKS_SPEC.md          # This document
├── 
├── core/
│   ├── block-layout.ts               # Pretext measurement
│   ├── block-types.ts                # 14 types + icons
│   ├── classifier.ts                 # Auto-type detection
│   └── synthesis.ts                  # Emergence detection
│
├── components/
│   ├── EnchantedBlock.svelte         # Adaptive card
│   ├── EnchantedCanvas.svelte        # Three-view canvas
│   ├── TypeBadge.svelte              # Clickable type indicator
│   ├── Annotation.svelte             # Enrichment display
│   └── ConnectionLine.svelte         # SVG connection
│
├── hooks/
│   └── useBlockEnrichment.svelte.ts  # KVE bidirectional
│
└── views/
    ├── TilingView.svelte             # BSP spatial (ZoneTiler)
    ├── KanbanView.svelte             # Columnar by type
    └── GraphView.svelte              # Force-directed (N3)
```

## Dependencies

```json
{
  "dependencies": {
    "@chenglou/pretext": "^1.0.0"
  },
  "peerDependencies": {
    "svelte": "^5.0.0"
  }
}
```

## Success Metrics

1. **No overflow**: 100% of blocks display full content without truncation
2. **Enrichment coverage**: 80%+ of blocks have KVE annotations within 2s of edit
3. **Synthesis quality**: User accepts 50%+ of suggested thesis statements
4. **View switching**: <100ms to switch between tiling/kanban/graph
5. **Measurement speed**: <16ms for blocks up to 1000 characters

## KVE Integration Commands

Leverages existing Ryu commands:
- `ryu_knowledge_ingest` — outbound contribution
- `ryu_knowledge_epistemic_detail` — inbound enrichment
- `ryu_think` — synthesis generation
- `ryu_knowledge_provenance_chain` — provenance display

## Open Questions

1. Should synthesis be automatic or user-triggered?
2. How to handle very long content (>10k chars) in blocks?
3. Should connections be editable or purely inferred?
4. Export format: `.nodepad` JSON, `.md`, or KOS-native?

---

*Spec version: 2026-04-09*
*Status: Draft for review*
