<script lang="ts">
  import { getRows, DIRECTIONS, type VertexMode, type LayoutMode, type Direction, type FormRow } from './lib/formsData';
  import SegmentedControl from './lib/SegmentedControl.svelte';
  import CustomSelect from './lib/CustomSelect.svelte';
  import ParabolaIllustration from './lib/ParabolaIllustration.svelte';

  // ── State ────────────────────────────────────────────────────────────────
  let vertexMode  = $state<VertexMode>('00');
  let layoutMode  = $state<LayoutMode>('table');
  let selectedDir = $state<Direction>('Upward');
  let activeRow   = $state<FormRow | null>(null);

  let rows        = $derived(getRows(vertexMode));
  let selectedRow = $derived(rows.find(r => r.direction === selectedDir) ?? rows[0]);

  // ── Modal helpers ────────────────────────────────────────────────────────
  let modalSource = $state<'table' | 'list' | null>(null);
  function openRow(row: FormRow) { activeRow = row; modalSource = 'table'; }
  function openListModal() { modalSource = 'list'; }
  function closeModal() { activeRow = null; modalSource = null; }

  function onRowKey(e: KeyboardEvent, row: FormRow) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRow(row); }
  }

  function onOverlayKey(e: KeyboardEvent) {
    if (e.key === 'Escape') closeModal();
  }

  // ── SVG icons (inline, no external dep) ─────────────────────────────────
  const ICON_TABLE = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="14" height="14" rx="1.5"/>
    <line x1="1" y1="5.5" x2="15" y2="5.5"/>
    <line x1="6" y1="5.5" x2="6" y2="15"/>
  </svg>`;

  const ICON_LIST = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
    <line x1="5" y1="4" x2="15" y2="4"/>
    <line x1="5" y1="8" x2="15" y2="8"/>
    <line x1="5" y1="12" x2="15" y2="12"/>
    <circle cx="2" cy="4" r="1" fill="currentColor" stroke="none"/>
    <circle cx="2" cy="8" r="1" fill="currentColor" stroke="none"/>
    <circle cx="2" cy="12" r="1" fill="currentColor" stroke="none"/>
  </svg>`;

  const vertexOptions = [
    { value: '00' as VertexMode, label: '(0,0)' },
    { value: 'hk' as VertexMode, label: '(h,k)' },
  ];

  const layoutOptions = [
    { value: 'table' as LayoutMode, label: 'Table', iconHtml: ICON_TABLE },
    { value: 'list'  as LayoutMode, label: 'List',  iconHtml: ICON_LIST  },
  ];

  const directionOptions = DIRECTIONS.map(dir => ({ value: dir, label: dir }));
</script>

<svelte:options css="injected" />

<main class="module-shell">

  <!-- ── Controls bar ──────────────────────────────────────────────────── -->
  <div class="controls-bar">
    <SegmentedControl
      label="Vertex Position"
      options={vertexOptions}
      value={vertexMode}
      onchange={(v) => (vertexMode = v)}
    />
    <SegmentedControl
      label="Layout"
      options={layoutOptions}
      value={layoutMode}
      onchange={(v) => (layoutMode = v)}
    />
  </div>

  <div class="divider"></div>

  <!-- ── Content ───────────────────────────────────────────────────────── -->
  <div class="content">

    {#if layoutMode === 'table'}
      <!-- TABLE LAYOUT -->
      <div class="table-scroll" role="region" aria-label="Standard forms table">
        <table class="forms-table">
          <thead>
            <tr>
              <th>DIRECTION</th>
              <th>EQUATION</th>
              <th>FOCUS</th>
              <th>DIRECTRIX</th>
              <th>AXIS</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as row (row.direction)}
              <!-- svelte-ignore a11y_interactive_supports_focus -->
              <tr
                tabindex="0"
                onclick={() => openRow(row)}
                onkeydown={(e) => onRowKey(e, row)}
                title="View {row.direction} parabola illustration"
              >
                <td class="col-direction">{row.direction}</td>
                <td class="col-equation">{@html row.equationHtml}</td>
                <td class="col-math">{row.focus}</td>
                <td class="col-math">{row.directrix}</td>
                <td class="col-math">{row.axis}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Hint -->
      <p class="table-hint">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
          width="12" height="12" style="vertical-align:-1px;flex-shrink:0" aria-hidden="true">
          <circle cx="8" cy="8" r="7"/>
          <line x1="8" y1="5" x2="8" y2="9"/>
          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" stroke="none"/>
        </svg>
        Tap a row to see its parabola
      </p>

    {:else}
      <!-- LIST LAYOUT -->
      <div class="list-layout">
        <!-- Direction picker -->
        <div class="list-picker">
          <CustomSelect
            label="Direction"
            options={directionOptions}
            bind:value={selectedDir}
          />
        </div>

        <!-- Detail card -->
        {#key selectedDir + vertexMode}
          <dl class="detail-card">
            <div class="detail-row">
              <dt>EQUATION</dt>
              <dd class="dd-equation">{@html selectedRow.equationHtml}</dd>
            </div>
            <div class="detail-row">
              <dt>FOCUS</dt>
              <dd class="dd-math">{selectedRow.focus}</dd>
            </div>
            <div class="detail-row">
              <dt>DIRECTRIX</dt>
              <dd class="dd-math">{selectedRow.directrix}</dd>
            </div>
            <div class="detail-row detail-row--last">
              <dt>AXIS</dt>
              <dd class="dd-math">{selectedRow.axis}</dd>
            </div>
          </dl>

          <button class="list-view-btn" onclick={() => { activeRow = selectedRow; openListModal(); }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" aria-hidden="true">
              <circle cx="8" cy="8" r="7"/>
              <line x1="8" y1="5" x2="8" y2="9"/>
              <circle cx="8" cy="11.5" r="0.75" fill="currentColor" stroke="none"/>
            </svg>
            View illustration
          </button>

          <!-- Inline illustration for list view -->
          <!-- <div class="list-illustration">
            <ParabolaIllustration direction={selectedDir} />
          </div> -->
        {/key}
      </div>
    {/if}

  </div>

  <!-- ── Modal ─────────────────────────────────────────────────────────── -->
  {#if activeRow}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="{activeRow.direction} parabola"
      onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      onkeydown={onOverlayKey}
    >
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-direction">{activeRow.direction}</span>
            <span class="modal-equation">{@html activeRow.equationHtml}</span>
          </div>
          <button class="modal-close" onclick={closeModal} aria-label="Close illustration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
              <line x1="18" y1="6"  x2="6"  y2="18" />
              <line x1="6"  y1="6"  x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <ParabolaIllustration direction={activeRow.direction} />
        </div>
      </div>
    </div>
  {/if}

</main>