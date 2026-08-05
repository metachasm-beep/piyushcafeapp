<script lang="ts">
  import { MOCK_RESTAURANT, MOCK_TABLES } from '$lib/mock-data';
  import '$lib/styles/spatial-glass.css';
</script>

<svelte:head>
  <title>Restaurant PWA — Demo Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Geist+Mono:wght@300;400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<main class="sg-shell" style="display:flex;align-items:center;justify-content:center;padding:48px 20px;min-height:100dvh;">
  <div class="sg-orbs" aria-hidden="true">
    <div class="sg-orb" style="width:700px;height:700px;background:radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%);top:-200px;left:50%;transform:translateX(-50%);"></div>
    <div class="sg-orb" style="width:400px;height:400px;background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%);bottom:-80px;right:-40px;filter:blur(50px);"></div>
  </div>

  <div style="max-width:520px;width:100%;position:relative;z-index:1;">
    <div style="text-align:center;margin-bottom:36px;">
      <div
        style="width:56px;height:56px;margin:0 auto 18px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(99,102,241,0.4);"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 11l19-9-9 19-2-8-8-2z" />
        </svg>
      </div>
      <h1 style="font-size:36px;font-weight:900;letter-spacing:-0.04em;color:#1e1b4b;margin:0;line-height:1.1;">
        Restaurant PWA
      </h1>
      <p style="font-size:13px;font-family:'Geist Mono',monospace;color:#8b84c0;margin:10px 0 0;letter-spacing:0.04em;">
        Spatial Glass demo templates
      </p>
    </div>

    <div class="sg-demo-banner" style="margin-bottom:20px;justify-content:center;text-align:center;">
      Owner &amp; table skins customise per restaurant after design intake
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;">
      <!-- Table / customer -->
      <div class="sg-tile sg-tile-static" style="padding:22px 24px;">
        <p style="font-size:11px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;color:#6366f1;font-weight:600;margin:0 0 8px;">
          Table app
        </p>
        <p style="font-size:14px;color:#6b6a9c;margin:0 0 16px;line-height:1.5;">
          Guest menu PWA — scan a QR to browse, order, and track. Demo restaurant: {MOCK_RESTAURANT.name}.
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          {#each MOCK_TABLES.slice(0, 3) as table}
            <a href="/table/{MOCK_RESTAURANT.id}/{table.id}" class="sg-btn-primary" style="padding:8px 14px;font-size:13px;text-decoration:none;">
              {table.display_name ?? `Table ${table.table_number}`}
            </a>
          {/each}
        </div>
      </div>

      <!-- Owner -->
      <div class="sg-tile sg-tile-static" style="padding:22px 24px;">
        <p style="font-size:11px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;color:#6366f1;font-weight:600;margin:0 0 8px;">
          Owner app
        </p>
        <p style="font-size:14px;color:#6b6a9c;margin:0 0 16px;line-height:1.5;">
          Staff portal — floor dashboard, kitchen display, and inventory.
          <br />
          <span style="font-family:'Geist Mono',monospace;font-size:11px;color:#8b84c0;">Google sign-in or email · demo without Supabase: any credentials</span>
        </p>
        <a href="/owner" class="sg-btn-primary" style="text-decoration:none;">Open Owner Portal →</a>
      </div>

      <!-- Superadmin -->
      <div class="sg-tile sg-tile-static" style="padding:22px 24px;">
        <p style="font-size:11px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;color:#6366f1;font-weight:600;margin:0 0 8px;">
          Superadmin
        </p>
        <p style="font-size:14px;color:#6b6a9c;margin:0 0 16px;line-height:1.5;">
          Platform console — provision restaurants, menus, and table QR codes.
        </p>
        <a href="/superadmin" class="sg-btn-ghost" style="text-decoration:none;">Open Superadmin →</a>
      </div>
    </div>

    <p style="margin-top:28px;text-align:center;font-size:11px;font-family:'Geist Mono',monospace;color:#a5b4fc;">
      Mock mode · no Supabase required
    </p>
  </div>
</main>
