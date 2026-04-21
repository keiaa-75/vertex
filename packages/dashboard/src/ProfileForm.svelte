<script lang="ts">
    import { saveProfile } from '@vertex/shared';
    import type { UserProfile } from '@vertex/shared';

    let fullName = $state('');
    let studentNo = $state('');
    let section = $state('');
    let isSubmitting = $state(false);
    let error = $state<string | null>(null);

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
        } catch (err: any) {
            error = err.message || "Failed to save profile. Please try again.";
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
        <label for="fullName">Full Name</label>
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

    <button type="submit" class="btn btn-filled" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Continue to Dashboard'}
    </button>
</form>