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
    background-color: #F5F5F7; /* Apple's classic off-white */
    color: #1D1D1F;
    -webkit-font-smoothing: antialiased;
  }
</style>

<!-- Main Wrapper -->
<div class="flex h-screen overflow-hidden bg-[#F5F5F7]">
  
  <!-- Mobile Overlay -->
  {#if mobileMenuOpen}
    <div 
      class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
      onclick={() => mobileMenuOpen = false}
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Sidebar (Solid, Clean) -->
  <aside 
    class="bg-[#F5F5F7] fixed lg:static inset-y-0 left-0 z-50 w-[240px] flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
  >
    <div class="p-4 lg:hidden flex justify-end">
      <button onclick={() => mobileMenuOpen = false} class="p-2 text-black/50 hover:text-black"><X size={24}/></button>
    </div>

    <!-- Logo mark -->
    <div class="px-6 py-8">
      <div class="text-[20px] font-bold text-[#1D1D1F] tracking-tight">Superadmin</div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-4 flex flex-col gap-1">
      {#each links as link}
        {@const active = $page.url.pathname === link.href}
        <a
          href={link.href}
          class="flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors"
          style="
            color: {active ? '#FFFFFF' : '#1D1D1F'};
            background: {active ? '#000000' : 'transparent'};
          "
          onclick={() => mobileMenuOpen = false}
        >
          <link.icon size={18} strokeWidth={active ? 2.5 : 2} class={active ? 'text-white' : 'text-black/50'} />
          {link.label}
        </a>
      {/each}
    </nav>

    <!-- Bottom: sign out -->
    <div class="p-4 mt-auto">
      <form action="/auth/logout?next=/" method="POST">
        <button
          type="submit"
          class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-[12px] text-[14px] font-medium text-black/50 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign Out
        </button>
      </form>
    </div>
  </aside>

  <!-- Main Content Wrapper -->
  <div class="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
    
    <!-- Header -->
    <header class="h-20 flex items-center justify-between px-8 z-30 flex-none">
      <div class="flex items-center gap-3">
        <button 
          class="p-2 -ml-2 rounded-xl text-black hover:bg-black/5 lg:hidden transition-colors"
          onclick={() => mobileMenuOpen = true}
        >
          <Menu size={24} />
        </button>
      </div>
      
      <div class="flex items-center gap-4 ml-auto">
        <div class="h-9 w-9 rounded-full bg-white shadow-sm flex items-center justify-center text-black cursor-pointer hover:bg-black/5 transition-colors">
          <Search size={18} />
        </div>
        <div class="h-9 w-9 rounded-full bg-white shadow-sm flex items-center justify-center text-black cursor-pointer hover:bg-black/5 transition-colors relative">
          <Bell size={18} />
          <div class="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto px-4 md:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        {@render children()}
      </div>
    </main>
  </div>
</div>
