<script lang="ts">
  import { PARABOLA_CARDS } from './lib/cardsData';

  // ── State ────────────────────────────────────────────────────────────────
  let index     = $state(0);
  let direction = $state<'fwd' | 'back'>('fwd');
  let hovered   = $state(false);
  let touched   = $state(false);

  const total   = PARABOLA_CARDS.length;
  let card      = $derived(PARABOLA_CARDS[index]);
  let canBack   = $derived(index > 0);
  let canFwd    = $derived(index < total - 1);
  let arrowsOn  = $derived(hovered || touched);

  // ── Navigation ───────────────────────────────────────────────────────────
  function go(delta: 1 | -1) {
    const next = index + delta;
    if (next < 0 || next >= total) return;
    direction = delta === 1 ? 'fwd' : 'back';
    index = next;
  }

  function onContainerPointer() {
    if (!touched) touched = true;
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1);  }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
  }

  // ── Swipe ────────────────────────────────────────────────────────────────
  let swipeStartX = 0;
  let swipeStartY = 0;
  const SWIPE_THRESHOLD = 44;

  function onPointerDown(e: PointerEvent) {
    swipeStartX = e.clientX;
    swipeStartY = e.clientY;
  }

  function onPointerUp(e: PointerEvent) {
    const dx = e.clientX - swipeStartX;
    const dy = e.clientY - swipeStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) go(1);
      else         go(-1);
    }
  }
</script>

<svelte:options css="injected" />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<main
  class="module-shell"
  role="region"
  aria-label="Parabola standard forms"
  onkeydown={onKeydown}
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
  onpointerdown={onContainerPointer}
>
  <div class="carousel-track">

    <!-- Left arrow -->
    <button
      class="nav-arrow nav-arrow--left"
      class:visible={arrowsOn && canBack}
      onclick={() => go(-1)}
      disabled={!canBack}
      aria-label="Previous card"
      tabindex={canBack ? 0 : -1}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>

    <!-- Card -->
    <div
      class="card-viewport"
      onpointerdown={onPointerDown}
      onpointerup={onPointerUp}
      role="presentation"
    >
      {#key index}
        <article
          class="form-card"
          class:anim-fwd={direction === 'fwd'}
          class:anim-back={direction === 'back'}
          aria-label="{card.direction} parabola: {card.equationHtml.replace(/<[^>]+>/g, '')}"
        >
          <!-- Direction badge + mini SVG -->
          <header class="card-header">
            <div class="preview-svg">{@html card.svgHtml}</div>
            <span class="direction-badge">{card.direction.toUpperCase()}</span>
          </header>

          <!-- Equation -->
          <div class="equation-row">
            <span class="equation">{@html card.equationHtml}</span>
          </div>

          <hr class="divider" />

          <!-- Focus & Directrix -->
          <div class="meta-grid">
            <div class="meta-col">
              <span class="meta-label">FOCUS</span>
              <span class="meta-value">{card.focus}</span>
            </div>
            <div class="meta-col">
              <span class="meta-label">DIRECTRIX</span>
              <span class="meta-value">{card.directrix}</span>
            </div>
          </div>

          <hr class="divider" />

          <!-- Axis of symmetry -->
          <div class="axis-row">
            <span class="axis-bullet" aria-hidden="true">●</span>
            <span class="axis-text">Axis: <strong>{card.axis}</strong></span>
          </div>
        </article>
      {/key}
    </div>

    <!-- Right arrow -->
    <button
      class="nav-arrow nav-arrow--right"
      class:visible={arrowsOn && canFwd}
      onclick={() => go(1)}
      disabled={!canFwd}
      aria-label="Next card"
      tabindex={canFwd ? 0 : -1}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>

  </div>

  <!-- Dot indicators -->
  <div class="dots" role="tablist" aria-label="Card position">
    {#each PARABOLA_CARDS as _, i}
      <button
        class="dot"
        class:dot--active={i === index}
        role="tab"
        aria-selected={i === index}
        aria-label="Card {i + 1} of {total}"
        onclick={() => { direction = i > index ? 'fwd' : 'back'; index = i; }}
      ></button>
    {/each}
  </div>
</main>