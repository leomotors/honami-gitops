<script lang="ts">
  import GradientAccentText from "$components/GradientAccentText.svelte";
  import { formatTime } from "$lib/types";

  type Props = {
    datetime: string;
    networkCount: number;
    driveCount: number;
  };

  let { datetime, networkCount, driveCount }: Props = $props();
</script>

<div class="mb-8">
  <h1 class="text-3xl font-bold text-slate-800">
    <GradientAccentText text="Infrastructure" />
    Map
  </h1>
  <p class="mt-1 text-sm text-slate-500">
    Last scanned {formatTime(datetime)} · {networkCount} network{networkCount !==
    1
      ? "s"
      : ""}
    · {driveCount} drive{driveCount !== 1 ? "s" : ""}
  </p>
</div>
