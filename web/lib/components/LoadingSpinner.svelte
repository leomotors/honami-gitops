<script lang="ts">
  type Props = {
    message?: string;
  };

  let { message = "Loading…" }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-32">
  <div class="relative h-12 w-12">
    <div class="absolute inset-0 rounded-full border-2 border-pink-200"></div>
    <div
      class="absolute inset-0 rounded-full border-2 border-transparent border-t-pink-500"
      style="animation: spin 1s linear infinite;"
    ></div>
  </div>
  <p class="mt-4 text-sm font-medium text-pink-400">
    {message}
  </p>
</div>
