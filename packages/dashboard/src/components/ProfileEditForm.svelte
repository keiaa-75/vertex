<script lang="ts">
  import { saveProfile } from "@vertex/shared";
  import type { UserProfile } from "@vertex/shared";

  let { initialProfile, onSave, onCancel }: {
    initialProfile: UserProfile;
    onSave: () => void;
    onCancel: () => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  let { fullName: initialFullName, studentNo: initialStudentNo, section: initialSection } = initialProfile;
  
  let fullName = $state(initialFullName);
  let studentNo = $state(initialStudentNo);
  let section = $state(initialSection);
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
      onSave();
    } catch (err: any) {
      error = err.message || "Failed to save profile. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form class="edit-profile-form" onsubmit={handleSubmit}>
  <div class="profile-header">
    <button type="button" class="icon-btn-small" onclick={onCancel} aria-label="Cancel editing">
      <span class="material-symbols-outlined">close</span>
    </button>
    <h2 class="profile-title">Edit Profile</h2>
  </div>

  {#if error}
    <div class="error-msg" role="alert">{error}</div>
  {/if}

  <div class="form-fields">
    <div class="form-group">
      <label for="edit-fullName" class="field-label">Full Name</label>
      <input 
        id="edit-fullName" 
        type="text" 
        class="field-input"
        bind:value={fullName} 
        placeholder="Enter your full name"
        required 
      />
    </div>

    <div class="form-group">
      <label for="edit-studentNo" class="field-label">Student Number</label>
      <input 
        id="edit-studentNo" 
        type="text" 
        class="field-input"
        bind:value={studentNo} 
        placeholder="Enter your student number"
        required 
      />
    </div>

    <div class="form-group">
      <label for="edit-section" class="field-label">Section</label>
      <input 
        id="edit-section" 
        type="text" 
        class="field-input"
        bind:value={section} 
        placeholder="Enter your section"
        required 
      />
    </div>
  </div>

  <div class="form-actions">
    <button type="button" class="btn btn-cancel" onclick={onCancel} disabled={isSubmitting}>
      Cancel
    </button>
    <button type="submit" class="btn btn-save" disabled={!isValid || isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </button>
  </div>
</form>

<style>
  .edit-profile-form {
    display: flex;
    flex-direction: column;
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: var(--md-sys-spacing-md);
    padding: 0 var(--md-sys-spacing-lg) var(--md-sys-spacing-xl);
    border-bottom: 1px solid var(--md-sys-color-surface-variant);
    margin-bottom: var(--md-sys-spacing-xl);
  }

  .icon-btn-small {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: var(--md-sys-shape-corner-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--md-sys-color-on-surface);
    transition: background-color 0.15s;
  }

  .icon-btn-small:hover {
    background: var(--md-sys-color-surface-variant);
  }

  .profile-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--md-sys-color-primary);
  }

  .error-msg {
    background: #FEF2F2;
    color: #991B1B;
    padding: var(--md-sys-spacing-sm) var(--md-sys-spacing-md);
    border-radius: var(--md-sys-shape-corner-medium);
    font-size: 0.875rem;
    border: 1px solid #FECACA;
    margin: 0 var(--md-sys-spacing-lg) var(--md-sys-spacing-lg);
  }

  .form-fields {
    display: flex;
    flex-direction: column;
    gap: var(--md-sys-spacing-xl);
    padding: 0 var(--md-sys-spacing-lg);
    margin-bottom: var(--md-sys-spacing-xl);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--md-sys-spacing-sm);
  }

  .field-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
    letter-spacing: 0.01em;
  }

  .field-input {
    padding: var(--md-sys-spacing-md) var(--md-sys-spacing-lg);
    border: 1.5px solid var(--md-sys-color-surface-variant);
    border-radius: var(--md-sys-shape-corner-medium);
    font-size: 1rem;
    font-family: var(--md-sys-typescale-body);
    background: var(--md-sys-color-surface);
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
    box-sizing: border-box;
  }

  .field-input:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
  }

  .field-input::placeholder {
    color: var(--md-sys-color-on-surface-variant);
    opacity: 0.6;
  }

  .form-actions {
    display: flex;
    gap: var(--md-sys-spacing-md);
    padding: var(--md-sys-spacing-lg);
    padding-top: var(--md-sys-spacing-xl);
    border-top: 1px solid var(--md-sys-color-surface-variant);
    margin: 0 var(--md-sys-spacing-lg) var(--md-sys-spacing-lg);
  }

  .btn {
    flex: 1;
    padding: var(--md-sys-spacing-md) var(--md-sys-spacing-lg);
    border: none;
    border-radius: var(--md-sys-shape-corner-full);
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: var(--md-sys-typescale-body);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-cancel {
    background: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface);
  }

  .btn-cancel:hover:not(:disabled) {
    background: #E2E8F0;
  }

  .btn-save {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    box-shadow: var(--md-sys-elevation-1);
  }

  .btn-save:hover:not(:disabled) {
    box-shadow: var(--md-sys-elevation-2);
  }
</style>