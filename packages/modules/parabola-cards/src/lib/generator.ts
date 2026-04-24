export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface ParabolaCard {
  equationHtml: string;
  direction: Direction;
}

const P_VALUES = [1, 2, 3, 4, -1, -2, -3, -4] as const;
type PValue = typeof P_VALUES[number];

// U+2212 MINUS SIGN — cleaner math display than a hyphen
const MINUS = '−';

function fmtDirect(coefficient: number): string {
  return coefficient < 0
    ? `${MINUS}${Math.abs(coefficient)}`
    : `${coefficient}`;
}

function fmtFactored(p: PValue): string {
  const pStr = p < 0 ? `${MINUS}${Math.abs(p)}` : `${p}`;
  return `4(${pStr})`;
}

export function generateCard(): ParabolaCard {
  const isXSquared = Math.random() < 0.5;
  const p = P_VALUES[Math.floor(Math.random() * P_VALUES.length)];
  const useFactored = Math.random() < 0.5;

  const coeffStr = useFactored ? fmtFactored(p) : fmtDirect(4 * p);

  let equationHtml: string;
  let direction: Direction;

  if (isXSquared) {
    // (x − h)² = 4p(y − k), vertex form omitted — pure standard form
    equationHtml = `x<sup>2</sup> = ${coeffStr}y`;
    direction = p > 0 ? 'UP' : 'DOWN';
  } else {
    equationHtml = `y<sup>2</sup> = ${coeffStr}x`;
    direction = p > 0 ? 'RIGHT' : 'LEFT';
  }

  return { equationHtml, direction };
}