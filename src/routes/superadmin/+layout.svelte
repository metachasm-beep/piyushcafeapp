<script lang="ts">
  import { page } from '$app/stores';
  import { LayoutDashboard, Users, Store, Settings, Menu, X, LogOut, Search, Bell } from 'lucide-svelte';
  import { tooltip } from '$lib/actions/tooltip';

  let { children } = $props();
  let mobileMenuOpen = $state(false);

  const links = [
    { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/superadmin/restaurants', label: 'Restaurants', icon: Store },
    { href: '/superadmin/users', label: 'Users', icon: Users },
    { href: '/superadmin/menu', label: 'Global Menu', icon: LayoutDashboard },
    { href: '/superadmin/settings', label: 'Settings', icon: Settings },
  ];
</script>

<style>
  /* Magical CSS Animations */
  @keyframes blob-bounce {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  .animate-blob {
    animation: blob-bounce 15s infinite alternate ease-in-out;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  
  /* Deep Frosted Glass for layout */
  :global(.sa-glass-panel) {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  /* Reset global body for this layout */
  :global(body) {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #0f172a; /* Fallback dark */
    color: #f8fafc;
  }
</style>

<!-- Main Wrapper with Generative Mesh Background -->
<div class="flex h-screen overflow-hidden bg-slate-950 relative">
  
  <!-- Generative Ambient Blobs -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/40 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
    <div class="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
    <div class="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[150px] animate-blob animation-delay-4000"></div>
    <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"></div> <!-- Dimmer -->
  </div>

  <!-- Mobile Overlay -->
  {#if mobileMenuOpen}
    <div 
      class="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
      onclick={() => mobileMenuOpen = false}
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Floating Frosted Sidebar -->
  <aside 
    class="sa-glass-panel fixed lg:static inset-y-4 left-4 z-50 w-[260px] flex flex-col rounded-[32px] transform transition-transform duration-500 ease-out lg:translate-x-0 {mobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%]'} m-4 ml-4 mr-0"
  >
    <div class="p-6 lg:hidden flex justify-end">
      <button onclick={() => mobileMenuOpen = false} class="p-2 text-white/70 hover:text-white"><X size={24}/></button>
    </div>

    <!-- Logo mark -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-[14px] bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div>
          <div class="text-[18px] font-bold text-white tracking-tight leading-none">Superadmin</div>
          <div class="text-[11px] text-white/50 tracking-widest uppercase mt-1">Console</div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-4 flex flex-col gap-2">
      {#each links as link}
        {@const active = $page.url.pathname === link.href}
        <a
          href={link.href}
          class="group flex items-center gap-3 px-4 py-3.5 rounded-[20px] text-[15px] font-medium transition-all duration-300 ease-out"
          style="
            color: {active ? '#ffffff' : 'rgba(255,255,255,0.6)'};
            background: {active ? 'rgba(255,255,255,0.15)' : 'transparent'};
            box-shadow: {active ? '0 4px 20px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.2)' : 'none'};
          "
          onclick={() => mobileMenuOpen = false}
        >
          <span style="color:{active ? '#a78bfa' : 'inherit'};" class="transition-transform duration-300 group-hover:scale-110">
            <link.icon size={20} strokeWidth={active ? 2.5 : 2} />
          </span>
          {link.label}
        </a>
      {/each}
    </nav>

    <!-- Bottom: sign out -->
    <div class="p-4 mt-auto">
      <form action="/auth/logout?next=/" method="POST">
        <button
          type="submit"
          class="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-[20px] text-[14px] font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut size={18} strokeWidth={2} />
          Sign Out
        </button>
      </form>
    </div>
  </aside>

  <!-- Main Content Wrapper -->
  <div class="flex-1 flex flex-col h-screen overflow-hidden relative z-10 lg:pl-4">
    
    <!-- Header -->
    <header class="h-20 flex items-center justify-between px-6 z-30 flex-none">
      <div class="flex items-center gap-3">
        <button 
          class="p-2 -ml-2 rounded-xl text-white/70 hover:bg-white/10 lg:hidden transition-colors"
          onclick={() => mobileMenuOpen = true}
        >
          <Menu size={24} />
        </button>
        <span class="font-bold text-xl text-white lg:hidden">Superadmin</span>
      </div>
      
      <div class="flex items-center gap-3 ml-auto">
        <div class="h-10 w-10 rounded-full sa-glass-panel flex items-center justify-center text-white cursor-pointer hover:bg-white/20 transition-colors">
          <Search size={18} />
        </div>
        <div class="h-10 w-10 rounded-full sa-glass-panel flex items-center justify-center text-white cursor-pointer hover:bg-white/20 transition-colors relative">
          <Bell size={18} />
          <div class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-8">
      <div class="max-w-7xl mx-auto">
        {@render children()}
      </div>
    </main>
  </div>
</div>
