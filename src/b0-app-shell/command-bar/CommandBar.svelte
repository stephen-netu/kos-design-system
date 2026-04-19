<script lang="ts">
  /**
   * CommandBar — The LEAP global command strip.
   *
   * Three zones, always in the same positions across every LEAP app:
   *   LEFT  · FLOW PHASE — the system's current operational state
   *   CENTER · INTENT    — the user's voice to the agent network
   *   RIGHT  · SPARK     — available compute fuel
   *
   * Prop-driven: no store imports. Each app wires it to its own stores.
   *
   * Placement: top of every LEAP app shell, above app-specific navigation.
   * Height: 52px fixed.
   */

  interface Props {
    /** Whether the daemon socket is connected. */
    connected?: boolean;
    /** Current FLOW phase string (e.g. "GO", "SPROUT", "FREEZE"). */
    flowPhase?: string | null;
    /** Remaining spark fuel units. Null when daemon is offline. */
    sparkRemaining?: number | null;
    /** Total spark fuel capacity. Null when daemon is offline. */
    sparkTotal?: number | null;
    /** Latest daemon sequence number — shown as secondary info in phase section. */
    daemonSequence?: number | null;
    /** REFLEX tick rate in ms — shown as secondary info. */
    tickRateMs?: number | null;
    /** True while an intent is being submitted. */
    submitting?: boolean;
    /** Called when the user submits an intent. */
    onintent?: (text: string) => void;
  }

  let {
    connected = false,
    flowPhase = null,
    sparkRemaining = null,
    sparkTotal = null,
    daemonSequence = null,
    tickRateMs = null,
    submitting = false,
    onintent,
  }: Props = $props();

  // ── FLOW PHASE ──────────────────────────────────────────────────────────────

  const phaseLabel = $derived(flowPhase?.toUpperCase() ?? '—');

  const phaseGlow = $derived.by((): string => {
    switch (flowPhase?.toLowerCase()) {
      case 'go':
      case 'running':
      case 'executing':   return '#27ae60';
      case 'sprout':
      case 'in_progress':
      case 'active':      return '#4682c8';
      case 'weed':
      case 'weeding':     return '#e67e22';
      case 'consult':
      case 'consulting':  return '#b87333';
      case 'freeze':
      case 'frozen':
      case 'blocked':     return '#506eb4';
      case 'seed':        return '#b87333';
      case 'compost':
      case 'prune':       return '#3d3d3d';
      default:            return '#5a5245';
    }
  });

  const isActivePhase = $derived(
    flowPhase?.toLowerCase() === 'go' || flowPhase?.toLowerCase() === 'running'
  );

  // ── SPARK ────────────────────────────────────────────────────────────────────

  const SEGMENT_COUNT = 28;

  const sparkFraction = $derived(
    sparkTotal != null && sparkTotal > 0 && sparkRemaining != null
      ? Math.max(0, Math.min(1, sparkRemaining / sparkTotal))
      : 0
  );

  const filledSegments = $derived(Math.round(sparkFraction * SEGMENT_COUNT));

  const sparkCritical = $derived(sparkFraction < 0.1);
  const sparkWarning  = $derived(sparkFraction < 0.25 && !sparkCritical);

  function fmt(n: number | null | undefined): string {
    if (n == null) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toLocaleString();
  }

  // ── INTENT ───────────────────────────────────────────────────────────────────

  let intentText: string = $state('');
  let focused: boolean = $state(false);

  function handleSubmit() {
    const text = intentText.trim();
    if (!text || submitting || !connected) return;
    intentText = '';
    onintent?.(text);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="cb" class:cb--disconnected={!connected} class:cb--submitting={submitting}>
  <!--
    Subtle horizontal scanline texture — gives the strip a slight analog instrument
    quality without being distracting. Rendered as a CSS pseudo-element in ::before.
  -->

  <!-- ── LEFT: FLOW PHASE ─────────────────────────────────────────────────── -->
  <div class="cb-phase" style="--glow: {phaseGlow}">
    <div class="cb-phase__dot" class:cb-phase__dot--pulse={isActivePhase && connected}></div>
    <div class="cb-phase__text">
      <span class="cb-phase__name">{connected ? phaseLabel : 'OFFLINE'}</span>
      <span class="cb-phase__sub">
        {#if connected && tickRateMs != null}
          {tickRateMs}ms
        {:else if !connected}
          waiting for daemon
        {:else}
          flow phase
        {/if}
      </span>
    </div>
  </div>

  <!-- ── DIVIDER ───────────────────────────────────────────────────────────── -->
  <div class="cb-rule" aria-hidden="true"></div>

  <!-- ── CENTER: INTENT ───────────────────────────────────────────────────── -->
  <div class="cb-intent" class:cb-intent--focused={focused} class:cb-intent--active={intentText.length > 0}>
    <span class="cb-intent__cursor" aria-hidden="true">⟩</span>
    <input
      class="cb-intent__input"
      type="text"
      bind:value={intentText}
      onfocus={() => focused = true}
      onblur={() => focused = false}
      onkeydown={handleKeydown}
      placeholder={connected ? 'Express intent for your machine...' : 'Waiting for daemon...'}
      disabled={!connected || submitting}
      autocomplete="off"
      spellcheck="false"
      aria-label="Intent dispatch — press Enter to send"
    />
    <button
      class="cb-intent__send"
      class:cb-intent__send--ready={intentText.trim().length > 0 && connected}
      onclick={handleSubmit}
      disabled={!intentText.trim() || !connected || submitting}
      title="Dispatch intent (Enter)"
      aria-label="Dispatch intent"
    >
      {#if submitting}
        <span class="cb-intent__spinner" aria-hidden="true"></span>
      {:else}
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <path d="M5.5 9.5V1.5M1.5 5.5l4-4 4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {/if}
    </button>
  </div>

  <!-- ── DIVIDER ───────────────────────────────────────────────────────────── -->
  <div class="cb-rule" aria-hidden="true"></div>

  <!-- ── RIGHT: SPARK ─────────────────────────────────────────────────────── -->
  <div
    class="cb-spark"
    class:cb-spark--warning={sparkWarning}
    class:cb-spark--critical={sparkCritical}
  >
    <!-- Segmented fuel bar -->
    <div class="cb-spark__bar" aria-hidden="true" title={connected ? `Spark: ${fmt(sparkRemaining)} / ${fmt(sparkTotal)}` : 'Spark: offline'}>
      {#each { length: SEGMENT_COUNT } as _, i}
        <div class="cb-spark__seg" class:cb-spark__seg--on={i < filledSegments}></div>
      {/each}
    </div>

    <!-- Readout -->
    <div class="cb-spark__readout">
      <span class="cb-spark__val">{connected ? fmt(sparkRemaining) : '—'}</span>
      <span class="cb-spark__div">/</span>
      <span class="cb-spark__cap">{connected ? fmt(sparkTotal) : '—'}</span>
      <span class="cb-spark__lbl">SPARK</span>
    </div>
  </div>
</div>

<style>
  /* ── Shell ─────────────────────────────────────────────────────────────── */

  .cb {
    display: grid;
    grid-template-columns: 148px 1px 1fr 1px 196px;
    align-items: stretch;
    height: 52px;
    width: 100%;
    background: #0a0a0a;
    border-bottom: 1px solid rgba(184, 115, 51, 0.14);
    position: relative;
    overflow: visible;
    flex-shrink: 0;
  }

  /* Scanline texture — very faint, adds analog depth */
  .cb::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      180deg,
      transparent 0px,
      transparent 2px,
      rgba(255, 255, 255, 0.012) 2px,
      rgba(255, 255, 255, 0.012) 3px
    );
    pointer-events: none;
    z-index: 0;
  }

  /* Corner accent marks — mechanical gauge aesthetic */
  .cb::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(184, 115, 51, 0.5) 0%,
      rgba(184, 115, 51, 0.0) 20%,
      transparent 50%,
      rgba(184, 115, 51, 0.0) 80%,
      rgba(184, 115, 51, 0.5) 100%
    );
    pointer-events: none;
    z-index: 0;
  }

  .cb--disconnected {
    opacity: 0.55;
  }

  /* ── Divider ───────────────────────────────────────────────────────────── */

  .cb-rule {
    width: 1px;
    background: rgba(184, 115, 51, 0.12);
    margin: 12px 0;
    z-index: 1;
  }

  /* ── FLOW PHASE section ────────────────────────────────────────────────── */

  .cb-phase {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 18px;
    position: relative;
    z-index: 1;
  }

  /* Radial color wash behind the phase — bleeds from left edge */
  .cb-phase::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 160% 120% at -10% 50%,
      color-mix(in srgb, var(--glow, #5a5245) 12%, transparent),
      transparent 65%
    );
    pointer-events: none;
  }

  .cb-phase__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--glow, #5a5245);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--glow, #5a5245) 20%, transparent),
      0 0 8px color-mix(in srgb, var(--glow, #5a5245) 50%, transparent);
    flex-shrink: 0;
    transition: background 0.4s, box-shadow 0.4s;
  }

  .cb-phase__dot--pulse {
    animation: phase-pulse 2.4s ease-in-out infinite;
  }

  @keyframes phase-pulse {
    0%, 100% {
      opacity: 1;
      box-shadow:
        0 0 0 2px color-mix(in srgb, var(--glow) 20%, transparent),
        0 0 10px color-mix(in srgb, var(--glow) 60%, transparent);
    }
    50% {
      opacity: 0.65;
      box-shadow:
        0 0 0 2px color-mix(in srgb, var(--glow) 10%, transparent),
        0 0 4px color-mix(in srgb, var(--glow) 30%, transparent);
    }
  }

  .cb-phase__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cb-phase__name {
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 700;
    color: var(--glow, #5a5245);
    letter-spacing: 0.1em;
    line-height: 1;
    transition: color 0.4s;
  }

  .cb-phase__sub {
    font-family: var(--font-mono);
    font-size: 9px;
    color: rgba(160, 152, 128, 0.65);
    letter-spacing: 0.06em;
    line-height: 1;
  }

  /* ── INTENT section ────────────────────────────────────────────────────── */

  .cb-intent {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    position: relative;
    z-index: 1;
    transition: background 0.2s;
  }

  /* Bottom underline — slides in on focus */
  .cb-intent::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20px;
    right: 20px;
    height: 1px;
    background: rgba(184, 115, 51, 0.45);
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .cb-intent--focused::after {
    transform: scaleX(1);
  }

  .cb-intent--focused {
    background: rgba(184, 115, 51, 0.03);
  }

  .cb-intent__cursor {
    font-family: var(--font-mono);
    font-size: 13px;
    color: rgba(184, 115, 51, 0.45);
    flex-shrink: 0;
    user-select: none;
    transition: color 0.15s, opacity 0.15s;
    line-height: 1;
  }

  .cb-intent--focused .cb-intent__cursor,
  .cb-intent--active .cb-intent__cursor {
    color: #b87333;
  }

  .cb-intent__input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-primary);
    padding: 0;
    caret-color: #b87333;
  }

  .cb-intent__input::placeholder {
    color: rgba(160, 152, 128, 0.25);
    font-style: italic;
  }

  .cb-intent__input:disabled {
    cursor: not-allowed;
    color: rgba(160, 152, 128, 0.3);
  }

  .cb-intent__send {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(184, 115, 51, 0.28);
    border-radius: var(--radius-sm, 3px);
    color: rgba(184, 115, 51, 0.5);
    cursor: pointer;
    transition: all 0.12s;
  }

  .cb-intent__send--ready {
    border-color: rgba(184, 115, 51, 0.45);
    color: #b87333;
    background: rgba(184, 115, 51, 0.08);
  }

  .cb-intent__send--ready:hover {
    background: rgba(184, 115, 51, 0.16);
    border-color: rgba(184, 115, 51, 0.65);
    box-shadow: 0 0 8px rgba(184, 115, 51, 0.2);
  }

  .cb-intent__send:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .cb-intent__spinner {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 1.5px solid rgba(184, 115, 51, 0.2);
    border-top-color: #b87333;
    border-radius: 50%;
    animation: cb-spin 0.65s linear infinite;
  }

  @keyframes cb-spin {
    to { transform: rotate(360deg); }
  }

  /* ── SPARK section ─────────────────────────────────────────────────────── */

  .cb-spark {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    padding: 0 18px;
    position: relative;
    z-index: 1;
  }

  /* Radial color wash — bleeds from right edge */
  .cb-spark::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 160% 120% at 110% 50%,
      rgba(184, 115, 51, 0.07),
      transparent 65%
    );
    pointer-events: none;
  }

  .cb-spark__bar {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .cb-spark__seg {
    width: 4px;
    height: 11px;
    border-radius: var(--radius-xs, 1px);
    background: rgba(184, 115, 51, 0.09);
    transition: background 0.3s, box-shadow 0.3s;
    flex-shrink: 0;
  }

  .cb-spark__seg--on {
    background: #b87333;
    box-shadow: 0 0 3px rgba(184, 115, 51, 0.4);
  }

  /* Warning — amber shift */
  .cb-spark--warning .cb-spark__seg--on {
    background: #e67e22;
    box-shadow: 0 0 3px rgba(230, 126, 34, 0.5);
  }

  /* Critical — red + pulse */
  .cb-spark--critical .cb-spark__seg--on {
    background: #c0392b;
    box-shadow: 0 0 4px rgba(192, 57, 43, 0.6);
    animation: spark-critical 1.2s ease-in-out infinite;
  }

  @keyframes spark-critical {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .cb-spark__readout {
    display: flex;
    align-items: baseline;
    gap: 3px;
    font-family: var(--font-mono);
  }

  .cb-spark__val {
    font-size: 11px;
    font-weight: 600;
    color: #b87333;
    letter-spacing: 0.02em;
  }

  .cb-spark--warning .cb-spark__val  { color: #e67e22; }
  .cb-spark--critical .cb-spark__val { color: #c0392b; }

  .cb-spark__div {
    font-size: 10px;
    color: rgba(160, 152, 128, 0.3);
  }

  .cb-spark__cap {
    font-size: 10px;
    color: rgba(160, 152, 128, 0.45);
    letter-spacing: 0.02em;
  }

  .cb-spark__lbl {
    font-size: 9px;
    font-weight: 600;
    color: rgba(160, 152, 128, 0.35);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-left: 5px;
  }
</style>
