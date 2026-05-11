<script lang="ts">
    import { onMount } from "svelte";
    import {
        userStore,
        curriculumStore,
        loadCurriculum,
        logout,
        loginWithEmail,
        registerUser,
        progressMonitorStore,
        startProgressMonitor,
        stopProgressMonitor,
        auth,
        sendPasswordResetEmail,
        type Topic,
    } from "@vertex/shared";
    import ProfileForm from "./ProfileForm.svelte";
    import TopicList from "./components/TopicList.svelte";
    import TopicDetailView from "./components/TopicDetailView.svelte";
    import ProfileView from "./components/ProfileView.svelte";
    import ProfileEditForm from "./components/ProfileEditForm.svelte";

    // ── Auth form state ──────────────────────────────────────────────────────
    let email = $state("");
    let password = $state("");
    let authError = $state<string | null>(null);
    let isAuthenticating = $state(false);
    let isSignupMode = $state(true);

    // ── Reset password state ─────────────────────────────────────────────────
    let isResetMode = $state(false);
    let resetEmail = $state("");
    let resetSent = $state(false);
    let resetError = $state<string | null>(null);
    let isSendingReset = $state(false);

    // ── Dashboard view routing ───────────────────────────────────────────────
    let viewState = $state<"topics" | "profile" | "editProfile">("topics");
    let selectedTopic = $state<Topic | null>(null);

    let isLoading = $derived(
        $userStore.loading ||
            $curriculumStore.loading ||
            $progressMonitorStore.loading,
    );
    let isAuthenticated = $derived(!!$userStore.firebaseUser);
    let needsProfileSetup = $derived($userStore.needsProfileSetup);
    let profile = $derived($userStore.profile);

    // ── Auth handlers ────────────────────────────────────────────────────────
    function toggleMode() {
        isSignupMode = !isSignupMode;
        authError = null;
        email = "";
        password = "";
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
            authError =
                err.message?.replace("Firebase: ", "") || "Login failed";
        } finally {
            isAuthenticating = false;
        }
    }

    // ── Reset password handlers ──────────────────────────────────────────────
    function enterResetMode() {
        isResetMode = true;
        resetEmail = email; // pre-fill whatever the user already typed
        resetError = null;
        resetSent = false;
        authError = null;
    }

    function exitResetMode() {
        isResetMode = false;
        resetError = null;
        resetSent = false;
    }

    async function handlePasswordReset(e: Event) {
        e.preventDefault();
        resetError = null;
        isSendingReset = true;

        try {
            await sendPasswordResetEmail(auth, resetEmail.trim());
            resetSent = true;
        } catch (err: any) {
            resetError =
                err.message?.replace("Firebase: ", "") ??
                "Could not send reset email.";
        } finally {
            isSendingReset = false;
        }
    }

    // ── Progress monitor lifecycle ───────────────────────────────────────────
    $effect(() => {
        const user = $userStore.firebaseUser;
        if (user) {
            startProgressMonitor(user.uid);
            return () => stopProgressMonitor();
        }
        stopProgressMonitor();
    });

    $effect(() => {
        console.log("State Check:", {
            userLoading: $userStore.loading,
            userAuth: isAuthenticated,
            needsProfile: needsProfileSetup,
            curriculumLoading: $curriculumStore.loading,
            curriculumTopics: $curriculumStore.topics.length,
            monitorLoading: $progressMonitorStore.loading,
            monitorEntries: $progressMonitorStore.map.size,
            isLoading,
        });
    });

    onMount(() => {
        loadCurriculum();
    });
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
    />
</svelte:head>

