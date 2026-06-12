<script lang="ts">
  /**
   * ResearchPanel - Fabric Component
   * 
   * Research query interface with quick/detailed modes, results display, and progress tracking.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @stephen-netu/design-system/fabric/ai
   * @adr 2026-04-26-research-router-vertical-slice
   */
  import { Search, X, ExternalLink, Clock, Gauge, TrendingUp, AlertCircle, Loader2 } from '@lucide/svelte';

  export interface ResearchEntry {
    title: string;
    url: string;
    snippet: string;
    sourceEngine: string;
    credibilityScore: number;
    publishedAt: string | null;
    doi: string | null;
  }

  export interface ResearchResultsData {
    queryId: string;
    entries: ResearchEntry[];
    sourcesUsed: string[];
    confidencePermille: number;
    totalAvailable: number;
    sequence: number;
  }

  export interface ResearchProgressData {
    queryId: string;
    stage: string;
    percent: number;
    enginesCompleted: number;
    enginesTotal: number;
    sequence: number;
  }

  type QueryMode = 'quick' | 'detailed';
  type ViewState = 'idle' | 'querying' | 'results' | 'error';

  interface Props {
    // State
    results: ResearchResultsData | null;
    progress: ResearchProgressData | null;
    isLoading: boolean;
    error: string | null;
    queryId: string | null;

    // Callbacks
    onQuickSearch: (query: string, maxResults: number, hint: string) => void;
    onDetailedSearch: (query: string, maxResults: number, depth: number, engines: string[]) => void;
    onCancel: (queryId: string) => void;
    onEntryClick?: (url: string) => void;
    onClear: () => void;

    // Customization
    title?: string;
    placeholder?: string;
    emptyStateText?: string;
  }

  let {
    results = null,
    progress = null,
    isLoading = false,
    error = null,
    queryId = null,
    onQuickSearch,
    onDetailedSearch,
    onCancel,
    onEntryClick,
    onClear,
    title = 'Research',
    placeholder = 'Enter research query...',
    emptyStateText = 'Enter a query to begin research',
  }: Props = $props();

  let queryMode: QueryMode = $state('quick');
  let queryInput: string = $state('');
  let maxResults: number = $state(20);
  let depth: number = $state(2);
  let selectedEngines: string[] = $state([]);

  let viewState: ViewState = $derived.by(() => {
    if (isLoading) return 'querying';
    if (error) return 'error';
    if (results) return 'results';
    return 'idle';
  });

  function handleSubmit() {
    const query = queryInput.trim();
    if (!query || isLoading) return;

    if (queryMode === 'quick') {
      onQuickSearch(query, maxResults, 'Quick');
    } else {
      onDetailedSearch(query, maxResults, depth, selectedEngines);
    }
    queryInput = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleCancel() {
    if (queryId) {
      onCancel(queryId);
    }
  }

  function getCredibilityLabel(score: number): string {
    if (score >= 800) return 'High';
    if (score >= 500) return 'Medium';
    return 'Low';
  }

  function formatConfidence(permille: number): string {
    return `${(permille / 10).toFixed(1)}%`;
  }

  function getProgressPercent(p: ResearchProgressData | null): number {
    return p?.percent ?? 0;
  }

  function getEnginesProgress(p: ResearchProgressData | null): string {
    if (!p) return '';
    return `${p.enginesCompleted}/${p.enginesTotal}`;
  }
</script>

<div class="research-panel">
  <header class="panel-header">
    <h3 class="panel-title">{title || 'Research'}</h3>
    <div class="mode-toggle">
      <button
        class="mode-btn"
        class:active={queryMode === 'quick'}
        onclick={() => queryMode = 'quick'}
      >
        Quick
      </button>
      <button
        class="mode-btn"
        class:active={queryMode === 'detailed'}
        onclick={() => queryMode = 'detailed'}
      >
        Detailed
      </button>
    </div>
  </header>

  <div class="query-form">
    <input
      type="text"
      class="query-input"
      placeholder={placeholder || 'Enter research query...'}
      bind:value={queryInput}
      onkeydown={handleKeydown}
      disabled={isLoading}
    />

    {#if queryMode === 'quick'}
      <div class="query-options">
        <label class="option">
          <span>Max results</span>
          <input type="number" bind:value={maxResults} min="1" max="100" />
        </label>
      </div>
    {:else}
      <div class="query-options">
        <label class="option">
          <span>Max results</span>
          <input type="number" bind:value={maxResults} min="1" max="100" />
        </label>
        <label class="option">
          <span>Depth</span>
          <input type="number" bind:value={depth} min="1" max="5" />
        </label>
      </div>
    {/if}

    <button
      class="submit-btn"
      onclick={handleSubmit}
      disabled={!queryInput.trim() || isLoading}
    >
      <Search size={16} />
      {queryMode === 'quick' ? 'Search' : 'Research'}
    </button>
  </div>

  <div class="panel-content">
    {#if viewState === 'querying'}
      <div class="loading-state">
        <Loader2 class="spinner" size={24} />
        <span>Searching...</span>
        {#if progress}
          <div class="progress-bar">
            <div
              class="progress-fill"
              style="width: {getProgressPercent(progress)}%"
            ></div>
          </div>
          <span class="progress-label">
            {progress.stage} • {getEnginesProgress(progress)}
          </span>
        {/if}
      </div>
    {:else if viewState === 'error'}
      <div class="error-state">
        <AlertCircle size={20} />
        <span>{error || 'Search failed'}</span>
        <button class="retry-btn" onclick={() => onClear()}>
          Clear
        </button>
      </div>
    {:else if viewState === 'results' && results}
      <div class="results-header">
        <div class="results-meta">
          <span class="meta-item">
            <Gauge size={14} />
            {formatConfidence(results.confidencePermille)}
          </span>
          <span class="meta-item">
            <TrendingUp size={14} />
            {results.sourcesUsed.length} sources
          </span>
          {#if results.totalAvailable > 0}
            <span class="meta-item">
              <Clock size={14} />
              {results.totalAvailable} available
            </span>
          {/if}
        </div>
        <button class="clear-btn" onclick={() => onClear()}>
          <X size={14} />
        </button>
      </div>

      <div class="results-list">
        {#each results.entries as entry}
          <div class="result-card">
            <div class="result-header">
              <a
                class="result-title"
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                onclick={(e) => {
                  e.preventDefault();
                  onEntryClick?.(entry.url);
                }}
              >
                {entry.title}
              </a>
               <span class="external-icon">
                 <ExternalLink size={12} />
               </span>
            </div>
            <p class="result-snippet">{entry.snippet}</p>
            <div class="result-footer">
              <span class="source">{entry.sourceEngine}</span>
              <span class="credibility" class:high={entry.credibilityScore >= 800} class:medium={entry.credibilityScore >= 500 && entry.credibilityScore < 800}>
                {getCredibilityLabel(entry.credibilityScore)}
              </span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <Search size={32} />
        <span>{emptyStateText || 'Enter a query to begin research'}</span>
      </div>
    {/if}
  </div>

  {#if isLoading}
    <footer class="panel-footer">
      <button class="cancel-btn" onclick={handleCancel}>
        <X size={14} />
        Cancel
      </button>
    </footer>
  {/if}
</div>

<style>
  .research-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-bg-panel, #222222);
    border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    border-radius: var(--radius-md, 0.5rem);
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
  }

  .panel-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary, #f2efe9);
    margin: 0;
  }

  .mode-toggle {
    display: flex;
    gap: var(--space-1);
    background: var(--color-bg-canvas, #1a1a1a);
    padding: 2px;
    border-radius: var(--radius-sm, 0.25rem);
  }

  .mode-btn {
    padding: 4px 12px;
    font-size: 12px;
    background: none;
    border: none;
    color: var(--color-text-secondary, #a09880);
    cursor: pointer;
    border-radius: var(--radius-sm, 0.25rem);
    transition: all 0.15s;
  }

  .mode-btn.active {
    background: var(--color-accent, var(--color-accent));
    color: var(--color-text-primary, #f2efe9);
  }

  .query-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
  }

  .query-input {
    width: 100%;
    padding: 8px 12px;
    background: var(--color-bg-canvas, #1a1a1a);
    border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--color-text-primary, #f2efe9);
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
  }

  .query-input:focus {
    border-color: var(--color-accent, var(--color-accent));
  }

  .query-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .query-options {
    display: flex;
    gap: var(--space-3);
  }

  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    color: var(--color-text-secondary, #a09880);
    cursor: pointer;
    border-radius: var(--radius-sm, 0.25rem);
  }

  .clear-btn:hover {
    background: var(--color-bg-canvas, #1a1a1a);
    color: var(--color-text-primary, #f2efe9);
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .result-card {
    padding: 12px;
    background: var(--color-bg-canvas, #1a1a1a);
    border-radius: var(--radius-sm, 0.25rem);
  }

  .result-header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-15);
    margin-bottom: 6px;
  }

  .result-title {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-accent, var(--color-accent));
    text-decoration: none;
    line-height: 1.4;
  }

  .result-title:hover {
    text-decoration: underline;
  }

  .external-icon {
    flex-shrink: 0;
    color: var(--color-text-tertiary, #706858);
  }

  .result-snippet {
    font-size: 13px;
    color: var(--color-text-secondary, #a09880);
    line-height: 1.5;
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .result-footer {
    display: flex;
    gap: var(--space-2);
    font-size: 11px;
  }

  .source {
    color: var(--color-text-tertiary, #706858);
  }

  .credibility {
    padding: 1px 6px;
    border-radius: var(--radius-sm, 0.25rem);
    background: rgba(229, 57, 53, 0.2);
    color: #e53935;
  }

  .credibility.medium {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }

  .credibility.high {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: 32px;
    color: var(--color-text-tertiary, #706858);
  }

  .panel-footer {
    display: flex;
    justify-content: center;
    padding: 12px 16px;
    border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
  }

  .cancel-btn {
    display: flex;
    align-items: center;
    gap: var(--space-15);
    padding: 6px 16px;
    background: none;
    border: 1px solid var(--color-error, #e53935);
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--color-error, #e53935);
    font-size: 12px;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: rgba(229, 57, 53, 0.1);
  }
</style>