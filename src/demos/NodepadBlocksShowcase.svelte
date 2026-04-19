<script lang="ts">
  // EnchantedShowcase — Flat Nodepad-style blocks (NO nested cards)
  // Key improvements from failed first attempt:
  // - Single flat block (no card-within-card)
  // - Click-and-type editing (no mode toggle, no cursor reset)
  // - NO collapse button (content flows naturally)
  
  import { NodepadBlock, type EnchantedBlockData } from '@kos/design-system/x0-enchanted-blocks';
  
  // Mock blocks as EnchantedBlockData (not wrapped in TaskView)
  const mockBlocks: EnchantedBlockData[] = [
    {
      id: 'wt-001',
      type: 'task',
      content: 'Short task: Brief description.',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    {
      id: 'wt-002',
      type: 'idea',
      content: 'Medium complexity idea that should wrap to a few lines. This demonstrates how the block adapts to content length without truncation or collapse buttons.',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    {
      id: 'wt-003',
      type: 'question',
      content: `How do we integrate Pretext for DOM-free text measurement?

Key considerations:
- Canvas-based measurement (no DOM thrash)
- Adaptive sizing per content
- 14-type classification from Nodepad
- Inline editing without mode switches

The block should just flow naturally—no collapse buttons needed.`,
      annotation: 'Research note from Chenglou/pretext investigation',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    {
      id: 'wt-004',
      type: 'claim',
      content: 'Flat blocks with inline editing are superior to nested card containers.',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    {
      id: 'wt-005',
      type: 'reference',
      content: 'Nodepad spatial canvas research — 14 block types, no collapse buttons, click-and-type editing.',
      annotation: 'github.com/mskayyali/nodepad',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    {
      id: 'wt-006',
      type: 'general',
      content: 'Completed: Pretext dependency added to design-system. Build passes.',
      createdAt: Date.now() - 86400000,
      modifiedAt: Date.now(),
    },
  ];
  
  // Local state for blocks (simulating store)
  let blocks = $state<EnchantedBlockData[]>(mockBlocks);
  
  function handleChange(id: string, newContent: string) {
    const block = blocks.find(b => b.id === id);
    if (block) {
      block.content = newContent;
      block.modifiedAt = Date.now();
    }
    console.log(`Changed ${id}: ${newContent.slice(0, 30)}...`);
  }
  
  function handleTypeChange(id: string, newType: string) {
    const block = blocks.find(b => b.id === id);
    if (block) {
      (block as {type: string}).type = newType;
    }
  }
</script>

<div class="showcase">
  <header class="showcase-header">
    <h1>Nodepad-Style Blocks</h1>
    <p class="subtitle">Flat layout • Click to edit • No collapse buttons • No nested cards</p>
    <div class="features">
      <span class="feature">✓ Single flat container</span>
      <span class="feature">✓ Type in place (stable cursor)</span>
      <span class="feature">✓ Auto-sized to content</span>
      <span class="feature">✓ 14 types (click chip to cycle)</span>
    </div>
  </header>
  
  <main class="showcase-grid">
    {#each blocks as block (block.id)}
      <NodepadBlock
        {block}
        maxWidth={320}
        onChange={(content) => handleChange(block.id, content)}
        onTypeChange={(type) => handleTypeChange(block.id, type)}
      />
    {/each}
  </main>
  
  <footer class="showcase-footer">
    <p>Flat block architecture — no card-within-card nesting</p>
    <p class="hint">Click any block to start typing. Click type chip to cycle types.</p>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    background: var(--color-bg-canvas, #1a1a1a);
    font-family: "Sovereign Sans", system-ui, sans-serif;
  }
  
  .showcase {
    min-height: 100vh;
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  
  .showcase-header {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }
  
  h1 {
    color: var(--color-text-primary, #e8e4dc);
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  .subtitle {
    color: var(--color-text-secondary, #a09880);
    font-size: 16px;
    margin: 0 0 20px 0;
  }
  
  .features {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px 24px;
    font-size: 13px;
    color: var(--color-accent, #b87333);
  }
  
  .feature {
    white-space: nowrap;
  }
  
  .showcase-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    align-items: start; /* KEY: Each card sizes to its own content, not row height */
    gap: 20px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    padding: 0 20px;
  }
  
  .showcase-footer {
    text-align: center;
    margin-top: auto;
    padding-top: 40px;
    color: var(--color-text-muted, #706858);
    font-size: 13px;
  }
  
  .showcase-footer p {
    margin: 4px 0;
  }
  
  .hint {
    font-style: italic;
    opacity: 0.8;
  }
</style>
