<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { adminUser, pendingWaiterCount } from '$lib/stores/admin';
  import { MOCK_RESTAURANT } from '$lib/mock-data';
  import {
    LayoutDashboard,
    ChefHat,
    UtensilsCrossed,
    LogOut,
    Menu,
    Bell
  } from '@lucide/svelte';
  import '$lib/styles/spatial-glass.css';

  let { children } = $props();
  let mobileMenuOpen = $state(false);

  function handleLogout() {
    adminUser.logout();
    goto('/owner/login');
  }

  let currentPath = $derived(page.url.pathname);
  let isLoginPage = $derived(currentPath === '/owner/login');

  const links = [
    { href: '/owner', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/owner/kitchen', label: 'Kitchen Display', icon: ChefHat },
    { href: '/owner/inventory', label: 'Inventory', icon: UtensilsCrossed }
  ];
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Geist+Mono:wght@300;400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

{#if isLoginPage}
  {@render children()}
{:else}
  <div class="sg-shell" style="display:flex;height:100dvh;overflow:hidden;">
    <!-- Ambient glow orbs -->
    <div class="sg-orbs" aria-hidden="true">
      <div class="sg-orb" style="width:700px;height:700px;background:radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%);top:-200px;left:-200px;"></div>
      <div class="sg-orb" style="width:500px;height:500px;background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%);bottom:-100px;right:200px;filter:blur(60px);"></div>
      <div class="sg-orb" style="width:400px;height:400px;background:radial-gradient(circle,rgba(167,139,250,0.10) 0%,transparent 70%);top:40%;right:-100px;filter:blur(50px);"></div>
    </div>

    <!-- Mobile overlay -->
    {#if mobileMenuOpen}
      <button
        type="button"
        aria-label="Close menu"
        class="ow-mobile-overlay"
        style="position:fixed;inset:0;background:rgba(30,27,75,0.35);backdrop-filter:blur(4px);z-index:40;border:none;cursor:pointer;"
        onclick={() => (mobileMenuOpen = false)}
      ></button>
    {/if}

    <!-- Frosted Sidebar -->
    <aside
      class="sg-glass ow-sidebar"
      class:ow-sidebar-open={mobileMenuOpen}
      style="width:256px;min-width:256px;height:100%;display:flex;flex-direction:column;padding:28px 18px;border-right:1px solid rgba(99,102,241,0.1);box-shadow:4px 0 32px rgba(99,102,241,0.05);"
    >
      <!-- Logo / restaurant mark -->
      <div style="margin-bottom:28px;padding-bottom:22px;border-bottom:1px solid rgba(99,102,241,0.1);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div
            style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(99,102,241,0.4);flex-shrink:0;"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
          <div>
            <div style="font-size:15px;font-weight:800;color:#1e1b4b;letter-spacing:-0.03em;line-height:1.1;">
              {MOCK_RESTAURANT.name}
            </div>
            <div style="font-size:10px;font-family:'Geist Mono',monospace;color:#8b84c0;letter-spacing:0.06em;text-transform:uppercase;">
              Owner Portal
            </div>
          </div>
        </div>
        <div class="sg-demo-banner">
          <span style="width:6px;height:6px;border-radius:50%;background:#6366f1;flex-shrink:0;" class="sg-pulse"></span>
          Demo template
        </div>
      </div>

      <nav style="flex:1;display:flex;flex-direction:column;gap:3px;">
        {#each links as link}
          {@const active = currentPath === link.href}
          <a
            href={link.href}
            onclick={() => (mobileMenuOpen = false)}
            style="display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:13px;text-decoration:none;font-size:14px;font-weight:{active
              ? 700
              : 500};color:{active ? '#4338ca' : '#6b6a9c'};background:{active
              ? 'linear-gradient(135deg,rgba(99,102,241,0.13),rgba(139,92,246,0.07))'
              : 'transparent'};border:1px solid {active
              ? 'rgba(99,102,241,0.2)'
              : 'transparent'};box-shadow:{active
              ? '0 2px 10px rgba(99,102,241,0.1)'
              : 'none'};transition:all 0.15s ease;"
          >
            <span style="color:{active ? '#6366f1' : '#a5b4fc'};flex-shrink:0;">
              <link.icon size={17} strokeWidth={active ? 2.5 : 1.8} />
            </span>
            {link.label}
          </a>
        {/each}
      </nav>

      <div style="padding-top:20px;border-top:1px solid rgba(99,102,241,0.1);">
        <div style="display:flex;align-items:center;gap:10px;padding:0 4px 14px;">
          <div
            style="width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1));border:1px solid rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-weight:800;color:#6366f1;font-size:14px;"
          >
            {$adminUser?.email?.charAt(0).toUpperCase() || 'O'}
          </div>
          <div style="min-width:0;">
            <div style="font-size:13px;font-weight:700;color:#1e1b4b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              {$adminUser?.email?.split('@')[0] || 'Owner'}
            </div>
            <div style="font-size:10px;font-family:'Geist Mono',monospace;color:#8b84c0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              {$adminUser?.email || 'owner@demo.com'}
            </div>
          </div>
        </div>
        <button
          type="button"
          style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 13px;border-radius:13px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:500;color:#9ca3af;font-family:'Cabinet Grotesk',system-ui,sans-serif;text-align:left;transition:all 0.15s;"
          onclick={handleLogout}
          onmouseenter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.background = 'rgba(239,68,68,0.07)';
          }}
          onmouseleave={(e) => {
            e.currentTarget.style.color = '#9ca3af';
            e.currentTarget.style.background = 'none';
          }}
        >
          <LogOut size={16} strokeWidth={1.8} />
          Sign Out
        </button>
      </div>
    </aside>

    <!-- Main column -->
    <div class="ow-main" style="flex:1;display:flex;flex-direction:column;min-width:0;height:100%;position:relative;z-index:5;">
      <!-- Mobile header -->
      <header
        class="sg-glass ow-mobile-header"
        style="height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;position:sticky;top:0;z-index:30;border-bottom:1px solid rgba(99,102,241,0.1);"
      >
        <div style="display:flex;align-items:center;gap:10px;">
          <button
            type="button"
            style="padding:8px;border-radius:10px;border:none;background:rgba(99,102,241,0.08);color:#4338ca;cursor:pointer;display:flex;"
            onclick={() => (mobileMenuOpen = true)}
          >
            <Menu size={20} />
          </button>
          <span style="font-weight:800;font-size:15px;color:#1e1b4b;letter-spacing:-0.02em;">Owner Portal</span>
        </div>
        {#if $pendingWaiterCount > 0}
          <div style="position:relative;color:#6366f1;">
            <Bell size={22} />
            <span
              style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:#ef4444;color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;"
            >
              {$pendingWaiterCount}
            </span>
          </div>
        {/if}
      </header>

      <main class="ow-content" style="flex:1;overflow-y:auto;padding:24px 20px 48px;">
        {@render children()}
      </main>
    </div>
  </div>
{/if}

<style>
  .ow-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  .ow-sidebar.ow-sidebar-open {
    transform: translateX(0);
  }
  @media (min-width: 1024px) {
    .ow-sidebar {
      position: relative;
      transform: none;
    }
    .ow-sidebar.ow-sidebar-open {
      transform: none;
    }
    .ow-mobile-header,
    .ow-mobile-overlay {
      display: none !important;
    }
    .ow-content {
      padding: 32px 36px 48px !important;
    }
  }
</style>
