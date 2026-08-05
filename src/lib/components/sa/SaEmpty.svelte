<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    body?: string;
    children?: Snippet;
  };

  let { title, body = '', children }: Props = $props();
</script>

<div class="sa-tile sa-tile-static sa-empty">
  <div class="sa-empty-title">{title}</div>
  {#if body}
    <p class="sa-empty-body">{body}</p>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</div>
