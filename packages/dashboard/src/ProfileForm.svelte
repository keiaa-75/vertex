<script lang="ts">
    import { saveProfile } from '@vertex/shared';
    import type { UserProfile } from '@vertex/shared';

    // Local reactive state for form fields
    let fullName = $state('');
    let studentNo = $state('');
    let section = $state('');
    let isSubmitting = $state(false);
    let error = $state<string | null>(null);

    // Derived validation: all fields must be non-empty
    let isValid = $derived(
        fullName.trim().length > 0 &&
        studentNo.trim().length > 0 &&
        section.trim().length > 0
    );

    async function handleSubmit(event: Event) {
        event.preventDefault();
        if (!isValid || isSubmitting) return;

        isSubmitting = true;
        error = null;

        try {
            const profile: UserProfile = {
                fullName: fullName.trim(),
                studentNo: studentNo.trim(),
                section: section.trim()
            };

            await saveProfile(profile);
            // saveProfile clears needsProfileSetup
            // dashboard should take over without manual routing
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<form class="profile-form" onsubmit={handleSubmit}>
    {#if error}
        <div class="error-msg" role="alert">{error}</div>
    {/if}

    <div class="field">
        <label for="fullname">Full Name</label>
        <input
            id="fullName"
            type="text"
            bind:value={fullName}
            placeholder="e.g. Juan Dela Cruz"
            required
        />
    </div>

    <div class="field">
        <label for="studentNo">Student Number</label>
        <input
            id="studentNo"
            type="text"
            bind:value={studentNo}
            placeholder="e.g. 136883130441"
            required
        />
    </div>

    <div class="field">
        <label for="section">Section</label>
        <input
            id="section"
            type="text"
            bind:value={section}
            placeholder="e.g. STEM-A"
            required
        />
    </div>

    <button type="submit" class="btn btn-primary" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Continue to Dashboard'}
    </button>
</form>

<style>
    .profile-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        text-align: left;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
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
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(0, 180, 216, 0.15);
    }

    .error-msg {
        background: #FEF2F2;
        color: #DC2626;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 0.9rem;
        border: 1px solid #FECACA;
    }
</style>