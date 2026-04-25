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
    markInteracted,
    type User
  } from '@vertex/shared';

  // Read lessonId from the iframe's query string.
  // This is the PARENT lesson ID, not the module name.
  // Pass the lesson that contains this module.
  // Example: /modules/parabola/sort/?lessonId=parabola
  const lessonId = new URLSearchParams(window.location.search).get('lessonId') ?? '';

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

  // Track whether markInteracted has already been called across sessions.
  // Once sent, don't re-send on subsequent game-overs.
  let interactionRecorded = false;

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

    // Mark interacted on the first game-over where the student sorted at
    // least one card correctly. Zero-score ends (immediate wrong swipe)
    // don't count as meaningful engagement.
    if (!interactionRecorded && score > 0) {
      interactionRecorded = true;
      void markInteracted(lessonId);
    }
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
        <div class="hint hint-desktop hint-up"    class:active={lastInputDirection === 'UP'}>W</div>
        <div class="hint hint-desktop hint-left"  class:active={lastInputDirection === 'LEFT'}>A</div>
        <div class="hint hint-desktop hint-right" class:active={lastInputDirection === 'RIGHT'}>D</div>
        <div class="hint hint-desktop hint-down"  class:active={lastInputDirection === 'DOWN'}>S</div>

        <div class="hint hint-mobile hint-up"    class:active={lastInputDirection === 'UP'}>↑</div>
        <div class="hint hint-mobile hint-left"  class:active={lastInputDirection === 'LEFT'}>←</div>
        <div class="hint hint-mobile hint-right" class:active={lastInputDirection === 'RIGHT'}>→</div>
        <div class="hint hint-mobile hint-down"  class:active={lastInputDirection === 'DOWN'}>↓</div>

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