<script lang="ts">
  import { parabolaPoints, safeP, fmtP } from './lib/math';

  // ── Graph geometry (fixed) ───────────────────────────────────────────────
  const VW    = 600;
  const VH    = 440;
  const CX    = VW / 2;   // 300 — vertex x
  const CY    = VH / 2;   // 220 — vertex y
  const SCALE = 8;        // px per unit; at p=±20 focus sits 160px from vertex

  // Grid: every 5 units = 40px
  const GRID_STEP_PX = 5 * SCALE;
  const gridXs = Array.from(
    { length: Math.ceil(VW / GRID_STEP_PX) + 1 },
    (_, i) => i * GRID_STEP_PX
  );
  const gridYs = Array.from(
    { length: Math.ceil(VH / GRID_STEP_PX) + 1 },
    (_, i) => i * GRID_STEP_PX
  );

  // ── State ────────────────────────────────────────────────────────────────
  let pRaw = $state(2.0);
  let p    = $derived(safeP(pRaw));

  // ── Derived SVG coords ───────────────────────────────────────────────────
  let focusX      = $derived(CX);
  let focusY      = $derived(CY - p * SCALE);
  let directrixY  = $derived(CY + p * SCALE);
  let points      = $derived(parabolaPoints(p, CX, CY, SCALE));

  // ── Derived display strings ──────────────────────────────────────────────
  let pDisplay         = $derived(`p = ${fmtP(pRaw === 0 ? 0 : pRaw)}`);
  let focusDisplay     = $derived(`(0, ${fmtP(p)})`);
  let directrixDisplay = $derived(`y = ${fmtP(-p)}`);

  // ── Label positions — nudge away from vertex when p is very small ────────
  // Focus label: right of dot, pushed up enough so it clears the dot.
  let focusLabelX  = $derived(focusX + 14);
  let focusLabelY  = $derived(focusY);

  // Directrix label: right end of line.
  let dirLabelX = VW - 10;
  let dirLabelY = $derived(directrixY);
</script>

<svelte:options css="injected" />

<main class="module-shell">

  <!-- ── Graph ──────────────────────────────────────────────────────────── -->
  <div class="graph-wrap">
    <svg
      viewBox="0 0 {VW} {VH}"
      class="graph-svg"
      role="img"
      aria-label="Interactive parabola graph"
    >
      <defs>
        <!-- All drawn elements clip to the graph rect -->
        <clipPath id="graph-clip">
          <rect width={VW} height={VH} />
        </clipPath>
      </defs>

      <g clip-path="url(#graph-clip)">

        <!-- Background -->
        <rect width={VW} height={VH} fill="transparent" />

        <!-- Grid lines -->
        {#each gridXs as gx}
          <line x1={gx} y1="0" x2={gx} y2={VH}
            stroke="#1a4b84" stroke-width="0.75" opacity="0.35" />
        {/each}
        {#each gridYs as gy}
          <line x1="0" y1={gy} x2={VW} y2={gy}
            stroke="#1a4b84" stroke-width="0.75" opacity="0.35" />
        {/each}

        <!-- Cartesian axes -->
        <line x1={CX} y1="0" x2={CX} y2={VH}
          stroke="#1a4b84" stroke-width="1.5" opacity="0.6" />
        <line x1="0" y1={CY} x2={VW} y2={CY}
          stroke="#1a4b84" stroke-width="1.5" opacity="0.6" />

        <!-- Axis of symmetry (dashed, over the y-axis) -->
        <line x1={CX} y1="0" x2={CX} y2={VH}
          stroke="#1a4b84" stroke-width="1.5"
          stroke-dasharray="7 5" opacity="0.75" />

        <!-- Axis of symmetry label -->
        <g transform="translate({CX + 8}, 18)">
          <text class="lbl-name" text-anchor="start">AXIS OF SYMMETRY</text>
          <text class="lbl-value" text-anchor="start" dy="16">x = 0</text>
        </g>

        <!-- Directrix line -->
        <line x1="0" y1={directrixY} x2={VW} y2={directrixY}
          stroke="#dc2626" stroke-width="2.5"
          stroke-dasharray="10 5" />

        <!-- Directrix label -->
        <g transform="translate({dirLabelX}, {dirLabelY})">
          <text class="lbl-name" text-anchor="end" dy="-10">DIRECTRIX</text>
          <text class="lbl-value lbl-directrix" text-anchor="end" dy="6">{directrixDisplay}</text>
        </g>

        <!-- Parabola curve -->
        <polyline
          points={points}
          stroke="#00b4d8"
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Parabola equation label — upper-left corner -->
        <g transform="translate(12, 18)">
          <text class="lbl-name" text-anchor="start">PARABOLA</text>
          <text class="lbl-value" text-anchor="start" dy="16">x² = 4py</text>
        </g>

        <!-- Vertex dot -->
        <circle cx={CX} cy={CY} r="5" fill="white" opacity="0.7" />

        <!-- Focus dot -->
        <circle cx={focusX} cy={focusY} r="7" fill="#ffc857" />

        <!-- Focus label -->
        <g transform="translate({focusLabelX}, {focusLabelY})">
          <text class="lbl-name" text-anchor="start" dy="-8">FOCUS</text>
          <text class="lbl-value lbl-focus" text-anchor="start" dy="8">{focusDisplay}</text>
        </g>

      </g><!-- /clip -->
    </svg>
  </div>

  <!-- ── Controls ───────────────────────────────────────────────────────── -->
  <div class="controls">
    <div class="slider-row">
      <span class="slider-label">Focal Distance</span>
      <input
        class="p-slider"
        type="range"
        min="-20"
        max="20"
        step="0.10"
        bind:value={pRaw}
        aria-label="Focal distance p"
      />
      <span class="p-pill" aria-live="polite" aria-atomic="true">{pDisplay}</span>
    </div>
  </div>

</main>