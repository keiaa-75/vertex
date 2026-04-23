export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface ParabolaCard {
  equation: string;
  direction: Direction;
}

const randomInt = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const formatTerm = (variable: string, value: number): string => {
  if (value === 0) return variable;
  const sign = value > 0 ? '-' : '+';
  return `(${variable} ${sign} ${Math.abs(value)})`;
};

export function generateCard(): ParabolaCard {
  const isXSquared = Math.random() > 0.5;
  const p = [1, 2, 3, 4, -1, -2, -3, -4][Math.floor(Math.random() * 8)];
  const h = randomInt(-5, 5);
  const k = randomInt(-5, 5);
  const coefficient = 4 * p;

  let equation: string;
  let direction: Direction;

  if (isXSquared) {
    // (x - h)^2 = 4p(y - k)
    const left = `${formatTerm('x', h)}^2`;
    const right = `${coefficient}${formatTerm('y', k)}`;
    equation = `${left} = ${right}`;
    direction = p > 0 ? 'UP' : 'DOWN';
  } else {
    // (y - k)^2 = 4p(x - h)
    const left = `${formatTerm('y', k)}^2`;
    const right = `${coefficient}${formatTerm('x', h)}`;
    equation = `${left} = ${right}`;
    direction = p > 0 ? 'RIGHT' : 'LEFT';
  }

  return { equation, direction };
}