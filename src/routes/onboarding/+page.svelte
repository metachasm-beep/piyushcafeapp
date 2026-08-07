<script lang="ts">
  import { enhance } from '$app/forms';
  import { Store, Loader2 } from 'lucide-svelte';
  
  let isSubmitting = $state(false);
</script>

<svelte:head>
  <title>Welcome | Piyush Cafe Platform</title>
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
        <Store size={40} />
      </div>
      <div>
        <h1 class="text-3xl font-display text-white mb-2">Welcome!</h1>
        <p class="text-sm text-[var(--color-text-secondary)]">Let's get your restaurant set up</p>
      </div>
    </div>

    <form 
      method="POST" 
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          isSubmitting = false;
          await update();
        };
      }}
      class="space-y-6"
    >
      <div class="space-y-2">
        <label for="restaurant_name" class="text-sm font-medium text-white/90">What is the name of your restaurant?</label>
        <input 
          type="text" 
          id="restaurant_name" 
          name="restaurant_name" 
          required 
          placeholder="e.g. The Golden Fork"
          class="flex h-12 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        class="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[var(--color-brand)] text-white font-semibold hover:bg-[var(--color-brand)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if isSubmitting}
          <Loader2 size={20} class="animate-spin" />
          Saving...
        {:else}
          Continue
        {/if}
      </button>
    </form>
    
    <div class="mt-8 text-center">
      <p class="text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        Secure Setup
      </p>
    </div>
  </div>
</div>
