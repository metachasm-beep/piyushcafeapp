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

<!-- Force Light Mode and Editorial Vibe for Superadmin -->
<div class="flex h-screen bg-[#f8f9fa] text-slate-900 overflow-hidden font-sans antialiased">
	<!-- Asymmetric Editorial Sidebar -->
	<aside class="w-72 h-full flex flex-col shrink-0 px-8 py-10">
		<div class="mb-12">
			<h1 class="text-3xl font-display font-black tracking-tight text-slate-900 italic">Superadmin.</h1>
			<p class="text-[10px] font-mono text-emerald-600 mt-2 uppercase tracking-widest">Global Network Terminal</p>
		</div>

		<nav class="flex-1 space-y-6 overflow-y-auto pr-4">
			{#each links as link}
				<a
					href={link.href}
					class="flex items-center gap-4 transition-all duration-300 group {page.url.pathname === link.href ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}"
				>
					<span class="{page.url.pathname === link.href ? 'text-emerald-600' : 'text-slate-300 group-hover:text-emerald-500'} transition-colors">
						<link.icon size={20} strokeWidth={page.url.pathname === link.href ? 2.5 : 1.5} />
					</span>
					<span class="text-sm font-mono tracking-wide {page.url.pathname === link.href ? 'font-bold' : ''}">{link.label}</span>
				</a>
			{/each}
		</nav>

		<div class="pt-8 mt-auto">
			<button class="flex items-center gap-3 text-slate-400 hover:text-red-600 transition-colors text-sm font-mono tracking-wide group" onclick={() => { import('$lib/stores/admin').then(m => m.adminUser.logout()); import('$app/navigation').then(m => m.goto('/admin/login')) }}>
				<LogOut size={18} class="group-hover:-translate-x-1 transition-transform" />
				<span>Sign Out</span>
			</button>
		</div>
	</aside>

	<!-- Main Content with soft left divider -->
	<main class="flex-1 h-screen overflow-y-auto relative z-10 border-l border-slate-200/60">
		<div class="p-10 h-full max-w-6xl mx-auto">
			{@render children()}
		</div>
	</main>
</div>
