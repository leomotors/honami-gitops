<script lang="ts">
  type Props = { message: string };
  let { message }: Props = $props();
</script>

<div
  class="rounded-2xl border border-pink-100 bg-white/70 p-8 text-center backdrop-blur-sm"
>
  <p class="text-sm text-slate-400">
    {message}
  </p>
</div>
