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
   *   lessonId   (required)  The PARENT lesson ID (the lesson page containing this embed).
   *                          This is NOT the module name — it's the lesson being tracked.
   *                          Example: "parabola"
   *   gate       (required)  Which field to check: "viewed", "interacted", or "completed"
   *   next       (required)  Full URL to navigate to when gate passes
   *   label      (optional)  Forward button text. Default: "Continue →"
   *   home       (optional)  URL for unauthenticated "Sign in" button. Default: "/"
   *   back       (optional)  If a URL: navigates there. If "true": calls history.back()
   *                          on the top frame. Omit to hide the back button entirely.
   *   backLabel  (optional)  Back button text. Default: "← Back"
   *   align      (optional)  Button alignment: "left" | "center" | "right". Default: "center"
   *   padding    (optional)  Set to "none" to strip shell padding. Default: standard padding.
   *
   * Example Embed URLs
   * ------------------
   * Pretest page (gate: viewed, back button to home):
   *   /navigator/?lessonId=parabola&gate=viewed&next=https://site/lesson&label=Start+→&back=https://site/home
   *
   * Lesson page (gate: interacted, browser back, left-aligned, no padding):
   *   /navigator/?lessonId=parabola&gate=interacted&next=https://site/posttest&back=true&align=left&padding=none
   *
   * Posttest page (gate: completed):
   *   /navigator/?lessonId=parabola&gate=completed&next=https://site/dashboard&label=Back+Home
   *
   * Firestore Details
   * -----------------
   * Document path: progress/{uid}_{lessonId}
   *
   * Gates map to boolean fields:
   *   viewed     → progress.viewed
   *   interacted → progress.interacted
   *   completed  → progress.completed
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

  // ---- URL parameters --------------------------------------------------
  const params = new URLSearchParams(window.location.search);

  const lessonId  = params.get('lessonId') ?? '';
  const gate      = (params.get('gate') ?? '') as 'viewed' | 'interacted' | 'completed';
  const next      = params.get('next') ?? '#';
  const label     = params.get('label') ?? 'Continue →';
  const home      = params.get('home') ?? '/vertex/';
  const back      = params.get('back');          // null = no back button
  const backLabel = params.get('backLabel') ?? '← Back';
  const align     = params.get('align') ?? 'center';
  const padding   = params.get('padding');       // "none" = no padding

  const showBack  = back !== null;

  // ---- Derived styles --------------------------------------------------
  const alignMap: Record<string, string> = {
    left:   'flex-start',
    center: 'center',
    right:  'flex-end',
  };

  const shellStyle = [
    `justify-content: ${alignMap[align] ?? 'center'}`,
    padding === 'none' ? 'padding: 0' : '',
  ].filter(Boolean).join('; ');

  // ---- State -----------------------------------------------------------
  let user       = $state<User | null>(null);
  let authReady  = $state(false);
  let gateMet    = $state<boolean | null>(null);
  let loadingDoc = $state(false);

  let unsubAuth: (() => void) | null = null;
  let unsubDoc:  (() => void) | null = null;

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

  // ---- Snapshot subscription (re-runs when auth state or lessonId changes)
  $effect(() => {
    unsubDoc?.();
    unsubDoc = null;

    if (!authReady || !user || !lessonId || !gate) {
      gateMet = null;
      return;
    }

    loadingDoc = true;
    const docRef = doc(db, 'progress', `${user.uid}_${lessonId}`);

    unsubDoc = onSnapshot(
      docRef,
      (snap) => {
        gateMet    = snap.exists() ? Boolean(snap.data()[gate]) : false;
        loadingDoc = false;
      },
      (err) => {
        console.error('Navigator snapshot error:', err);
        gateMet    = false;
        loadingDoc = false;
      }
    );
  });
</script>

<main class="navigator-shell" style={shellStyle}>
  {#if !authReady || loadingDoc}
    <!-- Loading — intentionally blank -->

  {:else if !user}
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

  {:else}
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
  {/if}
</main>