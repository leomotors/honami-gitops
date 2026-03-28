<script lang="ts">
  import { type Status, STATUS_STYLES } from "$lib/types";

  type Props = {
    status: Status;
    pulse?: boolean;
    size?: "sm" | "md";
  };

  let { status, pulse = false, size = "sm" }: Props = $props();

  let styles = $derived(STATUS_STYLES[status]);
  let shouldPulse = $derived(
    pulse || status === "Outdated" || status === "Down",
  );
</script>

<span
  class="inline-flex items-center gap-1.5 rounded-full font-medium ring-1
    {styles.bg} {styles.text} {styles.ring}
    {size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}"
>
  <span
    class="h-1.5 w-1.5 rounded-full {styles.dot} {shouldPulse
      ? 'animate-pulse'
      : ''}"
  ></span>
  {status}
</span>
