export type Direction = 'Upward' | 'Downward' | 'Rightward' | 'Leftward';

export interface FormRow {
  direction: Direction;
  /** Safe for {@html} — uses <sup> and <i> tags. */
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
    equationHtml: '<i>x</i><sup>2</sup> = 4<i>py</i>',
    focus: '(0, p)',
    directrix: 'y = −p',
    axis: 'x = 0',
  },
  {
    direction: 'Downward',
    equationHtml: '<i>x</i><sup>2</sup> = −4<i>py</i>',
    focus: '(0, −p)',
    directrix: 'y = p',
    axis: 'x = 0',
  },
  {
    direction: 'Rightward',
    equationHtml: '<i>y</i><sup>2</sup> = 4<i>px</i>',
    focus: '(p, 0)',
    directrix: 'x = −p',
    axis: 'y = 0',
  },
  {
    direction: 'Leftward',
    equationHtml: '<i>y</i><sup>2</sup> = −4<i>px</i>',
    focus: '(−p, 0)',
    directrix: 'x = p',
    axis: 'y = 0',
  },
];

const ROWS_HK: FormRow[] = [
  {
    direction: 'Upward',
    equationHtml: '(<i>x</i>−<i>h</i>)<sup>2</sup> = 4<i>p</i>(<i>y</i>−<i>k</i>)',
    focus: '(h, k+p)',
    directrix: 'y = k−p',
    axis: 'x = h',
  },
  {
    direction: 'Downward',
    equationHtml: '(<i>x</i>−<i>h</i>)<sup>2</sup> = −4<i>p</i>(<i>y</i>−<i>k</i>)',
    focus: '(h, k−p)',
    directrix: 'y = k+p',
    axis: 'x = h',
  },
  {
    direction: 'Rightward',
    equationHtml: '(<i>y</i>−<i>k</i>)<sup>2</sup> = 4<i>p</i>(<i>x</i>−<i>h</i>)',
    focus: '(h+p, k)',
    directrix: 'x = h−p',
    axis: 'y = k',
  },
  {
    direction: 'Leftward',
    equationHtml: '(<i>y</i>−<i>k</i>)<sup>2</sup> = −4<i>p</i>(<i>x</i>−<i>h</i>)',
    focus: '(h−p, k)',
    directrix: 'x = h+p',
    axis: 'y = k',
  },
];

export function getRows(mode: VertexMode): FormRow[] {
  return mode === '00' ? ROWS_00 : ROWS_HK;
}

export const DIRECTIONS: Direction[] = ['Upward', 'Downward', 'Rightward', 'Leftward'];