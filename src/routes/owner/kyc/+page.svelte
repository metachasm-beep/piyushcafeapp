<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { adminUser } from '$lib/stores/admin';
  import { CheckCircle } from 'lucide-svelte';

  let email = $state('');
  let phone = $state('');
  let businessName = $state('');
  let panNumber = $state('');
  
  let isSubmitting = $state(false);
  let isVerified = $state(false);
  let accountId = $state('');

  async function submitKyc(e: Event) {
    e.preventDefault();
    isSubmitting = true;

    try {
      const res = await fetch('/api/razorpay/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: $adminUser?.restaurant_id,
          email,
          phone,
          business_name: businessName,
          pan_number: panNumber
        })
      });

      if (!res.ok) {
        throw new Error('Failed to submit onboarding details');
      }

      const data = await res.json();
      accountId = data.accountId;
      isVerified = true;
      toast.success('Onboarding Submitted! Your Razorpay Account ID has been generated.');
    } catch (e) {
      toast.error('Error submitting onboarding details');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Razorpay Onboarding - The Golden Fork</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div>
    <h1 class="text-2xl font-display font-bold text-[var(--color-text-primary)]">Razorpay Onboarding</h1>
    <p class="text-[var(--color-text-secondary)] mt-1">Complete your profile to enable split payments and receive payouts directly into your bank account.</p>
  </div>

  {#if isVerified}
    <div class="glass p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 border border-green-500/20 bg-green-500/5">
      <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
        <CheckCircle size={32} />
      </div>
      <h2 class="text-xl font-bold text-green-500">Account Linked</h2>
      <p class="text-center text-[var(--color-text-secondary)]">Your account is active. Funds from orders will be directly settled into your bank account.</p>
      <div class="px-4 py-2 mt-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg font-mono text-sm text-[var(--color-brand)]">
        Account ID: {accountId}
      </div>
    </div>
  {:else}
    <form class="glass p-6 rounded-2xl space-y-6" onsubmit={submitKyc}>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label for="businessName" class="text-sm font-medium text-[var(--color-text-secondary)]">Legal Business Name</label>
          <input 
            type="text" 
            id="businessName" 
            bind:value={businessName} 
            required 
            placeholder="The Golden Fork LLC" 
            class="input-dark w-full"
          />
        </div>

        <div class="space-y-2">
          <label for="email" class="text-sm font-medium text-[var(--color-text-secondary)]">Business Email</label>
          <input 
            type="email" 
            id="email" 
            bind:value={email} 
            required 
            placeholder="contact@restaurant.com" 
            class="input-dark w-full"
          />
        </div>

        <div class="space-y-2">
          <label for="phone" class="text-sm font-medium text-[var(--color-text-secondary)]">Phone Number</label>
          <input 
            type="text" 
            id="phone" 
            bind:value={phone} 
            required 
            placeholder="9876543210" 
            class="input-dark w-full"
            pattern="\d{10}"
            title="10 digit phone number"
          />
        </div>

        <div class="space-y-2">
          <label for="pan" class="text-sm font-medium text-[var(--color-text-secondary)]">PAN Number</label>
          <input 
            type="text" 
            id="pan" 
            bind:value={panNumber} 
            required 
            placeholder="ABCDE1234F" 
            class="input-dark w-full uppercase" 
            pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
          />
        </div>
      </div>

      <div class="pt-4 border-t border-[var(--color-border)]">
        <button 
          type="submit" 
          class="btn-brand w-full py-3 flex justify-center items-center" 
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          {:else}
            Submit Details & Link Account
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
