# Technical Plan for Vertex

## Overview

This document describes the technical architecture and implementation plan for a modular, interactive pre-calculus e-learning platform. The system is designed to be embedded within Google Sites while leveraging modern web technologies for dynamic content and progress tracking.

### Key Technologies:

- Frontend Framework: Svelte (compiled to static JavaScript)
- Hosting: GitHub Pages (for interactive modules), Google Sites (as the content shell)
- Backend and Database: Firebase (Authentication, Firestore)
- Monorepo Management: Turborepo with multiple Svelte application packages

### Core Principles:

- All interactive components are self-contained Svelte applications embedded via iframe.
- Authentication and progress date are centralized in Firebase.
- Curriculum data (topics, lessons, URLs) is stored in Firestore to avoid hardcoding.
- User experience emphasizes "Open in New Tab" behavior for external actions and seamless state persistence.

## Branding and Visual Identity

### Typography

- Headings: Outfit - A geometric, rounded sans-serif that conveys a modern and approachable academic tone.
- Body Text: Plus Jakarta Sans - A clean, highly legible sans-serif with a youthful, contemporary feel.

### Color Palette

| Role		| Hex Code	 | Usage 											 |
| --------- | ---------- | ------------------------------------------------- |
| Primary	| #1A4B84	| Headers, buttons, primary actions, active states 	|
| Secondary	| #FFC857	| Highlights, call-to-action elements				|
| Accent	| #00B4D8	| Links, progress indicators, interactive elements	|

### Logo

The logo features a stylized letter **"V"** constructed from rounded rectangles (pills) and a circular element. The composition suggests both mathematical precision (geometry) and a welcoming, youthful energy.

### Design Tone

The overall aesthetic is youthful, energizing, and vibrant while maintaing a semi-formal, academic sensibility. Generous spacing, soft corners, and a balanced used of color create an inviting learning environment without sacrificing credibility.

## System Architecture

### High Level Structure

```
[Google Sites Page] 
    ├── Embedded iframe: Dashboard (Svelte App) 
    │       ├── Displays topics/lessons dynamically from Firestore
    │       ├── Handles user authentication (signInWithRedirect)
    │       └── Navigates parent window to lesson pages
    │
    └── Embedded iframe(s): Lesson Module(s) (Svelte Apps)
            ├── Render lesson content and interactive experiences
            ├── Track viewing progress (on mount)
            ├── One module (typically the post‑test) triggers completion status
            └── All share Firebase auth state via same origin (GitHub Pages)
```

### Multi-iframe Lesson Pages

A single Google Sites lesson page may contain **multiple embedded Svelte iframes.** This approach allows developers to break complex interactive content into smaller, focused modules (e.g., a 3D graph, a step-by-step derivation, and a quiz) while reusing shared logic.

#### How it works within the existing paradigm

**Authentication:**

All iframes are served from the same GitHub Pags origin. Firebase Authentication stores its session in `localStorage` or IndexedDB scoped to that origin. Every iframe initializes Firebase with the same configuraton and automatically shares the authenticated user state. No additional prompts are required.

**Progress Tracking:**

A single Firestore document per `(user, lesson)` tracks the state. Multiple iframes on the same pages can safely interact with that document:

- Viewed state: Any or all iframes may call `markViewed` on their `onMount`. This is idempotent and harmless. Or simply, the pre-test iframe can handle this action.
- Completed state: Only the post-test iframe (or a designated assessment component) writes `completed: true` upon passing the threshold. Other interactive components never modify completion status.

**Dashboard awareness:**

The dashboard does not need to know that a lesson uses multiple iframes. It reads the unified progress document and updates the UI accordingly.

### Why Google Sites + GitHub Pages?

- Google Sites provides a user-friendly, no-code environment for educators to organize content, create pages, and manage navigation.
- GitHub Pages offers free, reliable static hosting for the Svelte modules. It enables full control over interactive features and Firebase integration.
- The combination allows instructors to manage the overall site structure while developers maintain the interactive components independently.

### Cross-Origin Considerations

Since the Dashboard and Lesson Modules are served from `github.io` and embedded within `sites.google.com`, cross-origin restrictions apply:

