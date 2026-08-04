<script lang="ts">
  import { adminSettings } from '$lib/stores/admin';
  import { toast } from 'svelte-sonner';
  import { Settings, Save, Database, Link as LinkIcon } from '@lucide/svelte';

  let googleSheetUrl = $state($adminSettings.googleSheetUrl);
  let googleAppsScriptUrl = $state($adminSettings.googleAppsScriptUrl);
  let spreadsheetId = $state($adminSettings.spreadsheetId);

  // Automatically extract ID when URL changes
  $effect(() => {
    if (googleSheetUrl && googleSheetUrl.includes('/d/')) {
      const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        spreadsheetId = match[1];
      }
    }
  });

  function saveSettings() {
    if (googleSheetUrl && !spreadsheetId) {
      toast.error('Invalid Google Sheet URL. Could not extract ID.');
      return;
    }
    
    adminSettings.updateSettings({
      googleSheetUrl,
      spreadsheetId,
      googleAppsScriptUrl
    });
    
    toast.success('Settings saved successfully');
  }
</script>

<svelte:head>
  <title>Settings - Admin</title>
</svelte:head>

<div class="h-full flex flex-col gap-6 max-w-3xl mx-auto pb-12">
  <div class="flex items-center gap-3">
    <div class="p-3 bg-brand/20 rounded-xl text-brand">
      <Settings size={28} />
    </div>
    <div>
      <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">Settings</h1>
      <p class="text-[var(--color-text-secondary)] mt-1">Configure your external data sources</p>
    </div>
  </div>

  <div class="glass border border-[var(--color-border)] rounded-2xl p-6 space-y-8 mt-4">
    
    <!-- Database Section -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 text-xl font-bold border-b border-[var(--color-border)] pb-2">
        <Database size={20} class="text-brand" />
        <h2>Google Sheets Database</h2>
      </div>
      <p class="text-sm text-[var(--color-text-secondary)]">
        The PWA reads your menu and categories directly from a public Google Sheet using CSV export.
      </p>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-[var(--color-text-primary)]">Google Sheet URL</label>
        <input 
          type="url" 
          bind:value={googleSheetUrl}
          placeholder="https://docs.google.com/spreadsheets/d/..." 
          class="input-dark w-full"
        />
        <p class="text-xs text-[var(--color-text-secondary)]">Must be set to "Anyone with the link can view".</p>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-[var(--color-text-primary)]">Spreadsheet ID (Auto-extracted)</label>
        <input 
          type="text" 
          value={spreadsheetId}
          readonly
          class="input-dark w-full opacity-50 bg-black/20"
        />
      </div>
    </section>

    <!-- Webhook Section -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 text-xl font-bold border-b border-[var(--color-border)] pb-2">
        <LinkIcon size={20} class="text-brand" />
        <h2>Google Apps Script Webhook (For Writes)</h2>
      </div>
      <p class="text-sm text-[var(--color-text-secondary)]">
        To allow this admin panel to add or edit items, deploy the provided <code>google-apps-script.js</code> as a Web App and paste the URL here.
      </p>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-[var(--color-text-primary)]">Web App URL</label>
        <input 
          type="url" 
          bind:value={googleAppsScriptUrl}
          placeholder="https://script.google.com/macros/s/.../exec" 
          class="input-dark w-full"
        />
      </div>
    </section>

    <div class="pt-4 flex justify-end">
      <button 
        class="btn-brand flex items-center gap-2 px-8 py-3 text-lg"
        onclick={saveSettings}
      >
        <Save size={20} /> Save Configuration
      </button>
    </div>
  </div>
</div>
