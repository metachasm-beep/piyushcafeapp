<script lang="ts">
	import '$lib/components/marketing/marketing.css';
	import SiteNav from '$lib/components/marketing/SiteNav.svelte';

	let { children } = $props();
</script>

<div class="mk">
	<div class="mk-grain" aria-hidden="true"></div>
	<SiteNav />
	{@render children()}
</div>
