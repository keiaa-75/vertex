<script lang="ts">
  import type { Topic, Progress } from "@vertex/shared";

  let { topics, onSelectTopic, progressMap }: { 
    topics: Topic[]; 
    onSelectTopic: (topic: Topic) => void;
    progressMap: Map<string, Progress>;
  } = $props();

  function getTopicProgress(topic: Topic): number {
    if (!topic.lessons || topic.lessons.length === 0) return 0;
    
    const completedCount = topic.lessons.filter(lesson => {
      const progress = progressMap.get(lesson.id);
      return progress?.completed === true;
    }).length;

    return Math.round((completedCount / topic.lessons.length) * 100);
  }

  function getTopicStatus(percentage: number): 'unviewed' | 'viewed' | 'completed' {
    if (percentage === 100) return 'completed';
    if (percentage > 0) return 'viewed';
    return 'unviewed';
  }
</script>

<ul class="topic-list">
  {#each topics as topic}
    {@const percentage = getTopicProgress(topic)}
    {@const status = getTopicStatus(percentage)}
    <li>
      <button class="topic-list-item" class:unviewed={status === 'unviewed'} class:viewed={status === 'viewed'} class:completed={status === 'completed'} onclick={() => onSelectTopic(topic)}>
        <div class="progress-ring-small">
          <svg viewBox="0 0 40 40">
            <circle class="ring-bg" cx="20" cy="20" r="16" />
            <circle class="ring-fill" cx="20" cy="20" r="16" stroke-dasharray={`${percentage}, 100.53`} />
          </svg>
        </div>
        
        <div class="list-content">
          <h3 class="list-headline">{topic.name}</h3>
          <span class="list-supporting-text">{topic.lessons?.length ?? 0} lessons</span>
        </div>
        
        <span class="material-symbols-outlined list-trailing">chevron_right</span>
      </button>
    </li>
  {/each}
</ul>