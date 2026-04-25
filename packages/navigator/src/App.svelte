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
   *   lessonId  (required)  The PARENT lesson ID (the lesson page containing this embed).
   *                        This is NOT the module name — it's the lesson being tracked.
   *                        Example: "parabola"
   *   gate     (required)  Which field to check: "viewed", "interacted", or "completed"
   *   next     (required)  Full URL to navigate to when gate passes
   *   label    (optional)  Button text. Default: "Continue →"
   *   home     (optional)  URL for unauthenticated "Sign in" button. Default: "/"
   *
   * Example Embed URLs
   * --------------
   * Pretest page (gate: viewed):
   *   /navigator/?lessonId=parabola&gate=viewed&next=https://site/lesson&label=Start+→
   *
   * Lesson page (gate: interacted):
   *   /navigator/?lessonId=parabola&gate=interacted&next=https://site/posttest&label=Done
   *
   * Posttest page (gate: completed):
   *   /navigator/?lessonId=parabola&gate=completed&next=https://site/dashboard&label=Back+Home
   *
   * Firestore Details
   * -------------
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

  const lessonId = params.get('lessonId') ?? '';
  const gate     = (params.get('gate') ?? '') as 'viewed' | 'interacted' | 'completed';
  const next     = params.get('next') ?? '#';
  const label    = params.get('label') ?? 'Continue →';
  // Separate home URL for unauthenticated redirect — always points to the
  // Google Sites home page where the dashboard embed lives.
  const home     = params.get('home') ?? '/';

  // ---- State -----------------------------------------------------------
  let user       = $state<User | null>(null);
  let authReady  = $state(false);
  let gateMet    = $state<boolean | null>(null);
  let loadingDoc = $state(false);

  // Plain lets — cleanup functions have no reason to be reactive
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
      window.open(url, '_top');
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

<main class="navigator-shell">
  {#if !authReady || loadingDoc}
    <!-- Loading -->
  {:else if !user}
    <button
      class="nav-btn active"
      onclick={() => navigateTo(home)}
      aria-label="Go to sign-in page"
    >
      Sign in to continue
    </button>
  {:else}
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