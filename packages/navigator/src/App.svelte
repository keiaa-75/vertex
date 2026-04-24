<script lang="ts">
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
  const gate = (params.get('gate') ?? '') as 'viewed' | 'interacted' | 'completed';
  const next = params.get('next') ?? '#';
  const label = params.get('label') ?? 'Continue →';

  // ---- State -----------------------------------------------------------
  let user = $state<User | null>(null);
  let authReady = $state(false);
  let gateMet = $state<boolean | null>(null);
  let loadingDoc = $state(false);

  let unsubAuth = $state<(() => void) | null>(null);
  let unsubDoc = $state<(() => void) | null>(null);

  // ---- Derived hint text ------------------------------------------------
  const hintText = $derived(() => {
    if (!lessonId || !gate || !next) return 'Page misconfiguration';
    switch (gate) {
      case 'viewed':     return 'Submit the pre‑test above to continue';
      case 'interacted': return 'Complete the activity above to continue';
      case 'completed':  return 'Pass the post‑test (75%) to continue';
    }
  });

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

  // ---- Snapshot subscription (when user and params are ready) ----------
  $effect(() => {
    // Cleanup previous listener
    unsubDoc?.();
    unsubDoc = null;

    // Only proceed when auth is ready and we have a user and valid lessonId
    if (!authReady || !user || !lessonId || !gate) {
      gateMet = null;
      return;
    }

    loadingDoc = true;
    const docRef = doc(db, 'progress', `${user.uid}_${lessonId}`);

    unsubDoc = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const isMet = Boolean(data[gate]);
          gateMet = isMet;
        } else {
          gateMet = false;
        }
        loadingDoc = false;
      },
      (err) => {
        console.error('Navigator snapshot error:', err);
        gateMet = false;
        loadingDoc = false;
      }
    );
  });

  // ---- Navigation handler ----------------------------------------------
  function handleProceed() {
    if (!gateMet) return;
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = next;
      } else {
        window.location.href = next;
      }
    } catch {
      window.open(next, '_blank', 'noopener,noreferrer');
    }
  }
</script>

<main class="navigator-shell">
  {#if !authReady || loadingDoc}
    <!-- Loading state -->
    <div class="nav-spinner" aria-label="Loading progress…"></div>
    <p class="nav-hint">Checking your progress…</p>

  {:else if !user}
    <!-- Not signed in -->
    <p class="nav-hint">Please sign in to access this content.</p>

  {:else}
    <!-- Authenticated: show button -->
    <button
      class="nav-btn"
      class:active={gateMet === true}
      class:locked={gateMet === false}
      disabled={gateMet !== true}
      onclick={handleProceed}
      aria-label={gateMet ? `Proceed to next page` : `Cannot proceed yet`}
    >
      {label}
    </button>

    {#if gateMet === false}
      <p class="nav-hint">{hintText}</p>
    {:else if gateMet === true}
      <p class="nav-hint">You can now continue forward.</p>
    {/if}
  {/if}
</main>