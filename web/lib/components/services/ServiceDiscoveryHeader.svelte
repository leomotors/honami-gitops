<script lang="ts">
  import GradientAccentText from "$components/GradientAccentText.svelte";
  import { formatTime } from "$lib/types";

  type Props = {
    datetime: string;
    traefikCount: number;
    otherCount: number;
  };

  let { datetime, traefikCount, otherCount }: Props = $props();
</script>

<div class="mb-8">
  <h1 class="text-3xl font-bold text-slate-800">
    Service
    <GradientAccentText text="Discovery" />
  </h1>
  <p class="mt-1 text-sm text-slate-500">
    Last scanned {formatTime(datetime)} · {traefikCount} traefik service{traefikCount !==
    1
      ? "s"
      : ""}
    · {otherCount} other endpoint{otherCount !== 1 ? "s" : ""}
  </p>
</div>
