<script lang="ts">
  import GradientAccentText from "$components/GradientAccentText.svelte";
  import { formatTime } from "$lib/types";

  type Props = {
    datetime: string;
    composeCount: number;
    timeTaken: number;
    outdatedCount: number;
    refreshing: boolean;
    restarting: boolean;
    onScan: () => void;
    onRestartOutdated: () => void;
  };

  let {
    datetime,
    composeCount,
    timeTaken,
    outdatedCount,
    refreshing,
    restarting,
    onScan,
    onRestartOutdated,
  }: Props = $props();
</script>

<div
  class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
>
  <div>
    <h1 class="text-3xl font-bold text-slate-800">
      Compose
      <GradientAccentText text="Status" />
    </h1>
    <p class="mt-1 text-sm text-slate-500">
      Last scanned {formatTime(datetime)} · {composeCount} compose file{composeCount !==
      1
        ? "s"
        : ""} · {timeTaken.toFixed(1)}s
    </p>
  </div>
  <div class="flex gap-2">
    <button
      class="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-pink-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-pink-200 transition-all hover:shadow-lg hover:shadow-pink-300 disabled:opacity-50"
      onclick={onScan}
      disabled={refreshing}
    >
      <svg
        class="h-4 w-4"
        class:animate-spin={refreshing}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182"
        />
      </svg>
      {refreshing ? "Scanning…" : "Rescan"}
    </button>
    {#if outdatedCount > 0}
      <button
        class="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-50"
        onclick={onRestartOutdated}
        disabled={restarting}
      >
        {restarting ? "Restarting…" : "Restart Outdated"}
      </button>
    {/if}
  </div>
</div>
