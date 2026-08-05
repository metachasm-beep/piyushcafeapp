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

<!-- Force Light Mode for Superadmin -->
<div class="flex h-screen bg-white text-slate-900 overflow-hidden font-sans antialiased">
	<!-- Strict Sharp Sidebar -->
	<aside class="w-64 h-full flex flex-col bg-slate-50 border-r border-slate-200 shrink-0">
		<div class="p-6 border-b border-slate-200 bg-white">
			<h1 class="text-xl font-bold tracking-tight text-slate-900">Superadmin</h1>
			<p class="text-[11px] font-mono text-slate-500 mt-1 uppercase tracking-widest">Network Terminal</p>
		</div>

		<nav class="flex-1 py-4 space-y-0.5 overflow-y-auto">
			{#each links as link}
				<a
					href={link.href}
					class="flex items-center gap-3 px-6 py-2 transition-colors {page.url.pathname === link.href ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}"
				>
					<link.icon size={16} strokeWidth={page.url.pathname === link.href ? 2.5 : 2} />
					<span class="text-sm font-mono tracking-wide">{link.label}</span>
				</a>
			{/each}
		</nav>

		<div class="p-4 border-t border-slate-200 bg-white">
			<button class="w-full flex items-center gap-3 px-3 py-2 rounded-none text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors text-sm font-mono tracking-wide group">
				<LogOut size={16} class="group-hover:-translate-x-1 transition-transform" />
				<span>Sign Out</span>
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 h-screen overflow-y-auto relative z-10 bg-white">
		<div class="p-8 h-full max-w-7xl mx-auto">
			{@render children()}
		</div>
	</main>
</div>
