<script lang="ts">
  import { onMount } from "svelte";

  import ComposeFolderGroup from "$components/compose/ComposeFolderGroup.svelte";
  import ComposeOutdatedBanner from "$components/compose/ComposeOutdatedBanner.svelte";
  import ComposeStatusHeader from "$components/compose/ComposeStatusHeader.svelte";
  import ComposeSummaryPanel from "$components/compose/ComposeSummaryPanel.svelte";
  import ErrorCard from "$components/ErrorCard.svelte";
  import LoadingSpinner from "$components/LoadingSpinner.svelte";
  import { api } from "$lib/apiClient";
  import {
    type FolderGroup,
    groupByFolder,
    summarizeComposeData,
  } from "$lib/compose/composePageHelpers";
  import type { ComposeData } from "$lib/types";
  import { getFolderName } from "$lib/types";

  let data = $state<ComposeData | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);
  let refreshing = $state(false);
  let restarting = $state(false);
  let expandedGroups = $state<Record<string, boolean>>({});
  let expandedContainers = $state<Record<string, boolean>>({});

  let groups = $derived(
    data ? groupByFolder(data.composeFiles) : ([] as FolderGroup[]),
  );

  let summary = $derived(data ? summarizeComposeData(data) : null);

  async function fetchData(autoExpand = false) {
    try {
      const res = await api.compose.get();
      if (res.error) {
        error = "Cache not available — trigger a scan first";
        data = null;
        return;
      }
      data = res.data as unknown as ComposeData;
      error = null;
      if (autoExpand) autoExpandGroups();
    } catch {
      error = "Failed to connect to server";
      data = null;
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  function autoExpandGroups() {
    if (!data) return;
    const expanded: Record<string, boolean> = {};
    for (const cf of data.composeFiles) {
      const folder = getFolderName(cf.path);
      for (const c of cf.containers) {
        if (
          c.status === "Outdated" ||
          c.status === "Down" ||
          c.status === "Unhealthy"
        ) {
          expanded[folder] = true;
        }
      }
    }
    expandedGroups = expanded;
  }

  async function triggerScan() {
    refreshing = true;
    try {
      await api.compose.post();
      globalThis.setTimeout(() => fetchData(false), 3000);
    } catch {
      refreshing = false;
    }
  }

  async function restartOutdated() {
    restarting = true;
    try {
      await api.compose.outdated.post();
      globalThis.setTimeout(() => {
        restarting = false;
        fetchData(false);
      }, 5000);
    } catch {
      restarting = false;
    }
  }

  function toggleGroup(name: string) {
    expandedGroups[name] = !expandedGroups[name];
  }

  function toggleContainer(key: string) {
    expandedContainers[key] = !expandedContainers[key];
  }

  onMount(() => fetchData(true));
</script>

<svelte:head>
  <title>Compose Status — Honami GitOps</title>
  <meta name="description" content="Docker Compose service status dashboard" />
</svelte:head>

{#if loading}
  <LoadingSpinner message="Loading compose status…" />
{:else if error}
  <ErrorCard
    title="Unable to Load Status"
    message={error}
    onretry={() => {
      loading = true;
      fetchData(true);
    }}
  />
{:else if data && summary}
  <ComposeStatusHeader
    datetime={data.metadata.datetime}
    composeCount={summary.composeCount}
    timeTaken={data.metadata.timeTaken}
    outdatedCount={summary.counts.Outdated}
    {refreshing}
    {restarting}
    onScan={triggerScan}
    onRestartOutdated={restartOutdated}
  />

  <ComposeSummaryPanel {summary} />
  <ComposeOutdatedBanner count={summary.counts.Outdated} />

  <div class="space-y-4">
    {#each groups as group (group.name)}
      <ComposeFolderGroup
        {group}
        expanded={!!expandedGroups[group.name]}
        onToggle={() => toggleGroup(group.name)}
        {expandedContainers}
        onToggleContainer={toggleContainer}
      />
    {/each}
  </div>

  {#if data.composeFiles.length === 0}
    <div class="py-16 text-center">
      <p class="text-sm text-slate-400">No compose files found</p>
      <button
        class="mt-4 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-pink-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-pink-200 transition-all hover:shadow-lg hover:shadow-pink-300"
        onclick={triggerScan}
      >
        Trigger Scan
      </button>
    </div>
  {/if}
{/if}
