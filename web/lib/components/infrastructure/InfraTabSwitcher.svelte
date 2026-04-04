<script lang="ts">
  type Tab = "networks" | "storage";

  type Props = {
    active: Tab;
    onswitch: (tab: Tab) => void;
  };

  let { active, onswitch }: Props = $props();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    {
      id: "networks",
      label: "Network Dependencies",
      icon: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
    },
    {
      id: "storage",
      label: "Storage Mounts",
      icon: "M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.602H7.923a3.375 3.375 0 0 0-3.285 2.602l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m19.5 0a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3m16.5 0h.008v.008h-.008v-.008Zm-3 0h.008v.008h-.008v-.008Z",
    },
  ];
</script>

<div class="mb-6 flex gap-1 rounded-xl bg-white/50 p-1 backdrop-blur-sm">
  {#each tabs as tab (tab.id)}
    <button
      class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
        {active === tab.id
        ? 'bg-white text-pink-700 shadow-sm shadow-pink-100'
        : 'text-slate-500 hover:text-slate-700'}"
      onclick={() => onswitch(tab.id)}
    >
      <svg
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d={tab.icon} />
      </svg>
      {tab.label}
    </button>
  {/each}
</div>
