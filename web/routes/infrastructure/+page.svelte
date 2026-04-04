<script lang="ts">
  import { onMount } from "svelte";

  import EmptyStatePanel from "$components/EmptyStatePanel.svelte";
  import ErrorCard from "$components/ErrorCard.svelte";
  import DriveGroupCard from "$components/infrastructure/DriveGroupCard.svelte";
  import InfrastructureHeader from "$components/infrastructure/InfrastructureHeader.svelte";
  import InfraTabSwitcher from "$components/infrastructure/InfraTabSwitcher.svelte";
  import NetworkGroupCard from "$components/infrastructure/NetworkGroupCard.svelte";
  import LoadingSpinner from "$components/LoadingSpinner.svelte";
  import { api } from "$lib/apiClient";
  import {
    extractNetworkGroups,
    extractStorageServices,
  } from "$lib/infrastructure/infrastructure";
  import type { ComposeData } from "$lib/types";

  let data = $state<ComposeData | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);
  let activeTab = $state<"networks" | "storage">("networks");
  let expandedNetworks = $state<Record<string, boolean>>({});

  let networks = $derived(data ? extractNetworkGroups(data) : []);
  let storage = $derived(
    data
      ? extractStorageServices(data)
      : { services: [], allDrives: [] as string[] },
  );

  function toggleNetwork(name: string) {
    expandedNetworks[name] = !expandedNetworks[name];
  }

  async function fetchData() {
    try {
      const res = await api.compose.get();
      if (res.error) {
        error = "Cache not available — trigger a scan from Compose Status";
        data = null;
        return;
      }
      data = res.data as unknown as ComposeData;
      error = null;
    } catch {
      error = "Failed to connect to server";
      data = null;
    } finally {
      loading = false;
    }
  }

  onMount(() => fetchData());
</script>

<svelte:head>
  <title>Infrastructure Map — Honami GitOps</title>
  <meta
    name="description"
    content="Network dependencies and storage mount overview"
  />
</svelte:head>

{#if loading}
  <LoadingSpinner message="Mapping infrastructure…" />
{:else if error}
  <ErrorCard
    title="Unable to Load Infrastructure"
    message={error}
    onretry={() => {
      loading = true;
      fetchData();
    }}
  />
{:else if data}
  <InfrastructureHeader
    datetime={data.metadata.datetime}
    networkCount={networks.length}
    driveCount={storage.allDrives.length}
  />

  <InfraTabSwitcher active={activeTab} onswitch={(t) => (activeTab = t)} />

  {#if activeTab === "networks"}
    {#if networks.length === 0}
      <EmptyStatePanel message="No networks declared in any compose file" />
    {:else}
      <div class="space-y-3">
        {#each networks as group (group.networkName)}
          <NetworkGroupCard
            {group}
            expanded={!!expandedNetworks[group.networkName]}
            onToggle={() => toggleNetwork(group.networkName)}
          />
        {/each}
      </div>
    {/if}
  {:else if storage.services.length === 0}
    <EmptyStatePanel message="No bind-mount volumes found" />
  {:else}
    <DriveGroupCard services={storage.services} allDrives={storage.allDrives} />
  {/if}
{/if}
