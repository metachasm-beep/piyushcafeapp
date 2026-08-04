<script lang="ts">
  import { MOCK_RESTAURANT, MOCK_TABLES } from '$lib/mock-data';
</script>

<svelte:head>
  <title>The Golden Fork — Restaurant PWA</title>
</svelte:head>

<main
  class="min-h-screen flex items-center justify-center px-4 py-12"
  style="background: radial-gradient(ellipse at top, rgba(249,115,22,0.12) 0%, transparent 60%), var(--color-bg);"
>
  <div class="max-w-lg w-full text-center animate-fade-up">
    <!-- Logo -->
    <div class="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      <img src="/icons/icon-192.png" alt="The Golden Fork" class="w-full h-full object-cover" />
    </div>

    <h1
      class="text-4xl font-bold mb-2"
      style="font-family: var(--font-display); background: linear-gradient(135deg, #F97316, #FBBF24); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
    >
      The Golden Fork
    </h1>
    <p class="mb-10" style="color: var(--color-text-secondary);">
      Restaurant PWA Demo — powered by SvelteKit + Supabase
    </p>

    <!-- Demo Links -->
    <div class="flex flex-col gap-4">
      <!-- Customer View -->
      <div class="glass rounded-2xl p-5 text-left">
        <p class="text-xs font-semibold uppercase tracking-widest mb-3" style="color: var(--color-brand);">
          📱 Customer Interface
        </p>
        <p class="text-sm mb-4" style="color: var(--color-text-secondary);">
          Simulate scanning a table QR code to browse the menu and place an order.
        </p>
        <div class="flex flex-wrap gap-2">
          {#each MOCK_TABLES.slice(0, 3) as table}
            <a
              href="/table/{MOCK_RESTAURANT.id}/{table.id}"
              class="btn-brand text-sm px-4 py-2"
            >
              {table.display_name ?? `Table ${table.table_number}`}
            </a>
          {/each}
        </div>
      </div>

      <!-- Admin View -->
      <div class="glass rounded-2xl p-5 text-left">
        <p class="text-xs font-semibold uppercase tracking-widest mb-3" style="color: var(--color-brand);">
          🍳 Staff Interface
        </p>
        <p class="text-sm mb-4" style="color: var(--color-text-secondary);">
          Manage the menu, view kitchen orders, and generate QR codes.
          <br/>
          <span class="font-mono text-xs" style="color: var(--color-text-muted);">Login: any email + password123</span>
        </p>
        <a href="/admin" class="btn-ghost">
          Open Admin Dashboard →
        </a>
      </div>
    </div>

    <p class="mt-8 text-xs" style="color: var(--color-text-muted);">
      Running in mock mode — no Supabase connection required
    </p>
  </div>
</main>
