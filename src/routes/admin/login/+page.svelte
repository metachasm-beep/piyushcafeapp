<script lang="ts">
  import { goto } from '$app/navigation';
  import { adminUser } from '$lib/stores/admin';
  import { toast } from 'svelte-sonner';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000));
    
    if (password === 'password123' && email.trim() !== '') {
      adminUser.login(email);
      toast.success('Logged in successfully');
      goto('/admin');
    } else {
      error = 'Invalid credentials. Hint: password is password123';
      toast.error('Login failed');
    }
    
    loading = false;
  }
</script>

<div class="min-h-screen bg-[var(--color-bg)] flex items-center justify-center relative overflow-hidden px-4">
  <!-- Decorative background -->
  <div class="absolute inset-0 z-0">
    <!-- Food photography style overlay effect -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a110a] via-[#0c0c0c] to-[#0c0c0c] z-10"></div>
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-[var(--color-brand)]/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>
  </div>

  <div class="glass p-8 md:p-10 rounded-2xl w-full max-w-md z-20 animate-slide-up shadow-2xl border border-[var(--color-border)] relative">
    <div class="text-center mb-8">
      <div class="text-6xl mb-4 animate-bounce-in">🍴</div>
      <h1 class="font-display text-3xl font-bold text-[var(--color-brand)] tracking-wide">The Golden Fork</h1>
      <p class="text-[var(--color-text-secondary)] mt-2 uppercase tracking-widest text-sm font-semibold">Staff Portal</p>
    </div>

    <form onsubmit={handleLogin} class="space-y-5">
      {#if error}
        <div class="bg-red-950/50 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-4 animate-fade-in text-center">
          {error}
        </div>
      {/if}

      <div class="space-y-1">
        <label for="email" class="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Email</label>
        <input 
          type="email" 
          id="email" 
          bind:value={email} 
          required
          placeholder="admin@example.com"
          class="input-dark w-full"
          disabled={loading}
        />
      </div>

      <div class="space-y-1">
        <label for="password" class="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Password</label>
        <input 
          type="password" 
          id="password" 
          bind:value={password} 
          required
          placeholder="••••••••"
          class="input-dark w-full"
          disabled={loading}
        />
      </div>

      <button 
        type="submit" 
        class="btn-brand w-full py-3 mt-4 text-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all"
        disabled={loading}
      >
        {#if loading}
          <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        {:else}
          Sign In
        {/if}
      </button>
    </form>
    
    <div class="mt-8 text-center text-xs text-[var(--color-text-secondary)]/50">
      <p>Secure Staff Access Only</p>
    </div>
  </div>
</div>
