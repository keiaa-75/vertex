<script lang="ts">
  import type { Topic, Lesson } from "@vertex/shared";

  let { selectedTopic, onBack }: { 
    selectedTopic: Topic; 
    onBack: () => void 
  } = $props();

  function navigate(lesson: Lesson) {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = lesson.googleSitesUrl;
      } else {
        window.location.href = lesson.googleSitesUrl;
      }
    } catch {
      window.open(lesson.googleSitesUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function getSupportingText(lesson: Lesson) {
    if (lesson.prerequisites?.length) {
      return `Requires: ${lesson.prerequisites.join(', ')}`;
    }
    return '';
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
        <!-- Leading Progress Ring (static 0% placeholder) -->
        <div class="progress-ring-small">
          <svg viewBox="0 0 36 36">
            <circle class="ring-bg" cx="18" cy="18" r="15.915" />
            <circle class="ring-fill" cx="18" cy="18" r="15.915" stroke-dasharray="0, 100" />
          </svg>
          <span class="progress-text">0%</span>
        </div>
        
        <!-- Content Area -->
        <div class="list-content">
          <span class="list-headline">{lesson.title}</span>
          {#if getSupportingText(lesson)}
            <span class="list-supporting-text prereq-text">{getSupportingText(lesson)}</span>
          {/if}
        </div>
        
        <!-- Trailing Chevron -->
        <span class="material-symbols-outlined list-trailing">chevron_right</span>
      </button>
    </li>
  {/each}
</ul>