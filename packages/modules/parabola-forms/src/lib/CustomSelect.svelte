<script lang="ts">
  import { onMount } from 'svelte';

  interface Option<T> {
    value: T;
    label: string;
  }

  let { options, value = $bindable(), label = '' }: { options: Option<any>[], value: any, label?: string } = $props();

  let isOpen = $state(false);
  let buttonRef: HTMLButtonElement;
  let listRef: HTMLUListElement;

  function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      requestAnimationFrame(() => {
        const selectedEl = listRef?.querySelector('[data-selected="true"]');
        selectedEl?.scrollIntoView({ block: 'nearest' });
      });
    }
  }

  function close() {
    isOpen = false;
    buttonRef?.focus();
  }

  function select(opt: Option<any>) {
    value = opt.value;
    close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      isOpen = true;
      return;
    }

    if (isOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIdx = options.findIndex(o => o.value === value);
        const nextIdx = Math.min(currentIdx + 1, options.length - 1);
        value = options[nextIdx].value;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIdx = options.findIndex(o => o.value === value);
        const prevIdx = Math.max(currentIdx - 1, 0);
        value = options[prevIdx].value;
      }
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (isOpen && !buttonRef?.contains(e.target as Node) && !listRef?.contains(e.target as Node)) {
      close();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  let selectedOption = $derived(options.find(o => o.value === value) ?? options[0]);
</script>

<div class="custom-select">
  {#if label}
    <label class="select-label">{label}</label>
  {/if}

  <button
    bind:this={buttonRef}
    class="select-trigger"
    class:select-trigger--open={isOpen}
    onclick={toggle}
    onkeydown={handleKeydown}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={label || 'Select option'}
  >
    <span class="select-value">{selectedOption?.label}</span>
    <svg class="select-chevron" class:select-chevron--open={isOpen} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <polyline points="4 6 8 10 12 6"/>
    </svg>
  </button>

  {#if isOpen}
    <ul
      bind:this={listRef}
      class="select-dropdown"
      role="listbox"
    >
      {#each options as opt (opt.value)}
        <li
          class="select-option"
          class:select-option--selected={opt.value === value}
          data-selected={opt.value === value}
          role="option"
          aria-selected={opt.value === value}
          onclick={() => select(opt)}
          onkeydown={(e) => e.key === 'Enter' && select(opt)}
          onkeypress={(e) => e.key === 'Enter' && select(opt)}
        >
          {opt.label}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .custom-select {
    position: relative;
    width: 100%;
  }

  .select-label {
    display: block;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
    margin-bottom: 0.3rem;
  }

  .select-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem var(--md-sys-spacing-md);
    padding-right: 2.5rem;
    border: 1.5px solid var(--md-sys-color-surface-variant);
    border-radius: var(--md-sys-shape-corner-medium);
    background: var(--md-sys-color-surface);
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-body);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .select-trigger:hover {
    border-color: var(--md-sys-color-on-surface-variant);
  }

  .select-trigger--open {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
  }

  .select-value {
    flex: 1;
    text-align: left;
  }

  .select-chevron {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: #64748B;
    transition: transform 0.2s ease;
  }

  .select-chevron--open {
    transform: rotate(180deg);
  }

  .select-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 100;
    margin: 0;
    padding: 0.35rem 0;
    list-style: none;
    background: var(--md-sys-color-surface);
    border: 1px solid var(--md-sys-color-surface-variant);
    border-radius: var(--md-sys-shape-corner-medium);
    box-shadow: var(--md-sys-elevation-2);
    max-height: 240px;
    overflow-y: auto;
    animation: dropdown-fade-in 0.15s ease;
  }

  @keyframes dropdown-fade-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .select-option {
    padding: 0.65rem var(--md-sys-spacing-md);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    transition: background 0.1s ease;
  }

  .select-option:hover,
  .select-option:focus {
    background: var(--md-sys-color-surface-variant);
    outline: none;
  }

  .select-option--selected {
    background: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }
</style>