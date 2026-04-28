<script lang="ts">
  import type { Topic, Lesson, Progress } from "@vertex/shared";
  import { curriculumStore, buildLessonMap } from "@vertex/shared";
  import LessonDetailModal from "./LessonDetailModal.svelte";

  let { selectedTopic, onBack, progressMap }: { 
    selectedTopic: Topic; 
    onBack: () => void;
    progressMap: Map<string, Progress>;
  } = $props();

  let lessonMap = $derived(buildLessonMap($curriculumStore.topics));

  // ── Modal state ──────────────────────────────────────────────────────────
  let activeLesson = $state<Lesson | null>(null);

  function openDetail(lesson: Lesson, e: MouseEvent) {
    e.stopPropagation();
    activeLesson = lesson;
  }

  function closeDetail() {
    activeLesson = null;
  }

  // ── Navigation ───────────────────────────────────────────────────────────
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

  // ── Prerequisite hint ────────────────────────────────────────────────────
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

  // ── Progress helpers ─────────────────────────────────────────────────────
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

  function hasScoreData(lesson: Lesson): boolean {
    const p = progressMap.get(lesson.id);
    return !!(p && (p.pretestScore !== null || p.quizScore !== null));
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
    {@const hint = getPrerequisiteHint(lesson)}
    {@const hasScores = hasScoreData(lesson)}

    <li class="lesson-list-item" class:unviewed={status === 'unviewed'} class:viewed={status === 'viewed'} class:completed={status === 'completed'}>

      <!-- Main clickable area — navigates to Google Sites page -->
      <button class="lesson-row-main" onclick={() => navigate(lesson)}>
        <div class="progress-ring-small">
          <svg viewBox="0 0 40 40">
            <circle class="ring-bg" cx="20" cy="20" r="16" />
            <circle class="ring-fill" cx="20" cy="20" r="16" stroke-dasharray={`${percentage}, 100.53`} />
          </svg>
        </div>

        <div class="list-content">
          <span class="list-headline">{lesson.title}</span>
          {#if hint}
            <span class="list-supporting-text prereq-text">{hint}</span>
          {/if}
        </div>
      </button>

      <!-- Meatball — opens score detail modal -->
      <button
        class="lesson-meatball"
        class:has-scores={hasScores}
        onclick={(e) => openDetail(lesson, e)}
        aria-label="View score details for {lesson.title}"
        title={hasScores ? 'View scores' : 'Score details'}
      >
        <span class="material-symbols-outlined">more_vert</span>
      </button>
    </li>
  {/each}
</ul>

<!-- Score detail modal -->
{#if activeLesson}
  <LessonDetailModal
    lesson={activeLesson}
    progress={progressMap.get(activeLesson.id) ?? null}
    onClose={closeDetail}
    onNavigate={() => { closeDetail(); navigate(activeLesson!); }}
  />
{/if}