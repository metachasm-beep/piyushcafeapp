<script lang="ts">
  import { page } from '$app/stores';
  import { LayoutDashboard, Users, Store, Settings, Menu, X, LogOut, Search, Bell } from 'lucide-svelte';
  
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
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #F5F5F7; /* Apple aluminum grey */
    color: #1D1D1F;
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
  }

  .oak-accent {
    background-color: #C19A6B; /* Warm Oak Wood Tone */
  }
</style>

<!-- Top Oak Accent Line representing retail tables -->
<div class="h-2 w-full oak-accent fixed top-0 z-50"></div>

<div class="flex h-screen w-screen overflow-hidden pt-2">
  
  <!-- Mobile Overlay -->
  {#if mobileMenuOpen}
    <div 
      class="fixed inset-0 bg-black/10 z-40 lg:hidden backdrop-blur-sm"
      onclick={() => mobileMenuOpen = false}
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Retail Sparse Sidebar -->
  <aside 
    class="fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-[#F5F5F7] lg:bg-transparent flex flex-col pt-12 pb-8 px-8 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
  >
    <div class="flex items-center justify-between lg:hidden mb-12">
      <h2 class="text-xl font-bold tracking-tight text-[#1D1D1F]">Menu</h2>
      <button onclick={() => mobileMenuOpen = false} class="p-2 text-[#1D1D1F]/50 hover:text-[#1D1D1F]">
        <X size={24} />
      </button>
    </div>

    <!-- Apple Retail Typography Logo -->
    <div class="hidden lg:block mb-16">
      <h1 class="text-2xl font-bold tracking-tight text-[#1D1D1F] flex items-center gap-3">
        <div class="w-8 h-8 rounded-full oak-accent flex items-center justify-center">
          <Store size={16} class="text-white" />
        </div>
        Golden Fork
      </h1>
    </div>

    <nav class="flex-1 flex flex-col gap-6">
      {#each links as link}
        {@const active = $page.url.pathname === link.href}
        <a
          href={link.href}
          class="flex items-center gap-4 group"
          onclick={() => mobileMenuOpen = false}
        >
          <div class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 {active ? 'bg-white shadow-sm' : 'bg-transparent group-hover:bg-white/50'}">
            <link.icon size={20} strokeWidth={active ? 2.5 : 1.5} class="{active ? 'text-[#1D1D1F]' : 'text-[#1D1D1F]/40 group-hover:text-[#1D1D1F]/70'}" />
          </div>
          <span class="text-[17px] font-semibold tracking-tight transition-colors {active ? 'text-[#1D1D1F]' : 'text-[#1D1D1F]/40 group-hover:text-[#1D1D1F]/70'}">
            {link.label}
          </span>
        </a>
      {/each}
    </nav>

    <!-- Bottom Action -->
    <div class="mt-auto pt-8">
      <form action="/auth/logout?next=/" method="POST">
        <button
          type="submit"
          class="flex items-center gap-4 group w-full"
        >
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-transparent group-hover:bg-red-50 transition-all duration-300">
            <LogOut size={20} strokeWidth={1.5} class="text-[#1D1D1F]/40 group-hover:text-red-500" />
          </div>
          <span class="text-[17px] font-semibold tracking-tight text-[#1D1D1F]/40 group-hover:text-red-500 transition-colors">
            Sign Out
          </span>
        </button>
      </form>
    </div>
  </aside>

  <!-- Main Content Panel (Pure White Slabs) -->
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-white lg:rounded-tl-[40px] shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
    
    <!-- Header -->
    <header class="h-24 flex items-center justify-between px-8 lg:px-16 flex-none bg-white">
      <div class="flex items-center gap-4">
        <button 
          class="p-2 -ml-2 rounded-full text-[#1D1D1F]/50 hover:bg-[#F5F5F7] lg:hidden transition-colors"
          onclick={() => mobileMenuOpen = true}
        >
          <Menu size={24} />
        </button>
      </div>
      
      <div class="flex items-center gap-6">
        <div class="hidden md:flex items-center bg-[#F5F5F7] rounded-full px-4 py-2 w-64">
          <Search size={18} class="text-[#1D1D1F]/40 mr-2" />
          <input type="text" placeholder="Search..." class="bg-transparent border-none outline-none text-[15px] placeholder-[#1D1D1F]/40 w-full" />
        </div>
        <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] transition-colors text-[#1D1D1F]/70">
          <Bell size={20} />
        </button>
        <div class="w-10 h-10 rounded-full oak-accent shadow-sm"></div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto px-8 lg:px-16 pb-16">
      <div class="max-w-6xl mx-auto h-full">
        {@render children()}
      </div>
    </main>
  </div>
</div>
