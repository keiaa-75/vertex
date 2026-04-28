<script lang="ts">
  /*
   * Navigator — Conditional Proceed Button Embed
   * ================================
   * A reusable embed that reads Firestore progress and shows an active/disabled
   * button based on gate conditions. Used as an iframe in Google Sites pages.
   *
   * URL Parameters
   * ------------
   * All parameters are passed via query string.
   *
   *   lessonId    (required)  The PARENT lesson ID (the lesson page containing this embed).
   *                           This is NOT the module name — it's the lesson being tracked.
   *                           Example: "parabola"
   *   gate        (required)  Which field to check: "viewed", "interacted", or "completed"
   *   next        (required)  Full URL to navigate to when gate passes
   *   label       (optional)  Forward button text. Default: "Continue →"
   *   home        (optional)  URL for unauthenticated "Sign in" button. Default: "/"
   *   back        (optional)  If a URL: navigates there. If "true": calls history.back()
   *                           on the top frame. Omit to hide the back button entirely.
   *   backLabel   (optional)  Back button text. Default: "← Back"
   *   align       (optional)  Content alignment: "left" | "center" | "right". Default: "center"
   *   padding     (optional)  Set to "none" to strip shell padding. Default: standard padding.
   *   showStatus  (optional)  Set to "true" to show a status line above the button describing
   *                           the student's submission state or any pipeline errors.
   *
   * Example Embed URLs
   * ------------------
   * Pretest page (gate: viewed, show status):
   *   /navigator/?lessonId=parabola&gate=viewed&next=https://site/lesson&showStatus=true
   *
   * Lesson page (gate: interacted, browser back, show status):
   *   /navigator/?lessonId=parabola&gate=interacted&next=https://site/posttest&back=true&showStatus=true
   *
   * Posttest page (gate: completed, show status):
   *   /navigator/?lessonId=parabola&gate=completed&next=https://site/dashboard&showStatus=true
   */

  import { onMount } from 'svelte';
  import {
    auth,
    db,
    doc,
    onSnapshot,
    onAuthStateChanged,
    type User
  } from '@vertex/shared';
  import type { Progress } from '@vertex/shared';

  // ---- URL parameters --------------------------------------------------
  const params = new URLSearchParams(window.location.search);

  const lessonId   = params.get('lessonId') ?? '';
  const gate       = (params.get('gate') ?? '') as 'viewed' | 'interacted' | 'completed';
  const next       = params.get('next') ?? '#';
  const label      = params.get('label') ?? 'Continue →';
  const home       = params.get('home') ?? '/vertex/';
  const back       = params.get('back');
  const backLabel  = params.get('backLabel') ?? '← Back';
  const align      = params.get('align') ?? 'center';
  const padding    = params.get('padding');
  const showStatus = params.get('showStatus') === 'true';

  const showBack = back !== null;

  // ---- Derived styles --------------------------------------------------
  // align-items controls horizontal placement in column flex
  const alignMap: Record<string, string> = {
    left:   'flex-start',
    center: 'center',
    right:  'flex-end',
  };

  const shellStyle = [
    `align-items: ${alignMap[align] ?? 'center'}`,
    padding === 'none' ? 'padding: 0' : '',
  ].filter(Boolean).join('; ');

  // ---- State -----------------------------------------------------------
  let user         = $state<User | null>(null);
  let authReady    = $state(false);
  let gateMet      = $state<boolean | null>(null);
  let loadingDoc   = $state(false);
  let progressData = $state<Progress | null>(null);

  let unsubAuth: (() => void) | null = null;
  let unsubDoc:  (() => void) | null = null;

  // ---- Status line -----------------------------------------------------
  type StatusTone = 'info' | 'success' | 'warning' | 'error';
  interface StatusInfo { text: string; tone: StatusTone; }

  let statusInfo = $derived.by<StatusInfo | null>(() => {
    if (!showStatus || !authReady || !user) return null;

    const p = progressData;

    // Pipeline errors are only relevant for form-gated stages (viewed, completed).
    // The interacted gate is set client-side by markInteracted, not by GAS.
    if ((gate === 'viewed' || gate === 'completed') && p?.pipelineError) {
      return {
        text: 'Something went wrong processing your submission. Please let your teacher know.',
        tone: 'error',
      };
    }

    switch (gate) {
      case 'viewed':
        if (p?.viewed) return { text: 'Pre-test submitted', tone: 'success' };
        return { text: 'Submit the pre-test form above to unlock this button.', tone: 'info' };

      case 'interacted':
        if (p?.interacted) return { text: 'Activity completed', tone: 'success' };
        return { text: 'Complete the activity above to unlock this button.', tone: 'info' };

      case 'completed': {
        if (p?.completed) {
          // Prefer the score from the submission record; fall back to quizScore
          const score = p.lastSubmission?.score ?? p.quizScore;
          const scoreStr = score != null ? ` with ${score.toFixed(1)}%` : '';
          return { text: `Post-test passed${scoreStr}`, tone: 'success' };
        }
        if (p?.lastSubmission?.status === 'below_threshold') {
          const score = p.lastSubmission.score;
          const scoreStr = score != null ? `${score.toFixed(1)}%` : 'Your score';
          return {
            text: `${scoreStr} — 75% or higher is needed to proceed.`,
            tone: 'warning',
          };
        }
        return { text: 'Submit the post-test form above to unlock this button.', tone: 'info' };
      }

      default:
        return null;
    }
  });

  // ---- Navigation helpers ----------------------------------------------
  function navigateTo(url: string) {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function navigateBack() {
    if (!back) return;
    if (back === 'true') {
      try {
        if (window.top && window.top !== window.self) {
          window.top.history.back();
        } else {
          window.history.back();
        }
      } catch {
        window.history.back();
      }
    } else {
      navigateTo(back);
    }
  }

  // ---- Auth subscription -----------------------------------------------
  onMount(() => {
    unsubAuth = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      user = firebaseUser;
      authReady = true;
    });

    return () => {
      unsubAuth?.();
      unsubDoc?.();
    };
  });

  // ---- Snapshot subscription -------------------------------------------
  $effect(() => {
    unsubDoc?.();
    unsubDoc = null;

    if (!authReady || !user || !lessonId || !gate) {
      gateMet      = null;
      progressData = null;
      return;
    }

    loadingDoc = true;
    const docRef = doc(db, 'progress', `${user.uid}_${lessonId}`);

    unsubDoc = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Progress;
          progressData = data;
          gateMet      = Boolean(data[gate]);
        } else {
          progressData = null;
          gateMet      = false;
        }
        loadingDoc = false;
      },
      (err) => {
        console.error('Navigator snapshot error:', err);
        progressData = null;
        gateMet      = false;
        loadingDoc   = false;
      }
    );
  });
</script>

<main class="navigator-shell" style={shellStyle}>
  {#if !authReady || loadingDoc}
    <!-- Loading — intentionally blank -->

  {:else if !user}
    <div class="btn-row">
      {#if showBack}
        <button class="nav-btn back-btn" onclick={navigateBack} aria-label="Go back">
          {backLabel}
        </button>
      {/if}
      <button
        class="nav-btn active"
        onclick={() => navigateTo(home)}
        aria-label="Go to sign-in page"
      >
        Sign in to continue
      </button>
    </div>

  {:else}
    {#if showStatus && statusInfo}
      <p class="status-text status-{statusInfo.tone}" aria-live="polite">
        {statusInfo.text}
      </p>
    {/if}

    <div class="btn-row">
      {#if showBack}
        <button class="nav-btn back-btn" onclick={navigateBack} aria-label="Go back">
          {backLabel}
        </button>
      {/if}
      <button
        class="nav-btn"
        class:active={gateMet === true}
        class:locked={gateMet === false}
        disabled={gateMet !== true}
        onclick={() => navigateTo(next)}
        aria-label={gateMet ? 'Proceed to next page' : 'Cannot proceed yet'}
      >
        {label}
      </button>
    </div>
  {/if}
</main>