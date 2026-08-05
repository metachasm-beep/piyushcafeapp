<script lang="ts">
  import { AlertTriangle } from 'lucide-svelte';

  type Props = {
    title?: string;
    message: string;
  };

  let { title = 'Something went wrong', message }: Props = $props();
</script>

<div class="sa-error-banner" role="alert">
  <AlertTriangle size={18} strokeWidth={2} style="flex-shrink:0;margin-top:1px;" />
  <div>
    <strong>{title}</strong>
    <p>{message}</p>
  </div>
</div>
