<script lang="ts">
	import { page } from '$app/state';
	import { ArrowUpRight } from 'lucide-svelte';

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/ecosystem', label: 'Ecosystem' },
		{ href: '/flow', label: 'Flow' },
		{ href: '/pricing', label: 'Pricing' }
	];

	let path = $derived(page.url.pathname);
</script>

<nav class="mk-nav" aria-label="Marketing folds">
	<a href="/" class="mk-brand-link">The Golden Fork</a>
	{#each links as link}
		<a href={link.href} class:active={path === link.href}>
			{link.label}
		</a>
	{/each}
	<a href="/login" class="mk-cta">
		Staff login
		<ArrowUpRight size={14} strokeWidth={2} />
	</a>
</nav>
