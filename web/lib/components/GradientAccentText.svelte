<script lang="ts">
  type Props = { text: string };
  let { text }: Props = $props();
</script>

<span
  class="inline-block bg-linear-to-r from-pink-500 via-fuchsia-500 to-violet-500 bg-size-[200%_auto] bg-clip-text text-transparent"
  style="animation: shimmer 3s linear infinite;"
>
  {text}
</span>
