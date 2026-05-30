<script lang="ts">
  import type { Snippet } from 'svelte';
  import type {
    GraphSchema,
    NodeInstance,
    NodeDefinition,
    ValidationResult,
  } from './types';
  import GraphEditor from './GraphEditor.svelte';

  interface GraphHistoryProps {
    schema: GraphSchema;
    maxHistory?: number;
    readonly?: boolean;
    snapToGrid?: boolean;
    gridSize?: number;
    nodeContent?: Snippet<[NodeInstance, NodeDefinition]>;
    onchange?: (schema: GraphSchema) => void;
    onselect?: (nodeIds: string[]) => void;
    onvalidate?: (result: ValidationResult) => void;
  }

  let {
    schema,
    maxHistory = 50,
    readonly = false,
    snapToGrid = false,
    gridSize = 20,
    nodeContent,
    onchange,
    onselect,
    onvalidate,
  }: GraphHistoryProps = $props();

  // --- History state ---
  // svelte-ignore state_referenced_locally -- intentional: history starts with initial schema snapshot
  let history = $state<GraphSchema[]>([schema]);
  let historyIndex = $state<number>(0);

  let canUndo = $derived(historyIndex > 0);
  let canRedo = $derived(historyIndex < history.length - 1);
  let currentSchema = $derived(history[historyIndex]);

  // --- History operations ---
  function pushSchema(newSchema: GraphSchema) {
    // Discard any forward history beyond current position
    history = [...history.slice(0, historyIndex + 1), newSchema];

    // Trim to max depth (drop oldest entries)
    if (history.length > maxHistory) {
      const overflow = history.length - maxHistory;
      history = history.slice(overflow);
      historyIndex = history.length - 1;
    } else {
      historyIndex = history.length - 1;
    }

    onchange?.(newSchema);
  }

  function undo() {
    if (!canUndo) return;
    historyIndex--;
    onchange?.(history[historyIndex]);
  }

  function redo() {
    if (!canRedo) return;
    historyIndex++;
    onchange?.(history[historyIndex]);
  }

  // --- Editor change handler ---
  function handleEditorChange(newSchema: GraphSchema) {
    pushSchema(newSchema);
  }

  // --- Keyboard shortcuts (captured before GraphEditor) ---
  function handleKeydown(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      undo();
      return;
    }

    if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
      e.preventDefault();
      e.stopPropagation();
      redo();
      return;
    }
  }

  // Expose reactive state and methods for parent binding
  export { canUndo, canRedo, undo, redo };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="n0-graph-history" onkeydown={handleKeydown}>
  <GraphEditor
    schema={currentSchema}
    {readonly}
    {snapToGrid}
    {gridSize}
    {nodeContent}
    onchange={handleEditorChange}
    {onselect}
    {onvalidate}
  />
</div>

<style>
  .n0-graph-history {
    width: 100%;
    height: 100%;
    position: relative;
  }
</style>