- Authentication: Using `signInWithRedirect` ensures the OAuth flow completes on the trusted GitHub Pages domain, where Firebase can store the session. After login, the user returns to the Google Sites page manually (e.g., via browser back button).
- Parent Navigation: The Dashboard can change the browser's top-level location using `window.top.location.href` despite being in an iframe.
- Firestore Access: Both Dashboard and Modules share the same Firebase project configuration, so authentication persists across iframes on the same origin (`github.io`).

## Firebase Configuration

### Services Enabled

- Authentication: Google Sign-In provider only.
- Firestore Database: Stores user profiles, curriculum, and progress.
- Security Rules: Strict rules to protect user data

### Firestore Data Model

**Collection: `users`**

Stores student profile. Document ID = Firebase Auth UID.

```typescript
interface UserProfile {
	fullName: string;
	studentNo: string;
	section: string;
}
```

**Collection: `curriculum`**

Contains the course structure. Top-level document `precalculus` serves as the root.

- **Subcollection:** `topics`

Document ID: auto-generated or meaninful slug.

```typescript
interface Topic {
	name: string;	// e.g., "Conics"
	order: number;	// Display order
}
```

- **Subcollection:** `lessons`

Document ID: auto-generated or meaningful slug.

```typescript
interface Lesson {
	topicId: string;			// Reference to parent topic document ID
	title: string;				// e.g., "The Parabola"
	order: number;				// Display order within topic
	googleSitesUrl: string;		// Full URL of the Google Sites lesson page
	githubPagesPath: string;	// Relative path on GitHub Pages
	prerequisites: string[];	// Array of lesson IDs that are recommended prior study
}
```

**Collection: `progress`**

Tracks per-user, per-lesson completion status. Document ID = `${uid}_${lessonId}`.

```typescript
interface Progress {
	lessonId: string;
	viewed: boolean;
	viewedAt: Timestamp | null;
	completed: boolean;
	completedAt: Timestamp | null;
	quizScore: number | null;
}
```

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		// User profiles: owner-only access
		match /users/{userId} {
			allow read, write: if request.auth != null && request.auth.uid == userId;
		}

		// Progress records: user owns their own progress
		match /progress/{progressId} {
			allow read, write: if request.auth != null
				&& request.auth.uid == progressId.split('_')[0];
		}

		// Curriculum: public read, no client-side writes
		match /curriculum/{document=**} {
			allow read: if true;
			allow write: if false;
		}
	}
}
```

## Authentication Flow

### Initial Login (Onboarding)

1. Dashboard iframe loads, detects no authenticated user.
2. User clicks "Sign in with Google".
3. Dashboard initiates `signInWithRedirect(auth, provider)`.
4. Browser navigates to the Google OAuth consent screen, then redirects back to the GitHub Pages URL of the Dashboard
5. Firebase completes sign-in and stores the session in local storage for that origin.
6. The user now sees the fully authneticated Dashboard page (on GitHub Pages). They return to the Google Sites home page.
7. Upon revisiting the Google Sites page, the iframe reloads and automatically reads the existing Firebase session.

### Profile Completion

After first login, Dashboard checks Firestore for `users/{uid}`:

- If missing, displays a form to collect `fullName`, `studentNo`, `section`.
- Saves data to Firestore, then proceeds to topic selection.

### Subsequent Visits

Dashboard reads auth state from cached Firebase session. No popups or redirects occur unless the session expires.

## Dashboard Component (Embedded on Home Page)

### User Interface

- Collapsible Accordion: Each topic is a header showing name and progress percentage.
- Lesson Checklist: Within an expanded topic, a list of lessons with:
	- Visual status indicator (color-coded text/border/background).
	- Lesson title (clickable to navigate).
	- Optional prerequisite hint text (e.g., "You might want to study The Parabola first.").
- Logout Button: Clears Firebase session and refreshes.

### Progress Calculation

- Lesson States:
	- Unviewed: Red text, no background.
	- Viewed: Blue border or blue text (using `#00B4D8` accent).
	- Completed: Green background (with white text or a checkmark).
- Topic Percentage:
	- `(number of completed lessons in topic / total lessons in topic) * 100`, displayed next to topic name.

### Real-Time Updates

