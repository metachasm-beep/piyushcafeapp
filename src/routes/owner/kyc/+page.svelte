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

<div class="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
  <div>
    <h1 class="text-2xl font-bold tracking-tight text-zinc-950">Razorpay Onboarding</h1>
    <p class="text-sm text-zinc-500 mt-1">Complete your profile to enable split payments and receive payouts directly into your bank account.</p>
  </div>

  {#if isVerified}
    <div class="bg-emerald-50 p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 border border-emerald-100 shadow-sm">
      <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
        <CheckCircle size={32} />
      </div>
      <h2 class="text-xl font-bold text-emerald-700">Account Linked</h2>
      <p class="text-center text-emerald-600/80 font-medium">Your account is active. Funds from orders will be directly settled into your bank account.</p>
      <div class="px-4 py-2 mt-4 bg-white border border-emerald-200 rounded-lg font-mono text-sm text-emerald-700 shadow-sm font-bold">
        Account ID: {accountId}
      </div>
    </div>
  {:else}
    <form class="bg-white border border-zinc-200 p-6 md:p-8 rounded-2xl space-y-6 shadow-sm" onsubmit={submitKyc}>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-1.5">
          <label for="businessName" class="text-sm font-medium text-zinc-700">Legal Business Name</label>
          <input 
            type="text" 
            id="businessName" 
            bind:value={businessName} 
            required 
            placeholder="The Golden Fork LLC" 
            class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
          />
        </div>

        <div class="space-y-1.5">
          <label for="email" class="text-sm font-medium text-zinc-700">Business Email</label>
          <input 
            type="email" 
            id="email" 
            bind:value={email} 
            required 
            placeholder="contact@restaurant.com" 
            class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
          />
        </div>

        <div class="space-y-1.5">
          <label for="phone" class="text-sm font-medium text-zinc-700">Phone Number</label>
          <input 
            type="text" 
            id="phone" 
            bind:value={phone} 
            required 
            placeholder="9876543210" 
            class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
            pattern="\d{10}"
            title="10 digit phone number"
          />
        </div>

        <div class="space-y-1.5">
          <label for="pan" class="text-sm font-medium text-zinc-700">PAN Number</label>
          <input 
            type="text" 
            id="pan" 
            bind:value={panNumber} 
            required 
            placeholder="ABCDE1234F" 
            class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all uppercase" 
            pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
          />
        </div>
      </div>

      <div class="pt-6 border-t border-zinc-100 mt-2">
        <button 
          type="submit" 
          class="w-full flex justify-center items-center py-2.5 px-4 rounded-lg font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm" 
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          {:else}
            Submit Details & Link Account
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
