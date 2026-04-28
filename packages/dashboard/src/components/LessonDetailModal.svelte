<script lang="ts">
  import type { Lesson, Progress } from '@vertex/shared';

  let { lesson, progress, onClose, onNavigate }: {
    lesson: Lesson;
    progress: Progress | null;
    onClose: () => void;
    onNavigate: () => void;
  } = $props();

  // ── Score derivations ────────────────────────────────────────────────────
  let pretestScore  = $derived(progress?.pretestScore  ?? null);
  let posttestScore = $derived(progress?.quizScore     ?? null);

  let delta = $derived(
    pretestScore !== null && posttestScore !== null
      ? posttestScore - pretestScore
      : null
  );

  type MasteryLevel = { label: string; tone: 'advanced' | 'proficient' | 'developing' | 'beginning' };

  function getMastery(score: number): MasteryLevel {
    if (score >= 85) return { label: 'Advanced',    tone: 'advanced'   };
    if (score >= 75) return { label: 'Proficient',  tone: 'proficient' };
    if (score >= 60) return { label: 'Developing',  tone: 'developing' };
    return              { label: 'Beginning',   tone: 'beginning'  };
  }

  let mastery = $derived(posttestScore !== null ? getMastery(posttestScore) : null);

  function fmtScore(n: number): string {
    return n % 1 === 0 ? `${n}%` : `${n.toFixed(1)}%`;
  }

  function fmtDelta(d: number): string {
    const abs = Math.abs(d);
    const str = abs % 1 === 0 ? `${abs} pts` : `${abs.toFixed(1)} pts`;
    return d > 0 ? `+${str}` : d < 0 ? `−${str}` : 'No change';
  }

  // Close on Escape
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onClose} role="presentation">
  <div
    class="modal-card"
    role="dialog"
    aria-modal="true"
    aria-label="Lesson score detail"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="modal-header">
      <span class="modal-title">{lesson.title}</span>
      <button class="modal-close-btn" onclick={onClose} aria-label="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <!-- Score section -->
    <div class="modal-body">

      <!-- Pre-test -->
      <div class="score-block">
        <div class="score-row-label">
          <span class="score-tag">Pre-test</span>
          {#if pretestScore !== null}
            <span class="score-pct">{fmtScore(pretestScore)}</span>
          {:else}
            <span class="score-none">Not taken yet</span>
          {/if}
        </div>
        <div class="bar-track">
          <div
            class="bar-fill bar-fill--pre"
            style:width={pretestScore !== null ? `${pretestScore}%` : '0%'}
            style:opacity={pretestScore !== null ? '1' : '0'}
          ></div>
        </div>
      </div>

      <!-- Post-test -->
      <div class="score-block">
        <div class="score-row-label">
          <span class="score-tag">Post-test</span>
          {#if posttestScore !== null}
            <span class="score-pct">{fmtScore(posttestScore)}</span>
          {:else}
            <span class="score-none">Not taken yet</span>
          {/if}
        </div>
        <div class="bar-track">
          <div
            class="bar-fill bar-fill--post"
            style:width={posttestScore !== null ? `${posttestScore}%` : '0%'}
            style:opacity={posttestScore !== null ? '1' : '0'}
          ></div>
        </div>
      </div>

      <!-- Mastery + delta row (only when post-test exists) -->
      {#if posttestScore !== null || delta !== null}
        <div class="insight-row">
          {#if mastery}
            <span class="mastery-badge mastery-{mastery.tone}">{mastery.label}</span>
          {/if}

          {#if delta !== null}
            <span
              class="delta-pill"
              class:delta-up={delta > 0}
              class:delta-down={delta < 0}
              class:delta-flat={delta === 0}
              aria-label="Score change from pre-test to post-test: {fmtDelta(delta)}"
            >
              {#if delta > 0}
                <span class="delta-arrow" aria-hidden="true">↑</span>
              {:else if delta < 0}
                <span class="delta-arrow" aria-hidden="true">↓</span>
              {:else}
                <span class="delta-arrow" aria-hidden="true">→</span>
              {/if}
              {fmtDelta(delta)}
            </span>
          {/if}
        </div>

        <!-- Diagnostic message -->
        {#if delta !== null}
          <p class="delta-message" class:positive={delta > 0} class:negative={delta < 0}>
            {#if delta > 10}
              Great improvement from your pre-test! Keep it up.
            {:else if delta > 0}
              You improved since your pre-test.
            {:else if delta === 0}
              Your score stayed the same — consider reviewing the material.
            {:else if delta > -15}
              Your score dipped a little from your pre-test. Worth a review.
            {:else}
              Significant drop from pre-test. Revisit the lesson before retaking.
            {/if}
          </p>
        {/if}
      {/if}

    </div>

    <!-- Footer -->
    <div class="modal-footer">
      <button class="btn-view-lesson" onclick={onNavigate}>
        <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
        View Lesson
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(15, 23, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-card {
    background: var(--md-sys-color-surface);
    border-radius: var(--md-sys-shape-corner-extra-large);
    width: 100%;
    max-width: 360px;
    box-shadow: var(--md-sys-elevation-3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modal-pop 0.2s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  }

  @keyframes modal-pop {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Header ─────────────────────────────────────────────────── */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 1rem 1rem 0.875rem 1.25rem;
    border-bottom: 1px solid var(--md-sys-color-surface-variant);
  }

  .modal-title {
    font-family: var(--md-sys-typescale-heading);
    font-size: 1rem;
    font-weight: 700;
    color: var(--md-sys-color-primary);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .modal-close-btn {
    all: unset;
    cursor: pointer;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: var(--md-sys-shape-corner-full);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--md-sys-color-on-surface-variant);
    transition: background 0.15s;
  }

  .modal-close-btn:hover {
    background: var(--md-sys-color-surface-variant);
  }

  /* ── Body ───────────────────────────────────────────────────── */
  .modal-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ── Score blocks ───────────────────────────────────────────── */
  .score-block {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .score-row-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .score-tag {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
  }

  .score-pct {
    font-family: var(--md-sys-typescale-heading);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }

  .score-none {
    font-size: 0.8rem;
    font-style: italic;
    color: var(--md-sys-color-on-surface-variant);
    opacity: 0.7;
  }

  .bar-track {
    height: 8px;
    background: var(--md-sys-color-surface-variant);
    border-radius: var(--md-sys-shape-corner-full);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: var(--md-sys-shape-corner-full);
    transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .bar-fill--pre {
    background: var(--md-sys-color-tertiary);
  }

  .bar-fill--post {
    background: var(--md-sys-color-primary);
  }

  /* ── Insight row ────────────────────────────────────────────── */
  .insight-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.25rem;
  }

  .mastery-badge {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 0.3em 0.85em;
    border-radius: var(--md-sys-shape-corner-full);
  }

  .mastery-advanced {
    background: #D1FAE5;
    color: #065F46;
  }

  .mastery-proficient {
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-primary);
  }

  .mastery-developing {
    background: #FEF3C7;
    color: #92400E;
  }

  .mastery-beginning {
    background: #FEE2E2;
    color: #991B1B;
  }

  .delta-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.3em 0.75em;
    border-radius: var(--md-sys-shape-corner-full);
  }

  .delta-up {
    background: #D1FAE5;
    color: #065F46;
  }

  .delta-down {
    background: #FEE2E2;
    color: #991B1B;
  }

  .delta-flat {
    background: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface-variant);
  }

  .delta-arrow {
    font-style: normal;
    line-height: 1;
  }

  .delta-message {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.45;
    color: var(--md-sys-color-on-surface-variant);
  }

  .delta-message.positive { color: #065F46; }
  .delta-message.negative { color: #991B1B; }

  /* ── Footer ─────────────────────────────────────────────────── */
  .modal-footer {
    padding: 0 1.25rem 1.25rem;
  }

  .btn-view-lesson {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    border-radius: var(--md-sys-shape-corner-full);
    font-family: var(--md-sys-typescale-body);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--md-sys-elevation-1);
    transition: box-shadow 0.2s, transform 0.12s;
  }

  .btn-view-lesson:hover {
    box-shadow: var(--md-sys-elevation-2);
  }

  .btn-view-lesson:active {
    transform: scale(0.97);
  }
</style>