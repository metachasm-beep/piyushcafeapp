<script lang="ts">
  import { page } from '$app/state';
  import { LayoutDashboard, Store, UtensilsCrossed, QrCode, LogOut, Menu, X } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { adminUser } from '$lib/stores/admin';

  let { children } = $props();
  let mobileMenuOpen = $state(false);

  const links = [
    { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/superadmin/restaurants', label: 'Restaurants', icon: Store },
    { href: '/superadmin/menu', label: 'Menu Manager', icon: UtensilsCrossed },
    { href: '/superadmin/tables', label: 'Tables & QR', icon: QrCode },
  ];
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Geist+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
</svelte:head>

<style>
  :global(.sa-glass) {
    backdrop-filter: blur(24px) saturate(1.6);
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.75);
  }
  :global(.sa-tile) {
    backdrop-filter: blur(20px) saturate(1.5);
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(99, 102, 241, 0.06), 0 1px 2px rgba(99, 102, 241, 0.04);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  :global(.sa-tile:hover) {
    box-shadow: 0 8px 40px rgba(99, 102, 241, 0.12), 0 2px 6px rgba(99, 102, 241, 0.06);
    transform: translateY(-1px);
  }
  :global(.sa-input) {
    width: 100%;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.2);
    background: rgba(255, 255, 255, 0.7);
    font-family: 'Cabinet Grotesk', system-ui, sans-serif;
    font-size: 16px; /* 16px prevents iOS zoom on focus */
    color: #1e1b4b;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  @media (min-width: 1024px) {
    :global(.sa-input) {
      font-size: 14px;
    }
  }
  :global(.sa-input:focus) {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
  :global(.sa-btn-primary) {
    padding: 12px 20px; /* Slightly taller for touch */
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-family: 'Cabinet Grotesk', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    transition: opacity 0.15s, transform 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  :global(.sa-btn-primary:hover) { opacity: 0.9; transform: translateY(-1px); }
  :global(.sa-btn-primary:disabled) { opacity: 0.5; cursor: not-allowed; transform: none; }
  
  :global(.sa-label) {
    display: block;
    font-size: 11px;
    font-family: 'Geist Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8b84c0;
    margin-bottom: 6px;
  }
  :global(.sa-page-header) {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (min-width: 768px) {
    :global(.sa-page-header) {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
  }
  :global(.sa-page-title) {
    font-size: 28px;
    font-weight: 900;
    color: #1e1b4b;
    letter-spacing: -0.04em;
    line-height: 1.1;
  }
  @media (min-width: 768px) {
    :global(.sa-page-title) {
      font-size: 32px;
    }
  }
  :global(.sa-page-subtitle) {
    font-size: 13px;
    color: #8b84c0;
    margin-top: 4px;
    font-family: 'Geist Mono', monospace;
  }
  :global(.sa-badge-active) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 99px;
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
  :global(.sa-badge-inactive) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 99px;
    background: rgba(156, 163, 175, 0.1);
    color: #6b7280;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid rgba(156, 163, 175, 0.2);
  }
</style>

<!-- Main Wrapper -->
<div class="flex h-screen overflow-hidden bg-[linear-gradient(135deg,#e8e6f5_0%,#f0eeff_35%,#ede8ff_65%,#eaf0ff_100%)]" style="font-family:'Cabinet Grotesk',system-ui,sans-serif;">
  
  <!-- Ambient glow orbs -->
  <div aria-hidden="true" class="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div class="absolute w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,transparent_70%)] -top-[200px] -left-[200px] blur-[40px]"></div>
    <div class="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_70%)] -bottom-[100px] right-[200px] blur-[60px]"></div>
    <div class="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.10)_0%,transparent_70%)] top-[40%] -right-[100px] blur-[50px]"></div>
  </div>

  <!-- Mobile Overlay -->
  {#if mobileMenuOpen}
    <div 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
      onclick={() => mobileMenuOpen = false}
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Frosted Sidebar -->
  <aside 
    class="sa-glass fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static border-r border-[#6366f1]/10 shadow-[4px_0_32px_rgba(99,102,241,0.05)] {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
  >
    <div class="p-6 border-b border-[#6366f1]/10 lg:hidden flex justify-end">
      <button onclick={() => mobileMenuOpen = false} class="p-2 text-[#8b84c0] hover:text-[#1e1b4b]"><X size={24}/></button>
    </div>

    <!-- Logo mark -->
    <div class="px-5 py-6 border-b border-[#6366f1]/10">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-9 h-9 rounded-[10px] bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] flex items-center justify-center shadow-[0_4px_14px_rgba(99,102,241,0.4)] flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
        </div>
        <div>
          <div class="text-[15px] font-[800] text-[#1e1b4b] tracking-[-0.03em] leading-[1.1]">Superadmin</div>
          <div class="text-[10px] font-['Geist_Mono',monospace] text-[#8b84c0] tracking-[0.06em] uppercase">Console</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 mt-2">
        <div class="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.7)] animate-pulse"></div>
        <span class="text-[10px] font-['Geist_Mono',monospace] text-[#6d6a9c] tracking-[0.06em]">NETWORK LIVE</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
      {#each links as link}
        {@const active = page.url.pathname === link.href}
        <a
          href={link.href}
          class="flex items-center gap-3 px-3 py-3 rounded-[12px] text-[15px] transition-all duration-150"
          style="
            font-weight:{active ? 700 : 500};
            color:{active ? '#4338ca' : '#6b6a9c'};
            background:{active ? 'linear-gradient(135deg,rgba(99,102,241,0.13),rgba(139,92,246,0.07))' : 'transparent'};
            border:1px solid {active ? 'rgba(99,102,241,0.2)' : 'transparent'};
            box-shadow:{active ? '0 2px 10px rgba(99,102,241,0.1)' : 'none'};
          "
          onclick={() => mobileMenuOpen = false}
        >
          <span style="color:{active ? '#6366f1' : '#a5b4fc'};">
            <link.icon size={18} strokeWidth={active ? 2.5 : 1.8} />
          </span>
          {link.label}
        </a>
      {/each}
    </nav>

    <!-- Bottom: sign out -->
    <div class="p-4 border-t border-[#6366f1]/10">
      <form action="/auth/logout?next=/superadmin/login" method="POST">
        <button
          type="submit"
          class="w-full flex items-center gap-3 px-3 py-3 rounded-[12px] text-[14px] font-[500] text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
        >
          <LogOut size={16} strokeWidth={1.8} />
          Sign Out
        </button>
      </form>
    </div>
  </aside>

  <!-- Main Content Wrapper -->
  <div class="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
    
    <!-- Mobile Header -->
    <header class="lg:hidden h-16 sa-glass flex items-center justify-between px-4 z-30 sticky top-0 border-b border-[#6366f1]/10">
      <div class="flex items-center gap-3">
        <button 
          class="p-2 -ml-2 rounded-lg text-[#1e1b4b] hover:bg-white/40"
          onclick={() => mobileMenuOpen = true}
        >
          <Menu size={24} />
        </button>
        <span class="font-display font-bold text-lg text-[#1e1b4b]">Superadmin</span>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
      <div class="max-w-6xl mx-auto">
        {@render children()}
      </div>
    </main>
  </div>
</div>
