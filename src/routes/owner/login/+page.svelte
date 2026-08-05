<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { toast } from 'svelte-sonner';
	
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMsg = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		loading = false;

		if (error) {
			errorMsg = error.message;
			toast.error('Login failed: ' + error.message);
		} else {
			toast.success('Logged in successfully!');
			goto('/owner');
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
	<div class="glass-strong p-8 rounded-2xl w-full max-w-md animate-slide-up">
		<h1 class="text-3xl font-display text-[var(--color-brand)] mb-2 text-center">Owner Login</h1>
		<p class="text-[var(--color-text-secondary)] text-center mb-8">Sign in to manage your restaurant</p>

		{#if errorMsg}
			<div class="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">
				{errorMsg}
			</div>
		{/if}

		<form onsubmit={handleLogin} class="space-y-4">
			<div>
				<label for="email" class="block text-sm text-[var(--color-text-secondary)] mb-1">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="input-dark w-full"
					placeholder="owner@restaurant.com"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm text-[var(--color-text-secondary)] mb-1">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="input-dark w-full"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="btn-brand w-full mt-6"
			>
				{#if loading}
					Signing in...
				{:else}
					Sign In
				{/if}
			</button>
		</form>
	</div>
</div>
