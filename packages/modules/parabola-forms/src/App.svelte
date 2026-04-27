<script lang="ts">
  import { getRows, DIRECTIONS, type VertexMode, type LayoutMode, type Direction } from './lib/formsData';
  import SegmentedControl from './lib/SegmentedControl.svelte';
  import CustomSelect from './lib/CustomSelect.svelte';

  // ── State ────────────────────────────────────────────────────────────────
  let vertexMode = $state<VertexMode>('00');
  let layoutMode = $state<LayoutMode>('table');
  let selectedDir = $state<Direction>('Upward');

  let rows = $derived(getRows(vertexMode));
  let selectedRow = $derived(rows.find(r => r.direction === selectedDir) ?? rows[0]);

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
    { value: '00' as VertexMode, label: 'Vertex (0,0)' },
    { value: 'hk' as VertexMode, label: 'Vertex (h,k)' },
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
              <tr>
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
        {/key}
      </div>
    {/if}

  </div>
</main>