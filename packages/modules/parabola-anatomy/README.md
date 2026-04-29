# parabola-anatomy

Interactive drag-and-drop labelling activity. Students drag term chips from a word bank onto target slots on a parabola diagram. Placing a chip correctly locks it and shows a brief definition card. Deployed to `/vertex/modules/parabola/anatomy/`.

## Interaction

- Pointer-based drag with a ghost element following the cursor
- Slots accept a drop only when the chip matches the slot
- Success and warning sounds via the shared audio utility
- Locked chips become tappable to re-read the definition
- Fully keyboard-accessible via focus and Enter/Space

## Dev

```bash
pnpm dev
```

Runs on port `5174`.