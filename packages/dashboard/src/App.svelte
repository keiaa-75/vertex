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
    <section class="screen screen-center card-elevated" style="text-align: center;">
      <div class="spinner"></div>
      <p>Loading Vertex...</p>
    </section>

  {:else if !isAuthenticated}
    <section class="screen screen-center card-elevated">
      <img src="/vertex-logo.svg" alt="Vertex Logo" class="logo" />
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
          class="btn btn-filled"
          disabled={!email || !password || isAuthenticating}
        >
          {isAuthenticating ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p class="hint" style="text-align: center;">
        {isSignupMode ? 'Already have an account? ' : 'New user? '}
        <button type="button" class="btn btn-text" onclick={toggleMode}>
          {isSignupMode ? 'Sign In' : 'Create Account'}
        </button>
      </p>
    </section>

  {:else if needsProfileSetup}
    <section class="screen screen-center card-elevated">
      <h2>Complete Your Profile</h2>
      <p class="hint">Please provide your details to continue.</p>
      <ProfileForm />
    </section>

  {:else if profile}
    <section class="screen screen-dashboard">
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