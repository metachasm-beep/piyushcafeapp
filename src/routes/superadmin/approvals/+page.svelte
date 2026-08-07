<script lang="ts">
  import { Shield, ShieldAlert, CheckCircle2, XCircle } from 'lucide-svelte';
  
  let { data } = $props();
  let isUpdating = $state(false);

  import { enhance } from '$app/forms';
  
  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';
</script>

<svelte:head>
  <title>User Approvals | Superadmin</title>
</svelte:head>

<div class="flex-1 space-y-4">
  <div class="flex items-center justify-between space-y-2 mb-8">
    <div class="flex items-center gap-4">
      <div class="w-10 h-10 rounded-md bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-900">
        <Shield size={20} />
      </div>
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-zinc-950">User Approvals</h2>
        <p class="text-sm text-zinc-900">Manage access to the Owner portal</p>
      </div>
    </div>
  </div>

  <Card>
    <CardHeader>
      <div class="flex items-center gap-2">
        <ShieldAlert size={16} class="text-zinc-900" />
        <h3 class="font-semibold leading-none tracking-tight">Registered Users</h3>
      </div>
      <p class="text-sm text-zinc-900">Review and approve new restaurant owners.</p>
    </CardHeader>
    
    <CardContent class="p-0">
      <div class="w-full overflow-auto">
        <table class="w-full caption-bottom text-sm">
          <thead class="[&_tr]:border-b [&_tr]:border-zinc-200 bg-zinc-50/50">
            <tr class="border-b border-zinc-200 transition-colors hover:bg-zinc-50/50 data-[state=selected]:bg-zinc-50">
              <th class="h-12 px-4 text-left align-middle font-medium text-zinc-900">User / Email</th>
              <th class="h-12 px-4 text-left align-middle font-medium text-zinc-900">Registered</th>
              <th class="h-12 px-4 text-left align-middle font-medium text-zinc-900">Status</th>
              <th class="h-12 px-4 align-middle font-medium text-zinc-900 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="[&_tr:last-child]:border-0">
            {#if data.profiles.length === 0}
              <tr>
                <td colspan="4" class="p-8 text-center text-zinc-900">
                  No users found. They will appear here once they attempt to log in.
                </td>
              </tr>
            {/if}
            
            {#each data.profiles as profile}
              <tr class="border-b border-zinc-200 transition-colors hover:bg-zinc-50/50 data-[state=selected]:bg-zinc-50">
                <td class="p-4 align-middle">
                  <div class="font-medium text-zinc-950">{profile.email}</div>
                  <div class="text-xs text-[var(--color-brand)] font-medium mt-1">{profile.restaurant_name || 'No restaurant name provided'}</div>
                  <div class="text-xs text-zinc-500 font-mono mt-0.5">{profile.id}</div>
                </td>
                <td class="p-4 align-middle text-zinc-900">
                  {new Date(profile.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td class="p-4 align-middle">
                  {#if profile.is_approved}
                    <span class="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50">
                      <CheckCircle2 size={12} class="mr-1" /> Approved
                    </span>
                  {:else}
                    <span class="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-amber-600 bg-amber-50">
                      <XCircle size={12} class="mr-1" /> Pending
                    </span>
                  {/if}
                </td>
                <td class="p-4 align-middle text-right">
                  <div class="flex items-center justify-end gap-2">
                    <form method="POST" action="?/toggleApproval" use:enhance>
                      <input type="hidden" name="id" value={profile.id} />
                      <input type="hidden" name="currentState" value={profile.is_approved.toString()} />
                      
                      <button
                        type="submit"
                        disabled={isUpdating}
                        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 shadow-sm {profile.is_approved ? 'border border-zinc-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90'}"
                      >
                        {profile.is_approved ? 'Revoke' : 'Approve'}
                      </button>
                    </form>
                    
                    {#if !profile.is_approved}
                      <form method="POST" action="?/denyApproval" use:enhance onsubmit={(e) => { if (!confirm('Are you sure you want to deny this request? This will permanently delete the profile.')) e.preventDefault(); }}>
                        <input type="hidden" name="id" value={profile.id} />
                        <button
                          type="submit"
                          disabled={isUpdating}
                          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 shadow-sm border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100 hover:text-red-600"
                        >
                          Deny
                        </button>
                      </form>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
</div>
