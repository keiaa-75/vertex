<script lang="ts">
  import type { Topic, Lesson } from "@vertex/shared";
  import { curriculumStore, buildLessonMap } from "@vertex/shared";

  let { selectedTopic, onBack }: { 
    selectedTopic: Topic; 
    onBack: () => void 
  } = $props();

  // Build a flat map of all lesson IDs -> Lesson objects for cross-topic prerequisite resolution
  let lessonMap = $derived(buildLessonMap($curriculumStore.topics));

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

  function getPrerequisiteHint(lesson: Lesson): string | null {
    if (!lesson.prerequisites || lesson.prerequisites.length === 0) return null;

    // Resolve prerequisite IDs to actual titles, filtering out any stale/missing IDs
    const titles = lesson.prerequisites
      .map(id => lessonMap.get(id)?.title)
      .filter((title): title is string => title !== undefined);

    if (titles.length === 0) return null;

    // Format: "Title1", "Title1 and Title2", or "Title1, Title2, and Title3"
    const joined = titles.length === 1
      ? titles[0]
      : `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`;

    return `You might want to study ${joined} first.`;
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
          {#if getPrerequisiteHint(lesson)}
            <span class="list-supporting-text prereq-text">{getPrerequisiteHint(lesson)}</span>
          {/if}
        </div>
        
        <!-- Trailing Chevron -->
        <span class="material-symbols-outlined list-trailing">chevron_right</span>
      </button>
    </li>
  {/each}
</ul>