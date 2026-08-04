<script lang="ts">
  import { page } from '$app/state';
</script>

<div
  class="min-h-screen flex items-center justify-center flex-col gap-6 px-4"
  style="background: var(--color-bg); color: var(--color-text-primary);"
>
  <div class="text-6xl">🍴</div>
  <div class="text-center">
    <h1 class="text-4xl font-bold mb-2" style="font-family: var(--font-display);">
      {page.status}
    </h1>
    <p class="text-lg" style="color: var(--color-text-secondary);">
      {page.error?.message ?? 'Something went wrong.'}
    </p>
  </div>
  <a href="/" class="btn-brand">← Back to Menu</a>
</div>
