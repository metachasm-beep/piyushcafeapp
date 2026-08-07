<script lang="ts">
  import { page } from '$app/stores';
  import { LayoutDashboard, Users, Store, Settings, Menu, X, LogOut, Search, Bell, Command } from 'lucide-svelte';
  
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
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
    background-color: #ffffff;
    color: #09090b; /* zinc-950 */
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
  }
</style>

<div class="flex min-h-screen w-full flex-col bg-muted/40">
  
  <!-- Mobile Overlay -->
  {#if mobileMenuOpen}
    <div 
      class="fixed inset-0 z-50 bg-black/80 lg:hidden"
      onclick={() => mobileMenuOpen = false}
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Sidebar -->
  <aside 
    class="fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-zinc-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
  >
    <div class="flex h-[60px] items-center border-b border-zinc-200 px-6">
      <a href="/superadmin" class="flex items-center gap-2 font-semibold tracking-tight text-zinc-950">
        <div class="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-950 text-zinc-50">
          <Command size={14} />
        </div>
        <span>Golden Fork</span>
      </a>
      <button onclick={() => mobileMenuOpen = false} class="ml-auto lg:hidden text-zinc-900 hover:text-zinc-950">
        <X size={20} />
      </button>
    </div>

    <div class="flex-1 overflow-auto py-4">
      <nav class="grid items-start px-4 text-sm font-medium">
        {#each links as link}
          {@const active = $page.url.pathname === link.href}
          <a
            href={link.href}
            class="flex items-center gap-3 rounded-md px-3 py-2 transition-all {active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-900 hover:bg-zinc-100/50 hover:text-zinc-900'}"
            onclick={() => mobileMenuOpen = false}
          >
            <link.icon size={16} class={active ? 'text-zinc-900' : 'text-zinc-900'} />
            {link.label}
          </a>
        {/each}
      </nav>
    </div>

    <!-- Bottom Action -->
    <div class="mt-auto border-t border-zinc-200 p-4">
      <form action="/auth/logout?next=/" method="POST">
        <button
          type="submit"
          class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-900 transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </form>
    </div>
  </aside>

  <!-- Main Content Panel -->
  <div class="flex flex-col lg:pl-[260px] h-screen overflow-hidden bg-zinc-50/50">
    
    <!-- Top Header -->
    <header class="flex h-[60px] items-center gap-4 border-b border-zinc-200 bg-white px-6">
      <button 
        class="lg:hidden text-zinc-900 hover:text-zinc-950"
        onclick={() => mobileMenuOpen = true}
      >
        <Menu size={20} />
      </button>
      
      <div class="w-full flex-1">
        <form class="relative">
          <Search size={16} class="absolute left-2.5 top-2.5 text-zinc-900" />
          <input
            type="search"
            placeholder="Search..."
            class="flex h-9 w-full sm:w-[300px] md:w-[200px] lg:w-[300px] rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
          />
        </form>
      </div>

      <button class="h-9 w-9 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white text-sm font-medium shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950">
        <Bell size={16} class="text-zinc-950" />
      </button>
      <div class="h-9 w-9 rounded-full bg-zinc-200 border border-zinc-300"></div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto p-6 md:p-8">
      <div class="mx-auto max-w-6xl">
        {@render children()}
      </div>
    </main>
  </div>
</div>
