# navigator

A small embeddable widget with two modes: a gated proceed button (`mode=navigate`) and a lesson score card (`mode=score`). Deployed to `/vertex/navigator/` and embedded via iframe on Google Sites lesson pages.

## Modes

### navigate

Shows a proceed button that unlocks only when a gate condition is met. Gate options are `viewed`, `interacted`, and `completed`, checked against the student's Firestore progress document in real time.

Relevant query params:

| Param | Required | Description |
|---|---|---|
| `lessonId` | yes | The lesson being tracked |
| `gate` | yes | `viewed`, `interacted`, or `completed` |
| `next` | yes | URL to navigate to on proceed |
| `label` | no | Button text. Default: `Continue` |
| `back` | no | URL or `true` (history.back). Omit to hide |
| `backLabel` | no | Default: `Back` |
| `showStatus` | no | `true` shows a status line above the button |
| `align` | no | `left`, `center`, or `right`. Default: `center` |
| `padding` | no | `none` strips shell padding |

### score

Shows a pre-test and post-test score card with progress bars, mastery badge, score delta, and navigation buttons. Useful as a standalone summary embed at the bottom of a lesson page.

Relevant query params:

| Param | Required | Description |
|---|---|---|
| `lessonId` | yes | The lesson being tracked |
| `lessonTitle` | no | Display title. Default: `Lesson` |
| `lessonUrl` | no | Target for the "View Lesson" button |
| `nextUrl` | no | Target for the "Next Lesson" button |
| `nextLabel` | no | Button text. Default: `Next Lesson` |

Both modes share `homeUrl`, which defaults to `/vertex/`.

## Dev

```bash
pnpm dev
```

Runs on port `5176`.