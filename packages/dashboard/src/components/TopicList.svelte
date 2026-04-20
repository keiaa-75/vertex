<script lang="ts">
  import type { Topic } from "@vertex/shared";

  let { topics, onSelectTopic }: { 
    topics: Topic[]; 
    onSelectTopic: (topic: Topic) => void 
  } = $props();
</script>

<ul class="topic-list">
  {#each topics as topic}
    <li>
      <button class="topic-list-item" onclick={() => onSelectTopic(topic)}>
        <div class="progress-ring-small">
          <svg viewBox="0 0 36 36">
            <circle class="ring-bg" cx="18" cy="18" r="15.915" />
            <!-- Static 0% for now. Will bind to real progress store later -->
            <circle class="ring-fill" cx="18" cy="18" r="15.915" stroke-dasharray="0, 100" />
          </svg>
          <span class="progress-text">0%</span>
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