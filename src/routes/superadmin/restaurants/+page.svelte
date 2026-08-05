<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from 'svelte-sonner';
  import type { PageData, ActionData } from './$types';
  import { Plus, ExternalLink } from 'lucide-svelte';
  import SaModal from '$lib/components/sa/SaModal.svelte';
  import SaEmpty from '$lib/components/sa/SaEmpty.svelte';
  import SaErrorBanner from '$lib/components/sa/SaErrorBanner.svelte';
  import { saDensity, setSaRestaurantId } from '$lib/stores/saContext';
  import { goto } from '$app/navigation';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let loading = $state(false);
  let showAddModal = $state(false);
  let density = $state<'card' | 'compact'>('card');

  $effect(() => {
    const u = saDensity.subscribe((v) => (density = v));
    return () => u();
  });

  $effect(() => {
    if (form?.error) {
      toast.error(form.error);
      loading = false;
    }
    if (form?.success) {
      toast.success('Restaurant created');
      loading = false;
      showAddModal = false;
    }
  });

  function openManage(id: string) {
    setSaRestaurantId(id);
    goto('/superadmin/menu');
  }

  function openTable(id: string) {
    window.open(`/table/${id}/t1`, '_blank');
  }
</script>

<svelte:head><title>Restaurants · Superadmin</title></svelte:head>

<div>
  <div class="sa-page-header">
    <div>
      <h1 class="sa-page-title">Restaurants</h1>
      <p class="sa-page-subtitle">
        {data.restaurants.length} location{data.restaurants.length === 1 ? '' : 's'}
        {#if data.usingMock} · demo data{/if}
      </p>
    </div>
    <button type="button" class="sa-btn-primary" onclick={() => (showAddModal = true)}>
      <Plus size={15} strokeWidth={2.5} /> Add restaurant
    </button>
  </div>

  {#if data.loadError}
    <SaErrorBanner title="Could not load restaurants" message={data.loadError} />
  {/if}

  {#if data.restaurants.length === 0 && !data.loadError}
    <SaEmpty title="No restaurants yet" body="Create a restaurant to provision menu, tables, and QR links.">
      <button type="button" class="sa-btn-primary" onclick={() => (showAddModal = true)}>
        <Plus size={15} strokeWidth={2.5} /> Add restaurant
      </button>
    </SaEmpty>
  {:else if density === 'compact'}
    <div class="sa-tile sa-tile-static" style="padding:8px 20px;">
      {#each data.restaurants as r (r.id)}
        <div class="sa-list-row">
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:800;color:var(--sa-ink);">{r.name}</div>
            <div class="sa-num" style="font-size:10px;font-family:var(--sa-mono);color:var(--sa-faint);overflow:hidden;text-overflow:ellipsis;">{r.id}</div>
          </div>
          {#if r.is_active !== false}
            <span class="sa-badge-active">Active</span>
          {:else}
            <span class="sa-badge-inactive">Inactive</span>
          {/if}
          <div style="display:flex;gap:6px;">
            <button type="button" class="sa-btn-secondary" style="min-height:40px;padding:8px 12px;font-size:12px;" onclick={() => openManage(r.id)}>Menu</button>
            <button type="button" class="sa-btn-icon" aria-label="Open guest menu" onclick={() => openTable(r.id)}>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="sa-grid-cards">
      {#each data.restaurants as r (r.id)}
        <div class="sa-tile" style="padding:var(--sa-density-pad);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;gap:12px;">
            <div style="min-width:0;">
              <div style="font-size:17px;font-weight:800;color:var(--sa-ink);letter-spacing:-0.03em;margin-bottom:4px;">{r.name}</div>
              <div class="sa-num" style="font-size:10px;font-family:var(--sa-mono);color:var(--sa-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{r.id}</div>
            </div>
            {#if r.is_active !== false}
              <span class="sa-badge-active">
                <span style="width:5px;height:5px;border-radius:50%;background:var(--sa-ok);display:inline-block;"></span>
                Active
              </span>
            {:else}
              <span class="sa-badge-inactive">Inactive</span>
            {/if}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-top:14px;border-top:1px solid var(--sa-line);">
            <div>
              <div class="sa-label">Owner</div>
              <div style="font-size:12px;font-family:var(--sa-mono);color:var(--sa-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{'owner_id' in r && r.owner_id ? r.owner_id : 'Unassigned'}</div>
            </div>
            <div>
              <div class="sa-label">Created</div>
              <div class="sa-num" style="font-size:12px;font-family:var(--sa-mono);color:var(--sa-muted);">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;">
            <button type="button" class="sa-btn-secondary" style="flex:1;" onclick={() => openManage(r.id)}>Open menu</button>
            <button type="button" class="sa-btn-icon" aria-label="Open guest menu" onclick={() => openTable(r.id)}>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<SaModal
  open={showAddModal}
  title="Add restaurant"
  description="Creates an owner account and restaurant record"
  busy={loading}
  onClose={() => { if (!loading) showAddModal = false; }}
>
  <form
    method="POST"
    use:enhance={() => {
      loading = true;
      return async ({ update }) => {
        await update({ reset: true });
        loading = false;
      };
    }}
    style="display:flex;flex-direction:column;gap:16px;"
  >
    <div>
      <label class="sa-label" for="restaurant_name">Restaurant name</label>
      <input class="sa-input" id="restaurant_name" name="restaurant_name" type="text" required placeholder="The Golden Fork" />
    </div>
    <div>
      <label class="sa-label" for="email">Owner email</label>
      <input class="sa-input" id="email" name="email" type="email" required placeholder="owner@restaurant.com" />
    </div>
    <div>
      <label class="sa-label" for="password">Initial password</label>
      <input class="sa-input" id="password" name="password" type="password" required placeholder="••••••••" minlength="8" />
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;">
      <button type="button" class="sa-btn-secondary" style="flex:1;" disabled={loading} onclick={() => (showAddModal = false)}>Cancel</button>
      <button type="submit" disabled={loading} class="sa-btn-primary" style="flex:2;">
        {loading ? 'Creating…' : 'Create'}
      </button>
    </div>
  </form>
</SaModal>
