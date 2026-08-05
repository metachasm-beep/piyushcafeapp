<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  type Props = {
    open: boolean;
    title: string;
    description?: string;
    maxWidth?: string;
    busy?: boolean;
    onClose: () => void;
    children: Snippet;
    footer?: Snippet;
  };

  let {
    open,
    title,
    description = '',
    maxWidth = '460px',
    busy = false,
    onClose,
    children,
    footer
  }: Props = $props();

  let panelEl = $state<HTMLDivElement | null>(null);
  let previouslyFocused: HTMLElement | null = null;

  function getFocusable(root: HTMLElement): HTMLElement[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      if (busy) return;
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'Tab' && panelEl) {
      const nodes = getFocusable(panelEl);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  $effect(() => {
    if (!open) return;
    previouslyFocused = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      if (!panelEl) return;
      const nodes = getFocusable(panelEl);
      (nodes[0] ?? panelEl).focus();
    }, 20);
    return () => {
      clearTimeout(t);
      previouslyFocused?.focus?.();
    };
  });

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if open}
  <div class="sa-modal">
    <div
      class="sa-modal-backdrop"
      role="presentation"
      onclick={(e) => {
        if (busy) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        class="sa-tile sa-tile-static sa-modal-panel"
        style="max-width:{maxWidth};"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sa-modal-title"
        aria-describedby={description ? 'sa-modal-desc' : undefined}
        tabindex="-1"
        bind:this={panelEl}
      >
        <button
          type="button"
          class="sa-btn-icon sa-no-print"
          style="position:absolute;top:14px;right:14px;"
          aria-label="Close"
          disabled={busy}
          onclick={onClose}
        >
          <X size={16} />
        </button>

        <h2 id="sa-modal-title" class="sa-modal-title">{title}</h2>
        {#if description}
          <p id="sa-modal-desc" class="sa-modal-desc">{description}</p>
        {/if}

        {@render children()}

        {#if footer}
          <div style="margin-top:20px;">
            {@render footer()}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
