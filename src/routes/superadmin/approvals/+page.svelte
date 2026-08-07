<script lang="ts">
  import { Shield, ShieldAlert, CheckCircle, XCircle } from 'lucide-svelte';
  
  let { data } = $props();
  let isUpdating = $state(false);

  // We need the supabase client to update the db directly
  import { invalidateAll } from '$app/navigation';
  import { getContext } from 'svelte';
  // If we can't easily get supabase client here in a clean way from layout, we'll do an API call or just use a form action.
  // Actually, we can use a SvelteKit form action to keep it clean.
</script>

<svelte:head>
  <title>User Approvals | Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-up">
  <div class="flex items-center gap-4 mb-8">
    <div class="w-12 h-12 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center border border-[var(--color-brand)]/30 text-[var(--color-brand)]">
      <Shield size={24} />
    </div>
    <div>
      <h1 class="text-3xl font-display text-white">User Approvals</h1>
      <p class="text-[var(--color-text-secondary)]">Manage access to the Owner portal</p>
    </div>
  </div>

  <div class="glass-strong rounded-2xl overflow-hidden border border-white/5">
    <div class="p-6 border-b border-white/5 flex items-center gap-3">
      <ShieldAlert size={20} class="text-[var(--color-brand)]" />
      <h2 class="text-lg font-semibold text-white">Registered Users</h2>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-white/10 bg-black/40">
            <th class="p-4 text-sm font-semibold text-white">Email / User ID</th>
            <th class="p-4 text-sm font-semibold text-white">Registration Date</th>
            <th class="p-4 text-sm font-semibold text-white">Status</th>
            <th class="p-4 text-sm font-semibold text-white text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          {#if data.profiles.length === 0}
            <tr>
              <td colspan="4" class="p-8 text-center text-[var(--color-text-muted)]">
                No users found. They will appear here once they attempt to log in.
              </td>
            </tr>
          {/if}
          
          {#each data.profiles as profile}
            <tr class="hover:bg-white/5 transition-colors">
              <td class="p-4">
                <div class="text-sm font-medium text-white">{profile.email}</div>
                <div class="text-xs text-[var(--color-text-muted)] font-mono mt-1">{profile.id}</div>
              </td>
              <td class="p-4 text-sm text-[var(--color-text-secondary)]">
                {new Date(profile.created_at).toLocaleString('en-IN')}
              </td>
              <td class="p-4">
                {#if profile.is_approved}
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                    <CheckCircle size={14} /> Approved
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">
                    <XCircle size={14} /> Pending
                  </span>
                {/if}
              </td>
              <td class="p-4 text-right">
                <form method="POST" action="?/toggleApproval" use:enhance>
                  <input type="hidden" name="id" value={profile.id} />
                  <input type="hidden" name="currentState" value={profile.is_approved.toString()} />
                  
                  <button
                    type="submit"
                    disabled={isUpdating}
                    class="px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm {profile.is_approved ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}"
                  >
                    {profile.is_approved ? 'Revoke Access' : 'Approve Access'}
                  </button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<script module>
  import { enhance } from '$app/forms';
</script>
