<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { adminUser } from '$lib/stores/admin';
  import { CheckCircle } from 'lucide-svelte';

  let panNumber = $state('');
  let aadharNumber = $state('');
  let accountNumber = $state('');
  let ifscCode = $state('');
  
  let isSubmitting = $state(false);
  let isVerified = $state(false);
  let subMerchantId = $state('');

  async function submitKyc(e: Event) {
    e.preventDefault();
    isSubmitting = true;

    try {
      const res = await fetch('/api/payu/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: $adminUser?.restaurant_id,
          pan_number: panNumber,
          aadhar_number: aadharNumber,
          account_number: accountNumber,
          ifsc_code: ifscCode
        })
      });

      if (!res.ok) {
        throw new Error('Failed to submit KYC details');
      }

      const data = await res.json();
      subMerchantId = data.subMerchantId;
      isVerified = true;
      toast.success('KYC Submitted Successfully! Your Sub-Merchant ID has been generated.');
    } catch (e) {
      toast.error('Error submitting KYC');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>PayU KYC - The Golden Fork</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div>
    <h1 class="text-2xl font-display font-bold text-[var(--color-text-primary)]">PayU Merchant Onboarding</h1>
    <p class="text-[var(--color-text-secondary)] mt-1">Complete your KYC to enable split payments and receive payouts directly into your bank account.</p>
  </div>

  {#if isVerified}
    <div class="glass p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 border border-green-500/20 bg-green-500/5">
      <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
        <CheckCircle size={32} />
      </div>
      <h2 class="text-xl font-bold text-green-500">KYC Verified</h2>
      <p class="text-center text-[var(--color-text-secondary)]">Your account is active. Funds from orders will be directly settled into your bank account.</p>
      <div class="px-4 py-2 mt-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg font-mono text-sm text-[var(--color-brand)]">
        Sub-Merchant ID: {subMerchantId}
      </div>
    </div>
  {:else}
    <form class="glass p-6 rounded-2xl space-y-6" onsubmit={submitKyc}>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        <div class="space-y-2">
          <label for="aadhar" class="text-sm font-medium text-[var(--color-text-secondary)]">Aadhar Number</label>
          <input 
            type="text" 
            id="aadhar" 
            bind:value={aadharNumber} 
            required 
            placeholder="1234 5678 9012" 
            class="input-dark w-full"
            pattern="\d{12}"
            title="12 digit Aadhar number"
          />
        </div>

        <div class="space-y-2">
          <label for="account" class="text-sm font-medium text-[var(--color-text-secondary)]">Bank Account Number</label>
          <input 
            type="text" 
            id="account" 
            bind:value={accountNumber} 
            required 
            placeholder="00000000000" 
            class="input-dark w-full"
          />
        </div>

        <div class="space-y-2">
          <label for="ifsc" class="text-sm font-medium text-[var(--color-text-secondary)]">IFSC Code</label>
          <input 
            type="text" 
            id="ifsc" 
            bind:value={ifscCode} 
            required 
            placeholder="SBIN0001234" 
            class="input-dark w-full uppercase"
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
            Submit KYC & Generate Sub-Merchant ID
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
