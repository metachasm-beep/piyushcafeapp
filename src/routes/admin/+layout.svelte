<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { adminUser, pendingWaiterCount } from '$lib/stores/admin';
  import { LayoutDashboard, ChefHat, UtensilsCrossed, QrCode, LogOut, Menu, X, Bell, Settings } from '@lucide/svelte';

  let { children } = $props();
  let mobileMenuOpen = $state(false);

  function handleLogout() {
    adminUser.logout();
    goto('/admin/login');
  }

  let currentPath = $derived(page.url.pathname);
  
  // Do not show sidebar on login page
  let isLoginPage = $derived(currentPath === '/admin/login');
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
      <div class="p-6 flex flex-col items-center border-b border-[var(--color-border)]">
        <div class="text-4xl mb-2">🍴</div>
        <h1 class="font-display text-xl font-bold text-[var(--color-brand)]">The Golden Fork</h1>
        <p class="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider mt-1">Staff Portal</p>
      </div>

      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        <a 
          href="/admin" 
          class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/admin' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
          onclick={() => mobileMenuOpen = false}
        >
          <LayoutDashboard size={20} />
          <span class="font-medium">Dashboard</span>
        </a>
        <a 
          href="/admin/kitchen" 
          class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/admin/kitchen' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
          onclick={() => mobileMenuOpen = false}
        >
          <ChefHat size={20} />
          <span class="font-medium">Kitchen Display</span>
        </a>
        <a 
          href="/admin/menu" 
          class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/admin/menu' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
          onclick={() => mobileMenuOpen = false}
        >
          <UtensilsCrossed size={20} />
          <span class="font-medium">Menu Manager</span>
        </a>
        <a 
          href="/admin/tables" 
          class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/admin/tables' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
          onclick={() => mobileMenuOpen = false}
        >
          <QrCode size={20} />
          <span class="font-medium">Tables & QR</span>
        </a>
        <a 
          href="/admin/settings" 
          class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {currentPath === '/admin/settings' ? 'bg-[var(--color-card)] text-[var(--color-brand)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-card)]'}"
          onclick={() => mobileMenuOpen = false}
        >
          <Settings size={20} />
          <span class="font-medium">Settings</span>
        </a>
      </nav>

      <div class="p-4 border-t border-[var(--color-border)]">
        <div class="flex items-center gap-3 mb-4 px-2">
          <div class="w-10 h-10 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center">
            <span class="font-bold text-[var(--color-brand)]">{$adminUser?.email?.charAt(0).toUpperCase() || 'A'}</span>
          </div>
          <div class="overflow-hidden">
            <p class="text-sm font-medium truncate">{$adminUser?.email?.split('@')[0] || 'Admin'}</p>
            <p class="text-xs text-[var(--color-text-secondary)] truncate">{$adminUser?.email || 'admin@example.com'}</p>
          </div>
        </div>
        <button 
          class="btn-ghost w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/30"
          onclick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
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
