<script lang="ts">
	import { Check, X } from 'lucide-svelte';

	type Interest = 'platform_fee' | 'subscription' | 'not_sure';

	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let restaurant = $state('');
	let city = $state('');
	let interest = $state<Interest>('not_sure');
	let message = $state('');
	let submitting = $state(false);
	let submitted = $state(false);
	let errorMsg = $state('');

	function close() {
		open = false;
		if (submitted) {
			// Reset after a successful send once the panel closes
			setTimeout(resetForm, 320);
		}
	}

	function resetForm() {
		name = '';
		email = '';
		phone = '';
		restaurant = '';
		city = '';
		interest = 'not_sure';
		message = '';
		submitting = false;
		submitted = false;
		errorMsg = '';
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) close();
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		errorMsg = '';
		submitting = true;

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					phone: phone.trim(),
					restaurant: restaurant.trim(),
					city: city.trim(),
					interest,
					message: message.trim()
				})
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data?.error || 'Something went wrong. Please try again.');
			}

			submitted = true;
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="overlay" role="presentation" onclick={close}>
		<div
			class="panel"
			role="dialog"
			aria-modal="true"
			aria-labelledby="contact-title"
			onclick={(e) => e.stopPropagation()}
		>
			<button type="button" class="close" onclick={close} aria-label="Close contact form">
				<X size={18} strokeWidth={2} />
			</button>

			{#if submitted}
				<div class="success">
					<span class="success-icon" aria-hidden="true">
						<Check size={28} strokeWidth={2.25} />
					</span>
					<h2 id="contact-title" class="mk-display">We received your note.</h2>
					<p>Our team will reach out within one business day.</p>
					<button type="button" class="submit" onclick={close}>Close</button>
				</div>
			{:else}
				<header class="head">
					<p class="eyebrow">Contact</p>
					<h2 id="contact-title" class="mk-display">Tell us about your floor.</h2>
					<p class="lede">
						Share a few details and we will help you pick platform fee or subscription.
					</p>
				</header>

				<form class="form" onsubmit={handleSubmit}>
					<div class="grid">
						<label>
							<span>Name</span>
							<input type="text" name="name" autocomplete="name" required bind:value={name} />
						</label>
						<label>
							<span>Email</span>
							<input
								type="email"
								name="email"
								autocomplete="email"
								required
								bind:value={email}
							/>
						</label>
						<label>
							<span>Phone</span>
							<input
								type="tel"
								name="phone"
								autocomplete="tel"
								required
								bind:value={phone}
							/>
						</label>
						<label>
							<span>Restaurant / hotel</span>
							<input type="text" name="restaurant" required bind:value={restaurant} />
						</label>
						<label>
							<span>City</span>
							<input type="text" name="city" autocomplete="address-level2" bind:value={city} />
						</label>
						<label>
							<span>Interest</span>
							<select name="interest" bind:value={interest}>
								<option value="not_sure">Not sure yet</option>
								<option value="platform_fee">Platform fee (2%)</option>
								<option value="subscription">Monthly subscription</option>
							</select>
						</label>
					</div>

					<label class="full">
						<span>Message</span>
						<textarea
							name="message"
							rows="3"
							placeholder="Tables, outlets, go-live timing…"
							bind:value={message}
						></textarea>
					</label>

					{#if errorMsg}
						<p class="error" role="alert">{errorMsg}</p>
					{/if}

					<button type="submit" class="submit" disabled={submitting}>
						{#if submitting}
							<span class="spinner" aria-hidden="true"></span>
							Sending…
						{:else}
							Send message
						{/if}
					</button>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: grid;
		place-items: center;
		padding: 1.25rem;
		background:
			radial-gradient(ellipse at 30% 20%, rgba(184, 151, 78, 0.18), transparent 45%),
			rgba(18, 16, 14, 0.62);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		animation: mk-fade-in 0.35s var(--mk-ease);
	}

	.panel {
		position: relative;
		width: min(560px, 100%);
		max-height: min(90dvh, 820px);
		overflow: auto;
		padding: 1.75rem 1.6rem 1.5rem;
		border-radius: 1.5rem;
		background:
			linear-gradient(165deg, rgba(184, 151, 78, 0.12), transparent 42%),
			var(--mk-paper);
		border: 1px solid rgba(18, 16, 14, 0.1);
		box-shadow: 0 28px 80px rgba(18, 16, 14, 0.28);
		color: var(--mk-ink);
		animation: mk-rise-in 0.45s var(--mk-ease);
		scrollbar-width: thin;
	}

	.close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		appearance: none;
		border: 0;
		background: rgba(18, 16, 14, 0.05);
		color: var(--mk-ink-soft);
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 9999px;
		display: grid;
		place-items: center;
		cursor: pointer;
		transition:
			background 0.35s var(--mk-ease),
			transform 0.35s var(--mk-ease);
	}

	.close:hover {
		background: rgba(18, 16, 14, 0.1);
		transform: rotate(90deg);
	}

	.head {
		padding-right: 2rem;
		margin-bottom: 1.4rem;
	}

	.eyebrow {
		margin: 0 0 0.65rem;
		font-size: 0.7rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		font-weight: 700;
		color: var(--mk-brass-deep);
	}

	.head h2 {
		margin: 0;
		font-size: clamp(1.55rem, 3.5vw, 2rem);
		letter-spacing: -0.035em;
	}

	.lede {
		margin: 0.65rem 0 0;
		color: var(--mk-ink-soft);
		font-size: 0.95rem;
		line-height: 1.5;
		max-width: 36ch;
	}

	.form {
		display: grid;
		gap: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem 0.75rem;
	}

	label {
		display: grid;
		gap: 0.35rem;
	}

	label.full {
		grid-column: 1 / -1;
	}

	label span {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--mk-smoke);
	}

	input,
	select,
	textarea {
		appearance: none;
		width: 100%;
		border: 0;
		border-bottom: 1.5px solid var(--mk-line);
		border-radius: 0;
		background: transparent;
		padding: 0.55rem 0.1rem 0.6rem;
		font-family: var(--font-mk-body);
		font-size: 0.95rem;
		color: var(--mk-ink);
		outline: none;
		transition: border-color 0.35s var(--mk-ease);
	}

	textarea {
		resize: vertical;
		min-height: 4.5rem;
		line-height: 1.45;
	}

	input:focus,
	select:focus,
	textarea:focus {
		border-bottom-color: var(--mk-brass);
	}

	select {
		cursor: pointer;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a857c' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.15rem center;
		padding-right: 1.25rem;
	}

	.error {
		margin: 0;
		padding: 0.75rem 0.9rem;
		border-radius: 0.75rem;
		background: rgba(180, 50, 40, 0.08);
		border: 1px solid rgba(180, 50, 40, 0.2);
		color: #8a2e26;
		font-size: 0.88rem;
	}

	.submit {
		appearance: none;
		border: 0;
		margin-top: 0.25rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		padding: 0.95rem 1.35rem;
		border-radius: 9999px;
		background: var(--mk-ink);
		color: var(--mk-paper);
		font-family: var(--font-mk-body);
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition:
			transform 0.45s var(--mk-ease),
			background 0.45s var(--mk-ease);
	}

	.submit:hover:not(:disabled) {
		transform: translateY(-2px);
		background: var(--mk-ink-soft);
	}

	.submit:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border-radius: 9999px;
		border: 2px solid rgba(242, 240, 236, 0.25);
		border-top-color: var(--mk-paper);
		animation: mk-spin 0.7s linear infinite;
	}

	.success {
		text-align: center;
		padding: 1.5rem 0.5rem 0.5rem;
		display: grid;
		justify-items: center;
		gap: 0.75rem;
		animation: mk-rise-in 0.4s var(--mk-ease);
	}

	.success-icon {
		display: grid;
		place-items: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 9999px;
		background: rgba(184, 151, 78, 0.2);
		color: var(--mk-brass-deep);
		margin-bottom: 0.35rem;
	}

	.success h2 {
		margin: 0;
		font-size: 1.7rem;
	}

	.success p {
		margin: 0 0 0.75rem;
		color: var(--mk-ink-soft);
		max-width: 28ch;
		line-height: 1.5;
	}

	@keyframes mk-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes mk-rise-in {
		from {
			opacity: 0;
			transform: translateY(1.25rem) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes mk-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 560px) {
		.grid {
			grid-template-columns: 1fr;
		}

		.panel {
			padding: 1.4rem 1.15rem 1.25rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.overlay,
		.panel,
		.success,
		.close,
		.submit,
		.spinner {
			animation: none;
			transition: none;
		}
	}
</style>
