<script lang="ts">
  import { parts } from './lib/partsData.ts';
  import { usePointerDrag } from './lib/usePointerDrag.ts';
  import { playTone, ensureAudioContext } from './lib/audio.ts';

  type SlotState = { id: string; locked: boolean };

  let availableIds = $state<Set<string>>(new Set(parts.map(p => p.id)));
  let slots      = $state<SlotState[]>(parts.map(p => ({ id: p.slotId, locked: false })));
  let activePart = $state<(typeof parts)[number] | null>(null);

  function initAudio() {
    ensureAudioContext();
  }

  function handleDrop(partId: string, targetSlotId: string | null) {
    const part = parts.find(p => p.id === partId)!;
    if (!targetSlotId || targetSlotId !== part.slotId) {
      playTone('warning');
      return;
    }
    const slot = slots.find(s => s.id === targetSlotId)!;
    slot.locked  = true;
    availableIds.delete(partId);
    activePart = part;          // show info card immediately on correct drop
    playTone('success');
  }

  function isLocked(slotId: string): boolean {
    return slots.find(s => s.id === slotId)?.locked ?? false;
  }

  function getSlotCoords(slotId: string): { x: number; y: number } {
    switch (slotId) {
      case 'slot-vertex':    return { x: 400, y: 400 };
      case 'slot-focus':     return { x: 400, y: 320 };
      case 'slot-directrix': return { x: 545, y: 480 };
      case 'slot-axis':      return { x: 400, y: 75  };
      case 'slot-p':         return { x: 455, y: 360 };
      default:               return { x: 400, y: 400 };
    }
  }
</script>

<svelte:options css="injected" />

