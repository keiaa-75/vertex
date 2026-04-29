# parabola-graph

Interactive graphing module for the parabola `x² = 4py`. A range slider controls the focal distance p, and the graph updates in real time: the curve, focus position, and directrix all move together. Deployed to `/vertex/modules/parabola/graph/`.

## What updates with p

- Parabola curve (recalculated as a polyline)
- Focus dot and coordinate label
- Directrix line and equation label
- The curve inverts direction when p crosses zero

The graph renders on a transparent background so it blends with the Google Sites page behind the iframe.

## Dev

```bash
pnpm dev
```

Runs on port `5178`.