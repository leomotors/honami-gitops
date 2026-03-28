<script lang="ts">
  import StatusBadge from "$components/StatusBadge.svelte";
  import type { TraefikService } from "$lib/services/discovery";

  type Props = { service: TraefikService };
  let { service }: Props = $props();
</script>

<a
  href={service.url}
  target="_blank"
  rel="noopener noreferrer external"
  class="group relative overflow-hidden rounded-2xl border border-pink-100 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-pink-200 hover:shadow-md hover:shadow-pink-100/50"
>
  <div class="mb-3 flex items-start justify-between">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="font-mono text-sm font-semibold text-slate-700">
          {service.containerName}
        </span>
        <StatusBadge status={service.status} />
      </div>
      <p class="mt-1 truncate font-mono text-xs text-slate-400">
        {service.image}
      </p>
    </div>
    <svg
      class="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-pink-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  </div>
  <div
    class="flex items-center gap-1.5 text-sm text-pink-600 transition-colors group-hover:text-pink-700"
  >
    <svg
      class="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
      />
    </svg>
    <span class="truncate font-medium">
      {service.url}
    </span>
  </div>
  <div class="mt-2">
    <span
      class="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
    >
      {service.folder}/
    </span>
  </div>
</a>