<main class="module-shell" onpointerdown={initAudio}>
  <div class="diagram-area">
    <svg
      viewBox="0 0 800 560"
      class="parabola-svg"
      role="img"
      aria-label="Anatomy of a parabola diagram"
    >
      <!-- Directrix: horizontal line at y = vertex + p = 400 + 80 = 480 -->
      <line
        x1="180" y1="480" x2="600" y2="480"
        stroke="var(--md-sys-color-on-surface-variant)"
        stroke-width="2"
      />

      <!-- Axis of Symmetry: vertical dashed line through vertex (400,400) and focus (400,320) -->
      <line
        x1="400" y1="40" x2="400" y2="500"
        stroke="var(--md-sys-color-on-surface-variant)"
        stroke-width="1.5" stroke-dasharray="8 4"
      />

      <!-- Parabola curve.
           Bezier: M 150 150 Q 400 650 650 150
           Control at y=650 (outside viewBox) places bezier vertex exactly at (400, 400). -->
      <path
        d="M 150 150 Q 400 650 650 150"
        stroke="var(--md-sys-color-primary)"
        stroke-width="3.5" fill="none" stroke-linecap="round"
      />

      <!-- p measurement bracket between focus (400,320) and vertex (400,400) -->
      <line x1="428" y1="320" x2="428" y2="400" stroke="var(--md-sys-color-tertiary)" stroke-width="1.5" />
      <line x1="421" y1="320" x2="435" y2="320" stroke="var(--md-sys-color-tertiary)" stroke-width="1.5" />
      <line x1="421" y1="400" x2="435" y2="400" stroke="var(--md-sys-color-tertiary)" stroke-width="1.5" />

      <!-- Focus dot -->
      <circle cx="400" cy="320" r="6" fill="var(--md-sys-color-secondary)" />

      <!-- Vertex dot -->
      <circle cx="400" cy="400" r="8" fill="var(--md-sys-color-primary)" />

      <!-- Slot targets -->
      {#each parts as part (part.id)}
        {@const coords = getSlotCoords(part.slotId)}
        {@const locked = isLocked(part.slotId)}
        <g
          data-slot-id={part.slotId}
          class="slot-group"
          role="button"
          tabindex="0"
          aria-label="{part.name} drop zone"
          onclick={() => { if (locked) activePart = part; }}
          onkeydown={(e) => { if (locked && (e.key === 'Enter' || e.key === ' ')) activePart = part; }}
        >
          <!-- Transparent hit zone -->
          <circle cx={coords.x} cy={coords.y} r="28" fill="transparent" />
          <!-- Slot ring -->
          <circle
            cx={coords.x} cy={coords.y} r="13"
            fill={locked ? 'var(--md-sys-color-primary-container)' : 'transparent'}
            stroke={locked ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'}
            stroke-width="2"
            stroke-dasharray={locked ? undefined : '4 3'}
          />
          {#if locked}
            <circle cx={coords.x} cy={coords.y} r="5" fill="var(--md-sys-color-primary)" />
          {/if}
        </g>
      {/each}
    </svg>
  </div>

  <div class="wordbank">
    {#each parts.filter(p => availableIds.has(p.id)) as part (part.id)}
      <div
        class="chip"
        role="button"
        tabindex="0"
        aria-label="Drag {part.name} to its slot on the diagram"
        use:usePointerDrag={{ partId: part.id, onDrop: (slotId) => handleDrop(part.id, slotId) }}
      >
        {part.name}
      </div>
    {/each}
  </div>

  {#if activePart}
    <div
      class="info-backdrop"
      role="presentation"
      onclick={() => activePart = null}
    >
      <div
        class="info-card"
        role="dialog"
        aria-modal="true"
        onclick={(e) => e.stopPropagation()}
      >
        <p class="info-name">{activePart.name}</p>
        <p class="info-definition">{activePart.definition}</p>
        <button class="dismiss-btn" onclick={() => activePart = null}>Got it</button>
      </div>
    </div>
  {/if}
</main>

<style>
  :root {
    --md-sys-color-primary:            #1A4B84;
    --md-sys-color-on-primary:         #FFFFFF;
    --md-sys-color-primary-container:  #DCE5F5;
    --md-sys-color-secondary:          #FFC857;
    --md-sys-color-tertiary:           #00B4D8;
    --md-sys-color-surface:            #FFFFFF;
    --md-sys-color-on-surface:         #1E293B;
    --md-sys-color-surface-variant:    #F1F5F9;
    --md-sys-color-on-surface-variant: #64748B;

    --md-sys-typescale-heading: 'Outfit', system-ui, sans-serif;
    --md-sys-typescale-body:    'Plus Jakarta Sans', system-ui, sans-serif;

    --md-sys-shape-corner-medium: 12px;
    --md-sys-shape-corner-full:   9999px;

    --md-sys-spacing-sm: 0.5rem;
    --md-sys-spacing-md: 1rem;
    --md-sys-spacing-lg: 1.5rem;
  }

  .module-shell {
    position: relative;
    width: 100vw;
    height: 100dvh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--md-sys-color-surface);
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-body);
  }

  .diagram-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 2vh 2vw;
    box-sizing: border-box;
    min-height: 0;
  }

  .parabola-svg {
    width: min(90vw, 720px);
    height: auto;
    overflow: visible;
  }

  .slot-group {
    cursor: pointer;
  }

  .slot-group:focus-visible circle:nth-child(2) {
    filter: drop-shadow(0 0 5px var(--md-sys-color-primary));
  }

  .wordbank {
    display: flex;
    gap: clamp(0.5rem, 2vw, 1rem);
    padding: var(--md-sys-spacing-md) var(--md-sys-spacing-lg);
    flex-wrap: wrap;
    justify-content: center;
    flex-shrink: 0;
  }

  .chip {
    padding: 0.55em 1.1em;
    background: var(--md-sys-color-surface-variant);
    border: 1.5px solid var(--md-sys-color-on-surface-variant);
    border-radius: var(--md-sys-shape-corner-full);
    font-weight: 600;
    font-size: clamp(0.8rem, 1.5vw, 0.95rem);
    cursor: grab;
    user-select: none;
    touch-action: none;
    color: var(--md-sys-color-on-surface);
    transition: border-color 0.15s, background 0.15s, color 0.15s;
  }

  .chip:hover {
    background: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-primary);
  }

  .chip:active {
    cursor: grabbing;
  }

  .info-backdrop {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(30, 41, 59, 0.2);
    z-index: 20;
  }

  .info-card {
    background: var(--md-sys-color-surface);
    border: 1px solid var(--md-sys-color-surface-variant);
    border-radius: var(--md-sys-shape-corner-medium);
    padding: var(--md-sys-spacing-lg);
    max-width: min(320px, 80vw);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--md-sys-spacing-sm);
  }

  .info-name {
    font-family: var(--md-sys-typescale-heading);
    font-size: clamp(1rem, 2vw, 1.25rem);
    font-weight: 700;
    color: var(--md-sys-color-primary);
    margin: 0;
  }

  .info-definition {
    font-size: clamp(0.85rem, 1.5vw, 0.95rem);
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
    margin: 0;
  }

  .dismiss-btn {
    margin-top: var(--md-sys-spacing-sm);
    padding: 0.5em 1.5em;
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-primary);
    border: none;
    border-radius: var(--md-sys-shape-corner-full);
    font-family: var(--md-sys-typescale-body);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .dismiss-btn:hover {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
</style>