<script lang="ts">
  import type { Topic, Lesson, Progress } from "@vertex/shared";
  import { curriculumStore, buildLessonMap } from "@vertex/shared";

  let { selectedTopic, onBack, progressMap }: { 
    selectedTopic: Topic; 
    onBack: () => void;
    progressMap: Map<string, Progress>;
  } = $props();

  // Global lesson map for cross-topic prerequisite resolution
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

    const titles = lesson.prerequisites
      .map(id => lessonMap.get(id)?.title)
      .filter((title): title is string => title !== undefined);

    if (titles.length === 0) return null;

    const joined = titles.length === 1
      ? titles[0]
      : `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`;

    return `You might want to study ${joined} first.`;
  }

  function getLessonStatus(lesson: Lesson): 'unviewed' | 'viewed' | 'completed' {
    const progress = progressMap.get(lesson.id);
    if (!progress) return 'unviewed';
    if (progress.completed) return 'completed';
    if (progress.viewed) return 'viewed';
    return 'unviewed';
  }

  function getLessonPercentage(lesson: Lesson): number {
    const progress = progressMap.get(lesson.id);
    if (!progress) return 0;
    if (progress.completed) return 100;
    if (progress.viewed) return 50;
    return 0;
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
    {@const status = getLessonStatus(lesson)}
    {@const percentage = getLessonPercentage(lesson)}
    <li>
      <button class="lesson-list-item" class:unviewed={status === 'unviewed'} class:viewed={status === 'viewed'} class:completed={status === 'completed'} onclick={() => navigate(lesson)}>
        <div class="progress-ring-small">
          <svg viewBox="0 0 36 36">
            <circle class="ring-bg" cx="18" cy="18" r="15.915" />
            <circle class="ring-fill" cx="18" cy="18" r="15.915" stroke-dasharray={`${percentage}, 100`} />
          </svg>
          <span class="progress-text">{percentage}%</span>
        </div>
        
        <div class="list-content">
          <span class="list-headline">{lesson.title}</span>
          {#if getPrerequisiteHint(lesson)}
            <span class="list-supporting-text prereq-text">{getPrerequisiteHint(lesson)}</span>
          {/if}
        </div>
        
        <span class="material-symbols-outlined list-trailing">chevron_right</span>
      </button>
    </li>
  {/each}
</ul>