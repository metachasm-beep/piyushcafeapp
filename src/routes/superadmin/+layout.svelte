<script lang="ts">
  import { page } from '$app/state';
  import { LayoutDashboard, Store, UtensilsCrossed, QrCode, LogOut } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { adminUser } from '$lib/stores/admin';

  let { children } = $props();

  const links = [
    { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/superadmin/restaurants', label: 'Restaurants', icon: Store },
    { href: '/superadmin/menu', label: 'Menu Manager', icon: UtensilsCrossed },
    { href: '/superadmin/tables', label: 'Tables & QR', icon: QrCode },
  ];
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Geist+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
</svelte:head>

<style>
  :global(.sa-glass) {
    backdrop-filter: blur(24px) saturate(1.6);
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.75);
  }
  :global(.sa-tile) {
    backdrop-filter: blur(20px) saturate(1.5);
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(99, 102, 241, 0.06), 0 1px 2px rgba(99, 102, 241, 0.04);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  :global(.sa-tile:hover) {
    box-shadow: 0 8px 40px rgba(99, 102, 241, 0.12), 0 2px 6px rgba(99, 102, 241, 0.06);
    transform: translateY(-1px);
  }
  :global(.sa-input) {
    width: 100%;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.2);
    background: rgba(255, 255, 255, 0.7);
    font-family: 'Cabinet Grotesk', system-ui, sans-serif;
    font-size: 14px;
    color: #1e1b4b;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  :global(.sa-input:focus) {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
  :global(.sa-btn-primary) {
    padding: 10px 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-family: 'Cabinet Grotesk', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    transition: opacity 0.15s, transform 0.15s;
  }
  :global(.sa-btn-primary:hover) { opacity: 0.9; transform: translateY(-1px); }
  :global(.sa-btn-primary:disabled) { opacity: 0.5; cursor: not-allowed; transform: none; }
  :global(.sa-label) {
    display: block;
    font-size: 11px;
    font-family: 'Geist Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8b84c0;
    margin-bottom: 6px;
  }
  :global(.sa-page-header) {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
  }
  :global(.sa-page-title) {
    font-size: 32px;
    font-weight: 900;
    color: #1e1b4b;
    letter-spacing: -0.04em;
    line-height: 1.1;
  }
  :global(.sa-page-subtitle) {
    font-size: 13px;
    color: #8b84c0;
    margin-top: 4px;
    font-family: 'Geist Mono', monospace;
  }
  :global(.sa-badge-active) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 99px;
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
  :global(.sa-badge-inactive) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 99px;
    background: rgba(156, 163, 175, 0.1);
    color: #6b7280;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid rgba(156, 163, 175, 0.2);
  }
</style>

<!-- Spatial Glass Root -->
<div style="display:flex;height:100vh;overflow:hidden;background:linear-gradient(135deg,#e8e6f5 0%,#f0eeff 35%,#ede8ff 65%,#eaf0ff 100%);font-family:'Cabinet Grotesk',system-ui,sans-serif;">

  <!-- Ambient glow orbs -->
  <div aria-hidden="true" style="position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0;">
    <div style="position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%);top:-200px;left:-200px;filter:blur(40px);"></div>
    <div style="position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%);bottom:-100px;right:200px;filter:blur(60px);"></div>
    <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.10) 0%,transparent 70%);top:40%;right:-100px;filter:blur(50px);"></div>
  </div>

  <!-- Frosted Sidebar -->
  <aside class="sa-glass" style="width:256px;min-width:256px;height:100%;display:flex;flex-direction:column;position:relative;z-index:10;padding:28px 18px;border-right:1px solid rgba(99,102,241,0.1);box-shadow:4px 0 32px rgba(99,102,241,0.05);">

    <!-- Logo mark -->
    <div style="margin-bottom:32px;padding-bottom:22px;border-bottom:1px solid rgba(99,102,241,0.1);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(99,102,241,0.4);flex-shrink:0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
        </div>
        <div>
          <div style="font-size:15px;font-weight:800;color:#1e1b4b;letter-spacing:-0.03em;line-height:1.1;">Superadmin</div>
          <div style="font-size:10px;font-family:'Geist Mono',monospace;color:#8b84c0;letter-spacing:0.06em;text-transform:uppercase;">Console</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
        <div style="width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,0.7);animation:pulse 2s infinite;"></div>
        <span style="font-size:10px;font-family:'Geist Mono',monospace;color:#6d6a9c;letter-spacing:0.06em;">NETWORK LIVE</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav style="flex:1;display:flex;flex-direction:column;gap:3px;">
      {#each links as link}
        {@const active = page.url.pathname === link.href}
        <a
          href={link.href}
          style="display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:13px;text-decoration:none;font-size:14px;font-weight:{active?700:500};color:{active?'#4338ca':'#6b6a9c'};background:{active?'linear-gradient(135deg,rgba(99,102,241,0.13),rgba(139,92,246,0.07))':'transparent'};border:1px solid {active?'rgba(99,102,241,0.2)':'transparent'};box-shadow:{active?'0 2px 10px rgba(99,102,241,0.1)':'none'};transition:all 0.15s ease;"
        >
          <span style="color:{active?'#6366f1':'#a5b4fc'};flex-shrink:0;">
            <link.icon size={17} strokeWidth={active ? 2.5 : 1.8} />
          </span>
          {link.label}
        </a>
      {/each}
    </nav>

    <!-- Bottom: sign out -->
    <div style="padding-top:20px;border-top:1px solid rgba(99,102,241,0.1);">
      <button
        style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 13px;border-radius:13px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:500;color:#9ca3af;transition:all 0.15s;font-family:'Cabinet Grotesk',system-ui,sans-serif;text-align:left;"
        onclick={() => { adminUser.logout(); goto('/admin/login'); }}
        onmouseenter={(e) => {e.currentTarget.style.color='#ef4444';e.currentTarget.style.background='rgba(239,68,68,0.07)';}}
        onmouseleave={(e) => {e.currentTarget.style.color='#9ca3af';e.currentTarget.style.background='none';}}
      >
        <LogOut size={16} strokeWidth={1.8} />
        Sign Out
      </button>
    </div>
  </aside>

  <!-- Main -->
  <main style="flex:1;height:100%;overflow-y:auto;position:relative;z-index:5;padding:32px 36px 48px;">
    {@render children()}
  </main>
</div>
