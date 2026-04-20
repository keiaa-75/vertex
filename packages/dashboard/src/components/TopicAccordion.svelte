<script lang="ts">
    import { slide } from 'svelte/transition';
    import type { Topic } from "@vertex/shared";
    import LessonItem from "./LessonItem.svelte";

    let { topic }: { topic: Topic } = $props();

    // UI State
    let isOpen = $state(true);

    // Placeholder progress (will be wired later via progress store)
    let progress = $derived(0);

    function toggle() {
        isOpen = !isOpen;
    }
</script>

<article class="topic-card">
    <button class="topic-header" onclick={toggle} aria-expanded={isOpen}>
        <div class="header-left">
            <h3 class="topic-name">{topic.name}</h3>
            <span class="lesson-count">{topic.lessons?.length ?? 0} lessons</span>
        </div>
        
        <div class="header-right">
            <div class="progress-ring" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
                <svg viewBox="0 0 36 36">
                    <circle class="ring-bg" cx="18" cy="18" r="15.915" />
                    <circle class="ring-fill" cx="18" cy="18" r="15.915"
                            style="stroke-dasharray: {progress}, 100;" />
                </svg>
                <span class="progress-text">{progress}%</span>
            </div>
            <span class="chevron" class:rotate={isOpen}>▼</span>
        </div>
    </button>

    {#if isOpen}
        <div class="lesson-container" transition:slide={{ duration: 200 }}>
            <ul class="lesson-list">
                {#each topic.lessons as lesson}
                    <li>
                        <LessonItem {lesson} />
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</article>

<style>
    .topic-card {
        background: var(--md-sys-color-surface);
        border-radius: var(--md-sys-shape-corner-large);
        box-shadow: var(--md-sys-elevation-1);
        border: 1px solid var(--md-sys-color-surface-variant);
        overflow: hidden;
        transition: box-shadow 0.2s ease;
    }
    .topic-card:hover {
        box-shadow: var(--md-sys-elevation-2);
    }

    .topic-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--md-sys-spacing-md) var(--md-sys-spacing-lg);
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        gap: var(--md-sys-spacing-md);
        transition: background-color 0.15s ease;
    }
    .topic-header:hover {
        background: var(--md-sys-color-surface-variant);
    }

    .header-left {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        min-width: 0;
    }

    .topic-name {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .lesson-count {
        font-size: 0.8rem;
        color: var(--md-sys-color-on-surface-variant);
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: var(--md-sys-spacing-md);
        flex-shrink: 0;
    }

    /* MD3 Circular Progress */
    .progress-ring {
        position: relative;
        width: 36px;
        height: 36px;
    }
    .progress-ring svg {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
    }
    .ring-bg {
        fill: none;
        stroke: var(--md-sys-color-surface-variant);
        stroke-width: 3;
    }
    .ring-fill {
        fill: none;
        stroke: var(--md-sys-color-primary);
        stroke-width: 3;
        stroke-linecap: round;
        transition: stroke-dasharray 0.4s ease;
    }
    .progress-text {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
    }

    .chevron {
        color: var(--md-sys-color-on-surface-variant);
        transition: transform 0.25s ease;
        font-size: 0.75rem;
    }
    .chevron.rotate {
        transform: rotate(180deg);
    }

    .lesson-container {
        background: var(--md-sys-color-surface-variant);
        border-top: 1px solid var(--md-sys-color-surface);
    }

    .lesson-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }
</style>