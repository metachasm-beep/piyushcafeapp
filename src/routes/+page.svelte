<script lang="ts">
  import { page } from '$app/state';
  import { Shield, LockKeyhole } from 'lucide-svelte';
  import { env } from '$env/dynamic/public';
  
  let isLoading = $state(false);
  let errorMessage = $derived(page.url.searchParams.get('error'));

  import { onMount } from 'svelte';

  async function handleGoogleLogin() {
    isLoading = true;
    
    try {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        env.PUBLIC_SUPABASE_URL || '',
        env.PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (e) {
      console.error(e);
      alert('Failed to initialize Google Login');
      isLoading = false;
    }
  }

  async function handleDemoLogin() {
    isLoading = true;
    
    try {
      // Ensure the test account has the password set to password123
      await fetch('/api/demo-login', { method: 'POST' });

      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        env.PUBLIC_SUPABASE_URL || '',
        env.PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { error } = await supabase.auth.signInWithPassword({
        email: 'paullovessoccer@gmail.com',
        password: 'password123'
      });

      if (error) {
        throw error;
      }
      
      // Successfully logged in, let's navigate to the owner dashboard
      window.location.href = '/owner';
    } catch (e) {
      console.error(e);
      alert('Failed to login to demo account. Please ensure the test account has password123 set.');
      isLoading = false;
    }
  }

  onMount(async () => {
    // If the user was kicked back to the login page due to lack of approval,
    // ensure their client-side session is completely purged so they don't appear "logged in"
    if (errorMessage === 'pending_approval' || errorMessage === 'unauthorized') {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        env.PUBLIC_SUPABASE_URL || '',
        env.PUBLIC_SUPABASE_ANON_KEY || ''
      );
      await supabase.auth.signOut();
    }
  });
</script>

<svelte:head>
  <title>Login | Piyush Cafe Platform</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-white font-sans p-4 relative overflow-hidden">
  
  <!-- Decorative background glow -->
  <div class="absolute inset-0 pointer-events-none opacity-20">
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-brand)] rounded-full blur-[120px]"></div>
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900 rounded-full blur-[120px]"></div>
  </div>

  <div class="w-full max-w-md p-8 rounded-3xl glass-strong border border-white/10 relative z-10 animate-slide-up">
    <div class="flex flex-col items-center justify-center text-center space-y-4 mb-8">
      <div class="w-20 h-20 rounded-2xl bg-[var(--color-brand)]/10 flex items-center justify-center border border-[var(--color-brand)]/30 text-[var(--color-brand)] shadow-[0_0_30px_rgba(249,115,22,0.2)]">
        <Shield size={40} />
      </div>
      <div>
        <h1 class="text-3xl font-display text-white mb-2">Platform Access</h1>
        <p class="text-sm text-[var(--color-text-secondary)]">Secure login for Superadmin & Owners</p>
      </div>
    </div>

    {#if errorMessage}
      <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
        <LockKeyhole size={18} class="shrink-0" />
        {#if errorMessage === 'pending_approval'}
          <span>Your account is pending approval by the Superadmin. Please wait for access to be granted.</span>
        {:else if errorMessage === 'unauthorized'}
          <span>Access Denied. You are not authorized to access this system.</span>
        {:else}
          <span>Authentication failed. Please try again.</span>
        {/if}
      </div>
    {/if}

    <button
      onclick={handleGoogleLogin}
      disabled={isLoading}
      class="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isLoading}
        <div class="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
      {:else}
        <svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      {/if}
    </button>
    
    <button
      onclick={handleDemoLogin}
      disabled={isLoading}
      class="mt-4 w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isLoading}
        <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      {:else}
        <Shield size={20} class="text-green-400" />
        Demo Login (Owner)
      {/if}
    </button>
    
    <div class="mt-8 text-center">
      <p class="text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        End-to-End Encrypted Session
      </p>
    </div>
  </div>
</div>
