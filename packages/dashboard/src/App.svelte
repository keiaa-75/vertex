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

<main class="vertex-app">
  {#if isLoading}
    <section class="screen loading-screen">
      <div class="spinner"></div>
      <p>Loading Vertex...</p>
    </section>

  {:else if !isAuthenticated}
    <section class="screen auth-screen">
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
          <span class="field-hint">Min. 6 chararacters</span>
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
    <section class="screen profile-screen">
      <h2>Complete Your Profile</h2>
      <p class="hint">Please provide your details to continue.</p>
      <ProfileForm />
    </section>

  {:else if profile}
    <section class="screen dashboard-screen">
      <header class="dash-header">
        <div class="user-info">
          <h2>Welcome, {profile.fullName}</h2>
          <span class="meta">{profile.studentNo} - {profile.section}</span>
        </div>
        <button class="btn btn-secondary" onclick={logout}>Logout</button>
      </header>

      <nav class="curriculum-nav">
        {#if $curriculumStore.topics.length > 0}
          {#each $curriculumStore.topics as topic}
            <TopicAccordion {topic} />
          {/each}
        {:else}
          <p class="placeholder-text">No curriculum data found. Please check Firestore.</p>
        {/if}
      </nav>
    </section>
  {/if}
</main>

<style>
  :global(:root) {
    --primary: #1A4B84;
    --secondary: #FFC857;
    --accent: #00B4D8;
    --unviewed: #DC2626;
    --completed: #10B981;
    --bg: #F8FAFC;
    --text: #1E293B;
  }

  .vertex-app {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .screen {
    width: 100%;
    max-width: 480px;
    padding: 2rem;
    text-align: center;
  }

  h1, h2 {
    font-family: 'Outfit', sans-serif;
    color: var(--primary);
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s ease, opacity 0.2s;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn-primary {
    background: var(--primary);
    color: #fff;
  }

  .btn-secondary {
    background: var(--secondary);
    color: var(--primary);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--primary);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 1rem;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .meta {
    color: #64748B;
    font-size: 0.9rem;
  }

  .hint {
    color: #64748B;
    margin-bottom: 1.5rem;
  }

  .placeholder-text {
    padding: 2rem;
    border: 2px dashed #CBD5E1;
    border-radius: 12px;
    color: #94A3B8;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .field-hint {
    font-size: 0.8rem;
    color: #64748B;
    margin-top: -0.2rem;
  }

  label {
    font-weight: 600;
    color: var(--text);
    font-size: 0.9rem;
  }

  input {
    padding: 0.75rem;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
  }

  input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0, 180, 216, 0.15);
  }

  input:disabled {
    background: #F1F5F9;
    cursor: not-allowed;
  }

  .error-msg {
    background: #FEF2F2;
    color: #DC2626;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    border: 1px solid #FECACA;
  }

  .link-btn {
    background: none;
    border: none;
    color: var(--accent);
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  .link-btn:hover {
    text-decoration: underline;
  }

  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .user-info {
    text-align: left;
  }

  .curriculum-nav {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: left;
  }
</style>