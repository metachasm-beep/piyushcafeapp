<script lang="ts">
  import { Shield, EyeOff, KeyRound, Database, Search } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Privacy Policy | Piyush Cafe</title>
  <meta name="description" content="Privacy Policy and Data Protection guidelines for Piyush Cafe App" />
</svelte:head>

<div class="min-h-screen bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8 text-[var(--color-text)]">
  <div class="max-w-4xl mx-auto glass-strong rounded-3xl p-8 md:p-12 animate-slide-up relative overflow-hidden">
    <!-- Decorative background glow -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-[var(--color-brand)]/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-brand)]/10 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="relative z-10">
      <div class="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
        <div class="w-16 h-16 rounded-2xl bg-[var(--color-brand)]/10 flex items-center justify-center border border-[var(--color-brand)]/30 text-[var(--color-brand)]">
          <Shield size={32} />
        </div>
        <div>
          <h1 class="text-4xl font-display text-white mb-2">Privacy Policy</h1>
          <p class="text-[var(--color-text-secondary)]">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div class="prose prose-invert max-w-none space-y-8 prose-headings:text-white prose-headings:font-display prose-a:text-[var(--color-brand)]">
        
        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <p class="text-[var(--color-text-secondary)]">
            At Piyush Cafe ("Platform", "we", "our", "us"), we are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and protect your information in compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology Act, 2000</strong> of India.
          </p>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="flex items-center gap-2 text-2xl mb-4 text-[var(--color-brand)]"><Database size={24} /> 1. Information We Collect</h2>
          <ul class="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
            <li><strong>Personal Data:</strong> Name, phone number, and email address provided during the ordering process or account registration.</li>
            <li><strong>Order Data:</strong> Items ordered, table number, restaurant location, and order history.</li>
            <li><strong>Technical Data:</strong> Device type, browser type, IP address, and interaction data with our Platform for analytics.</li>
            <li><strong>Financial Data:</strong> We do NOT store your credit card or bank details. All payments are processed securely by our certified payment gateway partners (e.g., PayU).</li>
          </ul>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="flex items-center gap-2 text-2xl mb-4 text-[var(--color-brand)]"><EyeOff size={24} /> 2. How We Use Your Information</h2>
          <ul class="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
            <li>To process your digital orders and transmit them to the restaurant kitchen.</li>
            <li>To facilitate secure payment processing via third-party gateways.</li>
            <li>To communicate with you regarding order updates, cancellations, or refunds.</li>
            <li>To improve our Platform's performance and analyze customer preferences.</li>
          </ul>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="flex items-center gap-2 text-2xl mb-4 text-[var(--color-brand)]"><Search size={24} /> 3. Data Sharing and Disclosure</h2>
          <p class="text-[var(--color-text-secondary)] mb-4">We do not sell or rent your personal data to third parties. We may share your data only in the following circumstances:</p>
          <ul class="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
            <li><strong>Restaurants:</strong> Your order details and name are shared with the restaurant to fulfill your order.</li>
            <li><strong>Service Providers:</strong> Payment gateways and cloud hosting providers (e.g., Supabase, Vercel) under strict confidentiality agreements.</li>
            <li><strong>Legal Requirements:</strong> If required by law enforcement or government authorities under applicable Indian laws.</li>
          </ul>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="flex items-center gap-2 text-2xl mb-4 text-[var(--color-brand)]"><KeyRound size={24} /> 4. Your Rights (Under DPDP Act)</h2>
          <ul class="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
            <li><strong>Right to Access:</strong> You can request a summary of the personal data we hold about you.</li>
            <li><strong>Right to Correction:</strong> You can request correction of inaccurate or incomplete data.</li>
            <li><strong>Right to Erasure:</strong> You can request the deletion of your data once it is no longer necessary for the purpose it was collected (subject to legal retention requirements).</li>
            <li><strong>Right to Withdraw Consent:</strong> You may withdraw your consent for data processing at any time by contacting our Grievance Officer.</li>
          </ul>
        </section>

        <section class="bg-black/20 p-6 rounded-2xl border border-white/5">
          <h2 class="text-2xl mb-4 text-[var(--color-brand)]">5. Data Protection & Grievance Officer</h2>
          <p class="text-[var(--color-text-secondary)]">
            We employ industry-standard encryption and security measures to protect your data. If you have any concerns about your privacy or wish to exercise your rights, please contact our Data Protection / Grievance Officer:
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
