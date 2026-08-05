<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { adminUser } from '$lib/stores/admin';
  import '$lib/styles/spatial-glass.css';

  let status = $state('Completing Google sign-in…');
  let errorMsg = $state('');

  onMount(async () => {
    const params = page.url.searchParams;
    const code = params.get('code');
    const oauthError = params.get('error_description') || params.get('error');

    if (oauthError) {
      errorMsg = oauthError;
      status = 'Sign-in failed';
      return;
    }

    if (!supabase) {
      errorMsg = 'Supabase is not configured.';
      status = 'Sign-in failed';
      return;
    }

    try {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else {
        // Hash-based / already-detected session
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          throw new Error('No auth session returned from Google. Try signing in again.');
        }
      }

      await adminUser.init();
      status = 'Signed in — redirecting…';
      goto('/owner', { replaceState: true });
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Could not complete Google sign-in.';
      status = 'Sign-in failed';
    }
  });
</script>

<svelte:head>
  <title>Signing in… · Owner Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Geist+Mono:wght@300;400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="sg-shell" style="display:flex;align-items:center;justify-content:center;padding:24px;min-height:100dvh;">
  <div class="sg-orbs" aria-hidden="true">
    <div class="sg-orb" style="width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%);top:-120px;left:50%;transform:translateX(-50%);"></div>
  </div>

  <div class="sg-tile sg-tile-static" style="width:100%;max-width:400px;padding:36px 32px;text-align:center;position:relative;z-index:1;">
    {#if !errorMsg}
      <div
        style="width:36px;height:36px;margin:0 auto 18px;border:3px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;"
      ></div>
    {/if}
    <p style="font-size:16px;font-weight:800;color:#1e1b4b;margin:0 0 8px;letter-spacing:-0.02em;">{status}</p>
    {#if errorMsg}
      <p style="font-size:13px;color:#dc2626;margin:0 0 20px;">{errorMsg}</p>
      <a href="/owner/login" class="sg-btn-primary" style="text-decoration:none;">Back to login</a>
    {:else}
      <p style="font-size:12px;font-family:'Geist Mono',monospace;color:#8b84c0;margin:0;">Exchanging Google credentials</p>
    {/if}
  </div>
</div>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