Dashboard subscribes to Firestore `progress` collection using `onSnapshot`. When a student completes a lesson in another tab, the Dashboard updates automatically without refresh.

### Navigation

Clicking a lesson triggers:

```javascript
window.top.location.href = lesson.googleSitesUrl;
```

### Prerequisite Hint Generation

1. Fetch all lessons and build a map: `lessonId -> title`.
2. For each lesson, iterate over `prerequisites` array.
3. Look up titles and construct a hint string:
	`"You might want to study [Title1] and [Title2] first."`
4. Display as subdued text below the lesson title.

## Lesson Module Template

Each lesson is a separate Svelte application built from a shared template. All modules inherit common functionality from the `shared` package.

### Module Lifecycle

1. onMount:
	- Initialize Firebase (shared config)
	- Check current user; if logged in, call markViewed(lessonId).
	- `markViewed` writes `{ viewed: true, viewedAt: serverTimestamp() }` to Firestore if not already set.
2. Content Rendering:
	- Static leson content (text, images, MathJax/LaTex, animation, canvas) specific to the module
3. Post-Test Integration:
	- A `Quiz` component (from `shared`) renders multiple-choice questions.
	- Questions are defined locally in the module or fetched from Firestore.
	- On submission, score is calculated.
	- If score >= 75%, call `markCompleted(lessonId, score)`.
	- `markCompleted` writes `{ completed: true, completedAt: serverTimestamp(), quizScore: score }`.
	- Display appropriate feedback.

### Shared Package (`packages/shared`)

The monorepo includes a `shared` package that provides:

- `firebase.ts`: initializes Firebase app, exports `auth`, `db`, and helper functions. Handles singleton initialization to avoid duplicate app instances across multiple iframes.
- `progress.ts`: functions `markViewed, markCompleted, getProgress`.
- `stores/`: Svelte stores for `user` (auth state + profile) and `curriculum` (reactive Firestore data).
- `components/`: reusable UI components like `Quiz.svelte`, `Checklist.svelte`, etc.

## Post-test Implementation (Replacing Google Forms)

Each module will include a built-in quiz component to maintain seamless progress integration.

Quiz Component Requirements:

- Accepts an array of question objects:

	```typescript
	interface Question {
		text: string;
		options: string[];
		correctIndex: number;	// 0-based
	}
	```

- Randomizes order of questions and/or options (optional).
- Calculates score and triggers `markCompleted` upon passing threshold.
- Provides feedback on incorrect answers.

Data Storage for Questions:

- Can be hardcoded within the modules's `App.svelte` (acceptable since questions are lesson-specific)
- Alternatively, stored in Firestore under a `quizzes` subcollection for easier updates without redeploying the module.

## Basic Monorepo Structure (Turborepo)

```
vertex/
├── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── packages/
    ├── shared/                     # Common code
    │   ├── src/
    │   │   └── lib/
    │   │       ├── firebase.ts
    │   │       ├── progress.ts
    │   │       ├── stores/
    │   │       └── components/
    │   ├── package.json
    │   └── vite.config.ts
    ├── dashboard/                  # Home page embed
    │   ├── src/
    │   │   ├── App.svelte
    │   │   └── main.ts
    │   ├── index.html
    │   └── vite.config.ts
    ├── module-conics-circle/
    ├── module-conics-parabola/
    ├── module-trigonometry-unit-circle/
    └── ... (more lesson modules)
```

### Build and Deployment

- Each package builds independently using Vite.
- Output directories are configured to match the `githubPagesPath` values in Firestore.
- GitHub Actions workflow builds all modules on push to `main` and deploys to the `gh-pages` branch.
- The base path for all assets is set to `/precalc-modules/` (or a similar consistent prefix)

## Maintenance and Extensibility

### Adding a New Lesson

1. Create a new Firestore document in `curriculum/lessons` with appropriate fields.
2. Duplicate an existing module folder in the monorepo.
3. Update the lesson content and quiz questions.
4. Build and deploy via GitHub Actions.

### Updating Curriculum (Topics, Lesson Order)

Edit Firestore documents directly via Firebase Console or a simple admin script. No code changes required.

### Firebase Blaze Plan Considerations

- Firestore read/write limits on free tire should be sufficient for a typical class size
- Implement offline persistence for smoother experience.