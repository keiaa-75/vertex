/**
 * Returns an SVG polyline `points` string for the parabola x² = 4py.
 * Generates more points than the viewport needs; the caller's <clipPath>
 * handles the bounds so we never need to check visibility here.
 */
export function parabolaPoints(
  p: number,
  cx: number,
  cy: number,
  scale: number,
  steps = 120
): string {
  const maxX = 60; // units — well beyond any viewport at scale 8
  const pts: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const xu = -maxX + (2 * maxX * i) / steps;
    const yu = (xu * xu) / (4 * p);
    pts.push(`${(cx + xu * scale).toFixed(2)},${(cy - yu * scale).toFixed(2)}`);
  }

  return pts.join(' ');
}

/**
 * Safely clamps p away from zero so we never divide by zero.
 * Preserves sign and the 0.10 slider step.
 */
export function safeP(raw: number): number {
  if (raw === 0) return 0.1;
  return Math.abs(raw) < 0.05 ? (raw < 0 ? -0.05 : 0.05) : raw;
}

/**
 * Formats a numeric p value for display, e.g. "1.00" or "−3.50".
 * Uses the real minus sign (U+2212) for cleaner math display.
 */
export function fmtP(p: number): string {
  return p < 0
    ? `\u2212${Math.abs(p).toFixed(2)}`
    : p.toFixed(2);
}