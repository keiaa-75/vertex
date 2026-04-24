<script lang="ts">
  import { parts } from './lib/partsData.ts';
  import { usePointerDrag } from './lib/usePointerDrag.ts';
  import { audio } from './lib/audio.ts';

  type SlotState = { id: string; locked: boolean };

  let slots      = $state<SlotState[]>(parts.map(p => ({ id: p.slotId, locked: false })));
  let activePart = $state<(typeof parts)[number] | null>(null);

  function handleDrop(partId: string, targetSlotId: string | null) {
    const part = parts.find(p => p.id === partId)!;
    if (!targetSlotId || targetSlotId !== part.slotId) {
      audio.play('warning');
      return;
    }
    const slot = slots.find(s => s.id === targetSlotId)!;
    slot.locked = true;
    activePart  = part;
    audio.play('success');
  }

  function isLocked(slotId: string): boolean {
    return slots.find(s => s.id === slotId)?.locked ?? false;
  }

  function getSlotCoords(slotId: string): { x: number; y: number } {
    switch (slotId) {
      case 'slot-vertex':    return { x: 300, y: 300 };
      case 'slot-focus':     return { x: 300, y: 240 };
      case 'slot-directrix': return { x: 410, y: 360 };
      case 'slot-axis':      return { x: 300, y: 42  };
      case 'slot-p':         return { x: 345, y: 270 };
      default:               return { x: 300, y: 300 };
    }
  }
</script>

<svelte:options css="injected" />

