<script lang="ts">
    import type { Lesson } from "@vertex/shared";

    export let lesson: Lesson;

    function navigate() {
        // Navigate the top-level window (the Host Platform) to the lesson URL
        if (window.top) {
            window.top.location.href = lesson.googleSitesUrl;
        } else {
            window.location.href = lesson.googleSitesUrl;
        }
    }
</script>

<button class="lesson-item" onclick={navigate}>
    <span class="lesson-title">{lesson.title}</span>
    <!-- Status icon placeholder -->
     <span class="status-icon">➡️</span>
</button>

<style>
    .lesson-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 1rem 1.25rem;
        background: none;
        border: none;
        border-bottom: 1px solid #F1F5F9;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s;
        font-family: inherit;
    }

    .lesson-item:hover {
        background: #F8FAFC;
    }

    .lesson-item:last-child {
        border-bottom: none;
    }

    .lesson-title {
        font-weight: 500;
        color: var(--text);
    }

    .status-icon {
        color: var(--accent);
        font-weight: bold;
    }
</style>