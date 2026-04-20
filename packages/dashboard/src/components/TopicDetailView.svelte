<script lang="ts">
  import type { Topic, Lesson } from "@vertex/shared";

  let { selectedTopic, onBack }: { 
    selectedTopic: Topic; 
    onBack: () => void 
  } = $props();

  function navigate(lesson: Lesson) {
    try {
      // If embedded in Google Sites iframe, navigate the top frame
      if (window.top && window.top !== window.self) {
        window.top.location.href = lesson.googleSitesUrl;
      } else {
        window.location.href = lesson.googleSitesUrl;
      }
    } catch {
      // Fallback for strict cross-origin policies
      window.open(lesson.googleSitesUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function getPrereqHint(lesson: Lesson) {
    if (!lesson.prerequisites?.length) return '';
    return `Requires: ${lesson.prerequisites.join(', ')}`;
  }
</script>

<div class="topic-detail-header">
  <button class="back-btn" onclick={onBack} aria-label="Back to topics">
    <span class="material-symbols-outlined">arrow_back</span>
  </button>
  <h2 class="topic-detail-title">{selectedTopic.name}</h2>
</div>

<ul class="lesson-list">
  {#each selectedTopic.lessons as lesson}
    <li>
      <button class="lesson-list-item" onclick={() => navigate(lesson)}>
        <span class="material-symbols-outlined status-icon">arrow_forward_ios</span>
        <div class="list-content">
          <span class="list-headline">{lesson.title}</span>
          {#if lesson.prerequisites?.length}
            <span class="list-supporting-text">{getPrereqHint(lesson)}</span>
          {/if}
        </div>
        <!-- Placeholder completed icon. Will toggle based on progress store later -->
        <span class="material-symbols-outlined status-icon" style="color: var(--md-sys-color-on-surface-variant);">radio_button_unchecked</span>
      </button>
    </li>
  {/each}
</ul>