<main class="module-shell" onpointerdown={() => audio.ensureContext()}>
  <div class="diagram-area">
    <svg
      viewBox="0 0 600 420"
      class="parabola-svg"
      role="img"
      aria-label="Anatomy of a parabola diagram"
    >
      <line x1="135" y1="360" x2="450" y2="360"
        stroke="var(--md-sys-color-on-surface-variant)" stroke-width="2" />

      <line x1="300" y1="20" x2="300" y2="390"
        stroke="var(--md-sys-color-on-surface-variant)"
        stroke-width="1.5" stroke-dasharray="7 4" />

      <path d="M 112 112 Q 300 487 487 112"
        stroke="var(--md-sys-color-primary)"
        stroke-width="3.5" fill="none" stroke-linecap="round" />

      <line x1="322" y1="240" x2="322" y2="300" stroke="var(--md-sys-color-tertiary)" stroke-width="1.5" />
      <line x1="316" y1="240" x2="328" y2="240" stroke="var(--md-sys-color-tertiary)" stroke-width="1.5" />
      <line x1="316" y1="300" x2="328" y2="300" stroke="var(--md-sys-color-tertiary)" stroke-width="1.5" />

      <circle cx="300" cy="240" r="5" fill="var(--md-sys-color-secondary)" />
      <circle cx="300" cy="300" r="7" fill="var(--md-sys-color-primary)" />

      {#each parts as part (part.id)}
        {@const c      = getSlotCoords(part.slotId)}
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
          <circle cx={c.x} cy={c.y} r="26" fill="transparent" />
          <circle
            cx={c.x} cy={c.y} r="12"
            fill={locked ? 'var(--md-sys-color-primary-container)' : 'transparent'}
            stroke={locked ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'}
            stroke-width="2"
            stroke-dasharray={locked ? undefined : '4 3'}
          />
          {#if locked}
            <circle cx={c.x} cy={c.y} r="4" fill="var(--md-sys-color-primary)" />
          {/if}
        </g>
      {/each}
    </svg>
  </div>

  <div class="wordbank">
    {#each parts as part (part.id)}
      {@const locked = isLocked(part.slotId)}
      {#if locked}
        <div class="chip chip-done" aria-label="{part.name} — placed">
          {part.name}
        </div>
      {:else}
        <div
          class="chip"
          role="button"
          tabindex="0"
          aria-label="Drag {part.name} to its slot on the diagram"
          use:usePointerDrag={{ partId: part.id, onDrop: (slotId) => handleDrop(part.id, slotId) }}
        >
          {part.name}
        </div>
      {/if}
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
        tabindex="-1"
        aria-modal="true"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <p class="info-name">{activePart.name}</p>
        <p class="info-definition">{activePart.definition}</p>
        <button class="dismiss-btn" onclick={() => activePart = null}>Got it</button>
      </div>
    </div>
  {/if}
</main>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    height: 100%;
  }

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

    --md-sys-spacing-xs: 0.25rem;
    --md-sys-spacing-sm: 0.5rem;
    --md-sys-spacing-md: 1rem;
    --md-sys-spacing-lg: 1.5rem;
  }

  .module-shell {
    position: relative;
    width: 100%;
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
    min-height: 0;
    width: 100%;
    overflow: hidden;
    padding: clamp(0.25rem, 1vh, 1rem) 1rem 0;
    box-sizing: border-box;
  }

  .parabola-svg {
    height: clamp(180px, 55dvh, 420px);
    width: auto;
    max-width: 100%;
    display: block;
    overflow: hidden;
  }

  .slot-group {
    cursor: pointer;
    outline: none;
  }

  .slot-group:focus-visible circle:nth-child(2) {
    stroke: var(--md-sys-color-tertiary);
    stroke-width: 2.5;
  }

  .wordbank {
    display: flex;
    gap: clamp(0.4rem, 1.5vw, 0.75rem);
    padding: clamp(0.25rem, 0.75vh, 0.6rem) var(--md-sys-spacing-md)
             clamp(0.5rem, 1.5vh, 1rem);
    flex-wrap: wrap;
    justify-content: center;
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
  }

  .chip {
    padding: 0.45em 1em;
    background: var(--md-sys-color-surface-variant);
    border: 1.5px solid var(--md-sys-color-on-surface-variant);
    border-radius: var(--md-sys-shape-corner-full);
    font-weight: 600;
    font-size: clamp(0.75rem, 1.4vw, 0.9rem);
    cursor: grab;
    user-select: none;
    touch-action: none;
    color: var(--md-sys-color-on-surface);
    outline: none;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
  }

  .chip:hover {
    background: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-primary);
  }

  .chip:focus-visible {
    box-shadow: 0 0 0 3px var(--md-sys-color-primary-container),
                0 0 0 4.5px var(--md-sys-color-primary);
  }

  .chip:active {
    cursor: grabbing;
  }

  .chip-done {
    opacity: 0.38;
    cursor: default;
    pointer-events: none;
    border-style: dashed;
    border-color: var(--md-sys-color-on-surface-variant);
    background: transparent;
    color: var(--md-sys-color-on-surface-variant);
  }

  .info-backdrop {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(30, 41, 59, 0.18);
    z-index: 20;
  }

  .info-card {
    background: var(--md-sys-color-surface);
    border: 1px solid var(--md-sys-color-surface-variant);
    border-radius: var(--md-sys-shape-corner-medium);
    padding: var(--md-sys-spacing-lg);
    max-width: min(300px, 80vw);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--md-sys-spacing-sm);
    outline: none;
  }

  .info-name {
    font-family: var(--md-sys-typescale-heading);
    font-size: clamp(1rem, 2vw, 1.2rem);
    font-weight: 700;
    color: var(--md-sys-color-primary);
    margin: 0;
  }

  .info-definition {
    font-size: clamp(0.82rem, 1.4vw, 0.92rem);
    line-height: 1.55;
    color: var(--md-sys-color-on-surface-variant);
    margin: 0;
  }

  .dismiss-btn {
    margin-top: var(--md-sys-spacing-xs);
    padding: 0.45em 1.4em;
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-primary);
    border: none;
    border-radius: var(--md-sys-shape-corner-full);
    font-family: var(--md-sys-typescale-body);
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    outline: none;
    transition: background 0.15s, color 0.15s;
  }

  .dismiss-btn:hover {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }

  .dismiss-btn:focus-visible {
    box-shadow: 0 0 0 3px var(--md-sys-color-primary-container),
                0 0 0 4.5px var(--md-sys-color-primary);
  }
</style>