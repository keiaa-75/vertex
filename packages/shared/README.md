# @vertex/shared

Internal shared library. Provides the Firebase singleton, Svelte stores, progress write helpers, design tokens, and the audio utility. Every other package in the monorepo depends on this one.

## Exports

### Firebase instances

```ts
import { auth, db } from '@vertex/shared'
```

Initialises Firebase once and guards against duplicate initialisation across multiple iframes on the same origin.

### Stores

**`userStore`** tracks auth state, the student's Firestore profile, and whether profile setup is still needed. Exposes `loginWithEmail`, `registerUser`, `saveProfile`, and `logout`.

**`curriculumStore`** holds the full topic and lesson tree fetched from Firestore. Call `loadCurriculum()` once on mount. Also exports `buildLessonMap` for flat lookups by lesson ID.

**`progressMonitorStore`** maintains a real-time `Map<lessonId, Progress>` for a given UID using an `onSnapshot` listener. Call `startProgressMonitor(uid)` when the user is authenticated and `stopProgressMonitor()` on cleanup.

### Progress write helpers

```ts
import { markInteracted } from '@vertex/shared'
```

`markInteracted(lessonId)` does a merge write to set `interacted: true` on the student's progress document. Modules call this after meaningful engagement. It is safe to call multiple times.

### Audio

```ts
import { createAudio } from '@vertex/shared'
const audio = createAudio()
audio.play('success')
audio.play('warning')
```

Each call to `createAudio()` returns a new player scoped to the calling module. Pass an optional sound config object to override the defaults or add new tones. Call `audio.ensureContext()` inside a user gesture handler before the first `play()`.

### CSS

```ts
import '@vertex/shared/vertex.css'
```

Provides all MD3-aligned design tokens, base resets, typography scale, button classes, form field styles, and layout primitives. Import this first in every package's `main.ts`.

## Types

`Progress`, `LastSubmission`, `PipelineError`, `UserProfile`, `UserState`, `Topic`, `Lesson`, `CurriculumState`, `ProgressMonitorState`, `ToneConfig`, `SoundSchema`