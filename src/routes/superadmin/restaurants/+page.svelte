<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from 'svelte-sonner';
  import type { PageData, ActionData } from './$types';
  import { Plus, ExternalLink, X } from 'lucide-svelte';
  import { fly, fade, slide } from 'svelte/transition';
  import { backOut } from 'svelte/easing';

  let expandedRestaurantId = $state<string | null>(null);

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let loading = $state(false);
  let showAddModal = $state(false);

  $effect(() => {
    if (form?.error) { toast.error(form.error); loading = false; }
    if (form?.success) { toast.success('Restaurant provisioned!'); loading = false; showAddModal = false; }
  });
</script>

<svelte:head><title>Restaurants · Superadmin</title></svelte:head>

<div style="font-family:'Cabinet Grotesk',system-ui,sans-serif;color:#1e1b4b;">
  <div class="sa-page-header">
    <div>
      <h1 class="sa-page-title">Restaurant Nodes</h1>
      <p class="sa-page-subtitle">Active locations and deployment records</p>
    </div>
    <button class="sa-btn-primary" onclick={() => showAddModal = true}>
      <span style="display:flex;align-items:center;gap:6px;">
        <Plus size={15} strokeWidth={2.5} /> Provision Node
      </span>
    </button>
  </div>

  <!-- Node grid -->
  {#if data.restaurants.length === 0}
    <div class="sa-tile" style="padding:64px;text-align:center;">
      <div style="font-size:40px;margin-bottom:16px;">🏪</div>
      <div style="font-size:18px;font-weight:700;color:#8b84c0;margin-bottom:12px;">No restaurants yet</div>
      <button class="sa-btn-primary" onclick={() => showAddModal = true}>Provision First Node</button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each data.restaurants as r, i (r.id)}
        {#if expandedRestaurantId === null || expandedRestaurantId === r.id}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="sa-tile" 
            style="padding:24px; cursor:pointer; grid-column: {expandedRestaurantId === r.id ? '1 / -1' : 'auto'}; transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);" 
            in:fly={{ y: 20, duration: 400, delay: i * 50, easing: (t) => 1 - Math.pow(1 - t, 4) }}
            onclick={(e) => {
              // Only expand if clicking the card itself, not the action buttons
              if ((e.target as HTMLElement).closest('button')) return;
              expandedRestaurantId = expandedRestaurantId === r.id ? null : r.id;
            }}
          >
            <!-- Header row -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
              <div>
                <div style="font-size:18px;font-weight:800;color:#1e1b4b;letter-spacing:-0.03em;margin-bottom:4px;">{r.name}</div>
                <div style="font-size:10px;font-family:'Geist Mono',monospace;color:#9ca3af;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{r.id}</div>
              </div>
              <span class="sa-badge-active">
                <span style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 5px rgba(34,197,94,0.7);"></span>
                Active
              </span>
            </div>
            <!-- Details -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-top:16px;border-top:1px solid rgba(99,102,241,0.08);">
              <div>
                <div class="sa-label">Owner ID</div>
                <div style="font-size:12px;font-family:'Geist Mono',monospace;color:#6b6a9c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{r.owner_id ?? 'Unassigned'}</div>
              </div>
              <div>
                <div class="sa-label">Deployed</div>
                <div style="font-size:12px;font-family:'Geist Mono',monospace;color:#6b6a9c;">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}</div>
              </div>
            </div>
            
            {#if expandedRestaurantId === r.id}
              <div transition:slide={{ duration: 300 }} style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(0,0,0,0.05);">
                <h3 style="font-size:14px;font-weight:800;color:#1e1b4b;margin-bottom:12px;">Detailed Configuration</h3>
                <p style="font-size:12px;color:#6b6a9c;margin-bottom:16px;">(Placeholder for deeply nested restaurant configuration routing, tables, menus, etc.)</p>
                <div style="display:flex;gap:10px;">
                   <button class="sa-btn-primary" style="flex:1;">View Menu Dashboard</button>
                   <button class="sa-btn-primary" style="flex:1;">View Table Config</button>
                </div>
              </div>
            {/if}

            <!-- Actions -->
            <div style="display:flex;gap:10px;margin-top:18px;">
              <button
                style="flex:1;padding:8px;border-radius:10px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.12);color:#6366f1;font-size:12px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;transition:all 0.15s;"
                onclick={() => toast.info('Opening node settings...')}
              >Manage</button>
              <button
                style="width:36px;height:36px;border-radius:10px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.12);color:#6366f1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;"
                onclick={() => toast.info('Viewing node externally...')}
              >
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<!-- Provision modal -->
{#if showAddModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    transition:fade={{ duration: 200 }}
    style="position:fixed;inset:0;background:rgba(30,27,75,0.3);backdrop-filter:blur(10px);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;"
    onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }}
  >
    <div class="sa-tile" transition:fly={{ y: 40, duration: 600, easing: backOut }} style="width:100%;max-width:460px;padding:36px;position:relative;" onclick={(e) => e.stopPropagation()}>
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.07);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#8b84c0;"
        onclick={() => showAddModal = false}
      >
        <X size={14} />
      </button>

      <h2 style="font-size:22px;font-weight:900;color:#1e1b4b;letter-spacing:-0.03em;margin-bottom:6px;">Provision New Node</h2>
      <p style="font-size:12px;font-family:'Geist Mono',monospace;color:#8b84c0;margin-bottom:28px;">Deploy a new restaurant identity to the network</p>

      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => { await update({ reset: true }); loading = false; };
        }}
        style="display:flex;flex-direction:column;gap:18px;"
      >
        <div>
          <label class="sa-label" for="restaurant_name">Restaurant Name</label>
          <input class="sa-input" id="restaurant_name" name="restaurant_name" type="text" required placeholder="The Golden Fork" />
        </div>
        <div>
          <label class="sa-label" for="email">Owner Email</label>
          <input class="sa-input" id="email" name="email" type="email" required placeholder="owner@restaurant.com" />
        </div>
        <div>
          <label class="sa-label" for="password">Initial Password</label>
          <input class="sa-input" id="password" name="password" type="password" required placeholder="••••••••" />
        </div>
        <div style="display:flex;gap:10px;margin-top:8px;">
          <button
            type="button"
            onclick={() => showAddModal = false}
            disabled={loading}
            style="flex:1;padding:10px;border-radius:12px;background:transparent;border:1px solid rgba(99,102,241,0.15);color:#8b84c0;font-size:14px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;"
          >Cancel</button>
          <button type="submit" disabled={loading} class="sa-btn-primary" style="flex:2;">
            {loading ? 'Deploying...' : 'Deploy Restaurant'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
