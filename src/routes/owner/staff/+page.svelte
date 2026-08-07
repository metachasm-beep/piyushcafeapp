<script lang="ts">
	import { Users, UserPlus, Shield, UtensilsCrossed, Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let isInviting = $state(false);
	let isRemoving = $state(false);
	let staffList = $derived(data.staff || []);
</script>

<svelte:head>
	<title>Staff Management | Owner</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-950">Staff Management</h1>
			<p class="text-sm text-zinc-500 mt-0.5">Manage roles and access for your restaurant team.</p>
		</div>
	</div>

	{#if form?.message}
		<div class="rounded-lg border px-4 py-3 text-sm font-medium {form.success ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}">
			{form.message}
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Staff Table -->
		<div class="lg:col-span-2">
			<div class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
				<div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
					<h2 class="text-base font-semibold text-zinc-950">Current Staff</h2>
					<span class="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700">{staffList.length} members</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead>
							<tr class="border-b border-zinc-100 bg-zinc-50/50">
								<th class="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
								<th class="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
								<th class="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
								<th class="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-100">
							{#each staffList as staff}
								<tr class="hover:bg-zinc-50/50 transition-colors">
									<td class="px-6 py-4">
										<div class="text-sm font-medium text-zinc-900">{staff.email}</div>
										<div class="text-xs text-zinc-400 font-mono mt-0.5 truncate max-w-[180px]">{staff.user_id}</div>
									</td>
									<td class="px-6 py-4">
										{#if staff.role === 'owner'}
											<span class="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
												<Shield size={12} /> Owner
											</span>
										{:else if staff.role === 'chef'}
											<span class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
												<UtensilsCrossed size={12} /> Chef
											</span>
										{:else if staff.role === 'waiter'}
											<span class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
												<Users size={12} /> Waiter
											</span>
										{/if}
									</td>
									<td class="px-6 py-4">
										{#if staff.role === 'waiter'}
											{#if staff.is_available}
												<span class="inline-flex items-center gap-1.5 text-green-600 text-sm font-medium">
													<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Available
												</span>
											{:else}
												<span class="inline-flex items-center gap-1.5 text-zinc-400 text-sm font-medium">
													<span class="w-1.5 h-1.5 rounded-full bg-zinc-300"></span> Offline
												</span>
											{/if}
										{:else}
											<span class="text-zinc-300 text-sm">—</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-right">
										{#if staff.role !== 'owner'}
											<form method="POST" action="?/remove" use:enhance={() => { isRemoving = true; return async ({ update }) => { await update(); isRemoving = false; } }}>
												<input type="hidden" name="staffId" value={staff.id} />
												<button
													type="submit"
													disabled={isRemoving}
													class="inline-flex items-center justify-center h-8 w-8 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
													title="Remove Staff"
												>
													<Trash2 size={16} />
												</button>
											</form>
										{:else}
											<span class="text-xs text-zinc-300 italic">Cannot remove</span>
										{/if}
									</td>
								</tr>
							{/each}
							{#if staffList.length === 0}
								<tr>
									<td colspan="4" class="px-6 py-12 text-center text-sm text-zinc-400">
										No staff members found. Invite someone below.
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Invite Panel -->
		<div>
			<div class="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
				<div class="flex items-center gap-3 mb-6">
					<div class="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center">
						<UserPlus size={18} class="text-zinc-700" />
					</div>
					<h3 class="text-base font-semibold text-zinc-950">Invite Staff</h3>
				</div>

				<form method="POST" action="?/invite" use:enhance={() => { isInviting = true; return async ({ update }) => { await update({ reset: true }); isInviting = false; } }} class="space-y-4">
					<div class="space-y-1.5">
						<label for="email" class="block text-sm font-medium text-zinc-700">Staff Email</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							placeholder="chef@example.com"
							class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
						/>
					</div>
					<div class="space-y-1.5">
						<label for="role" class="block text-sm font-medium text-zinc-700">Role</label>
						<select
							id="role"
							name="role"
							required
							class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 appearance-none"
						>
							<option value="chef">Chef (Kitchen Dashboard)</option>
							<option value="waiter">Waiter (Tables Dashboard)</option>
						</select>
					</div>
					<button
						type="submit"
						disabled={isInviting}
						class="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 text-sm font-medium transition-colors disabled:opacity-50"
					>
						{isInviting ? 'Inviting...' : 'Invite Staff Member'}
					</button>
				</form>

				<p class="mt-4 text-xs text-zinc-400 leading-relaxed">
					Invited staff can immediately log in using the provided email address to access their role dashboard.
				</p>
			</div>
		</div>
	</div>
</div>
