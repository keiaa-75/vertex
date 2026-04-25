export type ParabolaDirection = 'Upward' | 'Downward' | 'Rightward' | 'Leftward';

export interface ParabolaFormCard {
  direction: ParabolaDirection;
  /** Equation with HTML superscripts, safe for {@html}. */
  equationHtml: string;
  focus: string;
  directrix: string;
  axis: string;
  /** Inline SVG string illustrating the parabola orientation, safe for {@html}. */
  svgHtml: string;
}

// Colours drawn from vertex.css tokens — kept as literals so the SVG strings
// are self-contained and don't rely on CSS variable resolution inside <svg>.
const CURVE   = '#1A4B84'; // --md-sys-color-primary
const FOCUS   = '#DC2626'; // --md-sys-color-error (red dot, matching reference)
const DASHES  = '#059669'; // --md-sys-color-completed (green dashes)
const AXIS_SV = '#94A3B8'; // muted slate for axis/ref lines

// All parabolas use the same 100 × 80 viewBox.
// The bezier control-point trick: mid-point of quadratic at t=0.5 is
//   P = 0.25·start + 0.5·ctrl + 0.25·end  →  vertex of the visual arc.

function upwardSvg(): string {
  // U-shape: vertex ≈ (50, 40).  Focus inside (50, 27).  Directrix y=53.
  return `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <line x1="50" y1="4" x2="50" y2="76" stroke="${AXIS_SV}" stroke-width="1" stroke-dasharray="3 2"/>
  <path d="M 10 68 Q 50 12 90 68" stroke="${CURVE}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="8" y1="54" x2="92" y2="54" stroke="${DASHES}" stroke-width="1.8" stroke-dasharray="5 3"/>
  <circle cx="50" cy="27" r="3.5" fill="${FOCUS}"/>
</svg>`;
}

function downwardSvg(): string {
  // ∩-shape: vertex ≈ (50, 40).  Focus inside (50, 53).  Directrix y=27.
  return `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <line x1="50" y1="4" x2="50" y2="76" stroke="${AXIS_SV}" stroke-width="1" stroke-dasharray="3 2"/>
  <path d="M 10 12 Q 50 68 90 12" stroke="${CURVE}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="8" y1="26" x2="92" y2="26" stroke="${DASHES}" stroke-width="1.8" stroke-dasharray="5 3"/>
  <circle cx="50" cy="53" r="3.5" fill="${FOCUS}"/>
</svg>`;
}

function rightwardSvg(): string {
  // ⊂-shape opening right: vertex ≈ (37, 40).  Focus (54, 40).  Directrix x=22.
  return `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <line x1="4" y1="40" x2="96" y2="40" stroke="${AXIS_SV}" stroke-width="1" stroke-dasharray="3 2"/>
  <path d="M 10 8 Q 74 40 10 72" stroke="${CURVE}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="23" y1="6" x2="23" y2="74" stroke="${DASHES}" stroke-width="1.8" stroke-dasharray="5 3"/>
  <circle cx="54" cy="40" r="3.5" fill="${FOCUS}"/>
</svg>`;
}

function leftwardSvg(): string {
  // ⊃-shape opening left: vertex ≈ (63, 40).  Focus (46, 40).  Directrix x=78.
  return `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <line x1="4" y1="40" x2="96" y2="40" stroke="${AXIS_SV}" stroke-width="1" stroke-dasharray="3 2"/>
  <path d="M 90 8 Q 26 40 90 72" stroke="${CURVE}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="77" y1="6" x2="77" y2="74" stroke="${DASHES}" stroke-width="1.8" stroke-dasharray="5 3"/>
  <circle cx="46" cy="40" r="3.5" fill="${FOCUS}"/>
</svg>`;
}

export const PARABOLA_CARDS: ParabolaFormCard[] = [
  {
    direction: 'Upward',
    equationHtml: 'x<sup>2</sup> = 4py',
    focus: '(0, p)',
    directrix: 'y = −p',
    axis: 'x = 0 (y-axis)',
    svgHtml: upwardSvg(),
  },
  {
    direction: 'Downward',
    equationHtml: 'x<sup>2</sup> = −4py',
    focus: '(0, −p)',
    directrix: 'y = p',
    axis: 'x = 0 (y-axis)',
    svgHtml: downwardSvg(),
  },
  {
    direction: 'Rightward',
    equationHtml: 'y<sup>2</sup> = 4px',
    focus: '(p, 0)',
    directrix: 'x = −p',
    axis: 'y = 0 (x-axis)',
    svgHtml: rightwardSvg(),
  },
  {
    direction: 'Leftward',
    equationHtml: 'y<sup>2</sup> = −4px',
    focus: '(−p, 0)',
    directrix: 'x = p',
    axis: 'y = 0 (x-axis)',
    svgHtml: leftwardSvg(),
  },
];