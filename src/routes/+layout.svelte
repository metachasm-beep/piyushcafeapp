<script lang="ts">
  import './layout.css';
  import { Toaster } from 'svelte-sonner';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/icons/icon-192.png" />
</svelte:head>

<Toaster
  position="top-right"
  toastOptions={{
    style: 'background: #1e1e1e; color: #f5f5f5; border: 1px solid rgba(255,255,255,0.1);'
  }}
/>

{@render children()}
