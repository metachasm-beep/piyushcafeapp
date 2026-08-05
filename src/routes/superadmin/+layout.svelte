<script lang="ts">
  import '$lib/styles/superadmin.css';
  import { page } from '$app/state';
  import {
    LayoutDashboard,
    Store,
    UtensilsCrossed,
    QrCode,
    LogOut,
    Menu,
    X,
    LayoutGrid,
    Rows3
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { adminUser } from '$lib/stores/admin';
  import {
    saDensity,
    saRestaurantId,
    saRestaurants,
    setSaDensity,
    setSaRestaurantId,
    type SaDensity
  } from '$lib/stores/saContext';
  import type { LayoutData } from './$types';

  let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

  const links = [
    { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/superadmin/restaurants', label: 'Restaurants', icon: Store },
    { href: '/superadmin/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/superadmin/tables', label: 'Tables & QR', icon: QrCode },
  ];

  let sidebarOpen = $state(false);
  let density = $state<SaDensity>('card');
  let restaurantId = $state<string | null>(null);

  $effect(() => {
    saRestaurants.set(data.restaurants);
  });

  $effect(() => {
    const unsubD = saDensity.subscribe((v) => (density = v));
    const unsubR = saRestaurantId.subscribe((v) => (restaurantId = v));
    return () => {
      unsubD();
      unsubR();
    };
  });

  $effect(() => {
    const list = data.restaurants;
    if (!list.length) return;
    const exists = restaurantId && list.some((r) => r.id === restaurantId);
    if (!exists) setSaRestaurantId(list[0].id);
  });

  function isActive(href: string) {
    if (href === '/superadmin') return page.url.pathname === href;
    return page.url.pathname.startsWith(href);
  }

  function closeSidebar() {
    sidebarOpen = false;
  }

  // Honest network status from restaurant count (demo telemetry placeholder)
  const nodeCount = $derived(data.restaurants.length);
  const statusLabel = $derived(
    data.loadError ? 'DATA DEGRADED' : nodeCount > 0 ? `${nodeCount} NODE${nodeCount === 1 ? '' : 'S'}` : 'NO NODES'
  );
  const statusOk = $derived(!data.loadError && nodeCount > 0);
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Geist+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
</svelte:head>

<div
  class="sa-shell"
  data-density={density}
  data-sidebar={sidebarOpen ? 'open' : 'closed'}
  style="display:flex;height:100vh;overflow:hidden;position:relative;"
>
  <div aria-hidden="true" style="position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0;">
    <div style="position:absolute;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(15,118,110,0.12) 0%,transparent 70%);top:-180px;left:-160px;filter:blur(40px);"></div>
    <div style="position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(2,132,199,0.08) 0%,transparent 70%);bottom:-80px;right:120px;filter:blur(50px);"></div>
  </div>

  <button type="button" class="sa-sidebar-backdrop" aria-label="Close menu" onclick={closeSidebar}></button>

  <aside class="sa-glass sa-sidebar">
    <div style="margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid var(--sa-line);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:34px;height:34px;border-radius:var(--sa-radius-sm);background:linear-gradient(135deg,var(--sa-accent),var(--sa-accent-strong));display:flex;align-items:center;justify-content:center;box-shadow:var(--sa-shadow-accent);flex-shrink:0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          </div>
          <div>
            <div style="font-size:15px;font-weight:800;color:var(--sa-ink);letter-spacing:-0.03em;line-height:1.1;">Superadmin</div>
            <div style="font-size:10px;font-family:var(--sa-mono);color:var(--sa-muted);letter-spacing:0.06em;text-transform:uppercase;">Console</div>
          </div>
        </div>
        <button type="button" class="sa-btn-icon sa-sidebar-close" aria-label="Close sidebar" onclick={closeSidebar}>
          <X size={16} />
        </button>
      </div>

      <div style="display:flex;align-items:center;gap:6px;margin-bottom:14px;">
        <div
          style="width:6px;height:6px;border-radius:50%;background:{statusOk ? 'var(--sa-ok)' : 'var(--sa-warn)'};box-shadow:0 0 8px {statusOk ? 'rgba(22,163,74,0.55)' : 'rgba(217,119,6,0.55)'};"
        ></div>
        <span style="font-size:10px;font-family:var(--sa-mono);color:var(--sa-muted);letter-spacing:0.05em;">{statusLabel}</span>
      </div>

      <label class="sa-label" for="sa-node-switcher">Restaurant scope</label>
      <select
        id="sa-node-switcher"
        class="sa-input"
        style="font-size:13px;padding:8px 12px;min-height:40px;"
        value={restaurantId ?? ''}
        onchange={(e) => setSaRestaurantId((e.currentTarget as HTMLSelectElement).value || null)}
      >
        {#each data.restaurants as r}
          <option value={r.id}>{r.name}</option>
        {/each}
      </select>
    </div>

    <nav style="flex:1;display:flex;flex-direction:column;gap:3px;" aria-label="Superadmin">
      {#each links as link}
        {@const active = isActive(link.href)}
        <a
          href={link.href}
          class="sa-nav-link"
          class:is-active={active}
          onclick={closeSidebar}
        >
          <span style="color:{active ? 'var(--sa-accent)' : 'var(--sa-faint)'};flex-shrink:0;">
            <link.icon size={17} strokeWidth={active ? 2.5 : 1.8} />
          </span>
          {link.label}
        </a>
      {/each}
    </nav>

    <div style="padding-top:16px;border-top:1px solid var(--sa-line);display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;gap:6px;" role="group" aria-label="Density">
        <button
          type="button"
          class="sa-btn-secondary"
          style="flex:1;min-height:40px;padding:8px;gap:6px;font-size:12px;{density === 'card' ? 'border-color:var(--sa-accent-line);color:var(--sa-accent);background:var(--sa-accent-soft);' : ''}"
          aria-pressed={density === 'card'}
          onclick={() => setSaDensity('card')}
        >
          <LayoutGrid size={14} /> Cards
        </button>
        <button
          type="button"
          class="sa-btn-secondary"
          style="flex:1;min-height:40px;padding:8px;gap:6px;font-size:12px;{density === 'compact' ? 'border-color:var(--sa-accent-line);color:var(--sa-accent);background:var(--sa-accent-soft);' : ''}"
          aria-pressed={density === 'compact'}
          onclick={() => setSaDensity('compact')}
        >
          <Rows3 size={14} /> Compact
        </button>
      </div>

      <button
        type="button"
        class="sa-btn-ghost"
        style="width:100%;justify-content:flex-start;"
        onclick={async () => {
          await adminUser.logout();
          goto('/owner/login');
        }}
      >
        <LogOut size={16} strokeWidth={1.8} />
        Sign out
      </button>
    </div>
  </aside>

  <div style="flex:1;display:flex;flex-direction:column;min-width:0;height:100%;position:relative;z-index:5;">
    <div class="sa-glass sa-mobile-bar">
      <button type="button" class="sa-btn-icon" aria-label="Open menu" onclick={() => (sidebarOpen = true)}>
        <Menu size={18} />
      </button>
      <div style="font-size:14px;font-weight:800;color:var(--sa-ink);letter-spacing:-0.02em;">Superadmin</div>
      <div style="width:var(--sa-hit);"></div>
    </div>
    <main class="sa-main">
      {@render children()}
    </main>
  </div>
</div>

<style>
  .sa-sidebar-close {
    display: none;
  }
  @media (max-width: 900px) {
    .sa-sidebar-close {
      display: inline-flex;
    }
  }
</style>
