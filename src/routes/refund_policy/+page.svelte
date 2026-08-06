<script lang="ts">
  import { RefreshCcw, Clock, AlertTriangle, CreditCard, Banknote } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Cancellation & Refund Policy | Piyush Cafe</title>
  <meta name="description" content="Cancellation and Refund Policy for Piyush Cafe App" />
</svelte:head>

<div class="min-h-screen bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8 text-[var(--color-text)]">
  <div class="max-w-4xl mx-auto glass-strong rounded-3xl p-8 md:p-12 animate-slide-up relative overflow-hidden">
    <!-- Decorative background glow -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-[var(--color-brand)]/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-brand)]/10 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="relative z-10">
      <div class="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
        <div class="w-16 h-16 rounded-2xl bg-[var(--color-brand)]/10 flex items-center justify-center border border-[var(--color-brand)]/30 text-[var(--color-brand)]">
          <RefreshCcw size={32} />
        </div>
        <div>
          <h1 class="text-4xl font-display text-white mb-2">Cancellation & Refund Policy</h1>
          <p class="text-[var(--color-text-secondary)]">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div class="prose prose-invert max-w-none space-y-8 prose-headings:text-white prose-headings:font-display prose-a:text-[var(--color-brand)]">
        
        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="flex items-center gap-2 text-2xl mb-4 text-[var(--color-brand)]"><AlertTriangle size={24} /> 1. Order Cancellation by User</h2>
          <ul class="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
            <li><strong>Before Acceptance:</strong> You may cancel an order only before the restaurant has accepted and started preparing it. In such cases, a full refund will be issued.</li>
            <li><strong>After Acceptance:</strong> Once the restaurant has accepted the order and food preparation has begun, the order cannot be cancelled, and no refund will be provided.</li>
          </ul>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="flex items-center gap-2 text-2xl mb-4 text-[var(--color-brand)]"><AlertTriangle size={24} /> 2. Order Cancellation by Restaurant</h2>
          <ul class="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
            <li>The restaurant reserves the right to cancel your order in unforeseen circumstances, such as inventory shortages, kitchen emergencies, or technical glitches.</li>
            <li>If the restaurant cancels your prepaid order, a <strong>100% full refund</strong> will be initiated automatically.</li>
          </ul>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="flex items-center gap-2 text-2xl mb-4 text-[var(--color-brand)]"><CreditCard size={24} /> 3. Failed Transactions</h2>
          <p>
            If a payment fails or times out, but the amount is debited from your bank account, the transaction is considered failed. Our payment gateway (PayU) will automatically reconcile and reverse the debited amount to your original payment method. 
          </p>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="flex items-center gap-2 text-2xl mb-4 text-[var(--color-brand)]"><Clock size={24} /> 4. Refund Processing Timelines</h2>
          <p class="text-[var(--color-text-secondary)] mb-4">
            Refunds will be processed to the original mode of payment. The time taken for the refund to reflect in your account depends on your bank and payment method:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
            <li><strong>UPI / Wallets:</strong> 1 to 3 business days</li>
            <li><strong>Credit / Debit Cards:</strong> 5 to 7 business days</li>
            <li><strong>Net Banking:</strong> 5 to 7 business days</li>
          </ul>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="flex items-center gap-2 text-2xl mb-4 text-[var(--color-brand)]"><Banknote size={24} /> 5. Defective or Incorrect Orders</h2>
          <p class="text-[var(--color-text-secondary)]">
            If you receive an incorrect item, or if there is a severe quality issue with your food, please report it to the restaurant staff immediately while at your table. Refunds or replacements for food quality issues are at the sole discretion of the restaurant management.
          </p>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="text-2xl mb-4 text-[var(--color-brand)]">6. Contact for Refunds</h2>
          <p class="text-[var(--color-text-secondary)]">
            For any discrepancies regarding payments or refunds, please reach out to us at:
          </p>
          <div class="mt-4 p-4 bg-black/40 rounded-xl border border-white/10 text-sm font-mono text-gray-300">
            Email: metachasm@gmail.com / nit.uniyal@gmail.com<br/>
            Time: Mon - Sat (9:00 - 18:00)
          </div>
        </section>

      </div>
    </div>
  </div>
</div>

<style>
  :global(.prose p) {
    margin-bottom: 1rem;
    color: var(--color-text-secondary);
  }
</style>
