<script lang="ts">
    import type { Lesson } from "@vertex/shared";

    let { lesson }: { lesson: Lesson } = $props();

    // Placeholder: Will be wired to the progress store in Phase 1
    let status = $state<'unviewed' | 'viewed' | 'completed'>('unviewed');

    function navigate() {
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
</script>

<button 
    class="lesson-item" 
    class:is-completed={status === 'completed'}
    onclick={navigate}
    aria-label="Open {lesson.title}"
>
    <div class="lesson-content">
        <span class="lesson-title">{lesson.title}</span>
        {#if lesson.prerequisites?.length}
            <span class="prereq-hint">Requires: {lesson.prerequisites.join(', ')}</span>
        {/if}
    </div>

    <span class="status-icon" aria-hidden="true">
        {#if status === 'completed'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10L8.5 14.5L16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        {:else if status === 'viewed'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10C3 10 6 4 10 4C14 4 17 10 17 10C17 10 14 16 10 16C6 16 3 10 3 10Z" stroke="currentColor" stroke-width="2"/>
                <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
        {:else}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 4L14 10L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        {/if}
    </span>
</button>

<style>
    .lesson-item {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--md-sys-spacing-md) var(--md-sys-spacing-lg);
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--md-sys-color-surface-variant);
        text-align: left;
        cursor: pointer;
        transition: background-color 0.15s ease, transform 0.1s ease;
        font-family: var(--md-sys-typescale-body);
        gap: var(--md-sys-spacing-md);
    }

    .lesson-item:last-child { border-bottom: none; }
    .lesson-item:hover { background-color: var(--md-sys-color-surface-variant); }
    .lesson-item:active { transform: scale(0.995); }
    .lesson-item:focus-visible { outline: 2px solid var(--md-sys-color-primary); outline-offset: -2px; border-radius: var(--md-sys-shape-corner-small); }

    .lesson-content {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        flex: 1;
        min-width: 0;
    }

    .lesson-title {
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.2s ease;
    }

    .prereq-hint {
        font-size: 0.75rem;
        color: var(--md-sys-color-on-surface-variant);
        font-style: italic;
    }

    .status-icon {
        color: var(--md-sys-color-tertiary);
        flex-shrink: 0;
        transition: color 0.2s ease, transform 0.2s ease;
    }

    .is-completed .status-icon { color: var(--md-sys-color-completed); }
    .is-completed .lesson-title { color: var(--md-sys-color-completed); }

    .lesson-item:hover .status-icon { transform: translateX(2px); }
</style>