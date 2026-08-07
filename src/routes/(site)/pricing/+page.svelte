<script lang="ts">
	import Reveal from '$lib/components/marketing/Reveal.svelte';
	import { ArrowRight, Check } from 'lucide-svelte';

	type Mode = 'fee' | 'sub';
	let mode = $state<Mode>('fee');

	const feePoints = [
		'₹0 monthly commitment',
		'2% of food cost as platform fee',
		'18% GST applied on the platform fee',
		'Restaurant keeps the rest via Razorpay Route',
		'Ideal for seasonal venues and first rollouts'
	];

	const plans = [
		{
			name: 'Cafe',
			price: '₹1,999',
			period: '/ month',
			blurb: 'Compact floors up to 20 tables.',
			perks: ['0% platform fee on food', 'Full guest + kitchen + waiter suite', 'Menu, QR & staff roles', 'Basic analytics']
		},
		{
			name: 'Restaurant',
			price: '₹3,999',
			period: '/ month',
			blurb: 'Busy rooms up to 50 tables.',
			featured: true,
			perks: ['0% platform fee on food', 'Everything in Cafe', 'Priority analytics & feedback', 'Faster onboarding support']
		},
		{
			name: 'Hotel',
			price: '₹8,999',
			period: '/ month',
			blurb: 'Hotels & multi-outlet groups.',
			perks: ['0% platform fee on food', 'Multi-floor / multi-outlet ready', 'Dedicated success contact', 'Custom rollout playbook']
		}
	];

	const exampleFood = 1000;
	const platformFee = exampleFood * 0.02;
	const gstOnFee = platformFee * 0.18;
	const platformTake = platformFee + gstOnFee;
	const guestTotal = exampleFood * 1.05;
	const restaurantGets = guestTotal - platformTake;
</script>

<svelte:head>
	<title>Pricing | The Golden Fork</title>
	<meta
		name="description"
		content="Two owner options: pay a 2% platform fee with no monthly bill, or subscribe monthly and keep 0% platform fee on food."
	/>
</svelte:head>

