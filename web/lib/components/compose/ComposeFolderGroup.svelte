<script lang="ts">
  import type { FolderGroup } from "$lib/compose/composePageHelpers";
  import { STATUS_PRIORITY, STATUS_STYLES } from "$lib/types";

  import ComposeFileContainersTable from "./ComposeFileContainersTable.svelte";

  type Props = {
    group: FolderGroup;
    expanded: boolean;
    onToggle: () => void;
    expandedContainers: Record<string, boolean>;
    onToggleContainer: (key: string) => void;
  };

  let {
    group,
    expanded,
    onToggle,
    expandedContainers,
    onToggleContainer,
  }: Props = $props();

  const hasIssues = $derived(
    group.worstStatus === "Outdated" ||
      group.worstStatus === "Down" ||
      group.worstStatus === "Unhealthy",
  );
</script>

<div
  class="overflow-hidden rounded-2xl border bg-white/70 backdrop-blur-sm transition-shadow {hasIssues
    ? 'border-rose-200 shadow-md shadow-rose-100/50'
    : 'border-pink-100 shadow-sm'}"
>
  <button
    class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-pink-50/50"
    onclick={onToggle}
  >
    <div class="flex items-center gap-3">
      <svg
        class="h-4 w-4 text-slate-400 transition-transform duration-200 {expanded
          ? 'rotate-90'
          : ''}"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m8.25 4.5 7.5 7.5-7.5 7.5"
        />
      </svg>
      <span class="font-mono text-sm font-semibold text-slate-700">
        {group.name}/
      </span>
      <span class="text-xs text-slate-400">
        {group.composeFiles.length} file{group.composeFiles.length !== 1
          ? "s"
          : ""} · {group.totalContainers} container{group.totalContainers !== 1
          ? "s"
          : ""}
      </span>
    </div>
    <div class="flex items-center gap-3">
      {#each STATUS_PRIORITY as status (status)}
        {#if group.statusCounts[status] > 0}
          <span
            class="inline-flex items-center gap-1 text-xs font-medium {STATUS_STYLES[
              status
            ].text}"
          >
            <span
              class="h-1.5 w-1.5 rounded-full {STATUS_STYLES[status]
                .dot} {status === 'Outdated' ? 'animate-pulse' : ''}"
            ></span>
            {group.statusCounts[status]}
          </span>
        {/if}
      {/each}
    </div>
  </button>

  {#if expanded}
    <div
      class="border-t border-pink-100/50 px-6 pt-3 pb-5"
      style="animation: fade-in-up 0.2s ease-out;"
    >
      {#each group.composeFiles as file, fileIdx (file.path)}
        <ComposeFileContainersTable
          {file}
          first={fileIdx === 0}
          {expandedContainers}
          {onToggleContainer}
        />
      {/each}
    </div>
  {/if}
</div>
