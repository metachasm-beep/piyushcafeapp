<script lang="ts">
	import Reveal from '$lib/components/marketing/Reveal.svelte';
	import { ArrowRight } from 'lucide-svelte';

	const steps = [
		{
			t: 'Scan',
			d: 'Guest opens the table QR. The browser loads /table/{restaurant}/{table} — branded menu, no app install.'
		},
		{
			t: 'Build',
			d: 'Browse categories, dietary badges, variations and add-ons. Cart lives on-device until checkout.'
		},
		{
			t: 'Place',
			d: 'Order hits the API and place_order RPC. Totals recalculate with food GST; a waiter is assigned.'
		},
		{
			t: 'Pay',
			d: 'UPI or card via Razorpay Route splits the bill instantly. Cash alerts the waiter to collect at the table.'
		},
		{
			t: 'Cook',
			d: 'Kitchen Display moves pending → preparing → ready → served. Inventory can hide sold-out items in real time.'
		},
		{
			t: 'Close',
			d: 'Guest tracks status, leaves star feedback, and the table turns — owners see revenue and ratings land in analytics.'
		}
	];
</script>

<svelte:head>
	<title>Order flow | The Golden Fork</title>
	<meta
		name="description"
		content="From QR scan to kitchen to Razorpay split: how The Golden Fork moves an order across guest, waiter, chef, and owner."
	/>
</svelte:head>

<section class="mk-fold mk-fold-dark" aria-label="Order flow fold">
	<div class="mk-fold-inner">
		<Reveal>
			<p class="mk-kicker">Fold 03 · Live order path</p>
			<h1 class="mk-title">From QR to kitchen to bank — in one continuous loop.</h1>
			<p class="mk-lede">
				Every seat becomes a terminal. The same order record fans out to kitchen tickets, waiter
				alerts, settlement math, and owner analytics without retyping a thing.
			</p>
		</Reveal>

		<ol class="rail">
			{#each steps as step, i}
				<li>
					<Reveal delay={i * 70}>
						<div class="step">
							<span class="idx">{String(i + 1).padStart(2, '0')}</span>
							<div>
								<h2>{step.t}</h2>
								<p>{step.d}</p>
							</div>
						</div>
					</Reveal>
				</li>
			{/each}
		</ol>

		<Reveal delay={100}>
			<aside class="callout">
				<p>
					<strong>Cashflow that does not wait.</strong> On online payments, Razorpay Route sends the
					restaurant share to the linked account the moment the bill clears — while the platform
					retains only the fee you opted into.
				</p>
			</aside>
		</Reveal>

		<Reveal delay={140}>
			<div class="mk-fold-nav">
				<a href="/pricing" class="mk-btn">
					Choose how you pay us
					<span class="mk-btn-icon"><ArrowRight size={16} strokeWidth={2.25} /></span>
				</a>
				<a href="/ecosystem" class="mk-btn-ghost">Back to ecosystem</a>
			</div>
		</Reveal>
	</div>
</section>

<style>
	.rail {
		list-style: none;
		margin: 3rem 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem 1.5rem;
		counter-reset: none;
	}

	.step {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.9rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--mk-line-light);
		min-height: 9.5rem;
	}

	.idx {
		font-family: var(--font-mk-display);
		font-weight: 700;
		color: var(--mk-brass-bright);
		font-size: 0.95rem;
		letter-spacing: 0.06em;
		padding-top: 0.2rem;
	}

	.step h2 {
		font-family: var(--font-mk-display);
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		margin: 0 0 0.45rem;
	}

	.step p {
		margin: 0;
		color: rgba(242, 240, 236, 0.7);
		line-height: 1.5;
		font-size: 0.95rem;
	}

	.callout {
		margin-top: 2.75rem;
		padding: 1.4rem 1.5rem;
		border-left: 3px solid var(--mk-brass);
		background: rgba(184, 151, 78, 0.08);
		max-width: 62ch;
	}

	.callout p {
		margin: 0;
		line-height: 1.55;
		color: rgba(242, 240, 236, 0.82);
	}

	.mk-fold-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
		margin-top: 2.5rem;
	}

	@media (max-width: 900px) {
		.rail {
			grid-template-columns: 1fr;
		}

		.step {
			min-height: 0;
		}
	}
</style>
