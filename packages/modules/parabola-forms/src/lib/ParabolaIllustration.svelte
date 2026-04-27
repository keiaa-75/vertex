<script lang="ts">
  import type { Direction } from './formsData';

  let { direction }: { direction: Direction } = $props();

  // Unique clip-path id per instance — avoids id collisions when
  // both the list-view illustration and a modal render simultaneously.
  const uid = Math.random().toString(36).slice(2, 7);

  const W = 240, H = 200, CX = 120, CY = 100, S = 20, P = 2;

  // ── Parabola curve ───────────────────────────────────────────────────────
  function makeCurve(dir: Direction): string {
    const isVert = dir === 'Upward' || dir === 'Downward';
    const sign   = (dir === 'Upward' || dir === 'Rightward') ? 1 : -1;
    return Array.from({ length: 91 }, (_, k) => {
      const u  = (k - 45) / 10;                       // -4.5 … 4.5 units
      const xu = isVert ? u : sign * u * u / (4 * P);
      const yu = isVert ? sign * u * u / (4 * P) : u;
      return `${(CX + xu * S).toFixed(1)},${(CY - yu * S).toFixed(1)}`;
    }).join(' ');
  }

  // ── Geometry per direction (SVG px) ─────────────────────────────────────
  type Line4 = [number, number, number, number];
  type Lbl   = { x: number; y: number; a: 'start' | 'end' | 'middle' };

  const GEO: Record<Direction, {
    focus:    { x: number; y: number };
    dirLine:  Line4;   // directrix line coords
    axisSym:  Line4;   // axis-of-symmetry line coords
    focusLbl: Lbl;
    dirLbl:   Lbl;
    vxLbl:    Lbl;
  }> = {
    Upward: {
      // opens up  → focus above vertex, directrix below
      focus:    { x: CX,         y: CY - P * S },
      dirLine:  [10, CY + P*S,   W-10, CY + P*S ],
      axisSym:  [CX, 6,          CX,   H-6       ],
      focusLbl: { x: CX + 8,  y: CY - P*S - 4,  a: 'start' },
      dirLbl:   { x: W - 12,  y: CY + P*S - 4,  a: 'end'   },
      vxLbl:    { x: CX + 8,  y: CY + 14,        a: 'start' },
    },
    Downward: {
      // opens down → focus below vertex, directrix above
      focus:    { x: CX,         y: CY + P * S },
      dirLine:  [10, CY - P*S,   W-10, CY - P*S ],
      axisSym:  [CX, 6,          CX,   H-6       ],
      focusLbl: { x: CX + 8,  y: CY + P*S + 14, a: 'start' },
      dirLbl:   { x: W - 12,  y: CY - P*S - 4,  a: 'end'   },
      vxLbl:    { x: CX + 8,  y: CY - 5,         a: 'start' },
    },
    Rightward: {
      // opens right → focus right of vertex, directrix left
      focus:    { x: CX + P * S, y: CY },
      dirLine:  [CX - P*S, 6, CX - P*S, H-6],
      axisSym:  [6,        CY, W-6,      CY ],
      focusLbl: { x: CX + P*S + 7, y: CY - 5, a: 'start' },
      dirLbl:   { x: CX - P*S - 4, y: 14,      a: 'end'   },
      vxLbl:    { x: CX - 8,       y: CY - 8,  a: 'end'   },
    },
    Leftward: {
      // opens left → focus left of vertex, directrix right
      focus:    { x: CX - P * S, y: CY },
      dirLine:  [CX + P*S, 6, CX + P*S, H-6],
      axisSym:  [6,        CY, W-6,      CY ],
      focusLbl: { x: CX - P*S - 7, y: CY - 5, a: 'end'   },
      dirLbl:   { x: CX + P*S + 4, y: 14,      a: 'start' },
      vxLbl:    { x: CX + 8,       y: CY - 8,  a: 'start' },
    },
  };

  let g   = $derived(GEO[direction]);
  let pts = $derived(makeCurve(direction));

  // Shared inline style for SVG text labels (avoids Svelte CSS-scope conflicts)
  const baseText = `font-family:'Plus Jakarta Sans',system-ui,sans-serif;
    font-size:9px;font-weight:700;letter-spacing:0.03em;
    paint-order:stroke fill;stroke:white;stroke-width:3.5px;stroke-linejoin:round`;
</script>

<svg
  viewBox="0 0 {W} {H}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="Parabola opening {direction.toLowerCase()}"
  style="display:block;width:100%;height:auto"
>
  <title>Parabola opening {direction.toLowerCase()}</title>
  <defs>
    <clipPath id="pi-clip-{uid}">
      <rect width={W} height={H} />
    </clipPath>
  </defs>

  <g clip-path="url(#pi-clip-{uid})">

    <!-- Coordinate axes (thin reference lines) -->
    <line x1="4"  y1={CY}  x2={W-4} y2={CY}  stroke="#CBD5E1" stroke-width="1" />
    <line x1={CX} y1="4"   x2={CX}  y2={H-4} stroke="#CBD5E1" stroke-width="1" />

    <!-- Axis of symmetry (dashed) -->
    <line
      x1={g.axisSym[0]} y1={g.axisSym[1]}
      x2={g.axisSym[2]} y2={g.axisSym[3]}
      stroke="#94A3B8" stroke-width="1.2" stroke-dasharray="5 3"
    />

    <!-- Directrix (green dashed) -->
    <line
      x1={g.dirLine[0]} y1={g.dirLine[1]}
      x2={g.dirLine[2]} y2={g.dirLine[3]}
      stroke="#059669" stroke-width="2" stroke-dasharray="8 4"
    />

    <!-- Parabola curve (primary blue) -->
    <polyline
      points={pts}
      stroke="#1A4B84"
      stroke-width="2.5"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Vertex marker (white circle with blue ring) -->
    <circle cx={CX} cy={CY} r="4.5" fill="white"   stroke="#1A4B84" stroke-width="2" />

    <!-- Focus marker (red filled with white core) -->
    <circle cx={g.focus.x} cy={g.focus.y} r="5.5" fill="#DC2626" />
    <circle cx={g.focus.x} cy={g.focus.y} r="2"   fill="white" opacity="0.7" />

    <!-- Label: Vertex -->
    <text
      x={g.vxLbl.x} y={g.vxLbl.y}
      text-anchor={g.vxLbl.a}
      style="{baseText};fill:#1A4B84"
    >Vertex</text>

    <!-- Label: Focus -->
    <text
      x={g.focusLbl.x} y={g.focusLbl.y}
      text-anchor={g.focusLbl.a}
      style="{baseText};fill:#DC2626"
    >Focus</text>

    <!-- Label: Directrix -->
    <text
      x={g.dirLbl.x} y={g.dirLbl.y}
      text-anchor={g.dirLbl.a}
      style="{baseText};fill:#059669"
    >Directrix</text>

  </g>
</svg>