<script lang="ts">
	import Reveal from '$lib/components/marketing/Reveal.svelte';
	import { ArrowRight, QrCode, MonitorSmartphone, ShieldCheck } from 'lucide-svelte';

	const apps = [
		{
			n: '01',
			title: 'Guest table app',
			role: 'Front of house',
			icon: QrCode,
			body: 'No download. Guests scan the table QR, browse your photo menu with dietary tags, add variations and chef notes, pay with UPI or card, or ask for cash — and tap Call Waiter when they need a human.'
		},
		{
			n: '02',
			title: 'Owner & staff portal',
			role: 'Back of house',
			icon: MonitorSmartphone,
			body: 'One secure portal for owners, chefs, and waiters. Live kitchen display, floor plan and table status, waiter requests, inventory toggles that hide sold-out dishes instantly, staff invites, analytics, and Razorpay KYC.'
		},
		{
			n: '03',
			title: 'Superadmin network',
			role: 'Platform control',
			icon: ShieldCheck,
			body: 'Invite-only onboarding. Approve owners, manage restaurants and tables, watch GMV and platform fees, and keep the multi-tenant network locked down while settlements run automatically.'
		}
	];
</script>

<svelte:head>
	<title>Ecosystem | The Golden Fork</title>
	<meta
		name="description"
		content="Three connected apps: guest QR ordering, owner/staff portal with kitchen and waiter tools, and a superadmin network console."
	/>
</svelte:head>

<section class="mk-fold" aria-label="Ecosystem fold">
	<div class="mk-fold-inner">
		<Reveal>
			<p class="mk-kicker">Fold 02 · How the system works</p>
			<h1 class="mk-title">One ecosystem. Three apps in sync.</h1>
			<p class="mk-lede">
				The Golden Fork is not a single screen. It is a multi-tenant dining OS where guest phones,
				kitchen tablets, waiter devices, and the owner dashboard share the same live order graph.
			</p>
		</Reveal>

		<div class="apps">
			{#each apps as app, i}
				<Reveal delay={i * 90}>
					<article class="app">
						<div class="app-top">
							<span class="app-n">{app.n}</span>
							<app.icon size={22} strokeWidth={1.5} />
						</div>
						<p class="app-role">{app.role}</p>
						<h2>{app.title}</h2>
						<p>{app.body}</p>
					</article>
				</Reveal>
			{/each}
		</div>

		<Reveal delay={120}>
			<div class="roles">
				<p class="roles-label">Role-aware access</p>
				<ul>
					<li><strong>Owner</strong> — full portal, KYC, staff, analytics, tables & QR</li>
					<li><strong>Chef</strong> — kitchen display and status machine</li>
					<li><strong>Waiter</strong> — floor alerts, assigned tables, cash collection</li>
					<li><strong>Guest</strong> — QR menu, cart, pay, track, feedback</li>
				</ul>
			</div>
		</Reveal>

		<Reveal delay={160}>
			<div class="mk-fold-nav">
				<a href="/flow" class="mk-btn">
					Follow an order
					<span class="mk-btn-icon"><ArrowRight size={16} strokeWidth={2.25} /></span>
				</a>
				<a href="/pricing" class="mk-btn-ghost">Compare owner plans</a>
			</div>
		</Reveal>

		<footer class="mk-fold-footer">
			<span>Built for restaurants, hotels, and cafes</span>
			<div class="links">
				<a href="/T&C">Terms</a>
				<a href="/privacy_policy">Privacy</a>
				<a href="/login">Staff login</a>
			</div>
		</footer>
	</div>
</section>

<style>
	.apps {
		display: grid;
		grid-template-columns: 1.15fr 0.95fr 0.9fr;
		gap: 1rem;
		margin-top: 3.25rem;
	}

	.app {
		min-height: 100%;
		padding: 1.6rem 1.5rem 1.75rem;
		border: 1px solid var(--mk-line);
		border-radius: 1.35rem;
		background:
			linear-gradient(160deg, rgba(184, 151, 78, 0.08), transparent 42%),
			rgba(255, 255, 255, 0.45);
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		transition:
			transform 0.55s var(--mk-ease),
			border-color 0.55s var(--mk-ease);
	}

	.app:hover {
		transform: translateY(-4px);
		border-color: rgba(184, 151, 78, 0.45);
	}

	.app:nth-child(2) {
		margin-top: 1.75rem;
	}

	.app:nth-child(3) {
		margin-top: 3.25rem;
	}

	.app-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: var(--mk-brass-deep);
		margin-bottom: 0.5rem;
	}

	.app-n {
		font-family: var(--font-mk-display);
		font-weight: 700;
		font-size: 0.95rem;
		letter-spacing: 0.08em;
	}

	.app-role {
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--mk-smoke);
		margin: 0;
	}

	.app h2 {
		font-family: var(--font-mk-display);
		font-size: 1.55rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		margin: 0;
	}

	.app p:last-child {
		margin: 0;
		color: var(--mk-ink-soft);
		line-height: 1.55;
		font-size: 0.95rem;
		opacity: 0.9;
	}

	.roles {
		margin-top: 2.75rem;
		padding: 1.5rem 0 0;
		border-top: 1px solid var(--mk-line);
		display: grid;
		grid-template-columns: 12rem 1fr;
		gap: 1.5rem;
	}

	.roles-label {
		font-family: var(--font-mk-display);
		font-weight: 700;
		font-size: 1rem;
		margin: 0;
	}

	.roles ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem 1.5rem;
	}

	.roles li {
		font-size: 0.92rem;
		line-height: 1.45;
		color: var(--mk-ink-soft);
	}

	.mk-fold-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
		margin-top: 2.5rem;
	}

	.links {
		display: flex;
		gap: 1.25rem;
	}

	@media (max-width: 960px) {
		.apps {
			grid-template-columns: 1fr;
		}

		.app:nth-child(2),
		.app:nth-child(3) {
			margin-top: 0;
		}

		.roles {
			grid-template-columns: 1fr;
		}

		.roles ul {
			grid-template-columns: 1fr;
		}
	}
</style>
