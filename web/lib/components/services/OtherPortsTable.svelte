<script lang="ts">
  import StatusBadge from "$components/StatusBadge.svelte";
  import type { PortService } from "$lib/services/discovery";

  type Props = { services: PortService[] };
  let { services }: Props = $props();
</script>

<div
  class="overflow-hidden rounded-2xl border border-pink-100 bg-white/70 backdrop-blur-sm"
>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-pink-100/40 bg-pink-50/40">
          <th
            class="px-5 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
          >
            Container
          </th>
          <th
            class="px-5 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
          >
            Image
          </th>
          <th
            class="px-5 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
          >
            Status
          </th>
          <th
            class="px-5 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
          >
            Open Ports
          </th>
          <th
            class="px-5 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
          >
            Folder
          </th>
        </tr>
      </thead>
      <tbody>
        {#each services as svc (svc.containerName)}
          <tr
            class="border-b border-pink-50 transition-colors last:border-0 hover:bg-pink-50/30"
          >
            <td class="px-5 py-3 whitespace-nowrap">
              <span class="font-mono text-xs font-medium text-slate-700">
                {svc.containerName}
              </span>
            </td>
            <td class="px-5 py-3 whitespace-nowrap">
              <span class="font-mono text-xs text-slate-500">
                {svc.image}
              </span>
            </td>
            <td class="px-5 py-3 whitespace-nowrap">
              <StatusBadge status={svc.status} />
            </td>
            <td class="px-5 py-3 whitespace-nowrap">
              <div class="flex flex-wrap gap-1.5">
                {#each svc.ports as port (`${port.published}-${port.target}-${port.protocol ?? ""}`)}
                  <span
                    class="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 font-mono text-xs font-medium text-sky-700 ring-1 ring-sky-200"
                  >
                    {port.published}:{port.target}{port.protocol
                      ? `/${port.protocol}`
                      : ""}
                  </span>
                {/each}
              </div>
            </td>
            <td class="px-5 py-3 whitespace-nowrap">
              <span
                class="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
              >
                {svc.folder}/
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
