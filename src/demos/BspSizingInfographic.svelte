<script lang="ts">
  // BSP Sizing Infographic — Static data guaranteed to show all categories
  interface SizingInfo {
    zoneId: string;
    contentArea: number;
    lines: number;
    fits: string[];
    content: string;
  }
  
  // Static data with real content representing Pretext-measured zones
  const sizingInfo: SizingInfo[] = [
    // Tiny: < 2000 px² — minimal content, just badges
    { zoneId: 'tiny-1', contentArea: 420, lines: 1, fits: ['ID badge', 'Color'], content: 'Hi.' },
    { zoneId: 'tiny-2', contentArea: 840, lines: 2, fits: ['ID badge', 'Color'], content: 'OK.' },
    { zoneId: 'tiny-3', contentArea: 1260, lines: 2, fits: ['ID badge', 'Color'], content: 'Todo.' },
    
    // Small: 2000-8000 px² — short tasks/notes
    { zoneId: 'small-1', contentArea: 2520, lines: 3, fits: ['Title', 'Type chip'], content: 'Short task item for today.' },
    { zoneId: 'small-2', contentArea: 3360, lines: 4, fits: ['Title', 'Type chip', 'Preview'], content: 'Quick note about BSP layout approach and spatial design.' },
    { zoneId: 'small-3', contentArea: 4620, lines: 5, fits: ['Title', 'Type chip', 'Preview'], content: 'Reference link to Nodepad documentation and spatial canvas patterns.' },
    { zoneId: 'small-4', contentArea: 5880, lines: 6, fits: ['Title', 'Type chip', 'Preview'], content: 'Question: How do we integrate Pretext measurement with ZoneTiler for proportional sizing?' },
    
    // Medium: 8000-20000 px² — full paragraphs
    { zoneId: 'medium-1', contentArea: 8400, lines: 7, fits: ['Full title', '3-7 lines', 'Type chip'], content: 'Medium complexity note that demonstrates how cards flow and resize based on their actual content measurements using Pretext library for DOM-free measurement.' },
    { zoneId: 'medium-2', contentArea: 10500, lines: 8, fits: ['Full title', '3-7 lines', 'Annotation'], content: 'Research on spatial canvas patterns and BSP tiling approaches. Key insight: ZoneTiler creates clean divisions with draggable dividers between zones for intuitive navigation.' },
    { zoneId: 'medium-3', contentArea: 12600, lines: 9, fits: ['Full title', '3-7 lines', 'Inline edit'], content: 'How do we integrate BSP tiling with content-proportional sizing?\n\nKey points to consider:\n- Binary space partitioning\n- Content-adaptive zones\n- Draggable dividers' },
    { zoneId: 'medium-4', contentArea: 15400, lines: 10, fits: ['Full title', '3-7 lines', 'Inline edit'], content: 'Nodepad natural flow concept adaptation for KOS. The spatial canvas should allow cards to size themselves based on content, avoiding wasted space from fixed-size containers that force scrolling or truncation.' },
    
    // Large: > 20000 px² — substantial content, full editing
    { zoneId: 'large-1', contentArea: 21000, lines: 12, fits: ['Complete', 'Full editing', 'Type selector'], content: 'BSP creates superior spatial organization for complex workspaces.\n\nBenefits of this approach:\n- Clean divisions between content areas\n- Predictable layout that users can navigate\n- Content-aware sizing prevents wasted space\n- Tiny zones become colored indicator blocks\n- Large zones support full editing capabilities' },
    { zoneId: 'large-2', contentArea: 25200, lines: 14, fits: ['Complete', 'Full editing', 'Annotations'], content: 'ZoneTiler implementation notes for LEAP design system.\n\nFeatures implemented:\n- h/j/k/l keyboard navigation between zones\n- Ctrl+Shift+H/V to split zones\n- Draggable dividers for manual resize\n- Focus management with visual indicators\n- Content measurement via Pretext\n- Proportional sizing algorithms\n- Minimized block rendering for tiny zones' },
    { zoneId: 'large-3', contentArea: 29400, lines: 16, fits: ['Complete', 'Full editing', 'Annotations', 'History'], content: 'Research on content-proportional layouts for spatial canvases.\n\nKey findings from analysis:\n- Cards should size themselves to their content\n- Layout algorithms should adapt to content, not force content into fixed layouts\n- No forced rectangular constraints that create wasted space\n- Tight packing of content blocks\n- Automatic downgrade to indicator blocks when content is too small for meaningful display\n- Upgrade to full editing mode when sufficient space available' },
    { zoneId: 'huge-1', contentArea: 33600, lines: 18, fits: ['Complete', 'Full editing', 'All features'], content: 'Complete ZoneTiler implementation with content-proportional BSP layout.\n\nThis zone demonstrates full editing capabilities with:\n- Complete content visibility\n- Full inline editing with stable cursor\n- Type selector chips (Task, Idea, Question, Claim, Reference, Definition)\n- Annotation support with metadata\n- Keyboard shortcuts for power users\n- Drag-and-drop zone resizing\n- Automatic content measurement and re-layout\n- Responsive sizing based on available canvas space\n- Integration with Nodepad block system\n- Brass/copper aesthetic consistent with KOS design system\n\nThis is substantial content that requires a large zone for effective editing and viewing.' },
  ];
  
  // Categorize
  const tiny = sizingInfo.filter(s => s.contentArea < 2000);
  const small = sizingInfo.filter(s => s.contentArea >= 2000 && s.contentArea < 8000);
  const medium = sizingInfo.filter(s => s.contentArea >= 8000 && s.contentArea < 20000);
  const large = sizingInfo.filter(s => s.contentArea >= 20000);
