<script lang="ts">
	import { page } from '$app/state';
	import { Shield, LockKeyhole } from 'lucide-svelte';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';

	let isLoading = $state(false);
	let errorMessage = $derived(page.url.searchParams.get('error'));

	async function handleGoogleLogin() {
		isLoading = true;

		try {
			const { createBrowserClient } = await import('@supabase/ssr');
			const supabase = createBrowserClient(
				env.PUBLIC_SUPABASE_URL || '',
				env.PUBLIC_SUPABASE_ANON_KEY || ''
			);

			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (error) {
				throw error;
			}
		} catch (e) {
			console.error(e);
			alert('Failed to initialize Google Login');
			isLoading = false;
		}
	}

	onMount(async () => {
		if (errorMessage === 'pending_approval' || errorMessage === 'unauthorized') {
			const { createBrowserClient } = await import('@supabase/ssr');
			const supabase = createBrowserClient(
				env.PUBLIC_SUPABASE_URL || '',
				env.PUBLIC_SUPABASE_ANON_KEY || ''
			);
			await supabase.auth.signOut();
		}
	});
</script>

<svelte:head>
	<title>Staff Login | The Golden Fork</title>
</svelte:head>

<div
	class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[var(--color-bg)] p-4 font-sans text-white"
>
	<div class="pointer-events-none absolute inset-0 opacity-20">
		<div
			class="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[var(--color-brand)] blur-[120px]"
		></div>
		<div class="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-amber-900 blur-[120px]"></div>
	</div>

	<div
		class="glass-strong relative z-10 w-full max-w-md animate-slide-up rounded-3xl border border-white/10 p-8"
	>
		<div class="mb-8 flex flex-col items-center justify-center space-y-4 text-center">
			<div
				class="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 text-[var(--color-brand)] shadow-[0_0_30px_rgba(249,115,22,0.2)]"
			>
				<Shield size={40} />
			</div>
			<div>
				<h1 class="font-display mb-2 text-3xl text-white">Platform Access</h1>
				<p class="text-sm text-[var(--color-text-secondary)]">
					Secure login for Superadmin, Owners & Staff
				</p>
			</div>
		</div>

		{#if errorMessage}
			<div
				class="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
			>
				<LockKeyhole size={18} class="shrink-0" />
				{#if errorMessage === 'pending_approval'}
					<span
						>Your account is pending approval by the Superadmin. Please wait for access to be
						granted.</span
					>
				{:else if errorMessage === 'unauthorized'}
					<span>Access Denied. You are not authorized to access this system.</span>
				{:else}
					<span>Authentication failed. Please try again.</span>
				{/if}
			</div>
		{/if}

		<button
			onclick={handleGoogleLogin}
			disabled={isLoading}
			class="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 font-semibold text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isLoading}
				<div
					class="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black"
				></div>
			{:else}
				<svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						fill="#EA4335"
					/>
				</svg>
				Sign in with Google
			{/if}
		</button>

		<div class="mt-8 text-center">
			<a
				href="/"
				class="text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
			>
				← Back to The Golden Fork
			</a>
		</div>
	</div>
</div>
