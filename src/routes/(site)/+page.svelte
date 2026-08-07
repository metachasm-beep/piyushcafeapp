<script lang="ts">
	import Reveal from '$lib/components/marketing/Reveal.svelte';
	import { ArrowRight, ChevronDown } from 'lucide-svelte';
</script>

<svelte:head>
	<title>The Golden Fork — Order management for restaurants, hotels & cafes</title>
	<meta
		name="description"
		content="The Golden Fork is a multi-app dining OS: QR ordering for guests, kitchen and waiter tools for staff, and owner analytics — with subscription or platform-fee pricing."
	/>
</svelte:head>

<section class="mk-fold mk-hero" aria-label="Hero">
	<div class="mk-hero-media" aria-hidden="true">
		<img
			src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=80"
			alt=""
			width="2400"
			height="1600"
			fetchpriority="high"
		/>
		<div class="mk-hero-veil"></div>
	</div>

	<div class="mk-fold-inner mk-hero-copy">
		<Reveal>
			<p class="mk-brand-mark">The Golden Fork</p>
		</Reveal>
		<Reveal delay={80}>
			<h1 class="mk-title mk-hero-title">
				Dining that moves at the speed of a scan.
			</h1>
		</Reveal>
		<Reveal delay={160}>
			<p class="mk-lede mk-hero-lede">
				A multi-app order system for restaurants, hotels, and cafes — guests order from the table,
				kitchens cook from live tickets, owners keep the floor and the cashflow clear.
			</p>
		</Reveal>
		<Reveal delay={240}>
			<div class="mk-hero-actions">
				<a href="/ecosystem" class="mk-btn">
					See the ecosystem
					<span class="mk-btn-icon"><ArrowRight size={16} strokeWidth={2.25} /></span>
				</a>
				<a href="/pricing" class="mk-btn-ghost">Subscription or platform fee</a>
			</div>
		</Reveal>
	</div>

	<a href="/ecosystem" class="mk-scroll-hint" aria-label="Next fold: Ecosystem">
		<span>Next fold</span>
		<ChevronDown size={18} strokeWidth={1.75} />
	</a>
</section>

<style>
	.mk-hero {
		color: var(--mk-paper);
		display: grid;
		align-items: end;
	}

	.mk-hero-media {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.mk-hero-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform: scale(1.04);
		animation: mk-hero-drift 18s var(--mk-ease) infinite alternate;
	}

	.mk-hero-veil {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(105deg, rgba(18, 16, 14, 0.88) 0%, rgba(18, 16, 14, 0.55) 48%, rgba(18, 16, 14, 0.28) 100%),
			radial-gradient(ellipse at 70% 20%, rgba(184, 151, 78, 0.22), transparent 55%);
	}

	.mk-hero-copy {
		position: relative;
		z-index: 1;
		padding-bottom: 5.5rem;
	}

	.mk-brand-mark {
		font-family: var(--font-mk-display);
		font-size: clamp(2.8rem, 8vw, 5.5rem);
		font-weight: 800;
		letter-spacing: -0.04em;
		line-height: 0.95;
		color: var(--mk-brass-bright);
		margin: 0 0 1.5rem;
		text-shadow: 0 8px 40px rgba(18, 16, 14, 0.45);
	}

	.mk-hero-title {
		max-width: 16ch;
		font-size: clamp(1.55rem, 3.4vw, 2.55rem);
		font-weight: 700;
		color: var(--mk-paper);
		opacity: 0.95;
	}

	.mk-hero-lede {
		color: rgba(242, 240, 236, 0.78);
		max-width: 42ch;
	}

	.mk-hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
		margin-top: 2rem;
	}

	.mk-scroll-hint {
		position: absolute;
		right: 1.5rem;
		bottom: 1.5rem;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(242, 240, 236, 0.7);
		text-decoration: none;
		animation: mk-bob 2.4s var(--mk-ease) infinite;
	}

	@keyframes mk-hero-drift {
		from {
			transform: scale(1.04) translate3d(0, 0, 0);
		}
		to {
			transform: scale(1.08) translate3d(-1.5%, -1%, 0);
		}
	}

	@keyframes mk-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(6px);
		}
	}

	@media (max-width: 768px) {
		.mk-scroll-hint {
			left: 1.25rem;
			right: auto;
			bottom: 5.25rem;
		}

		.mk-hero-copy {
			padding-bottom: 7rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mk-hero-media img,
		.mk-scroll-hint {
			animation: none;
		}
	}
</style>
