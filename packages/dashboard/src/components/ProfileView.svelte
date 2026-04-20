<script lang="ts">
  import type { UserProfile } from "@vertex/shared";

  let { profile, onBack, onEdit }: {
    profile: UserProfile;
    onBack: () => void;
    onEdit: () => void;
  } = $props();
</script>

<div class="profile-header">
  <button class="back-btn" onclick={onBack} aria-label="Back to topics">
    <span class="material-symbols-outlined">arrow_back</span>
  </button>
  <h2 class="profile-title">My Profile</h2>
</div>

<ul class="profile-list">
  <li class="profile-row">
    <div class="list-content">
      <span class="list-headline">Full Name</span>
      <span class="list-supporting-text">{profile.fullName}</span>
    </div>
  </li>

  <li class="profile-row">
    <div class="list-content">
      <span class="list-headline">Student Number</span>
      <span class="list-supporting-text">{profile.studentNo}</span>
    </div>
  </li>

  <li class="profile-row">
    <div class="list-content">
      <span class="list-headline">Section</span>
      <span class="list-supporting-text">{profile.section}</span>
    </div>
  </li>

  <li class="profile-row edit-row">
    <button class="btn btn-tonal edit-btn" onclick={onEdit}>
      <span class="material-symbols-outlined">edit</span>
      <span>Edit Profile</span>
    </button>
  </li>
</ul>