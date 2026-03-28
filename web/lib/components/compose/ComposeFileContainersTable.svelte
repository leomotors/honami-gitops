<script lang="ts">
  import StatusBadge from "$components/StatusBadge.svelte";
  import { formatPorts, shortPath } from "$lib/compose/composePageHelpers";
  import type { ComposeFile } from "$lib/types";
  import { STATUS_STYLES } from "$lib/types";

  type Props = {
    file: ComposeFile;
    first: boolean;
    expandedContainers: Record<string, boolean>;
    onToggleContainer: (key: string) => void;
  };

  let { file, first, expandedContainers, onToggleContainer }: Props = $props();
</script>

<div class={first ? "" : "mt-5"}>
  <div class="mb-2 flex items-center gap-2 px-1">
    <span class="font-mono text-xs text-slate-400">
      {shortPath(file.path)}
    </span>
    <StatusBadge status={file.status} />
  </div>

  <div class="overflow-x-auto rounded-xl border border-pink-100/60">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-pink-100/40 bg-pink-50/40">
          <th
            class="px-4 py-2 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
          >
            Container
          </th>
          <th
            class="px-4 py-2 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
          >
            Image
          </th>
          <th
            class="px-4 py-2 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
          >
            Status
          </th>
          <th
            class="px-4 py-2 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
          >
            Ports
          </th>
        </tr>
      </thead>
      <tbody>
        {#each file.containers as container (container.name)}
          {@const containerKey = `${file.path}/${container.name}`}
          {@const hasDetails = (container.outdatedDetails?.length ?? 0) > 0}
          <tr
            class="border-b border-pink-50 transition-colors last:border-0
              {container.status === 'Outdated'
              ? 'bg-rose-50/50'
              : container.status === 'Down'
                ? 'bg-red-50/30'
                : 'hover:bg-pink-50/30'}
              {hasDetails ? 'cursor-pointer' : ''}"
            onclick={() => hasDetails && onToggleContainer(containerKey)}
          >
            <td class="px-4 py-2.5 whitespace-nowrap">
              <span class="font-mono text-xs text-slate-700">
                {container.name}
              </span>
            </td>
            <td class="px-4 py-2.5 whitespace-nowrap">
              <span class="font-mono text-xs text-slate-500">
                {container.image}
              </span>
            </td>
            <td class="px-4 py-2.5 whitespace-nowrap">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1
                  {STATUS_STYLES[container.status].bg}
                  {STATUS_STYLES[container.status].text}
                  {STATUS_STYLES[container.status].ring}"
                style={container.status === "Outdated"
                  ? "animation: pulse-glow 2s ease-in-out infinite;"
                  : ""}
              >
                <span
                  class="h-1.5 w-1.5 rounded-full {STATUS_STYLES[
                    container.status
                  ].dot}
                    {container.status === 'Outdated' ||
                  container.status === 'Down'
                    ? 'animate-pulse'
                    : ''}"
                ></span>
                {container.status}
                {#if hasDetails}
                  <svg
                    class="h-3 w-3 opacity-50 transition-transform {expandedContainers[
                      containerKey
                    ]
                      ? 'rotate-180'
                      : ''}"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                {/if}
              </span>
            </td>
            <td
              class="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-slate-400"
            >
              {formatPorts(container.ports)}
            </td>
          </tr>

          {#if hasDetails && expandedContainers[containerKey]}
            <tr>
              <td
                colspan="4"
                class="bg-rose-50/60 px-4 py-3"
                style="animation: fade-in-up 0.15s ease-out;"
              >
                <div class="space-y-2 text-xs">
                  <p class="font-medium text-rose-700">Out of sync details:</p>
                  {#each container.outdatedDetails ?? [] as detail, index (index)}
                    <div class="flex items-start gap-2">
                      <span
                        class="mt-0.5 shrink-0 rounded bg-rose-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-rose-500 uppercase"
                      >
                        {detail.type}
                      </span>
                      <span class="text-slate-600">
                        {detail.message}
                      </span>
                    </div>
                  {/each}
                </div>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>