<main class="vertex-app">
    <!-- ── Loading ──────────────────────────────────────────────────────────── -->
    {#if isLoading}
        <section class="screen screen-center card-elevated">
            <div class="spinner"></div>
            <p>Loading Vertex...</p>
        </section>

        <!-- ── Unauthenticated ──────────────────────────────────────────────────── -->
    {:else if !isAuthenticated}
        <section class="screen screen-center card-elevated">
            {#if isResetMode}
                <!-- ── Reset password ─────────────────────────────────────────────── -->
                {#if resetSent}
                    <div class="reset-success">
                        <span class="reset-icon" aria-hidden="true">✉</span>
                        <h1>Check your inbox</h1>
                        <p class="hint">
                            A password reset link was sent to
                            <strong>{resetEmail}</strong>. Check your spam
                            folder if it doesn't arrive shortly.
                        </p>
                        <button
                            type="button"
                            class="btn btn-filled"
                            onclick={exitResetMode}
                        >
                            Back to Sign In
                        </button>
                    </div>
                {:else}
                    <h1>Reset Password</h1>
                    <p class="hint">
                        Enter your email and we'll send you a reset link.
                    </p>

                    <form class="auth-form" onsubmit={handlePasswordReset}>
                        {#if resetError}
                            <div class="error-msg" role="alert">
                                {resetError}
                            </div>
                        {/if}

                        <div class="field">
                            <label for="reset-email">Email</label>
                            <input
                                id="reset-email"
                                type="email"
                                bind:value={resetEmail}
                                placeholder="john.doe@email.com"
                                autocomplete="email"
                                required
                                disabled={isSendingReset}
                            />
                        </div>

                        <button
                            type="submit"
                            class="btn btn-filled"
                            disabled={!resetEmail || isSendingReset}
                        >
                            {isSendingReset ? "Sending…" : "Send Reset Link"}
                        </button>
                    </form>

                    <p class="hint hint-center">
                        <button
                            type="button"
                            class="btn btn-text"
                            onclick={exitResetMode}
                        >
                            ← Back to Sign In
                        </button>
                    </p>
                {/if}
            {:else}
                <!-- ── Sign in / Sign up ───────────────────────────────────────────── -->
                <h1>{isSignupMode ? "Create Account" : "Welcome Back"}</h1>
                <p class="hint">
                    {isSignupMode
                        ? "Sign up to access your pre-calculus modules."
                        : "Sign in to access your lessons."}
                </p>

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
                        {isAuthenticating
                            ? "Signing up…"
                            : isSignupMode
                              ? "Create Account"
                              : "Sign In"}
                    </button>
                </form>

                {#if !isSignupMode}
                    <p class="hint hint-center">
                        <button
                            type="button"
                            class="btn btn-text"
                            onclick={enterResetMode}
                        >
                            Forgot password?
                        </button>
                    </p>
                {/if}

                <p class="hint hint-center">
                    {isSignupMode ? "Already have an account? " : "New user? "}
                    <button
                        type="button"
                        class="btn btn-text"
                        onclick={toggleMode}
                    >
                        {isSignupMode ? "Sign In" : "Create Account"}
                    </button>
                </p>
            {/if}
        </section>

        <!-- ── Profile setup ────────────────────────────────────────────────────── -->
    {:else if needsProfileSetup}
        <section class="screen screen-center card-elevated">
            <h2>Complete Your Profile</h2>
            <p class="hint">Please provide your details to continue.</p>
            <ProfileForm />
        </section>

        <!-- ── Dashboard ────────────────────────────────────────────────────────── -->
    {:else if profile}
        <section class="screen screen-dashboard">
            <div class="dashboard-card">
                <header class="card-nav">
                    <span class="nav-brand">Dash</span>
                    <div class="nav-actions">
                        <button
                            class="icon-btn"
                            aria-label="Profile"
                            onclick={() => {
                                viewState = "profile";
                                selectedTopic = null;
                            }}
                        >
                            <span class="material-symbols-outlined">person</span
                            >
                        </button>
                        <button
                            class="icon-btn"
                            onclick={logout}
                            aria-label="Logout"
                        >
                            <span class="material-symbols-outlined">logout</span
                            >
                        </button>
                    </div>
                </header>

                <div class="card-content">
                    {#if viewState === "topics"}
                        {#if selectedTopic}
                            <TopicDetailView
                                {selectedTopic}
                                progressMap={$progressMonitorStore.map}
                                onBack={() => (selectedTopic = null)}
                            />
                        {:else}
                            <TopicList
                                topics={$curriculumStore.topics}
                                progressMap={$progressMonitorStore.map}
                                onSelectTopic={(t) => (selectedTopic = t)}
                            />
                        {/if}
                    {:else if viewState === "profile"}
                        <ProfileView
                            {profile}
                            onBack={() => (viewState = "topics")}
                            onEdit={() => (viewState = "editProfile")}
                        />
                    {:else if viewState === "editProfile"}
                        <ProfileEditForm
                            initialProfile={profile}
                            onSave={() => (viewState = "profile")}
                            onCancel={() => (viewState = "profile")}
                        />
                    {/if}
                </div>
            </div>
        </section>
    {/if}
</main>
