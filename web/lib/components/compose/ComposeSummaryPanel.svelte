<script lang="ts">
  import {
    DISPLAY_STATUSES,
    type Status,
    STATUS_PRIORITY,
    STATUS_STYLES,
  } from "$lib/types";

  type Summary = {
    counts: Record<Status, number>;
    total: number;
  };

  type Props = { summary: Summary };
  let { summary }: Props = $props();
</script>

<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
  <div
    class="rounded-2xl border border-pink-100 bg-white/70 p-4 text-center backdrop-blur-sm"
  >
    <div class="text-2xl font-bold text-slate-700">{summary.total}</div>
    <div class="text-xs font-medium tracking-wider text-slate-400 uppercase">
      Total
    </div>
  </div>
  {#each DISPLAY_STATUSES as status (status)}
    {#if summary.counts[status] > 0}
      <div
        class="rounded-2xl border border-pink-100 bg-white/70 p-4 text-center backdrop-blur-sm {status ===
          'Outdated' || status === 'Down'
          ? 'ring-1 ' + STATUS_STYLES[status].ring
          : ''}"
      >
        <div class="flex items-center justify-center gap-1.5">
          <span
            class="h-2 w-2 rounded-full {STATUS_STYLES[status].dot} {status ===
              'Outdated' || status === 'Down'
              ? 'animate-pulse'
              : ''}"
          ></span>
          <span class="text-2xl font-bold {STATUS_STYLES[status].text}">
            {summary.counts[status]}
          </span>
        </div>
        <div
          class="text-xs font-medium tracking-wider text-slate-400 uppercase"
        >
          {status}
        </div>
      </div>
    {/if}
  {/each}
</div>

{#if summary.total > 0}
  <div class="mb-8 flex h-2 overflow-hidden rounded-full bg-pink-100/50">
    {#each STATUS_PRIORITY as status (status)}
      {#if summary.counts[status] > 0}
        <div
          class="{STATUS_STYLES[status].dot} transition-all duration-700"
          style="width: {(summary.counts[status] / summary.total) * 100}%"
        ></div>
      {/if}
    {/each}
  </div>
{/if}
