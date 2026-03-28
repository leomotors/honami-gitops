<script lang="ts">
  type Props = { count: number };
  let { count }: Props = $props();
</script>

{#if count > 0}
  <div
    class="mb-8 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 backdrop-blur-sm"
    style="animation: pulse-glow 3s ease-in-out infinite;"
  >
    <div
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100"
    >
      <svg
        class="h-5 w-5 text-rose-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
    </div>
    <div>
      <p class="text-sm font-semibold text-rose-700">
        {count} container{count > 1 ? "s" : ""} out of sync
      </p>
      <p class="text-xs text-rose-600/70">
        These services don't match their compose definitions and need a restart
      </p>
    </div>
  </div>
{/if}
