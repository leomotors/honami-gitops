<script lang="ts">
  import StatusBadge from "$components/StatusBadge.svelte";
  import type { NetworkGroup } from "$lib/infrastructure/infrastructure";

  type Props = {
    group: NetworkGroup;
    expanded: boolean;
    onToggle: () => void;
  };

  let { group, expanded, onToggle }: Props = $props();

  let isDefault = $derived(group.networkName === "(default)");
</script>

<div
  class="overflow-hidden rounded-2xl border border-pink-100 bg-white/70 backdrop-blur-sm"
>
  <button
    class="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-pink-50/50"
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
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg {isDefault
          ? 'bg-linear-to-br from-slate-300 to-slate-400'
          : group.external
            ? 'bg-linear-to-br from-violet-500 to-fuchsia-500'
            : 'bg-linear-to-br from-slate-400 to-slate-500'}"
      >
        <svg
          class="h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
      </div>
      <div>
        <div class="flex items-center gap-2">
          {#if isDefault}
            <span class="text-sm font-semibold text-slate-400 italic">
              no network
            </span>
          {:else}
            <span class="font-mono text-sm font-semibold text-slate-700">
              {group.networkName}
            </span>
          {/if}
          {#if group.external}
            <span
              class="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600 ring-1 ring-violet-200"
            >
              external
            </span>
          {:else if !isDefault}
            <span
              class="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200"
            >
              internal
            </span>
          {/if}
        </div>
        <p class="text-xs text-slate-400">
          {group.services.length} service{group.services.length !== 1
            ? "s"
            : ""}
          {isDefault ? "" : "connected"}
        </p>
      </div>
    </div>
  </button>

  {#if expanded}
    <div
      class="divide-y divide-pink-50 border-t border-pink-100/50"
      style="animation: fade-in-up 0.2s ease-out;"
    >
      {#each group.services as svc (svc.containerName + svc.composePath)}
        <div
          class="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-pink-50/30"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-medium text-slate-700">
                {svc.containerName}
              </span>
              <StatusBadge status={svc.status} />
            </div>
            <p class="mt-0.5 truncate font-mono text-[11px] text-slate-400">
              {svc.image}
            </p>
          </div>
          <span
            class="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
          >
            {svc.folder}/
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>
