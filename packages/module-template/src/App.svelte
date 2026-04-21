<script lang="ts">
  // Embed-optimized container: no margins, overflow hidden, full viewport
  // Ready to mount interactive lesson widgets or canvas/iframe children
</script>

<svelte:options css="injected" />

<div class="module-shell">
  <!-- Lesson widget mounts here -->
  <slot />
</div>

<style>
  .module-shell {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: var(--md-sys-color-surface, #ffffff);
    color: var(--md-sys-color-on-surface, #000000);
    font-family: var(--md-sys-typescript-body-font-family, system-ui, sans-serif);
  }
</style>