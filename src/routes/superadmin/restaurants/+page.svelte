<script lang="ts">
  import { Store, Plus, ExternalLink, X, Settings2, Activity } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import { slide, fade } from 'svelte/transition';
  import { toast } from 'svelte-sonner';
  
  let { data } = $props();

  let showAddModal = $state(false);
  let expandedRestaurantId = $state<string | null>(null);
  let loading = $state(false);

  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';
</script>

<svelte:head>
  <title>Restaurants | Superadmin</title>
</svelte:head>

<div class="flex-1 space-y-4">
  <div class="flex items-center justify-between space-y-2 mb-8">
    <div class="flex items-center gap-4">
      <div class="w-10 h-10 rounded-md bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-900">
        <Store size={20} />
      </div>
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-zinc-950">Restaurants</h2>
        <p class="text-sm text-zinc-900">Manage {data.restaurants.length} active instances across the platform.</p>
      </div>
    </div>
    
    <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2 gap-2" onclick={() => showAddModal = true}>
      <Plus size={16} />
      Provision Node
    </button>
  </div>

  {#if data.restaurants.length === 0}
    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-12 text-center animate-in fade-in-50">
      <div class="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 mb-4">
        <Store size={32} class="text-zinc-900" />
      </div>
      <h3 class="mt-4 text-lg font-semibold text-zinc-950">No restaurants provisioned</h3>
      <p class="mb-4 mt-2 text-sm text-zinc-900">
        You haven't added any restaurants to the network yet.
      </p>
      <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2" onclick={() => showAddModal = true}>
        Provision First Node
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each data.restaurants as r (r.id)}
        {#if expandedRestaurantId === null || expandedRestaurantId === r.id}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="transition-all duration-300 {expandedRestaurantId === r.id ? 'col-span-full' : 'col-span-1'}"
            onclick={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              expandedRestaurantId = expandedRestaurantId === r.id ? null : r.id;
            }}
          >
            <Card class="h-full cursor-pointer transition-colors hover:bg-zinc-50">
              <CardHeader class="flex flex-row items-start justify-between space-y-0 pb-2">
                <div class="space-y-1">
                  <h3 class="font-semibold leading-none tracking-tight">{r.name}</h3>
                  <p class="text-xs text-zinc-900 font-mono truncate max-w-[200px]">{r.id}</p>
                </div>
                <span class="inline-flex items-center rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                  Active
                </span>
              </CardHeader>
              <CardContent>
                <div class="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div class="space-y-1">
                    <p class="text-zinc-900 text-xs">Owner Email</p>
                    <p class="font-medium text-zinc-900 truncate" title={r.owner_email}>{r.owner_email}</p>
                  </div>
                  <div class="space-y-1">
                    <p class="text-zinc-900 text-xs">Deployed</p>
                    <p class="font-medium text-zinc-900">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '-'}</p>
                  </div>
                </div>

                {#if expandedRestaurantId === r.id}
                  <div transition:slide={{ duration: 200 }} class="mt-6 pt-6 border-t border-zinc-200">
                    <h4 class="text-sm font-semibold mb-2">Detailed Configuration</h4>
                    <p class="text-xs text-zinc-900 mb-4">Select an area to manage this instance.</p>
                    <div class="flex gap-2">
                       <button class="inline-flex flex-1 items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 h-8 px-3">
                         View Menu
                       </button>
                       <button class="inline-flex flex-1 items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 h-8 px-3">
                         View Tables
                       </button>
                    </div>
                  </div>
                {/if}

                <div class="flex gap-2 mt-6">
                  <button
                    class="inline-flex flex-1 items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-8 px-3 gap-1.5"
                    onclick={() => toast.info('Opening settings...')}
                  >
                    <Settings2 size={14} /> Manage
                  </button>
                  <button
                    class="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 border border-zinc-200 bg-white hover:bg-zinc-100 h-8 w-8"
                    onclick={() => toast.info('Viewing node externally...')}
                  >
                    <ExternalLink size={14} class="text-zinc-900" />
                  </button>
                  <form method="POST" action="?/deleteRestaurant" use:enhance={() => {
                    if (!confirm('Are you sure you want to completely destroy this node and its owner? This cannot be undone.')) return ({ update }) => update({ reset: false });
                    return async ({ result, update }) => {
                      console.log('Delete result:', result);
                      if (result.type === 'success') {
                        toast.success('Node destroyed');
                        window.location.reload();
                      } else if (result.type === 'failure') {
                        toast.error(result.data?.error || 'Failed to destroy node (failure)');
                      } else if (result.type === 'error') {
                        toast.error(result.error?.message || 'Server error occurred during deletion');
                      } else {
                        toast.error(`Unexpected result type: ${result.type}`);
                      }
                      update();
                    };
                  }}>
                    <input type="hidden" name="restaurant_id" value={r.id} />
                    <button
                      type="submit"
                      class="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 h-8 px-3 ml-2"
                    >
                      Destroy
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

{#if showAddModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }}
  >
    <div 
      class="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
        <div>
          <h2 class="text-lg font-semibold tracking-tight">Provision Node</h2>
          <p class="text-sm text-zinc-900">Deploy a new restaurant identity to the network.</p>
        </div>
        <button
          class="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
          onclick={() => showAddModal = false}
        >
          <X size={16} class="text-zinc-900" />
        </button>
      </div>

      <form
        method="POST"
        action="?/createRestaurant"
        use:enhance={() => {
          loading = true;
          return async ({ result, update }) => { 
            await update({ reset: false }); 
            loading = false; 
            console.log('Create result:', result);
            if (result.type === 'success') {
              toast.success('Restaurant node provisioned successfully!');
              showAddModal = false;
              window.location.reload();
            } else if (result.type === 'failure') {
              toast.error(result.data?.error || 'Failed to provision node');
            } else if (result.type === 'error') {
              toast.error(result.error?.message || 'Server error occurred during creation');
            } else {
              toast.error(`Unexpected result type: ${result.type}`);
            }
          };
        }}
        class="p-6 space-y-4"
      >
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="restaurant_name">Restaurant Name</label>
          <input class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" id="restaurant_name" name="restaurant_name" type="text" required placeholder="The Golden Fork" />
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="email">Owner Email</label>
          <input class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" id="email" name="email" type="email" required placeholder="owner@restaurant.com" />
        </div>
        
        <div class="flex gap-2 pt-2 border-t border-zinc-200 mt-6">
          <button
            type="button"
            onclick={() => showAddModal = false}
            disabled={loading}
            class="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 h-9 px-4"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} class="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4">
            {loading ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
