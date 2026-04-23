<script lang="ts">
  import { generateCard, type Direction, type ParabolaCard } from './lib/generator';
  import { swipe } from './lib/swipe';

  // --- Game State ---
  let gameState = $state<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  let currentCard = $state<ParabolaCard>(generateCard());
  let score = $state(0);
  let timeLeft = $state(3000); 
  let isReverseMode = $state(false);
  let gameOverReason = $state<'TIMEOUT' | 'WRONG_DIRECTION' | null>(null);
  
  // Feedback States
  let lastFeedback = $state<'CORRECT' | 'WRONG' | null>(null);
  let lastInputDirection = $state<Direction | null>(null);

  const TIME_LIMIT = 3000;
  let timerInterval: number | undefined;

  // --- Game Actions ---
  function startGame() {
    score = 0;
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
      if (timeLeft <= 0) {
        endGame('TIMEOUT');
      }
    }, 10);
  }

  function endGame(reason: 'TIMEOUT' | 'WRONG_DIRECTION') {
    clearInterval(timerInterval);
    gameState = 'GAME_OVER';
    gameOverReason = reason;
  }

  // --- Input Logic ---
  const opposites: Record<Direction, Direction> = {
    UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT'
  };

  function handleInput(inputDir: Direction) {
    if (gameState !== 'PLAYING') return;

    // Visual feedback loop: flash the input indicator
    lastInputDirection = inputDir;
    setTimeout(() => { lastInputDirection = null; }, 150);

    const targetDir = isReverseMode ? opposites[currentCard.direction] : currentCard.direction;

    if (inputDir === targetDir) {
      score++;
      lastFeedback = 'CORRECT';
      // Short delay for visual confirmation before swapping equation
      setTimeout(nextCard, 100);
    } else {
      lastFeedback = 'WRONG';
      endGame('WRONG_DIRECTION');
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const keyMap: Record<string, Direction> = {
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT'
    };
    if (keyMap[e.key]) handleInput(keyMap[e.key]);
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<main class="game-container" class:reversed={isReverseMode}>
  <header>
    <div class="score-pill">Score: {score}</div>
    <label class="mode-toggle">
      <input type="checkbox" bind:checked={isReverseMode} disabled={gameState === 'PLAYING'} />
      <span class="slider"></span>
      {isReverseMode ? "REVERSE MODE" : "NORMAL MODE"}
    </label>
  </header>

  {#if gameState === 'MENU'}
    <div class="overlay">
      <h1>Parabola Sort</h1>
      <p>Flick/WASD in the direction the parabola opens.</p>
      {#if isReverseMode}
        <p class="warning"><strong>Reverse Mode:</strong> Flick OPPOSITE to the opening!</p>
      {/if}
      <button onclick={startGame}>START SESSION</button>
    </div>

  {:else if gameState === 'PLAYING'}
    <div class="stage" use:swipe={handleInput}>
      <div class="timer-track">
        <div class="timer-fill" style:width="{(timeLeft / TIME_LIMIT) * 100}%"></div>
      </div>

      <div class="card" class:correct={lastFeedback === 'CORRECT'} class:wrong={lastFeedback === 'WRONG'}>
        <div class="equation">
          {currentCard.equation}
        </div>
      </div>

      <div class="direction-hints">
        <span class="hint up" class:active={lastInputDirection === 'UP'}>W</span>
        <span class="hint left" class:active={lastInputDirection === 'LEFT'}>A</span>
        <span class="hint down" class:active={lastInputDirection === 'DOWN'}>S</span>
        <span class="hint right" class:active={lastInputDirection === 'RIGHT'}>D</span>
      </div>
    </div>

  {:else if gameState === 'GAME_OVER'}
    <div class="overlay game-over">
      <h2 class="error-text">
        {gameOverReason === 'TIMEOUT' ? "OUT OF TIME!" : "WRONG DIRECTION!"}
      </h2>
      <p>Session Score: <strong>{score}</strong></p>
      <button onclick={startGame}>TRY AGAIN</button>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #121212;
    color: white;
    font-family: 'Inter', sans-serif;
  }

  .game-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    touch-action: none;
  }

  header {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255,255,255,0.05);
  }

  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .card {
    width: 300px;
    height: 400px;
    background: #1e1e1e;
    border: 3px solid #333;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    transition: transform 0.1s, border-color 0.1s;
    box-shadow: 0 15px 35px rgba(0,0,0,0.4);
  }

  .card.correct { border-color: #4caf50; transform: scale(1.05); }
  .card.wrong { border-color: #f44336; transform: scale(0.95); }

  .timer-track {
    width: 300px;
    height: 6px;
    background: #222;
    border-radius: 3px;
    margin-bottom: 2.5rem;
    overflow: hidden;
  }

  .timer-fill {
    height: 100%;
    background: #2196f3;
  }

  .direction-hints {
    position: absolute;
    width: 200px;
    height: 200px;
    pointer-events: none;
    opacity: 0.3;
  }

  .hint {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 2px solid #555;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
  }

  .hint.active { 
    background: white; 
    color: black; 
    transform: scale(1.3); 
    opacity: 1; 
  }

  .up { top: 0; left: 50%; transform: translateX(-50%); }
  .down { bottom: 0; left: 50%; transform: translateX(-50%); }
  .left { left: 0; top: 50%; transform: translateY(-50%); }
  .right { right: 0; top: 50%; transform: translateY(-50%); }

  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .error-text { color: #f44336; }
  .warning { color: #ff9800; }

  button {
    margin-top: 2rem;
    padding: 0.8rem 2.5rem;
    font-size: 1.1rem;
    font-weight: bold;
    border: none;
    border-radius: 30px;
    background: #2196f3;
    color: white;
    cursor: pointer;
  }

  .score-pill {
    background: #333;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-weight: bold;
  }
</style>