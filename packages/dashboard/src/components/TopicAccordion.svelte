<script lang="ts">
    import type { Topic } from "@vertex/shared";
    import LessonItem from "./LessonItem.svelte";

    let { topic }: {
        topic: Topic;
    } = $props();

    // Placeholder: Progress calculation through Progress Store to follow
    let progress = $derived(0);
</script>

<details class="topic-accordion" open>
    <summary class="topic-header">
        <span class="topic-name">{topic.name}</span>
        <span class="progress-badge complete">{progress === 100}> 
            {progress}%
        </span>
    </summary>

    <ul class="lesson-list">
        {#each topic.lessons as lesson}
            <li>
                <LessonItem {lesson} />
            </li>
        {/each}
    </ul>
</details>

<style>
    .topic-accordion {
        background: #fff;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        margin-bottom: 1rem;
        overflow: hidden;
    }
    
    .topic-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        cursor: pointer;
        list-style: none;
        background: var(--bg);
        font-weight: 600;
        color: var(--text);
    }
</style>