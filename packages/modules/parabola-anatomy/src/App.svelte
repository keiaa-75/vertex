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