<section class="mk-fold" aria-label="Pricing fold">
	<div class="mk-fold-inner">
		<Reveal>
			<p class="mk-kicker">Fold 04 · Owner commercial options</p>
			<h1 class="mk-title">Pick how you partner with us.</h1>
			<p class="mk-lede">
				Owners choose one path — not a stack of add-ons. Stay on a pure platform fee, or subscribe
				monthly and keep every rupee of food revenue.
			</p>
		</Reveal>

		<Reveal delay={80}>
			<div class="toggle" role="tablist" aria-label="Pricing mode">
				<button
					role="tab"
					aria-selected={mode === 'fee'}
					class:active={mode === 'fee'}
					onclick={() => (mode = 'fee')}
				>
					Platform fee
				</button>
				<button
					role="tab"
					aria-selected={mode === 'sub'}
					class:active={mode === 'sub'}
					onclick={() => (mode = 'sub')}
				>
					Subscription
				</button>
			</div>
		</Reveal>

		{#if mode === 'fee'}
			<div class="fee-panel">
				<Reveal delay={40}>
					<article class="fee-hero">
						<p class="eyebrow">Pay as you grow</p>
						<h2>2% of food cost</h2>
						<p class="sub">
							No monthly bill. When a guest pays online, Razorpay Route splits the settlement
							automatically: you receive the food + GST share minus our fee.
						</p>
						<ul>
							{#each feePoints as point}
								<li>
									<Check size={16} strokeWidth={2.25} />
									{point}
								</li>
							{/each}
						</ul>
					</article>
				</Reveal>

				<Reveal delay={120}>
					<article class="math">
						<p class="eyebrow">Worked example · ₹1,000 food</p>
						<dl>
							<div>
								<dt>Guest pays (food + 5% GST)</dt>
								<dd>₹{guestTotal.toFixed(2)}</dd>
							</div>
							<div>
								<dt>Platform fee (2%)</dt>
								<dd>₹{platformFee.toFixed(2)}</dd>
							</div>
							<div>
								<dt>GST on fee (18%)</dt>
								<dd>₹{gstOnFee.toFixed(2)}</dd>
							</div>
							<div class="total">
								<dt>Platform retains</dt>
								<dd>₹{platformTake.toFixed(2)}</dd>
							</div>
							<div class="keep">
								<dt>Restaurant settlement</dt>
								<dd>₹{restaurantGets.toFixed(2)}</dd>
							</div>
						</dl>
						<p class="note">
							Cash orders skip the gateway split — your waiter collects at the table while the
							kitchen ticket still runs live.
						</p>
					</article>
				</Reveal>
			</div>
		{:else}
			<div class="plans">
				{#each plans as plan, i}
					<Reveal delay={i * 80}>
						<article class="plan" class:featured={plan.featured}>
							{#if plan.featured}
								<span class="badge">Most venues</span>
							{/if}
							<h2>{plan.name}</h2>
							<p class="price">
								{plan.price}<span>{plan.period}</span>
							</p>
							<p class="blurb">{plan.blurb}</p>
							<ul>
								{#each plan.perks as perk}
									<li>
										<Check size={16} strokeWidth={2.25} />
										{perk}
									</li>
								{/each}
							</ul>
						</article>
					</Reveal>
				{/each}
			</div>
			<Reveal delay={120}>
				<p class="sub-note">
					Subscription venues settle food revenue in full through Razorpay Route — the monthly plan
					replaces the 2% platform fee. Switch between models with our team during onboarding.
				</p>
			</Reveal>
		{/if}

		<Reveal delay={160}>
			<div class="compare">
				<table>
					<thead>
						<tr>
							<th>What you get</th>
							<th>Platform fee</th>
							<th>Subscription</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Monthly cost</td>
							<td>₹0</td>
							<td>From ₹1,999</td>
						</tr>
						<tr>
							<td>Fee on food</td>
							<td>2% + GST on fee</td>
							<td>0%</td>
						</tr>
						<tr>
							<td>Guest / kitchen / waiter apps</td>
							<td>Included</td>
							<td>Included</td>
						</tr>
						<tr>
							<td>Instant Razorpay split</td>
							<td>Yes</td>
							<td>Yes</td>
						</tr>
						<tr>
							<td>Best when</td>
							<td>Volume is variable</td>
							<td>Volume is steady</td>
						</tr>
					</tbody>
				</table>
			</div>
		</Reveal>

		<Reveal delay={180}>
			<div class="cta-band">
				<div>
					<h2 class="mk-display">Ready in about five minutes.</h2>
					<p>Google login → approval → Razorpay KYC → table QR codes live.</p>
				</div>
				<a href="/login" class="mk-btn">
					Start owner onboarding
					<span class="mk-btn-icon"><ArrowRight size={16} strokeWidth={2.25} /></span>
				</a>
			</div>
		</Reveal>

		<footer class="mk-fold-footer">
			<span>© The Golden Fork</span>
			<div class="links">
				<a href="/T&C">Terms</a>
				<a href="/privacy_policy">Privacy</a>
				<a href="/refund_policy">Refunds</a>
			</div>
		</footer>
	</div>
</section>

<style>
	.toggle {
		margin-top: 2rem;
		display: inline-flex;
		padding: 0.3rem;
		border-radius: 9999px;
		background: rgba(18, 16, 14, 0.05);
		border: 1px solid var(--mk-line);
		gap: 0.2rem;
	}

	.toggle button {
		appearance: none;
		border: 0;
		background: transparent;
		padding: 0.7rem 1.25rem;
		border-radius: 9999px;
		font-family: var(--font-mk-body);
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--mk-ink-soft);
		cursor: pointer;
		transition:
			background 0.45s var(--mk-ease),
			color 0.45s var(--mk-ease),
			transform 0.45s var(--mk-ease);
	}

	.toggle button.active {
		background: var(--mk-ink);
		color: var(--mk-paper);
	}

	.fee-panel {
		margin-top: 2rem;
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: 1.25rem;
	}

	.fee-hero,
	.math,
	.plan {
		border: 1px solid var(--mk-line);
		border-radius: 1.4rem;
		padding: 1.6rem 1.55rem;
		background: rgba(255, 255, 255, 0.5);
	}

	.eyebrow {
		margin: 0 0 0.75rem;
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--mk-brass-deep);
		font-weight: 700;
	}

	.fee-hero h2 {
		font-family: var(--font-mk-display);
		font-size: clamp(2.2rem, 4vw, 3.2rem);
		letter-spacing: -0.04em;
		margin: 0 0 0.75rem;
	}

	.sub {
		margin: 0 0 1.25rem;
		color: var(--mk-ink-soft);
		line-height: 1.55;
		max-width: 42ch;
	}

	.fee-hero ul,
	.plan ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.65rem;
	}

	.fee-hero li,
	.plan li {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		font-size: 0.95rem;
		color: var(--mk-ink-soft);
		line-height: 1.4;
	}

	.fee-hero li :global(svg),
	.plan li :global(svg) {
		color: var(--mk-brass-deep);
		margin-top: 0.15rem;
		flex-shrink: 0;
	}

	.math dl {
		margin: 0;
		display: grid;
		gap: 0.75rem;
	}

	.math dl > div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.7rem;
		border-bottom: 1px solid var(--mk-line);
		font-size: 0.95rem;
	}

	.math dt {
		color: var(--mk-smoke);
	}

	.math dd {
		margin: 0;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.math .total dd {
		color: var(--mk-brass-deep);
	}

	.math .keep {
		border-bottom: 0;
		padding-bottom: 0;
	}

	.math .keep dd {
		font-size: 1.15rem;
		color: var(--mk-ink);
	}

	.note {
		margin: 1.1rem 0 0;
		font-size: 0.82rem;
		color: var(--mk-smoke);
		line-height: 1.45;
	}

	.plans {
		margin-top: 2rem;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.plan {
		position: relative;
		min-height: 100%;
		transition:
			transform 0.55s var(--mk-ease),
			border-color 0.55s var(--mk-ease);
	}

	.plan:hover {
		transform: translateY(-4px);
		border-color: rgba(184, 151, 78, 0.45);
	}

	.plan.featured {
		background:
			linear-gradient(165deg, rgba(184, 151, 78, 0.16), transparent 50%),
			rgba(255, 255, 255, 0.62);
		border-color: rgba(184, 151, 78, 0.45);
	}

	.badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		padding: 0.35rem 0.6rem;
		border-radius: 9999px;
		background: var(--mk-ink);
		color: var(--mk-paper);
	}

	.plan h2 {
		font-family: var(--font-mk-display);
		font-size: 1.45rem;
		margin: 0 0 0.5rem;
	}

	.price {
		font-family: var(--font-mk-display);
		font-size: 2.2rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		margin: 0 0 0.35rem;
	}

	.price span {
		font-size: 0.9rem;
		font-weight: 500;
		letter-spacing: 0;
		color: var(--mk-smoke);
		margin-left: 0.2rem;
	}

	.blurb {
		margin: 0 0 1.2rem;
		color: var(--mk-smoke);
		font-size: 0.9rem;
	}

	.sub-note {
		margin: 1.25rem 0 0;
		max-width: 60ch;
		color: var(--mk-smoke);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.compare {
		margin-top: 2.75rem;
		overflow-x: auto;
		border: 1px solid var(--mk-line);
		border-radius: 1.2rem;
		background: rgba(255, 255, 255, 0.4);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}

	th,
	td {
		padding: 0.95rem 1.15rem;
		text-align: left;
		border-bottom: 1px solid var(--mk-line);
	}

	th {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--mk-smoke);
		font-weight: 700;
	}

	tr:last-child td {
		border-bottom: 0;
	}

	.cta-band {
		margin-top: 2.75rem;
		padding: 1.6rem 1.5rem;
		border-radius: 1.4rem;
		background: var(--mk-ink);
		color: var(--mk-paper);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1.25rem;
	}

	.cta-band h2 {
		font-size: clamp(1.5rem, 3vw, 2rem);
		margin: 0 0 0.35rem;
	}

	.cta-band p {
		margin: 0;
		color: rgba(242, 240, 236, 0.7);
	}

	.links {
		display: flex;
		gap: 1.25rem;
	}

	@media (max-width: 960px) {
		.fee-panel,
		.plans {
			grid-template-columns: 1fr;
		}
	}
</style>
