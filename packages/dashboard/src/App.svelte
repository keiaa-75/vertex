<script lang="ts">
  import { onMount } from "svelte";
  import {
    userStore,
    curriculumStore,
    loadCurriculum,
    logout,
    loginWithEmail,
    registerUser
  } from '@vertex/shared';
  import ProfileForm from "./ProfileForm.svelte";
  import TopicAccordion from "./components/TopicAccordion.svelte"

  let email = $state('');
  let password = $state('');
  let authError = $state<string | null>(null);
  let isAuthenticating = $state(false);
  let isSignupMode = $state(false);

  let isLoading = $derived($userStore.loading || $curriculumStore.loading);
  let isAuthenticated = $derived(!!$userStore.firebaseUser);
  let needsProfileSetup = $derived($userStore.needsProfileSetup);
  let profile = $derived($userStore.profile);

  function toggleMode() {
    isSignupMode = !isSignupMode;
    authError = null;
    email = '';
    password = '';
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    authError = null;
    isAuthenticating = true;

    try {
      if (isSignupMode) {
        await registerUser(email.trim(), password);
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      authError = err.message?.replace('Firebase: ', '') || 'Login failed';
    } finally {
      isAuthenticating = false;
    }
  }

  $effect(() => {
    console.log('State Check:', {
      userLoading: $userStore.loading,
      userAuth: !!$userStore.firebaseUser,
      needsProfile: $userStore.needsProfileSetup,
      curriculumLoading: $curriculumStore.loading,
      curriculumTopics: $curriculumStore.topics.length,
      isLoading
    });
  });

  onMount(() => {
    loadCurriculum();
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</svelte:head>

<main class="vertex-app">
  {#if isLoading}
    <section class="screen loading-screen">
      <div class="spinner"></div>
      <p>Loading Vertex...</p>
    </section>

  {:else if !isAuthenticated}
    <section class="screen auth-screen card-elevated">
      <div class="logo-placeholder">Vertex</div>
      <h1>{isSignupMode ? "Create Account" : "Welcome Back"}</h1>
      <p>{isSignupMode ? "Sign up to access your pre-calculus modules." : "Sign in to access your lessons."}</p>

      <form class="auth-form" onsubmit={handleSubmit}>
        {#if authError}
          <div class="error-msg" role="alert">{authError}</div>
        {/if}

        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="john.doe@email.com"
            autocomplete="username"
            required
            disabled={isAuthenticating}
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="********"
            autocomplete="current-password"
            required
            disabled={isAuthenticating}
          />
          <span class="field-hint">Min. 6 characters</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          disabled={!email || !password || isAuthenticating}
        >
          {isAuthenticating ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p class="hint">
        {isSignupMode ? 'Already have an account? ' : 'New user? '}
        <button type="button" class="link-btn" onclick={toggleMode}>
          {isSignupMode ? 'Sign In' : 'Create Account'}
        </button>
      </p>
    </section>

  {:else if needsProfileSetup}
    <section class="screen profile-screen card-elevated">
      <h2>Complete Your Profile</h2>
      <p class="hint">Please provide your details to continue.</p>
      <ProfileForm />
    </section>

  {:else if profile}
    <section class="screen dashboard-screen">
      <header class="dash-header card-flat">
        <div class="user-info">
          <h2>Welcome, {profile.fullName}</h2>
          <span class="meta">{profile.studentNo} &bull; {profile.section}</span>
        </div>
        <button class="btn btn-tonal" onclick={logout}>Logout</button>
      </header>

      <div class="curriculum-grid">
        {#if $curriculumStore.topics.length > 0}
          {#each $curriculumStore.topics as topic}
            <TopicAccordion {topic} />
          {/each}
        {:else}
          <div class="placeholder-card">No curriculum data found. Please check Firestore.</div>
        {/if}
      </div>
    </section>
  {/if}
</main>

<style>
  /* ========================
     MD3-INSPIRED DESIGN TOKENS
     ======================== */
  :global(:root) {
    /* Core Palette */
    --md-palette-primary: #1A4B84;
    --md-palette-secondary: #FFC857;
    --md-palette-accent: #00B4D8;

    /* Semantic Tokens (Light Mode) */
    --color-surface: #F8FAFC;
    --color-surface-container: #FFFFFF;
    --color-surface-variant: #F1F5F9;
    --color-on-surface: #1E293B;
    --color-on-surface-variant: #64748B;

    --color-primary: var(--md-palette-primary);
    --color-on-primary: #FFFFFF;
    --color-primary-container: #E2EAF5;

    --color-secondary: var(--md-palette-secondary);
    --color-on-secondary: #1A1A1A;
    --color-secondary-container: #FFF8E1;

    --color-accent: var(--md-palette-accent);
    --color-on-accent: #FFFFFF;
    --color-accent-container: #E6F7FA;

    /* Progress States */
    --color-unviewed: #DC2626;
    --color-viewed: #0284C7;
    --color-completed: #059669;

    /* Typography */
    --font-heading: 'Outfit', system-ui, sans-serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;

    /* Spacing Scale (4px baseline) */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    --space-2xl: 3rem;

    /* Radius (MD3 inspired) */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 28px;
    --radius-full: 9999px;

    /* Elevation / Shadows */
    --shadow-none: none;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  /* ========================
     BASE & LAYOUT
     ======================== */
  :global(body) {
    margin: 0;
    background: var(--color-surface);
  }

  .vertex-app {
    font-family: var(--font-body);
    background: var(--color-surface);
    color: var(--color-on-surface);
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: var(--space-xl) var(--space-md);
    box-sizing: border-box;
  }

  .screen {
    width: 100%;
    box-sizing: border-box;
  }

  .auth-screen, .profile-screen {
    max-width: 480px;
    margin: auto;
    background: var(--color-surface-container);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--color-surface-variant);
    padding: var(--space-xl);
  }

  .dashboard-screen {
    max-width: 960px;
    width: 100%;
  }

  h1, h2 {
    font-family: var(--font-heading);
    color: var(--color-primary);
    margin: 0 0 var(--space-sm) 0;
    line-height: 1.2;
  }

  h1 { font-size: 1.75rem; font-weight: 600; }
  h2 { font-size: 1.5rem; font-weight: 600; }

  .meta {
    color: var(--color-on-surface-variant);
    font-size: 0.9rem;
    display: block;
    margin-top: var(--space-xs);
  }

  .hint {
    color: var(--color-on-surface-variant);
    margin-top: var(--space-lg);
    margin-bottom: var(--space-xl);
    font-size: 0.9rem;
  }

  /* ========================
     FORMS & INPUTS
     ======================== */
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin-top: var(--space-lg);
    text-align: left;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  label {
    font-weight: 600;
    color: var(--color-on-surface);
    font-size: 0.85rem;
  }

  input {
    padding: 0.875rem 1rem;
    border: 1.5px solid var(--color-surface-variant);
    border-radius: var(--radius-md);
    font-size: 1rem;
    background: var(--color-surface);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 4px var(--color-accent-container);
  }

  input:disabled {
    background: var(--color-surface-variant);
    cursor: not-allowed;
    opacity: 0.7;
  }

  .field-hint {
    font-size: 0.8rem;
    color: var(--color-on-surface-variant);
    margin-top: -0.1rem;
  }

  .error-msg {
    background: #FEF2F2;
    color: #991B1B;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    border: 1px solid #FECACA;
  }

  /* ========================
     BUTTONS (MD3 Style)
     ======================== */
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-full);
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s;
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
  }

  .btn:active { transform: scale(0.97); }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-sm);
  }
  .btn-primary:hover:not(:disabled) { box-shadow: var(--shadow-md); }

  .btn-tonal {
    background: var(--color-surface-variant);
    color: var(--color-on-surface);
  }
  .btn-tonal:hover:not(:disabled) { background: #E2E8F0; }

  .link-btn {
    background: none;
    border: none;
    color: var(--color-accent);
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
  }
  .link-btn:hover { text-decoration: underline; }

  /* ========================
     DASHBOARD & CARDS
     ======================== */
  .logo-placeholder {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: var(--space-md);
    letter-spacing: -0.5px;
  }

  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xl);
    padding: var(--space-lg);
    background: var(--color-surface-container);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-surface-variant);
  }

  .curriculum-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--space-lg);
  }

  .placeholder-card {
    grid-column: 1 / -1;
    padding: var(--space-2xl);
    border: 2px dashed var(--color-surface-variant);
    border-radius: var(--radius-lg);
    color: var(--color-on-surface-variant);
    text-align: center;
    background: var(--color-surface-container);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-primary);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto var(--space-md);
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>