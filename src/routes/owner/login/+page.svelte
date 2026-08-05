<script lang="ts">
  import { goto } from '$app/navigation';
  import { adminUser } from '$lib/stores/admin';
  import { MOCK_RESTAURANT } from '$lib/mock-data';
  import { toast } from 'svelte-sonner';
  import '$lib/styles/spatial-glass.css';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let errorMsg = $state('');

  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    errorMsg = '';

    // Demo template: accept any email + password123 (or any non-empty password for local demo)
    await new Promise((r) => setTimeout(r, 400));

    if (!email.trim() || !password.trim()) {
      errorMsg = 'Email and password are required.';
      loading = false;
      return;
    }

    // Mock auth for demo — restaurant-specific auth lands after design intake
    adminUser.login(email.trim());
    toast.success('Welcome back');
    loading = false;
    goto('/owner');
  }
</script>

<svelte:head>
  <title>Owner Login · Demo Template</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Geist+Mono:wght@300;400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="sg-shell" style="display:flex;align-items:center;justify-content:center;padding:24px;min-height:100dvh;">
  <div class="sg-orbs" aria-hidden="true">
    <div class="sg-orb" style="width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%);top:-150px;left:50%;transform:translateX(-50%);"></div>
    <div class="sg-orb" style="width:400px;height:400px;background:radial-gradient(circle,rgba(139,92,246,0.14) 0%,transparent 70%);bottom:-80px;right:-60px;filter:blur(50px);"></div>
  </div>

  <div class="sg-tile sg-tile-static" style="width:100%;max-w:420px;padding:40px 36px;position:relative;z-index:1;">
    <div style="text-align:center;margin-bottom:28px;">
      <div
        style="width:48px;height:48px;margin:0 auto 16px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(99,102,241,0.4);"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
      </div>
      <h1 style="font-size:26px;font-weight:900;letter-spacing:-0.04em;color:#1e1b4b;margin:0;">
        {MOCK_RESTAURANT.name}
      </h1>
      <p class="sg-page-subtitle" style="margin-top:6px;">Owner portal · demo template</p>
    </div>

    <div class="sg-demo-banner" style="margin-bottom:24px;justify-content:center;">
      Branding customised after design intake
    </div>

    {#if errorMsg}
      <div
        style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#dc2626;padding:12px 14px;border-radius:12px;margin-bottom:20px;font-size:13px;"
      >
        {errorMsg}
      </div>
    {/if}

    <form onsubmit={handleLogin} style="display:flex;flex-direction:column;gap:16px;">
      <div>
        <label for="email" class="sg-label">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          class="sg-input"
          placeholder="owner@restaurant.com"
        />
      </div>

      <div>
        <label for="password" class="sg-label">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          class="sg-input"
          placeholder="••••••••"
        />
      </div>

      <button type="submit" disabled={loading} class="sg-btn-primary" style="width:100%;margin-top:8px;padding:12px 20px;">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>

    <p style="margin-top:20px;text-align:center;font-size:11px;font-family:'Geist Mono',monospace;color:#8b84c0;">
      Demo: any email + any password
    </p>
  </div>
</div>
