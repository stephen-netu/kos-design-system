<script lang="ts">
  /**
   * ActivityRail - Fabric Component
   * 
   * Vertical navigation rail for app switching and view selection.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @kos/design-system/fabric/navigation
   * @adr 2026-04-12-leap-substrate-refactor-001
   */
  import type { LucideIcon } from '@lucide/svelte';
  import {
    LayoutGrid, FileText, Network, Columns2, Globe,
    FolderTree, MessageSquare, HelpCircle, Layers, Gauge, Wifi, Folder,
    Compass, Cpu, MessageCircle, Inbox,
  } from '@lucide/svelte';

  export type RailItemType = 'app' | 'view' | 'panel';

  export interface RailItem {
    id: string;
    type: RailItemType;
    label: string;
    iconName: string;
    active?: boolean;
    disabled?: boolean;
    title?: string;
  }

  interface Props {
    /** App-level items (top section) */
    appItems: RailItem[];
    /** View-level items (middle section) */
    viewItems: RailItem[];
    /** Panel toggle items (bottom section) */
    panelItems: RailItem[];
    /** Currently active app ID */
    activeAppId?: string;
    /** Callback when item is clicked */
    onitemclick: (item: RailItem) => void;
    /** Callback for help button */
    onopenhelp?: () => void;
    /** Enable drag-drop for stream cards (app items only) */
    ondropstreamcard?: (item: RailItem, data: { content: string; contentType: string; source: string }) => void;
  }

  let {
    appItems,
    viewItems,
    panelItems,
    activeAppId,
    onitemclick,
    onopenhelp,
    ondropstreamcard,
  }: Props = $props();

  const ICON_MAP: Record<string, LucideIcon> = {
    'layout-grid': LayoutGrid,
    'file-text': FileText,
    'network': Network,
    'columns': Columns2,
    'globe': Globe,
    'wifi': Wifi,
    'folder-tree': FolderTree,
    'message-square': MessageSquare,
    'folder': Folder,
    'compass': Compass,
    'cpu': Cpu,
    'message-circle': MessageCircle,
    'inbox': Inbox,
    'layers': Layers,
    'gauge': Gauge,
    'help-circle': HelpCircle,
  };

  function getIcon(name: string): LucideIcon {
    return ICON_MAP[name.toLowerCase()] ?? FileText;
  }

  // Drop target state
  let dropTargetId = $state<string | null>(null);

  function isStreamCardDrag(e: DragEvent): boolean {
    return e.dataTransfer?.types.includes('application/json') ?? false;
  }

  function handleDragOver(item: RailItem, e: DragEvent) {
    if (!isStreamCardDrag(e) || item.type !== 'app') return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    dropTargetId = item.id;
  }

  function handleDragLeave(e: DragEvent) {
    if (e.currentTarget instanceof HTMLElement && !e.currentTarget.contains(e.relatedTarget as Node)) {
      dropTargetId = null;
    }
  }

  function handleDrop(item: RailItem, e: DragEvent) {
    e.preventDefault();
    dropTargetId = null;
    if (!ondropstreamcard || item.type !== 'app') return;

    try {
      const data = e.dataTransfer?.getData('application/json');
      if (!data) return;
      const payload = JSON.parse(data);
      if (payload.type !== 'stream-card') return;

      ondropstreamcard(
        item,
        { content: payload.content, contentType: payload.contentType, source: payload.source }
      );
    } catch {
      // Not a valid stream card payload
    }
  }
</script>

<nav class="activity-rail" aria-label="Activity navigation">
  <div class="rail-brand scanlines">⬡</div>

  <!-- App buttons -->
  <div class="rail-section rail-apps">
    {#each appItems as item (item.id)}
      {@const Icon = getIcon(item.iconName)}
      <button
        class="rail-btn"
        class:active={item.active}
        class:drag-over={dropTargetId === item.id}
        class:disabled={item.disabled}
        title={item.title ?? item.label}
        aria-label={item.label}
        onclick={() => onitemclick(item)}
        ondragover={(e) => handleDragOver(item, e)}
        ondragleave={handleDragLeave}
        ondrop={(e) => handleDrop(item, e)}
      >
        <Icon size={18} />
      </button>
    {/each}
  </div>

  <div class="rail-divider"></div>

  <!-- View buttons -->
  <div class="rail-section">
    {#each viewItems as item (item.id)}
      {@const Icon = getIcon(item.iconName)}
      <button
        class="rail-btn"
        class:active={item.active}
        class:disabled={item.disabled}
        title={item.label}
        aria-label={item.label}
        onclick={() => onitemclick(item)}
      >
        <Icon size={18} />
      </button>
    {/each}
  </div>

  <!-- Panel toggles -->
  <div class="rail-section rail-panels">
    {#each panelItems as item (item.id)}
      {@const Icon = getIcon(item.iconName)}
      <button
        class="rail-btn"
        class:active={item.active}
        class:disabled={item.disabled}
        title={item.label}
        aria-label={item.label}
        onclick={() => onitemclick(item)}
      >
        <Icon size={18} />
      </button>
    {/each}
  </div>

  <div class="rail-spacer"></div>

  <button
    class="rail-btn"
    title="Keyboard shortcuts (?)"
    aria-label="Keyboard shortcuts"
    onclick={() => onopenhelp?.()}
  >
    <HelpCircle size={18} />
  </button>
</nav>

<style>
  .activity-rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 48px;
    height: 100%;
    background: var(--color-bg-canvas);
    border-right: 2px solid var(--border-default);
    padding: 4px 0;
    gap: var(--space-05);
  }

  .rail-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    color: var(--color-accent);
    font-size: 16px;
    flex-shrink: 0;
    margin-bottom: 4px;
  }

  .rail-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-05);
    width: 100%;
  }

  .rail-divider {
    width: 24px;
    height: 2px;
    background: var(--border-subtle);
    margin: 4px 0;
  }

  .rail-panels {
    border-top: 2px solid var(--border-subtle);
    padding-top: 4px;
    margin-top: 4px;
  }

  .rail-spacer {
    flex: 1;
  }

  .rail-btn {
    width: 36px;
    height: 36px;
    background: transparent;
    border: 2px solid var(--border-subtle);
    border-radius: 0; /* Military sharp edges */
    color: var(--color-text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
    flex-shrink: 0;
    padding: 0;
  }

  .rail-btn:hover {
    background: var(--color-bg-panel);
    color: var(--color-text-secondary);
    border-color: var(--border-hover);
  }

  .rail-btn.active {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .rail-btn.drag-over {
    background: var(--color-accent-subtle);
    box-shadow: var(--shadow-accent-glow);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .rail-btn.disabled {
    opacity: 0.3;
    pointer-events: none;
    border-color: var(--border-subtle);
  }
</style>