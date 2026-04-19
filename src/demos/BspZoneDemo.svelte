<script lang="ts">
  // BSP Zone Demo — Working ZoneTiler with NodepadBlock content
  // Demonstrates: h/j/k/l navigation, Ctrl+Shift+H/V splitting, draggable dividers
  
  import ZoneTiler from '../spatial/ZoneTiler.svelte';
  import NodepadBlock from '../x0-enchanted-blocks/components/NodepadBlock.svelte';
  import { createDefaultBsp, splitZone, type BspNode, type ZoneLeaf, type ZoneRect, type SplitDirection } from '../spatial';
  import type { EnchantedBlockData, BlockType } from '../x0-enchanted-blocks';
  
  // Generate content for zones — 16+ varied contents
  function generateContent(id: number): EnchantedBlockData {
    const types: BlockType[] = ['task', 'idea', 'question', 'claim', 'reference', 'definition'];
    const short = ['Short task.', 'Quick note.', 'Todo item.', 'Done.', 'Idea spark.', 'Reference link.'];
    const medium = [
      'Medium complexity note that demonstrates how cards flow within a zone.',
      'Research on spatial canvas patterns and BSP tiling.',
      'Key insight: ZoneTiler creates clean divisions.',
      'Amethyst window manager approach to tiling.',
      'Nodepad natural flow concept adaptation.',
      'How do we measure content with Pretext?',
    ];
    const long = [
      'How do we integrate BSP tiling?\n\nKey points:\n- Binary space partitioning\n- Draggable dividers\n- Keyboard navigation\n- Content-adaptive zones',
      'BSP creates superior spatial organization.\n\nBenefits:\n- Clean divisions\n- Predictable layout\n- Keyboard navigation\n- Draggable dividers',
      'Research on content-proportional layouts.\n\nFindings:\n- Cards should size to content\n- Layout should adapt\n- No forced rectangles\n- Tight packing',
      'ZoneTiler implementation notes.\n\nFeatures:\n- h/j/k/l navigation\n- Ctrl+Shift+H/V splitting\n- Draggable dividers\n- Focus management',
    ];
    
    const pool = id % 3 === 0 ? long : id % 3 === 1 ? medium : short;
    const content = pool[id % pool.length];
    
    return {
      id: `block-${String(id).padStart(3, '0')}`,
      type: types[id % types.length],
      content: content + (id > 15 ? ` [extra ${id - 15}]` : ''),
      annotation: id % 4 === 0 ? 'Research' : undefined,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
  }
  
  // Initialize with 16 zones in BSP tree
  function initTree(): BspNode {
    let t: BspNode = createDefaultBsp('zone-001', 'main');
    // First level: split into 2 columns
    t = splitZone(t, 'zone-001', 'horizontal', 
      { kind: 'leaf', id: 'zone-002', label: 'zone-002', privacyState: 'ouvert' }, 0.5);
    // Second level: 4 zones
    t = splitZone(t, 'zone-001', 'vertical',
      { kind: 'leaf', id: 'zone-003', label: 'zone-003', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-002', 'vertical',
      { kind: 'leaf', id: 'zone-004', label: 'zone-004', privacyState: 'ouvert' }, 0.5);
    // Third level: 8 zones
    t = splitZone(t, 'zone-003', 'horizontal',
      { kind: 'leaf', id: 'zone-005', label: 'zone-005', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-004', 'horizontal',
      { kind: 'leaf', id: 'zone-006', label: 'zone-006', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-005', 'vertical',
      { kind: 'leaf', id: 'zone-007', label: 'zone-007', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-006', 'vertical',
      { kind: 'leaf', id: 'zone-008', label: 'zone-008', privacyState: 'ouvert' }, 0.5);
    // Fourth level: 16 zones
    t = splitZone(t, 'zone-007', 'horizontal',
      { kind: 'leaf', id: 'zone-009', label: 'zone-009', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-008', 'horizontal',
      { kind: 'leaf', id: 'zone-010', label: 'zone-010', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-009', 'vertical',
      { kind: 'leaf', id: 'zone-011', label: 'zone-011', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-010', 'vertical',
      { kind: 'leaf', id: 'zone-012', label: 'zone-012', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-011', 'horizontal',
      { kind: 'leaf', id: 'zone-013', label: 'zone-013', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-012', 'horizontal',
      { kind: 'leaf', id: 'zone-014', label: 'zone-014', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-013', 'vertical',
      { kind: 'leaf', id: 'zone-015', label: 'zone-015', privacyState: 'ouvert' }, 0.5);
    t = splitZone(t, 'zone-014', 'vertical',
      { kind: 'leaf', id: 'zone-016', label: 'zone-016', privacyState: 'ouvert' }, 0.5);
    return t;
  }
  let tree = $state<BspNode>(initTree());
  
  let containerWidth = $state(800);
  let containerHeight = $state(600);
  let focusedZoneId = $state('zone-001');
  let nextZoneId = $state(17);
  
  // Map zone IDs to content — 16 zones with varied content
  function initContents(): Map<string, EnchantedBlockData> {
    const m = new Map<string, EnchantedBlockData>();
    for (let i = 1; i <= 16; i++) {
      m.set(`zone-${String(i).padStart(3, '0')}`, generateContent(i - 1));
    }
    return m;
  }
  let zoneContents = $state<Map<string, EnchantedBlockData>>(initContents());
  
  function handleSplitRequest(zoneId: string, direction: SplitDirection) {
    const newZoneId = `zone-${String(nextZoneId).padStart(3, '0')}`;
    nextZoneId++;
    
    const newLeaf: ZoneLeaf = {
      kind: 'leaf',
      id: newZoneId,
      label: newZoneId,
      privacyState: 'ouvert',
    };
    
    tree = splitZone(tree, zoneId, direction, newLeaf, 0.5);
    
    // Add content for new zone
    zoneContents = new Map(zoneContents);
    zoneContents.set(newZoneId, generateContent(nextZoneId));
    
    // Focus new zone
    focusedZoneId = newZoneId;
  }
  
  function handleContentChange(zoneId: string, content: string) {
    const block = zoneContents.get(zoneId);
    if (block) {
      zoneContents = new Map(zoneContents);
      zoneContents.set(zoneId, { ...block, content, modifiedAt: Date.now() });
    }
  }
  
  function handleTypeChange(zoneId: string, type: BlockType) {
    const block = zoneContents.get(zoneId);
    if (block) {
      zoneContents = new Map(zoneContents);
      zoneContents.set(zoneId, { ...block, type } as EnchantedBlockData);
    }
  }
  
  function getBlockForZone(zoneId: string): EnchantedBlockData | undefined {
    return zoneContents.get(zoneId);
  }
</script>

<div class="demo">
  <header>
    <h2>BSP ZoneTiler — 16 Zones</h2>
    <div class="instructions">
      <span><kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd> navigate</span>
      <span><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>H</kbd>/<kbd>V</kbd> split</span>
      <span>Drag dividers to resize</span>
    </div>
  </header>
  
  <div class="canvas" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
    <ZoneTiler
      {tree}
      width={containerWidth}
      height={containerHeight}
      {focusedZoneId}
      onFocusChange={(id) => focusedZoneId = id}
      onSplitRequest={handleSplitRequest}
    >
      {#snippet zoneContent(zone: ZoneRect)}
        {@const block = getBlockForZone(zone.id)}
        <div class="zone" class:focused={zone.id === focusedZoneId}>
          {#if block}
            <NodepadBlock 
              {block}
              maxWidth={zone.width - 16}
              onChange={(c) => handleContentChange(zone.id, c)}
              onTypeChange={(t) => handleTypeChange(zone.id, t)}
            />
          {:else}
            <div class="empty">{zone.id}</div>
          {/if}
        </div>
      {/snippet}
    </ZoneTiler>
  </div>
</div>

<style>
  .demo { 
    padding: 16px; 
    height: 100vh; 
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  
  header {
    flex-shrink: 0;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  h2 { 
    color: var(--color-text-primary, #e8e4dc); 
    margin: 0;
    font-size: 18px;
  }
  
  .instructions {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--color-text-muted, #706858);
  }
  
  .instructions span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  kbd {
    background: var(--color-bg-elevated, #333);
    border: 1px solid var(--color-border, #444);
    border-radius: 3px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 11px;
    color: var(--color-text-secondary, #a89b8c);
  }
  
  .canvas { 
    flex: 1;
    background: var(--color-bg-panel, #222);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
  }
  
  .zone {
    width: 100%;
    height: 100%;
    padding: 8px;
    box-sizing: border-box;
    background: var(--color-bg-elevated, #252422);
    overflow: auto;
    transition: box-shadow 0.15s ease;
  }
  
  .zone.focused {
    box-shadow: inset 0 0 0 2px var(--color-accent, #b87333);
  }
  
  .empty {
    color: var(--color-text-muted, #706858);
    font-size: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
</style>
