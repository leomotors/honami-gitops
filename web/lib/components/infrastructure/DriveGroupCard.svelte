<script lang="ts">
  import { SvelteSet } from "svelte/reactivity";

  import StatusBadge from "$components/StatusBadge.svelte";
  import type { StorageService } from "$lib/infrastructure/infrastructure";

  type Props = {
    services: StorageService[];
    allDrives: string[];
  };

  let { services, allDrives }: Props = $props();

  let activeDrives = new SvelteSet<string>();

  let filtered = $derived.by(() => {
    if (activeDrives.size === 0) return services;
    return services.filter((s) =>
      s.drives.some((d) => activeDrives.has(d.name)),
    );
  });

  function toggleDrive(drive: string) {
    if (activeDrives.has(drive)) {
      activeDrives.delete(drive);
    } else {
      activeDrives.add(drive);
    }
  }

  function clearFilters() {
    activeDrives.clear();
  }

  const DRIVE_COLORS: Record<string, string> = {
    root: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  function driveStyle(drive: string): string {
    return DRIVE_COLORS[drive] ?? "bg-sky-50 text-sky-700 ring-sky-200";
  }

  function driveActiveStyle(drive: string): string {
    if (drive === "root") {
      return activeDrives.has(drive)
        ? "bg-slate-600 text-white ring-slate-700"
        : "bg-slate-100 text-slate-600 ring-slate-300 hover:bg-slate-200";
    }
    return activeDrives.has(drive)
      ? "bg-sky-600 text-white ring-sky-700"
      : "bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100";
  }
</script>

<div class="space-y-4">
  <!-- Drive filter buttons -->
  <div
    class="flex flex-wrap items-center gap-2 rounded-2xl border border-pink-100 bg-white/70 px-5 py-4 backdrop-blur-sm"
  >
    <span class="mr-1 text-xs font-medium text-slate-400">Filter by drive:</span
    >
    {#each allDrives as drive (drive)}
      <button
        class="rounded-full px-3 py-1 font-mono text-xs font-medium ring-1 transition-colors {driveActiveStyle(
          drive,
        )}"
        onclick={() => toggleDrive(drive)}
      >
        {drive}
      </button>
    {/each}
    {#if activeDrives.size > 0}
      <button
        class="ml-1 rounded-full px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
        onclick={clearFilters}
      >
        Clear
      </button>
    {/if}
    <span class="ml-auto text-xs text-slate-400">
      {filtered.length} service{filtered.length !== 1 ? "s" : ""}
    </span>
  </div>

  <!-- Service table -->
  <div
    class="overflow-hidden rounded-2xl border border-pink-100 bg-white/70 backdrop-blur-sm"
  >
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-pink-100/40 bg-pink-50/40">
            <th
              class="px-5 py-2.5 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
            >
              Container
            </th>
            <th
              class="px-5 py-2.5 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
            >
              Image
            </th>
            <th
              class="px-5 py-2.5 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
            >
              Status
            </th>
            <th
              class="px-5 py-2.5 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
            >
              Drives
            </th>
            <th
              class="px-5 py-2.5 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase"
            >
              Folder
            </th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as svc (svc.containerName)}
            <tr
              class="border-b border-pink-50 transition-colors last:border-0 hover:bg-pink-50/30"
            >
              <td class="px-5 py-2.5 whitespace-nowrap">
                <span class="font-mono text-xs font-medium text-slate-700">
                  {svc.containerName}
                </span>
              </td>
              <td class="px-5 py-2.5 whitespace-nowrap">
                <span class="font-mono text-xs text-slate-500">
                  {svc.image}
                </span>
              </td>
              <td class="px-5 py-2.5 whitespace-nowrap">
                <StatusBadge status={svc.status} />
              </td>
              <td class="px-5 py-2.5">
                <div class="flex flex-wrap gap-1.5">
                  {#each svc.drives as drive (drive.name)}
                    <span
                      class="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium ring-1 {driveStyle(
                        drive.name,
                      )}"
                      title={drive.paths.join("\n")}
                    >
                      {drive.name}
                    </span>
                  {/each}
                </div>
              </td>
              <td class="px-5 py-2.5 whitespace-nowrap">
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
</div>
