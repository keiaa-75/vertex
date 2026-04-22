# Vertex Architecture & Implementation Roadmap

## 1. Architectural Evolution & Rationale
Vertex began as a fully client-driven learning platform where each lesson module handled its own progress tracking, embedded quizzes, and direct Firestore mutations. Through iterative deployment testing and classroom workflow validation, the architecture pivoted toward a **server-mediated assessment pipeline** and a **strictly embed-optimized module boundary**.

**Key Drivers for the Pivot:**
- **Assessment Reliability:** Google Forms + Apps Script eliminates client-side score manipulation, handles network interruptions gracefully, and gives educators native access to response analytics without custom admin tooling.
- **Separation of Concerns:** Lesson modules now focus exclusively on interactive pedagogy (manipulatives, visualizations, state machines). Progress mutation is offloaded to a trusted server layer.
- **Iframe Compatibility:** OAuth redirects and cross-origin cookie policies consistently break inside embedded frames. Email/password auth with same-origin session persistence proved significantly more stable.
- **Operational Simplicity:** Manual pre-filled form URLs reduce infrastructure complexity, eliminate dependency on dynamic link generation, and keep assessment routing transparent for educators.

The result is a cleaner, more maintainable system: the Dashboard reacts to Firestore state, modules render interactive content, and Google Forms + GAS handle assessment writes. Each boundary is explicit, auditable, and independently updatable.

## 2. Core Design Decisions

### Monorepo with `@vertex/shared`
- **Rationale:** Centralizes Firebase initialization, type definitions, and reactive stores. Prevents code duplication across the dashboard and lesson modules.
- **Trade-offs:** Requires consistent workspace linking and aligned TypeScript/Vite configurations across packages.

### GAS-Powered Progress Writes
- **Rationale:** Server-side writes guarantee idempotency, bypass client-side security restrictions, and allow educators to lock or restrict forms natively.
- **Trade-offs:** Introduces a dependency on Google Workspace and requires secure management of service account credentials.

### Manual Form Pre-fill Handoff
- **Rationale:** Zero runtime infrastructure. Eliminates dynamic URL generation bugs and keeps assessment routing transparent and easily debuggable for educators.
- **Trade-offs:** Requires manual link distribution and does not auto-scale without human coordination.

### Single-Origin GitHub Pages Hosting
- **Rationale:** All iframes share `*.github.io`, enabling automatic Firebase session sync via `localStorage`/`IndexedDB` and seamless cross-frame state sharing.
- **Trade-offs:** Requires strict base-path alignment during build; limits CDN flexibility but drastically simplifies authentication and state management.

### Explicit `userId` in Progress Documents
- **Rationale:** Replaces fragile document ID-parsing in security rules. Enables indexed Firestore queries and predictable, rule-enforced access control.
- **Trade-offs:** Slightly larger document payloads and requires migration awareness if legacy data exists.

## 3. Iframe-Aware Embedding Principles
Modules are designed to feel **planted directly into the host page**, not layered on top of it. Traditional UI metaphors that imply elevation (floating cards, drop shadows, heavy margins) are intentionally avoided to prevent visual dissonance when embedded in Google Sites.

### Core Constraints
- **Viewport Locking:** Shells enforce `100vw × 100vh`, `margin: 0`, `overflow: hidden`. All interactive surfaces scale responsively using `clamp()`, `dvh`, or container queries instead of rigid breakpoints.
- **Scroll Containment:** No global body scrolling. Any scrollable region uses isolated containers with `overscroll-behavior: contain` to prevent iframe bounce or host-page drift.
- **Direct Placement UI:** Floating card interfaces are discouraged. Interactive elements anchor to the visible plane. State changes, feedback, and scoring indicators appear inline or anchored to their origin point rather than in detached overlays.
- **CSS Isolation:** Design tokens are scoped to `:root` within each iframe. `svelte:options css="injected"` prevents style leakage. Fonts and SVGs are served from the same origin to avoid CORS or flash-of-unstyled-content artifacts.
- **Parent Navigation & Session Sync:** Cross-frame routing uses `window.top.location.href` with graceful fallbacks. Firebase auth persists automatically across iframes due to shared origin; no manual token passing is required.

## 4. Security & Data Model
### Progress Collection Structure

```
progress/{userId}_{lessonId}
├─ userId: string (explicit, indexed)
├─ lessonId: string
├─ viewed: boolean
├─ viewedAt: timestamp | null
├─ completed: boolean
├─ completedAt: timestamp | null
└─ quizScore: number | null
```


### Firestore Security Rules
- **Users:** Owner-only read/write. Profile creation requires authenticated `uid`.
- **Progress:** Read/write allowed only when `request.auth.uid == resource.data.userId`. Prevents cross-user data leakage and satisfies Firestore query indexing requirements.
- **Curriculum:** Public read, client-side write disabled. Structure managed via Firebase Console or admin scripts.

### Idempotency & Downgrade Prevention
- GAS uses `PATCH` with `updateMask` to merge only submitted fields.
- Pre-test submissions never overwrite `completed` or `quizScore`.
- Post-test submissions only set `completed: true` when score ≥ 75%. Lower scores are logged but do not alter existing completion states.
- Form-level restrictions (one response per user, locked after submission) act as the first line of defense against duplicate writes.

## 5. Current State
**Completed Milestones**
- Svelte 5 monorepo bootstrapped with Turborepo + pnpm workspace linking
- Firebase singleton initialization safe for multi-iframe contexts
- Email/password auth + profile setup flow with Firestore persistence
- Curriculum fetching with ordered topics/lessons and prerequisite hint resolution
- Real-time `progressMonitorStore` with `onSnapshot` listener and dashboard UI binding
- Firestore rules updated to explicit `resource.data.userId` validation
- Module template configured with dynamic `base` path injection matching `githubPagesPath`
- MD3-aligned design system embedded via shared CSS variables
- GAS pipeline implemented and verified for idempotent pre/post-test routing

## 6. Implementation Roadmap & Next Steps

### Deployment & CI/CD
- [ ] Configure GitHub Actions workflow: `turbo run build` → output to `dist/` → deploy to `gh-pages` branch
- [ ] Verify path mapping: ensure each module's `package.json` `vertex.githubPagesPath` correctly aligns with Vite `base` and Firestore `githubPagesPath`
- [ ] Document educator workflow: how to duplicate a module folder, update content, and trigger deployment

### Widget Scaffolding & Pattern Extraction
- [ ] Extend `module-template` with reusable interaction primitives:
  - Drag-and-drop state machines with slot validation
  - Toggle-driven mode switching (shared component state, instant context swap)
  - Timer/scoring hooks with session lifecycle management
  - Inline feedback loops (visual/audio cues without DOM interruption)
- [ ] Isolate widget-specific scoring from `quizScore` (completion metric). If performance tracking is required later, provision a separate `highScores` collection to avoid conflating mastery with personal bests
- [ ] Create standalone widget implementation guide (separate from this architecture doc)

### End-to-End Validation
- [ ] Embed dashboard + module + forms in a live Google Sites page
- [ ] Verify: login → profile setup → curriculum load → lesson navigation → form submission → Firestore update → real-time dashboard refresh
- [ ] Test edge cases: session expiry mid-lesson, form submission on poor connectivity, rapid toggle switching, iframe resize on mobile viewports

### Future Considerations
- [ ] Form URL registry (if manual distribution becomes unsustainable at scale)

---

*This document serves as both an architectural decision record and a living roadmap. As new interactive widgets are integrated or assessment workflows evolve, this foundation should remain stable while implementation details are documented in dedicated, scope-specific guides.*