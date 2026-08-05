<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, Store, UtensilsCrossed, QrCode, LogOut } from 'lucide-svelte';

	let { children } = $props();

	const links = [
		{ href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/superadmin/restaurants', label: 'Restaurants', icon: Store },
		{ href: '/superadmin/menu', label: 'Menu Manager', icon: UtensilsCrossed },
		{ href: '/superadmin/tables', label: 'Tables & QR', icon: QrCode },
	];
</script>

<div class="flex h-screen bg-bg text-text-primary overflow-hidden font-mono">
	<!-- Sidebar -->
	<aside class="w-64 flex flex-col bg-surface border-r border-border h-full shrink-0">
		<div class="p-4 border-b border-border bg-card">
			<h1 class="text-xl font-bold text-brand uppercase tracking-wider">Superadmin</h1>
			<p class="text-xs text-text-secondary mt-1 uppercase">Network Terminal</p>
		</div>

		<nav class="flex-1 p-2 space-y-1 overflow-y-auto">
			{#each links as link}
				<a
					href={link.href}
					class="flex items-center gap-3 px-3 py-2 transition-all duration-300 {page.url.pathname === link.href ? 'bg-brand text-black font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-card'}"
				>
					<link.icon size={16} />
					<span class="text-sm uppercase tracking-wide">{link.label}</span>
				</a>
			{/each}
		</nav>

		<div class="p-2 border-t border-border bg-card">
			<button class="w-full flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-red-400 hover:bg-red-950/30 transition-colors uppercase text-sm tracking-wide">
				<LogOut size={16} />
				<span>Sign Out</span>
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 h-screen overflow-y-auto bg-bg relative">
		<div class="p-6 h-full">
			{@render children()}
		</div>
	</main>
</div>
