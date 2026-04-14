<script lang="ts">
  import { onMount } from "svelte";
  import { userStore, curriculumStore, loadCurriculum, logout } from '@vertex/shared';
  import ProfileForm from './ProfileForm.svelte';

  // Derive UI state from stores reactively
  let isLoading = $derived($userStore.loading || $curriculumStore.loading);
  let isAuthenticated = $derived(!!$userStore.firebaseUser);
  let needsProfileSetup = $derived($userStore.needsProfileSetup);
  let profile = $derived($userStore.profile);

  // Load public curriculum on mount (no auth)
  onMount(() => {
    loadCurriculum();
  });
</script>

<main class="vertex-app">
  <!-- Loading State -->
  {#if isLoading}
    <section class="screen loading-screen">
      <div class="spinner"></div>
      <p>Loading Vertex...</p>
    </section>

  <!-- Unauthenticated State -->
  {:else if !isAuthenticated}
    <section class="screen auth-screen">
      <div class="logo-placeholder">Vertex</div>
      <h1>Vertex Dashboard</h1>
      <p>Sign in to access your lessons and track progress.</p>

      <!-- TODO: Wire signInWithRedirect in next commit -->
      <button class="btn btn-primary" onclick={() => window.location.reload()}>
        Sign in with Google
      </button>
    </section>

  <!-- Profile Completion State -->
  {:else if needsProfileSetup}
    <section class="screen profile-screen">
      <h2>Complete Your Profile</h2>
      <p class="hint">Please provide your details to continue.</p>

      <ProfileForm />
    </section>
  
  <!--- Authenticated Dashboard State -->
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
        <!-- TODO: Insert Topic Accordion.svelte + LessonList.svelte here -->
        <p class="placeholder-text">Curriculum accordion and checklist will render here.</p>
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
</style>