<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let {
		children,
		delay = 0,
		class: className = ''
	}: {
		children: Snippet;
		delay?: number;
		class?: string;
	} = $props();

	let el: HTMLElement | undefined = $state();
	let visible = $state(false);

	onMount(() => {
		if (!el) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			visible = true;
			return;
		}
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					visible = true;
					io.disconnect();
				}
			},
			{ threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<div
	bind:this={el}
	class="mk-reveal {className}"
	class:is-in={visible}
	style="transition-delay: {delay}ms"
>
	{@render children()}
</div>
