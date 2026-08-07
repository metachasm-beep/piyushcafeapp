<script lang="ts">
	import { Users, UserPlus, Shield, UtensilsCrossed, Settings, Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let isInviting = $state(false);
	let isRemoving = $state(false);

	let staffList = $derived(data.staff || []);
</script>

<svelte:head>
	<title>Staff Management | Restaurant Owner</title>
</svelte:head>

<div class="space-y-6 animate-fade-up">
	<div class="flex items-center justify-between mb-8">
		<div class="flex items-center gap-4">
			<div class="w-12 h-12 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center border border-[var(--color-brand)]/30 text-[var(--color-brand)]">
				<Users size={24} />
			</div>
			<div>
				<h1 class="text-3xl font-display text-[var(--color-text)]">Staff Management</h1>
				<p class="text-[var(--color-text-secondary)]">Manage roles and access for your restaurant team.</p>
			</div>
		</div>
	</div>

	{#if form?.message}
		<div class="p-4 rounded-xl {form.success ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} border font-medium">
			{form.message}
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 space-y-6">
			<div class="glass-strong rounded-2xl overflow-hidden border border-[var(--color-border)]">
				<div class="p-6 border-b border-[var(--color-border)]">
					<h2 class="text-lg font-semibold text-[var(--color-text)]">Current Staff</h2>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left border-collapse">
						<thead>
							<tr class="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
								<th class="p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Email</th>
								<th class="p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Role</th>
								<th class="p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Status</th>
								<th class="p-4 text-sm font-semibold text-[var(--color-text-secondary)] text-right">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[var(--color-border)]">
							{#each staffList as staff}
								<tr class="hover:bg-[var(--color-border)]/30 transition-colors">
									<td class="p-4">
										<div class="text-sm font-medium text-[var(--color-text)]">{staff.email}</div>
										<div class="text-xs text-[var(--color-text-muted)] mt-1 font-mono">{staff.user_id}</div>
									</td>
									<td class="p-4">
										{#if staff.role === 'owner'}
											<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium border border-brand/20">
												<Shield size={14} /> Owner
											</span>
										{:else if staff.role === 'chef'}
											<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
												<UtensilsCrossed size={14} /> Chef
											</span>
										{:else if staff.role === 'waiter'}
											<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium border border-blue-500/20">
												<Users size={14} /> Waiter
											</span>
										{/if}
									</td>
									<td class="p-4">
										{#if staff.role === 'waiter'}
											{#if staff.is_available}
												<span class="inline-flex items-center gap-1.5 text-green-500 text-sm font-medium">
													<span class="w-2 h-2 rounded-full bg-green-500"></span> Available
												</span>
											{:else}
												<span class="inline-flex items-center gap-1.5 text-[var(--color-text-muted)] text-sm font-medium">
													<span class="w-2 h-2 rounded-full bg-[var(--color-text-muted)]"></span> Offline
												</span>
											{/if}
										{:else}
											<span class="text-[var(--color-text-muted)] text-sm">-</span>
										{/if}
									</td>
									<td class="p-4 text-right">
										{#if staff.role !== 'owner'}
											<form method="POST" action="?/remove" use:enhance={() => { isRemoving = true; return async ({ update }) => { await update(); isRemoving = false; } }}>
												<input type="hidden" name="staffId" value={staff.id} />
												<button type="submit" disabled={isRemoving} class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove Staff">
													<Trash2 size={18} />
												</button>
											</form>
										{:else}
											<span class="text-xs text-[var(--color-text-muted)] italic">Cannot remove</span>
										{/if}
									</td>
								</tr>
							{/each}
							{#if staffList.length === 0}
								<tr>
									<td colspan="4" class="p-8 text-center text-[var(--color-text-muted)]">No staff members found.</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div class="space-y-6">
			<div class="glass-strong rounded-2xl p-6 border border-[var(--color-border)]">
				<div class="flex items-center gap-3 mb-6">
					<UserPlus size={20} class="text-[var(--color-brand)]" />
					<h3 class="text-lg font-bold text-[var(--color-text)]">Invite Staff</h3>
				</div>
				<form method="POST" action="?/invite" use:enhance={() => { isInviting = true; return async ({ update }) => { await update({ reset: true }); isInviting = false; } }} class="space-y-4">
					<div class="space-y-1.5">
						<label for="email" class="block text-sm font-bold text-[var(--color-text-secondary)]">Staff Email</label>
						<input type="email" id="email" name="email" required placeholder="chef@example.com" class="w-full px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)]" />
					</div>
					<div class="space-y-1.5">
						<label for="role" class="block text-sm font-bold text-[var(--color-text-secondary)]">Role</label>
						<select id="role" name="role" required class="w-full px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)]">
							<option value="chef">Chef (Kitchen Dashboard)</option>
							<option value="waiter">Waiter (Tables Dashboard)</option>
						</select>
					</div>
					<button type="submit" disabled={isInviting} class="w-full px-4 py-2.5 rounded-xl bg-[var(--color-brand)] text-white font-bold hover:brightness-110 transition-all disabled:opacity-50">
						{isInviting ? 'Inviting...' : 'Invite Staff Member'}
					</button>
				</form>
				<p class="mt-4 text-xs text-[var(--color-text-muted)]">
					Invited staff can immediately log in via Google using the provided email address to access their role dashboard.
				</p>
			</div>
		</div>
	</div>
</div>
