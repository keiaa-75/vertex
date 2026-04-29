# dashboard

The student-facing dashboard. Handles authentication, profile setup, curriculum display, and real-time progress tracking. Deployed to `/vertex/` on GitHub Pages and embedded in Google Sites as an iframe.

## Responsibilities

- Email/password sign-up and sign-in via Firebase Authentication
- Profile setup form (full name, student number, section) written to Firestore
- Fetches the full curriculum from Firestore on mount
- Subscribes to the student's progress collection with `onSnapshot` and reflects changes in real time
- Displays topics and lessons with visual progress states: unviewed, in-progress, completed
- Lesson detail modal shows pre-test and post-test scores, mastery level, and score delta
- Profile view with inline edit form

## Dev

```bash
pnpm dev
```

Runs on port `5173`. The Vite config proxies the other packages to their respective dev ports so that navigation and iframe embeds work correctly during local development.

## Notes

The base path is `/vertex/`. All asset references and navigation use this prefix. Do not change it without also updating `vite.config.ts`, the deploy workflow, and any Google Sites embeds that reference this package.