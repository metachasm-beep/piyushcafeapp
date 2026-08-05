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

<div class="flex h-screen bg-bg text-text-primary overflow-hidden">
	<!-- Sidebar -->
	<aside class="w-64 flex flex-col glass-strong border-r border-border h-full shrink-0">
		<div class="p-6 border-b border-border">
			<h1 class="text-xl font-display font-bold text-brand">Superadmin</h1>
			<p class="text-sm text-text-secondary mt-1">Network Dashboard</p>
		</div>

		<nav class="flex-1 p-4 space-y-2 overflow-y-auto">
			{#each links as link}
				<a
					href={link.href}
					class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 {page.url.pathname === link.href ? 'bg-brand/10 text-brand border border-brand/20' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}"
				>
					<link.icon size={20} />
					<span class="font-medium">{link.label}</span>
				</a>
			{/each}
		</nav>

		<div class="p-4 border-t border-border">
			<button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors">
				<LogOut size={20} />
				<span class="font-medium">Sign Out</span>
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 h-screen overflow-y-auto bg-bg relative">
		{@render children()}
	</main>
</div>
