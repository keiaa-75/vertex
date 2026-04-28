<script lang="ts">
  import type { Topic, Lesson, Progress } from "@vertex/shared";
  import { curriculumStore, buildLessonMap } from "@vertex/shared";
  import LessonDetailModal from "./LessonDetailModal.svelte";

  let { selectedTopic, progressMap, onBack }: {
    selectedTopic: Topic;
    progressMap: Map<string, Progress>;
    onBack: () => void;
  } = $props();

  let modalLesson = $state<Lesson | null>(null);

  function getLessonStatus(lesson: Lesson): 'unviewed' | 'viewed' | 'completed' {
    const p = progressMap.get(lesson.id);
    if (p?.completed) return 'completed';
    if (p?.viewed || p?.interacted) return 'viewed';
    return 'unviewed';
  }

  function getRingPct(lesson: Lesson): number {
    const p = progressMap.get(lesson.id);
    if (p?.completed) return 100;
    if (p?.viewed || p?.interacted) return 50;
    return 0;
  }

  function getProgress(lesson: Lesson): Progress | null {
    return progressMap.get(lesson.id) ?? null;
  }

  let lessonMap = $derived(buildLessonMap($curriculumStore.topics));

  function getPrereqHint(lesson: Lesson): string | null {
    if (!lesson.prerequisites?.length) return null;
    const unmet = lesson.prerequisites.filter(pid => !progressMap.get(pid)?.completed);
    if (!unmet.length) return null;
    const names = unmet.map(pid => lessonMap.get(pid)?.title ?? pid).join(', ');
    return `Requires: ${names}`;
  }

  function getNextLesson(lesson: Lesson): Lesson | null {
    const lessons = selectedTopic.lessons;
    const idx = lessons.findIndex(l => l.id === lesson.id);
    return idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
  }
</script>

<div class="topic-detail-header">
  <button class="back-btn" onclick={onBack} aria-label="Back to topics">
    <span class="material-symbols-outlined">arrow_back</span>
  </button>
  <h2 class="topic-detail-title">{selectedTopic.name}</h2>
</div>

<ul class="lesson-list">
  {#each selectedTopic.lessons as lesson (lesson.id)}
    {@const status  = getLessonStatus(lesson)}
    {@const pct     = getRingPct(lesson)}
    {@const prereq  = getPrereqHint(lesson)}
    <li
      class="lesson-list-item"
      class:unviewed={status === 'unviewed'}
      class:viewed={status === 'viewed'}
      class:completed={status === 'completed'}
    >
      <button
        class="lesson-row-main"
        onclick={() => (modalLesson = lesson)}
        aria-label="Open details for {lesson.title}"
      >
        <div class="progress-ring-small">
          <svg viewBox="0 0 40 40">
            <circle class="ring-bg"   cx="20" cy="20" r="16" />
            <circle class="ring-fill" cx="20" cy="20" r="16"
              stroke-dasharray="{pct}, 100.53" />
          </svg>
        </div>

        <div class="list-content">
          <span class="list-headline">{lesson.title}</span>
          {#if prereq}
            <span class="prereq-text">{prereq}</span>
          {:else}
            <span class="list-supporting-text">
              {status === 'completed'
                ? 'Completed'
                : status === 'viewed'
                ? 'In progress'
                : 'Not started'}
            </span>
          {/if}
        </div>

        <span class="material-symbols-outlined list-trailing">chevron_right</span>
      </button>
    </li>
  {/each}
</ul>

{#if modalLesson}
  <LessonDetailModal
    lesson={modalLesson}
    progress={getProgress(modalLesson)}
    nextLesson={getNextLesson(modalLesson)}
    onClose={() => (modalLesson = null)}
  />
{/if}