<script lang="ts" generics="T extends string">
  interface Option<T> {
    value: T;
    label: string;
    /** Optional inline SVG icon string — rendered with {@html}. */
    iconHtml?: string;
  }

  interface Props<T> {
    label: string;
    options: Option<T>[];
    value: T;
    onchange: (v: T) => void;
  }

  let { label, options, value, onchange }: Props<T> = $props();
</script>

<div class="seg-group" role="group" aria-label={label}>
  <span class="seg-label">{label}</span>
  <div class="seg-track">
    {#each options as opt}
      <button
        class="seg-btn"
        class:seg-btn--active={opt.value === value}
        onclick={() => onchange(opt.value)}
        aria-pressed={opt.value === value}
        type="button"
      >
        {#if opt.iconHtml}
          <span class="seg-icon" aria-hidden="true">{@html opt.iconHtml}</span>
        {/if}
        {opt.label}
      </button>
    {/each}
  </div>
</div>