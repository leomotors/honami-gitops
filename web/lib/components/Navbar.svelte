<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";

  const links = [
    { href: "/" as const, label: "Compose Status" },
    { href: "/services" as const, label: "Service Discovery" },
    { href: "/infrastructure" as const, label: "Infrastructure" },
  ];
</script>

<header
  class="sticky top-0 z-50 border-b border-pink-200/30 bg-white/60 backdrop-blur-xl"
>
  <div class="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
    <a href={resolve("/")} class="flex items-center gap-3">
      <img
        src="/honami-nom.webp"
        alt="Honami"
        class="h-8 w-8 rounded-lg object-cover shadow-md shadow-pink-200"
      />
      <span class="text-lg font-semibold tracking-tight text-slate-800">
        Honami
        <span
          class="bg-linear-to-r from-pink-500 to-fuchsia-500 bg-clip-text text-transparent"
        >
          GitOps
        </span>
      </span>
    </a>

    <nav class="flex items-center gap-1">
      {#each links as link (link.href)}
        {@const isActive = page.url.pathname === link.href}
        <a
          href={resolve(link.href)}
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {isActive
            ? 'bg-pink-100/60 text-pink-700'
            : 'text-slate-500 hover:bg-pink-50/50 hover:text-slate-700'}"
        >
          {link.label}
        </a>
      {/each}
    </nav>
  </div>
</header>
