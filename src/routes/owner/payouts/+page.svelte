<script lang="ts">
  import { CheckCircle, ExternalLink } from 'lucide-svelte';

  let { data } = $props();
  let restaurant = $derived(data.restaurant);
  
  let hasRazorpay = $derived(!!restaurant?.razorpay_account_id);
  let hasPayPal = $derived(!!restaurant?.paypal_account_id);
</script>

<svelte:head>
  <title>Payouts Setup - The Golden Fork</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
  <div>
    <h1 class="text-2xl font-bold tracking-tight text-zinc-950">Payouts Setup</h1>
    <p class="text-sm text-zinc-500 mt-1">Connect your payment provider to receive automated settlements directly into your bank account. Choose the provider that operates in your region.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Razorpay Card (India) -->
    <div class="bg-white border {hasRazorpay ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-zinc-200'} rounded-2xl p-6 flex flex-col shadow-sm relative overflow-hidden">
      {#if hasRazorpay}
        <div class="absolute top-0 right-0 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-bl-xl text-xs font-bold border-l border-b border-emerald-100 flex items-center gap-1">
          <CheckCircle size={12} /> Connected
        </div>
      {/if}
      
      <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 bg-[#02042B] rounded-xl flex items-center justify-center shadow-sm">
          <span class="text-white font-bold tracking-tight text-xl">Rz</span>
        </div>
        <div>
          <h2 class="text-lg font-bold text-zinc-900">Razorpay</h2>
          <p class="text-xs text-zinc-500 font-medium">For restaurants in India</p>
        </div>
      </div>
      
      <p class="text-sm text-zinc-600 mb-8 flex-1">
        Seamlessly accept UPI, cards, and wallets. Settlements are routed directly to your bank account with competitive platform fees.
      </p>

      {#if hasRazorpay}
        <div class="space-y-4">
          <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 flex justify-between items-center">
            <span class="truncate">ID: {restaurant.razorpay_account_id}</span>
          </div>
          <button class="w-full py-2.5 px-4 rounded-lg font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors text-sm">
            Manage on Razorpay
          </button>
        </div>
      {:else}
        <a href="/api/payouts/razorpay/authorize" class="w-full flex justify-center items-center py-2.5 px-4 rounded-lg font-medium bg-[#02042B] text-white hover:bg-black transition-colors shadow-sm text-sm gap-2">
          Connect Razorpay <ExternalLink size={14} />
        </a>
      {/if}
    </div>

    <!-- PayPal Card (International) -->
    <div class="bg-white border {hasPayPal ? 'border-sky-200 ring-1 ring-sky-100' : 'border-zinc-200'} rounded-2xl p-6 flex flex-col shadow-sm relative overflow-hidden">
      {#if hasPayPal}
        <div class="absolute top-0 right-0 bg-sky-50 text-sky-600 px-3 py-1 rounded-bl-xl text-xs font-bold border-l border-b border-sky-100 flex items-center gap-1">
          <CheckCircle size={12} /> Connected
        </div>
      {/if}
      
      <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 bg-[#00457C] rounded-xl flex items-center justify-center shadow-sm">
          <span class="text-white font-bold tracking-tight text-xl">PP</span>
        </div>
        <div>
          <h2 class="text-lg font-bold text-zinc-900">PayPal</h2>
          <p class="text-xs text-zinc-500 font-medium">For international restaurants</p>
        </div>
      </div>
      
      <p class="text-sm text-zinc-600 mb-8 flex-1">
        Accept global payments via PayPal, credit cards, and local payment methods. Seamless settlements everywhere.
      </p>

      {#if hasPayPal}
        <div class="space-y-4">
          <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 flex justify-between items-center">
            <span class="truncate">ID: {restaurant.paypal_account_id}</span>
          </div>
          <button class="w-full py-2.5 px-4 rounded-lg font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors text-sm">
            Manage on PayPal
          </button>
        </div>
      {:else}
        <a href="/api/payouts/paypal/authorize" class="w-full flex justify-center items-center py-2.5 px-4 rounded-lg font-medium bg-[#0079C1] text-white hover:bg-[#00457C] transition-colors shadow-sm text-sm gap-2">
          Connect PayPal <ExternalLink size={14} />
        </a>
      {/if}
    </div>
  </div>
</div>
