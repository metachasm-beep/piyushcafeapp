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

<!-- Ambient Liquid Glows -->
<div class="ambient-glow" style="top: 20%; left: 10%;"></div>
<div class="ambient-glow" style="top: 80%; left: 90%; filter: blur(120px); opacity: 0.3; background: radial-gradient(circle, #3b82f6 0%, transparent 70%);"></div>

<div class="flex h-screen bg-bg/50 text-text-primary overflow-hidden font-sans">
	<!-- Glass Sidebar -->
	<div class="p-6 pr-0 shrink-0 h-full">
		<aside class="w-64 h-full flex flex-col glass-strong rounded-3xl overflow-hidden shadow-float">
			<div class="p-6 border-b border-border/50">
				<h1 class="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-hover tracking-tight">Superadmin</h1>
				<p class="text-xs text-text-secondary mt-1 font-medium">Management Console</p>
			</div>

			<nav class="flex-1 p-4 space-y-2 overflow-y-auto hide-scrollbar">
				{#each links as link}
					<a
						href={link.href}
						class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 {page.url.pathname === link.href ? 'bg-brand/10 text-brand font-semibold shadow-glow border border-brand/20' : 'text-text-secondary hover:text-text-primary hover:bg-surface/50 hover:scale-[1.02]'}"
					>
						<link.icon size={18} />
						<span class="text-sm">{link.label}</span>
					</a>
				{/each}
			</nav>

			<div class="p-4 border-t border-border/50">
				<button class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium group">
					<LogOut size={18} class="group-hover:-translate-x-1 transition-transform" />
					<span>Sign Out</span>
				</button>
			</div>
		</aside>
	</div>

	<!-- Main Content -->
	<main class="flex-1 h-screen overflow-y-auto relative z-10">
		<div class="p-8 h-full max-w-7xl mx-auto">
			{@render children()}
		</div>
	</main>
</div>
