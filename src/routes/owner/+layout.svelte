<script lang="ts">
  import { page } from '$app/state';
  import { pendingWaiterCount } from '$lib/stores/admin';
  import { LayoutDashboard, ChefHat, UtensilsCrossed, LogOut, Menu, Bell, Settings, Table as TableIcon, Users, TrendingUp, Banknote } from 'lucide-svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: any, data: LayoutData } = $props();
  let restaurant = $derived(data?.restaurant);
  
  // Treat null/undefined role as 'owner' (approved users provisioned via superadmin)
  let userRole = $derived(data?.userRole ?? 'owner');
  let userName = $derived(data?.userName ?? 'Owner');
  let userEmail = $derived(data?.userEmail ?? '');
  let userInitial = $derived(userName.charAt(0).toUpperCase());

  let mobileMenuOpen = $state(false);

  let currentPath = $derived(page.url.pathname);
  
  // Do not show sidebar on login page
  let isLoginPage = $derived(currentPath === '/owner/login');
</script>

{#if isLoginPage}
  {@render children()}
{:else}
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex">
    
    <!-- Mobile overlay -->
    {#if mobileMenuOpen}
      <div 
        class="fixed inset-0 bg-black/60 z-40 lg:hidden"
        onclick={() => mobileMenuOpen = false}
        aria-hidden="true"
      ></div>
    {/if}

    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--color-surface)] border-r border-[var(--color-border)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
    >
      <div class="p-6 flex flex-col items-center border-b border-[var(--color-border)] text-center">
        {#if restaurant?.logo_url}
          <div class="w-16 h-16 rounded-2xl overflow-hidden mb-3 border border-[var(--color-border)]">
            <img src={restaurant.logo_url} alt={restaurant.name} class="w-full h-full object-cover" />
          </div>
        {:else}
          <div class="text-4xl mb-2">🍴</div>
        {/if}
        <h1 class="font-display text-xl font-bold text-[var(--color-brand)]">{restaurant?.name || 'Restaurant'}</h1>
        <p class="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider mt-1">Staff Portal</p>
      </div>

      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        {#if userRole === 'owner'}
          <a 
            href="/owner" 
            class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/owner' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
            onclick={() => mobileMenuOpen = false}
          >
            <LayoutDashboard size={20} />
            <span class="font-medium">Dashboard</span>
          </a>
        {/if}
        
        {#if userRole === 'owner' || userRole === 'chef'}
          <a 
            href="/owner/kitchen" 
            class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/owner/kitchen' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
            onclick={() => mobileMenuOpen = false}
          >
            <ChefHat size={20} />
            <span class="font-medium">Kitchen Display</span>
          </a>
        {/if}

        {#if userRole === 'owner' || userRole === 'waiter'}
          <a 
            href="/owner/waiter" 
            class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/owner/waiter' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
            onclick={() => mobileMenuOpen = false}
          >
            <Users size={20} />
            <span class="font-medium">Waiter Dashboard</span>
          </a>
        {/if}
        
        {#if userRole === 'owner'}
          <a 
            href="/owner/inventory" 
            class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/owner/inventory' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
            onclick={() => mobileMenuOpen = false}
          >
            <UtensilsCrossed size={20} />
            <span class="font-medium">Inventory</span>
          </a>
          <a 
            href="/owner/tables" 
            class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/owner/tables' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
            onclick={() => mobileMenuOpen = false}
          >
            <TableIcon size={20} />
            <span class="font-medium">Tables & QR</span>
          </a>
          <a 
            href="/owner/staff" 
            class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/owner/staff' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
            onclick={() => mobileMenuOpen = false}
          >
            <Users size={20} />
            <span class="font-medium">Staff</span>
          </a>
          
          <div class="pt-4 mt-2 border-t border-[var(--color-border)]">
            <p class="px-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Management</p>
            <a 
              href="/owner/analytics" 
              class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/owner/analytics' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
              onclick={() => mobileMenuOpen = false}
            >
              <TrendingUp size={20} />
              <span class="font-medium">Analytics</span>
            </a>
            <a 
              href="/owner/settings" 
              class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/owner/settings' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
              onclick={() => mobileMenuOpen = false}
            >
              <Settings size={20} />
              <span class="font-medium">Settings</span>
            </a>
            <a 
              href="/owner/kyc" 
              class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/owner/kyc' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
              onclick={() => mobileMenuOpen = false}
            >
              <Banknote size={20} />
              <span class="font-medium">PayU KYC</span>
            </a>
          </div>
        {/if}
      </nav>

      <div class="p-4 border-t border-[var(--color-border)]">
        <div class="flex items-center gap-3 mb-4 px-2">
          <div class="w-10 h-10 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center">
            <span class="font-bold text-[var(--color-brand)]">{userInitial}</span>
          </div>
          <div class="overflow-hidden">
            <p class="text-sm font-medium truncate">{userName}</p>
            <p class="text-xs text-[var(--color-text-secondary)] truncate">{userEmail}</p>
          </div>
        </div>
        <form action="/auth/logout?next=/" method="POST">
          <button 
            type="submit"
            class="btn-ghost w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/30"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <!-- Mobile Header -->
      <header class="lg:hidden glass-strong h-16 flex items-center justify-between px-4 z-30 sticky top-0">
        <div class="flex items-center gap-3">
          <button 
            class="p-2 -ml-2 rounded-lg hover:bg-[var(--color-card)] text-[var(--color-text-primary)]"
            onclick={() => mobileMenuOpen = true}
          >
            <Menu size={24} />
          </button>
          <span class="font-display font-bold text-lg text-[var(--color-brand)]">Staff Portal</span>
        </div>
        {#if $pendingWaiterCount > 0}
          <div class="relative">
            <Bell size={24} class="text-[var(--color-brand)]" />
            <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {$pendingWaiterCount}
            </span>
          </div>
        {/if}
      </header>

      <main class="flex-1 overflow-y-auto animate-fade-in p-4 md:p-6 lg:p-8">
        {@render children()}
      </main>
    </div>
  </div>
{/if}
