<script lang="ts">
  import { onMount } from 'svelte';
  import { generateCard, type Direction, type ParabolaCard } from './lib/generator';
  import { swipe } from './lib/swipe';
  import { audio } from './lib/audio';
  import {
    auth,
    db,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    onAuthStateChanged,
    type User
  } from '@vertex/shared';

  let gameState = $state<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  let currentCard = $state<ParabolaCard>(generateCard());
  let score = $state(0);
  let timeLeft = $state(3000);
  let isReverseMode = $state(false);
  let gameOverReason = $state<'TIMEOUT' | 'WRONG_DIRECTION' | null>(null);
  let lastFeedback = $state<'CORRECT' | 'WRONG' | null>(null);
  let lastInputDirection = $state<Direction | null>(null);

  const TIME_LIMIT = 3000;
  let timerInterval: number | undefined;

  let currentUser = $state<User | null>(null);
  let personalBest = $state(0);
  let highScoreLoaded = $state(false);

  let timerPct = $derived(timeLeft / TIME_LIMIT);
  let timerColorClass = $derived(
    timerPct > 0.55 ? '' : timerPct > 0.28 ? 'warn' : 'danger'
  );

  let displayBest = $derived(
    personalBest > 0 ? personalBest : null
  );

  async function loadHighScore(uid: string) {
    try {
      const ref = doc(db, 'highScores', uid);
      const snap = await getDoc(ref);
      if (snap.exists() && typeof snap.data().score === 'number') {
        personalBest = snap.data().score;
      } else {
        personalBest = 0;
      }
    } catch (e) {
      console.error('Failed to load high score:', e);
    } finally {
      highScoreLoaded = true;
    }
  }

  async function submitHighScore(finalScore: number) {
    if (!currentUser || finalScore <= personalBest) return;
  
    try {
      const ref = doc(db, 'highScores', currentUser.uid);
      await setDoc(ref, {
        score: finalScore,
        updatedAt: serverTimestamp()
      }, { merge: true });
      personalBest = finalScore;
    } catch (e) {
      console.error('Failed to save high score:', e);
    }
  }

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      if (user) {
        loadHighScore(user.uid);
      } else {
        personalBest = 0;
        highScoreLoaded = true;
      }
    });
    return unsubscribe;
  });

  function startGame() {
    audio.ensureContext();
    score = 0;
    lastFeedback = null;
    lastInputDirection = null;
    gameState = 'PLAYING';
    nextCard();
  }

  function nextCard() {
    currentCard = generateCard();
    timeLeft = TIME_LIMIT;
    lastFeedback = null;
    startTimer();
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
      timeLeft -= 10;
      if (timeLeft <= 0) endGame('TIMEOUT');
    }, 10);
  }

  function endGame(reason: 'TIMEOUT' | 'WRONG_DIRECTION') {
    clearInterval(timerInterval);
    gameState = 'GAME_OVER';
    gameOverReason = reason;
    submitHighScore(score);
  }

  const opposites: Record<Direction, Direction> = {
    UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT'
  };

  function handleInput(dir: Direction) {
    if (gameState !== 'PLAYING') return;

    lastInputDirection = dir;
    setTimeout(() => { lastInputDirection = null; }, 180);

    const target = isReverseMode ? opposites[currentCard.direction] : currentCard.direction;

    if (dir === target) {
      score++;
      lastFeedback = 'CORRECT';
      clearInterval(timerInterval);
      audio.play('success');
      setTimeout(nextCard, 160);
    } else {
      lastFeedback = 'WRONG';
      audio.play('warning');
      endGame('WRONG_DIRECTION');
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const keyMap: Record<string, Direction> = {
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT'
    };
    if (keyMap[e.key]) {
      e.preventDefault();
      handleInput(keyMap[e.key]);
    }
  }
</script>

<svelte:options css="injected" />
<svelte:window onkeydown={handleKeyDown} />

<main class="module-shell">
  <header class="game-header">
    <div class="score-pill">
      <span class="score-label">Score</span>
      <span class="score-value">{score}</span>
    </div>

    <div class="segmented-control" class:disabled={gameState === 'PLAYING'}>
      <button
        class="segment"
        class:active={!isReverseMode}
        disabled={gameState === 'PLAYING'}
        onclick={() => (isReverseMode = false)}
      >
        <span class="segment-full">Normal</span>
        <span class="segment-short">N</span>
      </button>
      <button
        class="segment"
        class:active={isReverseMode}
        disabled={gameState === 'PLAYING'}
        onclick={() => (isReverseMode = true)}
      >
        <span class="segment-full">Reverse</span>
        <span class="segment-short">R</span>
      </button>
    </div>
  </header>

  <div class="game-container">
    <div class="stage" use:swipe={handleInput}>
      <div class="timer-track" aria-hidden="true">
        <div
          class="timer-fill {timerColorClass}"
          style:width="{timerPct * 100}%"
        ></div>
      </div>

      <div class="card-arena">
        <div class="hint hint-up"    class:active={lastInputDirection === 'UP'}>W</div>
        <div class="hint hint-left"  class:active={lastInputDirection === 'LEFT'}>A</div>
        <div class="hint hint-right" class:active={lastInputDirection === 'RIGHT'}>D</div>
        <div class="hint hint-down"  class:active={lastInputDirection === 'DOWN'}>S</div>

        <div
          class="card"
          class:correct={lastFeedback === 'CORRECT'}
          class:wrong={lastFeedback === 'WRONG'}
          aria-live="polite"
        >
          {#if gameState === 'PLAYING'}
            <div class="equation">{@html currentCard.equationHtml}</div>
          {/if}
        </div>
      </div>
    </div>

    {#if gameState === 'MENU'}
      <div class="overlay" role="dialog" aria-modal="true">
        <h2 class="overlay-title">Parabola Sort</h2>

        {#if isReverseMode}
          <p class="overlay-body">
            Flick or press <kbd>W A S D</kbd> in the direction <strong>opposite</strong> to where the parabola opens.
          </p>
          <span class="mode-badge">Reversed mode active</span>
        {:else}
          <p class="overlay-body">
            Flick or press <kbd>W A S D</kbd> in the direction the parabola opens.
          </p>
        {/if}

        {#if currentUser && highScoreLoaded}
          {#if displayBest !== null}
            <p class="best-score">Your best: {displayBest}</p>
          {:else}
            <p class="best-score new-player">No high score yet</p>
          {/if}
        {:else if !currentUser}
          <p class="best-score sign-in-hint">Sign in to save your best score</p>
        {/if}

        <button class="btn-primary" onclick={startGame}>Start Session</button>
      </div>

    {:else if gameState === 'GAME_OVER'}
      <div class="overlay" role="dialog" aria-modal="true">
        <p class="over-reason" class:is-timeout={gameOverReason === 'TIMEOUT'} class:is-wrong={gameOverReason === 'WRONG_DIRECTION'}>
          {gameOverReason === 'TIMEOUT' ? 'Out of time' : 'Wrong direction'}
        </p>
        <p class="over-score">
          {score === 0
            ? 'No cards sorted this session.'
            : `You sorted ${score} ${score === 1 ? 'card' : 'cards'} correctly.`}
        </p>
        {#if currentUser && highScoreLoaded}
          {#if personalBest > 0}
            <p class="best-score">
              {score >= personalBest ? `New personal best! ${score}` : `Best: ${personalBest}`}
            </p>
          {/if}
        {/if}
        <button class="btn-primary" onclick={startGame}>Try Again</button>
      </div>
    {/if}
  </div>
</main>

<style>
  .module-shell {
    width: 100%;
    height: 100dvh;
    margin: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--md-sys-color-background);
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-body);
    -webkit-font-smoothing: antialiased;
  }

  .game-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--md-sys-spacing-md);
    padding: var(--md-sys-spacing-sm) var(--md-sys-spacing-md);
    background: var(--md-sys-color-surface);
    border-bottom: 1px solid var(--md-sys-color-surface-variant);
    flex-shrink: 0;
  }

  .score-pill {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-primary);
    padding: 0.3rem 0.875rem;
    border-radius: var(--md-sys-shape-corner-full);
    min-width: 72px;
  }

  .score-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
    line-height: 1;
  }

  .score-value {
    font-family: var(--md-sys-typescale-heading);
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1;
  }

  .segmented-control {
    display: inline-flex;
    align-items: center;
    border: 1.5px solid var(--md-sys-color-on-surface-variant);
    border-radius: var(--md-sys-shape-corner-full);
    overflow: hidden;
    background: var(--md-sys-color-surface-variant);
  }

  .segmented-control.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .segment {
    all: unset;
    padding: 0.3rem 0.75rem;
    font-family: var(--md-sys-typescale-body);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface-variant);
    background: transparent;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    border-right: 1px solid var(--md-sys-color-on-surface-variant);
    line-height: 1.3;
    white-space: nowrap;
  }

  .segment:last-child {
    border-right: none;
  }

  .segment.active {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }

  .segment:disabled {
    cursor: not-allowed;
  }

  .segment-short { display: none; }
  .segment-full { display: inline; }

  @media (max-width: 480px) {
    .segment-short { display: inline; }
    .segment-full { display: none; }
    .segment {
      padding: 0.3rem 0.55rem;
    }
  }

  .game-container {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .stage {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
  }

  .timer-track {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--md-sys-color-surface-variant);
    z-index: 1;
  }

  .timer-fill {
    height: 100%;
    background: var(--md-sys-color-primary);
    transition: width 0.01s linear, background 0.4s ease;
  }

  .timer-fill.warn   { background: var(--md-sys-color-secondary); }
  .timer-fill.danger { background: var(--md-sys-color-error); }

  .card-arena {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card {
    width: clamp(220px, 44vw, 300px);
    height: clamp(130px, 28vh, 200px);
    background: var(--md-sys-color-surface);
    border: 2px solid var(--md-sys-color-surface-variant);
    border-radius: var(--md-sys-shape-corner-large);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--md-sys-elevation-2);
    transition: border-color 0.12s, transform 0.12s, box-shadow 0.12s;
  }

  .card.correct {
    border-color: var(--md-sys-color-completed);
    transform: scale(1.04);
    box-shadow: 0 6px 18px rgba(5, 150, 105, 0.2);
  }

  .card.wrong {
    border-color: var(--md-sys-color-error);
    transform: scale(0.97);
    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.2);
  }

  .equation {
    font-family: var(--md-sys-typescale-heading);
    font-size: clamp(1.4rem, 4.5vw, 2rem);
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
    text-align: center;
    padding: var(--md-sys-spacing-md);
    user-select: none;
    line-height: 1.2;
  }

  .equation :global(sup) {
    font-size: 0.58em;
    vertical-align: super;
  }

  .hint {
    position: absolute;
    width: 34px;
    height: 34px;
    border: 1.5px solid var(--md-sys-color-on-surface-variant);
    border-radius: var(--md-sys-shape-corner-small);
    background: var(--md-sys-color-surface);
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-heading);
    font-weight: 700;
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.45;
    pointer-events: none;
    user-select: none;
    transition: opacity 0.12s, background 0.12s, color 0.12s, border-color 0.12s;
  }

  .hint-up   { top: -48px;  left: 50%; transform: translateX(-50%); }
  .hint-down { bottom: -48px; left: 50%; transform: translateX(-50%); }
  .hint-left { left: -48px;  top: 50%; transform: translateY(-50%); }
  .hint-right { right: -48px; top: 50%; transform: translateY(-50%); }

  .hint.active {
    opacity: 1;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    border-color: var(--md-sys-color-primary);
  }

  .hint-up.active    { transform: translateX(-50%) scale(1.18); }
  .hint-down.active  { transform: translateX(-50%) scale(1.18); }
  .hint-left.active  { transform: translateY(-50%) scale(1.18); }
  .hint-right.active { transform: translateY(-50%) scale(1.18); }

  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(248, 250, 252, 0.96);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--md-sys-spacing-sm);
    padding: var(--md-sys-spacing-xl);
    z-index: 10;
    text-align: center;
    backdrop-filter: blur(2px);
  }

  .overlay-title {
    font-family: var(--md-sys-typescale-heading);
    font-size: clamp(1.5rem, 5vw, 2rem);
    font-weight: 700;
    color: var(--md-sys-color-primary);
    margin: 0 0 var(--md-sys-spacing-xs);
  }

  .overlay-body {
    color: var(--md-sys-color-on-surface-variant);
    font-size: clamp(0.85rem, 2.2vw, 0.95rem);
    max-width: 260px;
    margin: 0;
    line-height: 1.55;
  }

  .overlay-body :global(kbd) {
    font-family: var(--md-sys-typescale-heading);
    font-weight: 700;
    background: var(--md-sys-color-surface-variant);
    padding: 0.1em 0.35em;
    border-radius: 4px;
    font-size: 0.9em;
    color: var(--md-sys-color-on-surface);
  }

  .mode-badge {
    background: var(--md-sys-color-secondary);
    color: var(--md-sys-color-on-secondary);
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.25rem 0.875rem;
    border-radius: var(--md-sys-shape-corner-full);
  }

  .best-score {
    font-weight: 600;
    color: var(--md-sys-color-primary);
    font-size: 0.95rem;
    margin: 0.25rem 0 0;
  }

  .new-player {
    opacity: 0.7;
    font-style: italic;
  }

  .sign-in-hint {
    font-size: 0.82rem;
    color: var(--md-sys-color-on-surface-variant);
  }

  .over-reason {
    font-family: var(--md-sys-typescale-heading);
    font-size: clamp(1.3rem, 4vw, 1.7rem);
    font-weight: 700;
    margin: 0;
  }

  .over-reason.is-timeout  { color: var(--md-sys-color-secondary); }
  .over-reason.is-wrong    { color: var(--md-sys-color-error); }

  .over-score {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.9rem;
    margin: 0;
  }

  .btn-primary {
    margin-top: var(--md-sys-spacing-sm);
    padding: 0.7rem 2rem;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    border: none;
    border-radius: var(--md-sys-shape-corner-full);
    font-family: var(--md-sys-typescale-body);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--md-sys-elevation-1);
    transition: box-shadow 0.2s, transform 0.12s;
  }

  .btn-primary:hover  { box-shadow: var(--md-sys-elevation-2); }
  .btn-primary:active { transform: scale(0.97); }
</style>