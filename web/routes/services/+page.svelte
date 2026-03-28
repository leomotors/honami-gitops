<script lang="ts">
  import { onMount } from "svelte";

  import EmptyStatePanel from "$components/EmptyStatePanel.svelte";
  import ErrorCard from "$components/ErrorCard.svelte";
  import LoadingSpinner from "$components/LoadingSpinner.svelte";
  import OtherPortsTable from "$components/services/OtherPortsTable.svelte";
  import ServiceDiscoveryHeader from "$components/services/ServiceDiscoveryHeader.svelte";
  import ServiceSectionHeading from "$components/services/ServiceSectionHeading.svelte";
  import TraefikServiceCard from "$components/services/TraefikServiceCard.svelte";
  import { api } from "$lib/apiClient";
  import { extractDiscoveredServices } from "$lib/services/discovery";
  import type { ComposeData } from "$lib/types";

  let data = $state<ComposeData | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);

  let services = $derived.by(() => {
    if (!data)
      return { traefik: [], other: [] } as ReturnType<
        typeof extractDiscoveredServices
      >;
    return extractDiscoveredServices(data);
  });

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
  <title>Service Discovery — Honami GitOps</title>
  <meta name="description" content="Discovered services and their endpoints" />
</svelte:head>

{#if loading}
  <LoadingSpinner message="Discovering services…" />
{:else if error}
  <ErrorCard
    title="Unable to Load Services"
    message={error}
    onretry={() => {
      loading = true;
      fetchData();
    }}
  />
{:else if data}
  <ServiceDiscoveryHeader
    datetime={data.metadata.datetime}
    traefikCount={services.traefik.length}
    otherCount={services.other.length}
  />

  <section class="mb-10">
    <ServiceSectionHeading title="Traefik Services" variant="traefik" />

    {#if services.traefik.length === 0}
      <EmptyStatePanel message="No traefik-routed services discovered" />
    {:else}
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each services.traefik as svc (svc.containerName)}
          <TraefikServiceCard service={svc} />
        {/each}
      </div>
    {/if}
  </section>

  <section>
    <ServiceSectionHeading title="Other Open Ports" variant="ports" />

    {#if services.other.length === 0}
      <EmptyStatePanel message="No services with public open ports found" />
    {:else}
      <OtherPortsTable services={services.other} />
    {/if}
  </section>
{/if}
