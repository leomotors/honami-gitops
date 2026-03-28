<script lang="ts">
  import "./layout.css";

  import type { Snippet } from "svelte";

  import Navbar from "$components/Navbar.svelte";

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="min-h-screen">
  <Navbar />

  <main class="mx-auto max-w-7xl px-6 py-8">
    {@render children()}
  </main>
</div>
