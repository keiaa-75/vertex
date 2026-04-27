export type Direction = 'Upward' | 'Downward' | 'Rightward' | 'Leftward';

export interface FormRow {
  direction: Direction;
  /** Safe for {@html} — uses <sup> tags only. */
  equationHtml: string;
  focus: string;
  directrix: string;
  axis: string;
}

export type VertexMode = '00' | 'hk';
export type LayoutMode = 'table' | 'list';

const ROWS_00: FormRow[] = [
  {
    direction: 'Upward',
    equationHtml: 'x<sup>2</sup> = 4py',
    focus: '(0, p)',
    directrix: 'y = −p',
    axis: 'x = 0',
  },
  {
    direction: 'Downward',
    equationHtml: 'x<sup>2</sup> = −4py',
    focus: '(0, −p)',
    directrix: 'y = p',
    axis: 'x = 0',
  },
  {
    direction: 'Rightward',
    equationHtml: 'y<sup>2</sup> = 4px',
    focus: '(p, 0)',
    directrix: 'x = −p',
    axis: 'y = 0',
  },
  {
    direction: 'Leftward',
    equationHtml: 'y<sup>2</sup> = −4px',
    focus: '(−p, 0)',
    directrix: 'x = p',
    axis: 'y = 0',
  },
];

const ROWS_HK: FormRow[] = [
  {
    direction: 'Upward',
    equationHtml: '(x−h)<sup>2</sup> = 4p(y−k)',
    focus: '(h, k+p)',
    directrix: 'y = k−p',
    axis: 'x = h',
  },
  {
    direction: 'Downward',
    equationHtml: '(x−h)<sup>2</sup> = −4p(y−k)',
    focus: '(h, k−p)',
    directrix: 'y = k+p',
    axis: 'x = h',
  },
  {
    direction: 'Rightward',
    equationHtml: '(y−k)<sup>2</sup> = 4p(x−h)',
    focus: '(h+p, k)',
    directrix: 'x = h−p',
    axis: 'y = k',
  },
  {
    direction: 'Leftward',
    equationHtml: '(y−k)<sup>2</sup> = −4p(x−h)',
    focus: '(h−p, k)',
    directrix: 'x = h+p',
    axis: 'y = k',
  },
];

export function getRows(mode: VertexMode): FormRow[] {
  return mode === '00' ? ROWS_00 : ROWS_HK;
}

export const DIRECTIONS: Direction[] = ['Upward', 'Downward', 'Rightward', 'Leftward'];