<script lang="ts">
  import '$lib/styles/spatial-glass.css';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Geist+Mono:wght@300;400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="sg-shell">
  <div class="sg-orbs" aria-hidden="true">
    <div class="sg-orb sg-orb--a"></div>
    <div class="sg-orb sg-orb--b"></div>
    <div class="sg-orb sg-orb--c"></div>
  </div>
  <div class="sg-content">
    {@render children()}
  </div>
</div>

<style>
  .sg-content {
    position: relative;
    z-index: 1;
  }
</style>
