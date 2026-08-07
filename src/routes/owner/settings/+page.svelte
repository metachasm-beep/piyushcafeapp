<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { toast } from 'svelte-sonner';
  import { Store, Upload, Image as ImageIcon } from 'lucide-svelte';

  // We inherit data.restaurant from the +layout.server.ts via $props()
  let { data } = $props();
  let restaurant = $derived(data.restaurant);

  let isUploading = $state(false);
  let imageFile = $state<File | null>(null);
  let imagePreview = $state<string | null>(null);

  function handleImageSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Image exceeds 1MB limit. Please choose a smaller file.');
        input.value = '';
        imageFile = null;
        imagePreview = null;
        return;
      }
      imageFile = file;
      imagePreview = URL.createObjectURL(imageFile);
    }
  }

  async function uploadLogo(e: SubmitEvent) {
    e.preventDefault();
    if (!restaurant) { toast.error('Error: Restaurant data not found'); return; }
    if (!supabase) { toast.error('Error: Supabase client not initialized'); return; }
    if (!imageFile) { toast.error('Error: No image file selected'); return; }

    isUploading = true;
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${restaurant.id}_logo_${Date.now()}.${fileExt}`;
      const filePath = `${restaurant.id}/${fileName}`;
      
      // Upload to restaurant-logos bucket
      const { error: uploadError } = await supabase.storage
        .from('restaurant-logos')
        .upload(filePath, imageFile, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-logos')
        .getPublicUrl(filePath);
        
      // Update restaurants table
      const { error: dbError } = await supabase
        .from('restaurants')
        .update({ logo_url: publicUrl })
        .eq('id', restaurant.id);
        
      if (dbError) throw dbError;
      
      toast.success('Restaurant logo updated successfully!');
      
      // Reload page to reflect changes in layout
      window.location.reload();
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to upload logo');
    } finally {
      isUploading = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - Owner Portal</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
  <div>
    <h2 class="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
      <Store class="text-zinc-900" /> Restaurant Settings
    </h2>
    <p class="text-sm text-zinc-500 mt-1">Manage your public profile and business details.</p>
  </div>

  <div class="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm">
    {#if restaurant}
      <h3 class="text-lg font-bold mb-2 text-zinc-950">Business Logo</h3>
    <p class="text-sm text-zinc-500 mb-6">
      Upload a high-quality logo. This will be displayed on your Staff Portal and the Customer Table App.
    </p>

    <form onsubmit={uploadLogo} class="flex flex-col md:flex-row gap-8 items-start">
      
      <!-- Current/Preview Logo -->
      <div class="flex-shrink-0 flex flex-col items-center gap-4">
        <div class="w-32 h-32 md:w-48 md:h-48 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden relative shadow-sm hover:bg-zinc-100 transition-colors">
          {#if imagePreview}
            <img src={imagePreview} alt="Preview" class="w-full h-full object-cover" />
          {:else if restaurant?.logo_url}
            <img src={restaurant.logo_url} alt={restaurant.name} class="w-full h-full object-cover" />
          {:else}
            <ImageIcon size={48} class="text-zinc-300" />
          {/if}
          <input 
            type="file" 
            accept="image/*" 
            onchange={handleImageSelect} 
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            title="Click to select logo"
          />
        </div>
        {#if imageFile}
          <span class="text-xs font-bold text-emerald-600">New image selected</span>
        {:else if restaurant?.logo_url}
          <span class="text-xs text-zinc-500 font-medium">Current logo</span>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex-1 space-y-4 w-full">
        <div class="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
          <p class="text-sm font-semibold text-zinc-900">Requirements:</p>
          <ul class="text-sm text-zinc-500 list-disc list-inside space-y-1">
            <li>Recommended resolution: 500x500px</li>
            <li>Aspect Ratio: 1:1 (Square)</li>
            <li>Max file size: 1MB</li>
            <li>Formats: JPG, PNG, WebP</li>
          </ul>
        </div>
        
        <button 
          type="submit" 
          disabled={isUploading || !imageFile}
          class="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {#if isUploading}
            <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            Uploading...
          {:else}
            <Upload size={16} />
            Save Logo
          {/if}
        </button>
      </div>

      </form>
    {:else}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <Store class="w-12 h-12 text-zinc-300 mb-4" />
        <h3 class="text-lg font-semibold text-zinc-900">No Restaurant Provisioned</h3>
        <p class="text-sm text-zinc-500 max-w-md mt-2 mb-6">
          Your account is not linked to a restaurant yet. If the superadmin just provisioned one for you, please refresh the page to load your data.
        </p>
        <button onclick={() => window.location.reload()} class="inline-flex h-9 items-center justify-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950">
          Refresh Page
        </button>
        {#if data.debugInfo}
          <div class="mt-8 p-4 bg-zinc-100 rounded text-left text-xs text-zinc-700 w-full overflow-auto font-mono">
            <strong>Debug Info:</strong>
            <pre>{JSON.stringify(data.debugInfo, null, 2)}</pre>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
