<script lang="ts">
  import { goto } from '$app/navigation';
  import { adminUser } from '$lib/stores/admin';
  import { supabase } from '$lib/supabase';
  import { MOCK_RESTAURANT } from '$lib/mock-data';
  import { toast } from 'svelte-sonner';
  import '$lib/styles/spatial-glass.css';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let googleLoading = $state(false);
  let errorMsg = $state('');

  const googleEnabled = !!supabase;

  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    errorMsg = '';

    if (!email.trim() || !password.trim()) {
      errorMsg = 'Email and password are required.';
      loading = false;
      return;
    }

    const { error } = await adminUser.loginWithPassword(email.trim(), password);
    loading = false;

    if (error) {
      errorMsg = error;
      toast.error(error);
      return;
    }

    toast.success('Welcome back');
    goto('/owner');
  }

  async function handleGoogleSignIn() {
    googleLoading = true;
    errorMsg = '';

    const redirectTo = `${window.location.origin}/owner/auth/callback`;
    const { error } = await adminUser.loginWithGoogle(redirectTo);

    if (error) {
      errorMsg = error;
      toast.error(error);
      googleLoading = false;
    }
    // On success the browser navigates away to Google
  }
</script>

<svelte:head>
  <title>Owner Login · Restaurant Portal</title>
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
      <p class="sg-page-subtitle" style="margin-top:6px;">Owner portal</p>
    </div>

    {#if errorMsg}
      <div
        style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#dc2626;padding:12px 14px;border-radius:12px;margin-bottom:20px;font-size:13px;"
      >
        {errorMsg}
      </div>
    {/if}

    <!-- Google OAuth -->
    <button
      type="button"
      class="sg-btn-ghost"
      style="width:100%;padding:12px 16px;margin-bottom:18px;font-size:14px;font-weight:700;gap:10px;background:rgba(255,255,255,0.85);border:1px solid rgba(99,102,241,0.2);color:#1e1b4b;"
      disabled={googleLoading || !googleEnabled}
      onclick={handleGoogleSignIn}
    >
      {#if googleLoading}
        Signing in with Google…
      {:else}
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
        Continue with Google
      {/if}
    </button>

    {#if !googleEnabled}
      <p style="font-size:11px;font-family:'Geist Mono',monospace;color:#8b84c0;text-align:center;margin:-8px 0 16px;">
        Google sign-in needs Supabase env vars
      </p>
    {/if}

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
      <div style="flex:1;height:1px;background:rgba(99,102,241,0.15);"></div>
      <span style="font-size:10px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;color:#8b84c0;">or email</span>
      <div style="flex:1;height:1px;background:rgba(99,102,241,0.15);"></div>
    </div>

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
          autocomplete="username"
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
          autocomplete="current-password"
        />
      </div>

      <button type="submit" disabled={loading || googleLoading} class="sg-btn-primary" style="width:100%;margin-top:8px;padding:12px 20px;">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>

    <p style="margin-top:20px;text-align:center;font-size:11px;font-family:'Geist Mono',monospace;color:#8b84c0;line-height:1.5;">
      {#if googleEnabled}
        Use Google or the email provisioned for your restaurant
      {:else}
        Demo mode: any email + password (no Supabase)
      {/if}
    </p>
  </div>
</div>
