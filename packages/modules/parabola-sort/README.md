# parabola-sort

Card sorting game. A parabola equation is shown and the student must swipe or press a direction key matching where that parabola opens. A per-card timer applies pressure. A wrong answer or timeout ends the session. Deployed to `/vertex/modules/parabola/sort/`.

## Modes

- **Normal** - swipe in the direction the parabola opens.
- **Reverse** - swipe in the opposite direction. Intended for students who have already mastered the normal direction and want a harder challenge.

## Scoring

Score increments on each correct sort. The session ends immediately on a wrong answer or timeout. If the student is signed in, their personal best is persisted to the `highScores` Firestore collection. The rule only allows a write if the new score exceeds the stored value.

The module also calls `markInteracted` on the first session where the student correctly sorts at least one card, recording engagement against the lesson's progress document.

## Dev

```bash
pnpm dev
```

Runs on port `5175`.