</script>

<div class="infographic">
  <header>
    <h2>BSP Zone Sizing — What Fits Where</h2>
    <p class="subtitle">Content-proportional allocation (xkcd radiation-style)</p>
    
  </header>
  
  <div class="scale-container">
    <!-- Tiny zones -->
    <div class="scale-section tiny">
      <h3>🔴 Tiny Zones (Colored Blocks) — {tiny.length} zones</h3>
      <div class="threshold">&lt; 2,000 px²</div>
      <div class="fits-list">
        <span class="fits-yes">Color indicator</span>
        <span class="fits-yes">ID badge</span>
        <span class="fits-no">No readable text</span>
        <span class="fits-no">No editing</span>
      </div>
      <div class="examples">
        {#each tiny as info}
          <div class="zone-preview tiny-block" style="--w: {Math.max(30, Math.sqrt(info.contentArea) * 0.8)}px; --h: {Math.max(30, Math.sqrt(info.contentArea) * 0.8)}px;" title="{info.content}">
            <div class="block-indicator">
              {info.content.slice(0, 8)}
            </div>
          </div>
        {:else}
          <div class="empty-section">No zones in this category</div>
        {/each}
      </div>
    </div>
    
    <!-- Small zones -->
    <div class="scale-section small">
      <h3>🟠 Small Zones (Titles Only) — {small.length} zones</h3>
      <div class="threshold">2,000 — 8,000 px²</div>
      <div class="fits-list">
        <span class="fits-yes">Title line</span>
        <span class="fits-yes">Type chip</span>
        <span class="fits-maybe">1-2 lines preview</span>
        <span class="fits-no">Full content</span>
      </div>
      <div class="examples">
        {#each small as info}
          <div class="zone-preview small-block" style="--w: {Math.max(60, Math.sqrt(info.contentArea) * 0.9)}px; --h: {Math.max(40, info.lines * 12)}px;">
            <div class="content-preview" title="{info.zoneId}: {Math.round(info.contentArea)}px²">
              <div class="mini-content">{info.content.slice(0, 60)}{info.content.length > 60 ? '...' : ''}</div>
              <div class="mini-lines">{info.lines} lines</div>
            </div>
          </div>
        {:else}
          <div class="empty-section">No zones in this category</div>
        {/each}
      </div>
    </div>
    
    <!-- Medium zones -->
    <div class="scale-section medium">
      <h3>🟡 Medium Zones (Preview Mode) — {medium.length} zones</h3>
      <div class="threshold">8,000 — 20,000 px²</div>
      <div class="fits-list">
        <span class="fits-yes">Full title</span>
        <span class="fits-yes">3-7 lines content</span>
        <span class="fits-yes">Type chip + annotation</span>
        <span class="fits-maybe">Inline editing</span>
      </div>
      <div class="examples">
        {#each medium as info}
          <div class="zone-preview medium-block" style="--w: {Math.max(100, info.contentArea / 80)}px; --h: {Math.max(60, info.lines * 14)}px;">
            <div class="content-preview" title="{info.zoneId}: {Math.round(info.contentArea)}px²">
              <div class="preview-body real-content">{info.content.slice(0, 180)}{info.content.length > 180 ? '...' : ''}</div>
              <div class="preview-meta">{info.lines} lines • {info.contentArea < 10000 ? Math.round(info.contentArea) : Math.round(info.contentArea/1000)+'K'} px²</div>
            </div>
          </div>
        {:else}
          <div class="empty-section">No zones in this category</div>
        {/each}
      </div>
    </div>
    
    <!-- Large zones -->
    <div class="scale-section large">
      <h3>🟢 Large Zones (Full Edit) — {large.length} zones</h3>
      <div class="threshold">&gt; 20,000 px²</div>
      <div class="fits-list">
        <span class="fits-yes">Complete content</span>
        <span class="fits-yes">Full editing</span>
        <span class="fits-yes">Type selector</span>
        <span class="fits-yes">Annotations</span>
      </div>
      <div class="examples">
        {#each large as info}
          <div class="zone-preview large-block" style="--w: {Math.max(140, info.contentArea / 150)}px; --h: {Math.max(100, info.lines * 14)}px;">
            <div class="content-preview" title="{info.zoneId}: {Math.round(info.contentArea)}px²">
              <div class="preview-body large real-content">{info.content.slice(0, 400)}{info.content.length > 400 ? '...' : ''}</div>
              <div class="preview-meta">{info.lines} lines • {Math.round(info.contentArea/1000)}K px²</div>
            </div>
          </div>
        {:else}
          <div class="empty-section">No zones in this category</div>
        {/each}
      </div>
    </div>
  </div>
  
  <footer>
    <p><strong>Magic formula:</strong> ZoneSize ∝ ContentArea → Tiny = ColoredBlock, Huge = FullEdit</p>
    <p class="note">Pretext measures content → BSP splits proportionally → No wasted micro-zones</p>
  </footer>
</div>

<style>
  .infographic {
    padding: 24px;
    max-width: 900px;
    margin: 0 auto;
    font-family: system-ui, sans-serif;
    color: var(--color-text-primary, #e8e4dc);
    background: var(--color-bg, #1a1918);
    min-height: 100vh;
    overflow-y: auto;
  }
  
  header {
    text-align: center;
    margin-bottom: 32px;
  }
  
  .debug {
    margin-top: 16px;
    padding: 12px;
    background: rgba(184, 115, 51, 0.1);
    border: 1px solid var(--color-accent, #b87333);
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    text-align: left;
  }
  
  .debug ul {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  .debug li {
    margin: 2px 0;
  }
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: var(--color-accent, #b87333);
  }
  
  .subtitle {
    margin: 0;
    color: var(--color-text-muted, #706858);
    font-size: 14px;
  }
  
  .scale-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .scale-section {
    background: var(--color-bg-panel, #222);
    border-radius: 8px;
    padding: 16px;
    border-left: 4px solid;
  }
  
  .scale-section.tiny { border-color: #e74c3c; }
  .scale-section.small { border-color: #e67e22; }
  .scale-section.medium { border-color: #f1c40f; }
  .scale-section.large { border-color: #2ecc71; }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
  }
  
  .threshold {
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text-muted, #706858);
    margin-bottom: 12px;
  }
  
  .fits-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .fits-list span {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
  }
  
  .fits-yes { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
  .fits-maybe { background: rgba(241, 196, 15, 0.2); color: #f1c40f; }
  .fits-no { background: rgba(231, 76, 60, 0.2); color: #e74c3c; text-decoration: line-through; }
  
  .examples {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    min-height: 60px;
  }
  
  .empty-section {
    color: var(--color-text-muted, #706858);
    font-size: 12px;
    font-style: italic;
    padding: 20px;
    width: 100%;
    text-align: center;
  }
  
  .zone-preview {
    position: relative;
    background: var(--color-bg-elevated, #2a2826);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  .tiny-block {
    width: var(--w);
    height: var(--h);
  }
  
  .block-indicator {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #b87333, #8b5a2b);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    color: #1a1918;
  }
  
  .small-block {
    width: var(--w);
    height: var(--h);
  }
  
  .medium-block {
    width: var(--w);
    height: var(--h);
    min-width: 100px;
    min-height: 60px;
  }
  
  .large-block {
    width: var(--w);
    height: var(--h);
    min-width: 140px;
    min-height: 100px;
  }
  
  .content-preview {
    padding: 8px;
    font-size: 11px;
    width: 100%;
  }
  
  .mini-title {
    font-weight: bold;
    margin-bottom: 2px;
  }
  
  .mini-lines {
    color: var(--color-text-muted, #706858);
    font-size: 10px;
  }
  
  .preview-header {
    font-weight: bold;
    margin-bottom: 4px;
    font-size: 11px;
  }
  
  .preview-body {
    color: var(--color-text-secondary, #a89b8c);
    font-size: 10px;
    line-height: 1.4;
  }
  
  .preview-body.large {
    font-size: 11px;
  }
  
  .mini-content {
    font-size: 10px;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .real-content {
    white-space: pre-wrap;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
  }
  
  .preview-meta {
    color: var(--color-text-muted, #706858);
    font-size: 9px;
    margin-top: 4px;
  }
  
  footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border, #333);
    text-align: center;
  }
  
  footer p {
    margin: 4px 0;
    font-size: 13px;
  }
  
  footer .note {
    color: var(--color-text-muted, #706858);
    font-size: 12px;
  }
</style>
