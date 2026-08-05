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

<div class="sg-shell" style="min-height:100dvh;position:relative;">
  <div class="sg-orbs" aria-hidden="true">
    <div class="sg-orb" style="width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,0.16) 0%,transparent 70%);top:-160px;right:-120px;"></div>
    <div class="sg-orb" style="width:400px;height:400px;background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%);bottom:20%;left:-100px;filter:blur(50px);"></div>
    <div class="sg-orb" style="width:300px;height:300px;background:radial-gradient(circle,rgba(167,139,250,0.1) 0%,transparent 70%);bottom:-60px;right:20%;filter:blur(40px);"></div>
  </div>
  <div style="position:relative;z-index:1;">
    {@render children()}
  </div>
</div>
