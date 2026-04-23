export interface Part {
    id: string;
    name: string;
    slotId: string;
    definition: string;
}

export const parts: Part[] = [
    {
        id: 'vertex',
        name: 'Vertex',
        slotId: 'slot-vertex',
        definition: 'The point where the parabola changes direction. Minimum or maximum point.'
    },
    {
        id: 'focus',
        name: 'Focus',
        slotId: 'slot-focus',
        definition: 'A point inside the parabola used in its geometric definition.'
    },
    {
        id: 'directrix',
        name: 'Directrix',
        slotId: 'slot-directrix',
        definition: 'A line perpendicular to the axis of symmetry; all points on the parabola are equidistant to focus and directrix.'
    },
    {
        id: 'axis',
        name: 'Axis of Symmetry',
        slotId: 'slot-axis',
        definition: 'The vertical line that divides the parabola into two mirror images.'
    },
    {
        id: 'p',
        name: 'p',
        slotId: 'slot-p',
        definition: 'The focal length. The distance from the vertex to the focus, equal to the distance from the vertex to the directrix. In standard form: x² = 4py.'
    }
];