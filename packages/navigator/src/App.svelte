<script lang="ts">
  /*
   * Navigator — Conditional Proceed Button + Standalone Score Card
   * ==============================================================
   * mode=navigate (default): reads Firestore progress and shows
   *   an active/disabled proceed button based on a gate condition.
   *
   * mode=score: shows a lesson score card with pre/post-test bars,
   *   mastery badge, delta, and navigation buttons. Useful as a
   *   standalone embed on Google Sites lesson summary pages.
   *
   * ── Shared params ───────────────────────────────────────────
   *   lessonId      (required)  The lesson being tracked.
   *   homeUrl       (optional)  Home button target. Default: /vertex/
   *
   * ── navigate-mode params ────────────────────────────────────
   *   gate          (required)  "viewed" | "interacted" | "completed"
   *   next          (required)  URL to navigate to when gate passes
   *   label         (optional)  Forward button text. Default: "Continue →"
   *   back          (optional)  URL or "true" (history.back). Omit to hide.
   *   backLabel     (optional)  Default: "← Back"
   *   align         (optional)  "left" | "center" | "right". Default: "center"
   *   padding       (optional)  "none" strips shell padding.
   *   showStatus    (optional)  "true" shows a status line above the button.
   *
   * ── score-mode params ───────────────────────────────────────
   *   lessonTitle   (optional)  Display title. Default: "Lesson"
   *   lessonUrl     (optional)  "View Lesson" button target.
   *   nextUrl       (optional)  "Next Lesson" button target.
   *   nextLabel     (optional)  Default: "Next Lesson"
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

  const mode     = params.get('mode') ?? 'navigate'; // 'navigate' | 'score'
  const lessonId = params.get('lessonId') ?? '';
  const homeUrl  = params.get('homeUrl')  ?? '/vertex/';

  // navigate-mode params
  const gate      = (params.get('gate') ?? '') as 'viewed' | 'interacted' | 'completed';
  const next      = params.get('next')      ?? '#';
  const label     = params.get('label')     ?? 'Continue →';
  const back      = params.get('back');
  const backLabel = params.get('backLabel') ?? '← Back';
  const align     = params.get('align')     ?? 'center';
  const padding   = params.get('padding');
  const showStatus = params.get('showStatus') === 'true';
  const showBack   = back !== null;

  // score-mode params
  const lessonTitle = params.get('lessonTitle') ?? 'Lesson';
  const lessonUrl   = params.get('lessonUrl')   ?? '';
  const nextUrl     = params.get('nextUrl')     ?? '';
  const nextLabel   = params.get('nextLabel')   ?? 'Next Lesson';

  // ---- Derived styles (navigate mode) ----------------------------------
  const alignMap: Record<string, string> = {
    left:   'flex-start',
    center: 'center',
    right:  'flex-end',
  };

  const shellStyle = mode === 'navigate' ? [
    `align-items: ${alignMap[align] ?? 'center'}`,
    padding === 'none' ? 'padding: 0' : '',
  ].filter(Boolean).join('; ') : '';

  // ---- State -----------------------------------------------------------
  let user         = $state<User | null>(null);
  let authReady    = $state(false);
  let gateMet      = $state<boolean | null>(null);
  let loadingDoc   = $state(false);
  let progressData = $state<Progress | null>(null);

  let unsubAuth: (() => void) | null = null;
  let unsubDoc:  (() => void) | null = null;

  // ---- Phase (navigate mode) ------------------------------------------
  type NavPhase = 'initializing' | 'unauthenticated' | 'loading' | 'ready';

  let phase = $derived.by<NavPhase>(() => {
    if (!authReady)  return 'initializing';
    if (!user)       return 'unauthenticated';
    if (loadingDoc)  return 'loading';
    return 'ready';
  });

  // ---- Status line (navigate mode) ------------------------------------
  type StatusTone = 'info' | 'success' | 'warning' | 'error';
  interface StatusInfo { text: string; tone: StatusTone; }

  let statusInfo = $derived.by<StatusInfo | null>(() => {
    if (!showStatus || phase !== 'ready') return null;
    const p = progressData;

    if ((gate === 'viewed' || gate === 'completed') && p?.pipelineError) {
      return { text: 'Something went wrong processing your submission. Please let your teacher know.', tone: 'error' };
    }

    switch (gate) {
      case 'viewed':
        if (p?.viewed) return { text: 'Pre-test submitted', tone: 'success' };
        if (p?.lastSubmission?.status === 'processing')
          return { text: 'Submission received — processing…', tone: 'info' };
        return { text: 'Submit the pre-test form above to unlock this button.', tone: 'info' };

      case 'interacted':
        if (p?.interacted) return { text: 'Activity completed', tone: 'success' };
        return { text: 'Complete the activity above to unlock this button.', tone: 'info' };

      case 'completed': {
        if (p?.completed) {
          const score = p.lastSubmission?.score ?? p.quizScore;
          const scoreStr = score != null ? ` with ${score.toFixed(1)}%` : '';
          return { text: `Post-test passed${scoreStr}`, tone: 'success' };
        }
        if (p?.lastSubmission?.status === 'processing')
          return { text: 'Post-test received — grading in progress…', tone: 'info' };
        if (p?.lastSubmission?.status === 'below_threshold') {
          const score = p.lastSubmission.score;
          const scoreStr = score != null ? `${score.toFixed(1)}%` : 'Your score';
          return { text: `${scoreStr} — 75% or higher is needed to proceed.`, tone: 'warning' };
        }
        return { text: 'Submit the post-test form above to unlock this button.', tone: 'info' };
      }

      default: return null;
    }
  });

  // ---- Score-mode derivations -----------------------------------------
  let pretestScore  = $derived(progressData?.pretestScore  ?? null);
  let posttestScore = $derived(progressData?.quizScore     ?? null);

  let scoreDelta = $derived(
    pretestScore !== null && posttestScore !== null
      ? posttestScore - pretestScore
      : null
  );

  type MasteryLevel = { label: string; tone: 'advanced' | 'proficient' | 'developing' | 'beginning' };

  function getMastery(score: number): MasteryLevel {
    if (score >= 85) return { label: 'Advanced',   tone: 'advanced'   };
    if (score >= 75) return { label: 'Proficient', tone: 'proficient' };
    if (score >= 60) return { label: 'Developing', tone: 'developing' };
    return               { label: 'Beginning',  tone: 'beginning'  };
  }

  let mastery = $derived(posttestScore !== null ? getMastery(posttestScore) : null);

  let postFailed = $derived(
    posttestScore !== null &&
    !progressData?.completed &&
    progressData?.lastSubmission?.status === 'below_threshold'
  );

  function fmtScore(n: number): string {
    return n % 1 === 0 ? `${n}%` : `${n.toFixed(1)}%`;
  }

  function fmtDelta(d: number): string {
    const abs = Math.abs(d);
    const str = abs % 1 === 0 ? `${abs} pts` : `${abs.toFixed(1)} pts`;
    return d > 0 ? `+${str}` : d < 0 ? `\u2212${str}` : 'No change';
  }

  // ---- Navigation helpers ----------------------------------------------
  function navigateTo(url: string) {
    if (!url || url === '#') return;
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
        (window.top ?? window).history.back();
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
      user      = firebaseUser;
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

    if (!authReady || !user || !lessonId) {
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
          gateMet      = mode === 'navigate' ? Boolean(data[gate]) : null;
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

<!-- ================================================================
     SCORE MODE
     ================================================================ -->
{#if mode === 'score'}
  <main class="score-shell">
    {#if !authReady || loadingDoc}
      <div class="score-loading">
        <span class="nav-spinner" aria-hidden="true"></span>
        <span>Loading scores…</span>
      </div>

    {:else if !user}
      <div class="score-unauth">
        <p class="score-unauth-text">Sign in to view your scores.</p>
        <button class="nav-btn active" onclick={() => navigateTo(homeUrl)}>
          Sign in
        </button>
      </div>

    {:else}
      <!-- Title -->
      <h2 class="score-title">{lessonTitle}</h2>

      <!-- Pre-test bar -->
      <div class="score-block">
        <div class="score-row-label">
          <span class="score-tag">Pre-test</span>
          {#if pretestScore !== null}
            <span class="score-pct">{fmtScore(pretestScore)}</span>
          {:else}
            <span class="score-none">Not taken yet</span>
          {/if}
        </div>
        <div class="bar-track">
          <div
            class="bar-fill bar-fill--pre"
            style:width={pretestScore !== null ? `${pretestScore}%` : '0%'}
            style:opacity={pretestScore !== null ? '1' : '0'}
          ></div>
        </div>
      </div>

      <!-- Post-test bar -->
      <div class="score-block">
        <div class="score-row-label">
          <span class="score-tag">Post-test</span>
          {#if posttestScore !== null}
            <span class="score-pct" class:score-pct--failed={postFailed}>
              {fmtScore(posttestScore)}
            </span>
          {:else}
            <span class="score-none">Not taken yet</span>
          {/if}
        </div>
        <div class="bar-track">
          <div
            class="bar-fill"
            class:bar-fill--post={!postFailed}
            class:bar-fill--failed={postFailed}
            style:width={posttestScore !== null ? `${posttestScore}%` : '0%'}
            style:opacity={posttestScore !== null ? '1' : '0'}
          ></div>
        </div>
        {#if postFailed}
          <p class="pass-hint">75% required to pass</p>
        {/if}
      </div>

      <!-- Insight row -->
      {#if posttestScore !== null}
        <div class="insight-row">
          {#if mastery}
            <span class="mastery-badge mastery-{mastery.tone}">{mastery.label}</span>
          {/if}
          {#if scoreDelta !== null}
            <span
              class="delta-pill"
              class:delta-up={scoreDelta > 0}
              class:delta-down={scoreDelta < 0}
              class:delta-flat={scoreDelta === 0}
            >
              {#if scoreDelta > 0}<span aria-hidden="true">↑</span>
              {:else if scoreDelta < 0}<span aria-hidden="true">↓</span>
              {:else}<span aria-hidden="true">→</span>{/if}
              {fmtDelta(scoreDelta)}
            </span>
          {/if}
        </div>

        {#if scoreDelta !== null}
          <p class="delta-message"
             class:positive={scoreDelta > 0}
             class:negative={scoreDelta < 0}>
            {#if scoreDelta > 10}Great improvement from your pre-test!
            {:else if scoreDelta > 0}You improved since your pre-test.
            {:else if scoreDelta === 0}Your score stayed the same — consider reviewing the material.
            {:else if scoreDelta > -15}Your score dipped a little from your pre-test. Worth a review.
            {:else}Significant drop from pre-test. Revisit the lesson before retaking.
            {/if}
          </p>
        {/if}
      {/if}

      <!-- Navigation buttons -->
      <div class="score-nav">
        {#if lessonUrl}
          <button class="btn-view-lesson" onclick={() => navigateTo(lessonUrl)}>
            View Lesson
          </button>
        {/if}

        <div class="score-nav-secondary">
          <button class="btn-nav-secondary" onclick={() => navigateTo(homeUrl)}>
            Home
          </button>

          {#if nextUrl}
            <button class="btn-nav-secondary btn-nav-next" onclick={() => navigateTo(nextUrl)}>
              {nextLabel}
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </main>

<!-- ================================================================
     NAVIGATE MODE (original behaviour)
     ================================================================ -->
{:else}
  <main class="navigator-shell" style={shellStyle}>

    {#if phase === 'initializing' || phase === 'loading'}
      {#if showStatus}
        <p class="status-text status-info" aria-live="polite">Checking your progress…</p>
      {/if}
      <div class="btn-row">
        {#if showBack}
          <button class="nav-btn back-btn" onclick={navigateBack} aria-label="Go back">{backLabel}</button>
        {/if}
        <button class="nav-btn locked" disabled aria-label="Checking progress…">
          <span class="nav-spinner" aria-hidden="true"></span>
          {label}
        </button>
      </div>

    {:else if phase === 'unauthenticated'}
      <div class="btn-row">
        {#if showBack}
          <button class="nav-btn back-btn" onclick={navigateBack} aria-label="Go back">{backLabel}</button>
        {/if}
        <button class="nav-btn active" onclick={() => navigateTo(homeUrl)} aria-label="Go to sign-in page">
          Sign in to continue
        </button>
      </div>

    {:else}
      {#if showStatus && statusInfo}
        <p class="status-text status-{statusInfo.tone}" aria-live="polite">{statusInfo.text}</p>
      {/if}
      <div class="btn-row">
        {#if showBack}
          <button class="nav-btn back-btn" onclick={navigateBack} aria-label="Go back">{backLabel}</button>
        {/if}
        <button
          class="nav-btn"
          class:active={gateMet === true}
          class:locked={gateMet !== true}
          disabled={gateMet !== true}
          onclick={() => navigateTo(next)}
          aria-label={gateMet ? 'Proceed to next page' : 'Cannot proceed yet'}
        >
          {label}
        </button>
      </div>
    {/if}

  </main>
{/if}