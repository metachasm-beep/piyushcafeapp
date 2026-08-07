<script lang="ts">
  import { page } from '$app/stores';
  import { LayoutDashboard, Users, Store, Settings, Menu, X, LogOut, Search, Bell } from 'lucide-svelte';
  import { tooltip } from '$lib/actions/tooltip';

  let { children } = $props();
  let mobileMenuOpen = $state(false);

  const links = [
    { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/superadmin/approvals', label: 'Approvals', icon: Users },
    { href: '/superadmin/restaurants', label: 'Restaurants', icon: Store },
    { href: '/superadmin/tables', label: 'Tables', icon: LayoutDashboard },
    { href: '/superadmin/menu', label: 'Global Menu', icon: Settings },
  ];
</script>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%);
    background-size: cover;
    background-attachment: fixed;
    color: #1D1D1F;
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
  }
  
  /* Abstract colorful blobs for Big Sur feel */
  .macos-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    background: radial-gradient(circle at 0% 0%, #ff8a00, #e52e71, transparent 60%),
                radial-gradient(circle at 100% 100%, #00c6ff, #0072ff, transparent 60%),
                radial-gradient(circle at 100% 0%, #ff007f, #ff8a00, transparent 50%),
                radial-gradient(circle at 0% 100%, #00b4db, #0083b0, transparent 50%);
    background-color: #fceabb;
  }
</style>

<div class="macos-bg"></div>

<!-- Desktop Environment Wrapper -->
<div class="flex items-center justify-center h-screen w-screen p-4 md:p-8 lg:p-12 overflow-hidden">
  
  <!-- macOS Window Container -->
  <div class="flex h-full w-full max-w-7xl bg-white/60 backdrop-blur-3xl rounded-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 overflow-hidden relative">
    
    <!-- Mobile Overlay -->
    {#if mobileMenuOpen}
      <div 
        class="absolute inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        onclick={() => mobileMenuOpen = false}
        aria-hidden="true"
      ></div>
    {/if}

    <!-- Sidebar (Vibrancy / Frosted) -->
    <aside 
      class="absolute lg:static inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-white/40 backdrop-blur-xl border-r border-black/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
    >
      <!-- Traffic Lights (macOS close/min/max) -->
      <div class="px-5 pt-4 pb-2 flex gap-2">
        <div class="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10"></div>
        <div class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10"></div>
        <div class="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10"></div>
      </div>

      <!-- Search Bar -->
      <div class="px-3 pt-4 pb-2">
        <div class="relative">
          <Search size={14} class="absolute left-2.5 top-1.5 text-black/40" />
          <input type="text" placeholder="Search" class="w-full bg-black/5 rounded-md pl-8 pr-3 py-1 text-[13px] text-black outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/50 transition-all border border-black/5 placeholder-black/40" />
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
        <p class="px-2 text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-1 mt-2">Favorites</p>
        {#each links as link}
          {@const active = $page.url.pathname === link.href}
          <a
            href={link.href}
            class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors {active ? 'bg-[#007AFF] text-white' : 'text-black/80 hover:bg-black/5'}"
            onclick={() => mobileMenuOpen = false}
          >
            <link.icon size={16} strokeWidth={active ? 2 : 2} class={active ? 'text-white' : 'text-[#007AFF]'} />
            {link.label}
          </a>
        {/each}
      </nav>

      <!-- Bottom: sign out -->
      <div class="p-3 mt-auto border-t border-black/5">
        <form action="/auth/logout?next=/" method="POST">
          <button
            type="submit"
            class="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium text-black/60 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </form>
      </div>
    </aside>

    <!-- Main Content Panel (Solid White or slightly translucent) -->
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-white/80 relative z-10">
      
      <!-- Toolbar Header -->
      <header class="h-12 flex items-center justify-between px-4 lg:px-6 z-30 flex-none border-b border-black/5 bg-white/50 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <button 
            class="p-1 rounded-md text-black/60 hover:bg-black/5 lg:hidden transition-colors"
            onclick={() => mobileMenuOpen = true}
          >
            <Menu size={20} />
          </button>
          <!-- Page Title -->
          <h1 class="text-[13px] font-bold text-black/80">Dashboard</h1>
        </div>
        
        <div class="flex items-center gap-3 ml-auto">
          <button class="text-black/50 hover:text-black transition-colors">
            <Bell size={16} />
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <div class="max-w-5xl mx-auto">
          {@render children()}
        </div>
      </main>
    </div>
  </div>
</div>
