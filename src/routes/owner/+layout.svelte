<script lang="ts">
  import { page } from '$app/state';
  import { pendingWaiterCount } from '$lib/stores/admin';
  import { LayoutDashboard, ChefHat, UtensilsCrossed, LogOut, Menu, Bell, Settings, Table as TableIcon, Users, TrendingUp, Banknote, Command, X } from 'lucide-svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: any, data: LayoutData } = $props();
  let restaurant = $derived(data?.restaurant);
  
  // Treat null/undefined role as 'owner'
  let userRole = $derived(data?.userRole ?? 'owner');
  let userName = $derived(data?.userName ?? 'Owner');
  let userEmail = $derived(data?.userEmail ?? '');
  let userInitial = $derived(userName.charAt(0).toUpperCase());

  let mobileMenuOpen = $state(false);
  let currentPath = $derived(page.url.pathname);
  let isLoginPage = $derived(currentPath === '/owner/login');

  const ownerLinks = [
    { href: '/owner', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/owner/kitchen', label: 'Kitchen Display', icon: ChefHat, exact: false },
    { href: '/owner/waiter', label: 'Waiter Dashboard', icon: Users, exact: false },
    { href: '/owner/inventory', label: 'Inventory', icon: UtensilsCrossed, exact: false },
    { href: '/owner/tables', label: 'Tables & QR', icon: TableIcon, exact: false },
    { href: '/owner/staff', label: 'Staff', icon: Users, exact: false },
  ];

  const managementLinks = [
    { href: '/owner/analytics', label: 'Analytics', icon: TrendingUp, exact: false },
    { href: '/owner/settings', label: 'Settings', icon: Settings, exact: false },
    { href: '/owner/kyc', label: 'PayU KYC', icon: Banknote, exact: false },
  ];

  function isActive(link: { href: string; exact: boolean }) {
    if (link.exact) return currentPath === link.href;
    return currentPath.startsWith(link.href);
  }
</script>

<style>
  :global(body) {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #ffffff;
    color: #09090b;
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
  }
</style>

{#if isLoginPage}
  {@render children()}
{:else}
  <div class="flex min-h-screen w-full bg-zinc-50/50">

    <!-- Mobile Overlay -->
    {#if mobileMenuOpen}
      <div
        class="fixed inset-0 z-50 bg-black/80 lg:hidden"
        onclick={() => mobileMenuOpen = false}
        aria-hidden="true"
      ></div>
    {/if}

    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-zinc-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}">
      
      <!-- Logo -->
      <div class="flex h-[60px] items-center border-b border-zinc-200 px-6 gap-3">
        <div class="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-950 text-zinc-50">
          <Command size={14} />
        </div>
        <div class="flex flex-col leading-tight">
          <span class="font-semibold tracking-tight text-zinc-950 text-sm">{restaurant?.name || 'Restaurant'}</span>
          <span class="text-[10px] text-zinc-500 uppercase tracking-wider">Staff Portal</span>
        </div>
        <button onclick={() => mobileMenuOpen = false} class="ml-auto lg:hidden text-zinc-500 hover:text-zinc-900">
          <X size={18} />
        </button>
      </div>

      <!-- Navigation -->
      <div class="flex-1 overflow-auto py-4">
        <nav class="grid items-start px-4 text-sm font-medium gap-0.5">
          {#if userRole === 'owner'}
            {#each ownerLinks as link}
              <a
                href={link.href}
                class="flex items-center gap-3 rounded-md px-3 py-2 transition-all {isActive(link) ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900'}"
                onclick={() => mobileMenuOpen = false}
              >
                <link.icon size={16} />
                {link.label}
                {#if link.href === '/owner/waiter' && $pendingWaiterCount > 0}
                  <span class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{$pendingWaiterCount}</span>
                {/if}
              </a>
            {/each}

            <div class="mt-4 pt-4 border-t border-zinc-100">
              <p class="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Management</p>
              {#each managementLinks as link}
                <a
                  href={link.href}
                  class="flex items-center gap-3 rounded-md px-3 py-2 transition-all {isActive(link) ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900'}"
                  onclick={() => mobileMenuOpen = false}
                >
                  <link.icon size={16} />
                  {link.label}
                </a>
              {/each}
            </div>
          {:else if userRole === 'chef'}
            <a href="/owner/kitchen" class="flex items-center gap-3 rounded-md px-3 py-2 transition-all {currentPath.startsWith('/owner/kitchen') ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900'}">
              <ChefHat size={16} /> Kitchen Display
            </a>
          {:else if userRole === 'waiter'}
            <a href="/owner/waiter" class="flex items-center gap-3 rounded-md px-3 py-2 transition-all {currentPath.startsWith('/owner/waiter') ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900'}">
              <Users size={16} /> Waiter Dashboard
              {#if $pendingWaiterCount > 0}
                <span class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{$pendingWaiterCount}</span>
              {/if}
            </a>
          {/if}
        </nav>
      </div>

      <!-- User Info + Logout -->
      <div class="mt-auto border-t border-zinc-200 p-4 space-y-3">
        <div class="flex items-center gap-3 px-1">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 text-sm font-semibold">
            {userInitial}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-zinc-900 truncate">{userName}</p>
            <p class="text-xs text-zinc-500 truncate">{userEmail}</p>
          </div>
        </div>
        <form action="/auth/logout?next=/" method="POST">
          <button
            type="submit"
            class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition-all hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </form>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex flex-col lg:pl-[260px] h-screen overflow-hidden w-full">
      
      <!-- Top Header -->
      <header class="flex h-[60px] shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-6">
        <button
          class="lg:hidden text-zinc-500 hover:text-zinc-900"
          onclick={() => mobileMenuOpen = true}
        >
          <Menu size={20} />
        </button>

        <div class="flex-1">
          <span class="text-sm font-medium text-zinc-500">{restaurant?.name || 'Staff Portal'}</span>
        </div>

        {#if $pendingWaiterCount > 0}
          <div class="relative">
            <div class="h-9 w-9 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white shadow-sm">
              <Bell size={16} class="text-zinc-950" />
            </div>
            <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{$pendingWaiterCount}</span>
          </div>
        {/if}

        <div class="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-200 flex items-center justify-center text-zinc-50 text-xs font-semibold">
          {userInitial}
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div class="mx-auto max-w-6xl">
          {@render children()}
        </div>
      </main>
    </div>
  </div>
{/if}
