<script lang="ts">
  import { page } from '$app/stores';
  import { LayoutDashboard, Users, Store, Settings, Menu, X, LogOut, Search, Bell } from 'lucide-svelte';
  
  let { children } = $props();
  let mobileMenuOpen = $state(false);

  const links = [
    { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/superadmin/approvals', label: 'Approvals', icon: Users },
    { href: '/superadmin/restaurants', label: 'Restaurants', icon: Store },
    { href: '/superadmin/tables', label: 'Tables', icon: LayoutDashboard },
    { href: '/superadmin/menu', label: 'Global Menu', icon: Settings },
  ];
</script>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #000000;
    color: #ffffff;
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
  }

  /* visionOS inspired animated mesh background */
  .spatial-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    background-color: #0f0c29;
    background-image: 
      radial-gradient(circle at 15% 50%, rgba(79, 70, 229, 0.4), transparent 50%),
      radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.3), transparent 50%),
      radial-gradient(circle at 50% 80%, rgba(14, 165, 233, 0.4), transparent 50%);
    filter: blur(60px);
    animation: pulseBg 15s ease-in-out infinite alternate;
  }

  @keyframes pulseBg {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(1.1); opacity: 1; }
  }

  /* Official Taste-Skill Liquid Glass Approximation (adapted for variable radii) */
  :global(.liquid-glass) {
    position: relative;
    isolation: isolate;
    border: 1px solid rgb(255 255 255 / .32);
    background:
      linear-gradient(135deg, rgb(255 255 255 / .20), rgb(255 255 255 / .02)),
      rgb(255 255 255 / .08);
    backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
    -webkit-backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / .48),
      inset 0 -1px 0 rgb(255 255 255 / .12),
      0 18px 60px rgb(0 0 0 / .30);
  }

  :global(.liquid-glass::before) {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background:
      radial-gradient(circle at 20% 0%, rgb(255 255 255 / .35), transparent 34%),
      linear-gradient(90deg, rgb(255 255 255 / .12), transparent 42%, rgb(255 255 255 / .08));
    pointer-events: none;
  }

  :global(.liquid-glass::after) {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    border: 1px solid rgb(255 255 255 / .10);
    pointer-events: none;
  }
</style>

<div class="spatial-bg"></div>

<div class="flex h-screen w-screen overflow-hidden text-white/90">
  
  <!-- Mobile Overlay -->
  {#if mobileMenuOpen}
    <div 
      class="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-md"
      onclick={() => mobileMenuOpen = false}
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Spatial Sidebar -->
  <aside 
    class="fixed lg:static inset-y-0 left-0 z-50 w-[280px] lg:m-4 lg:mr-2 rounded-3xl liquid-glass flex flex-col pt-10 pb-8 px-6 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 {mobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%]'}"
  >
    <div class="flex items-center justify-between lg:hidden mb-10">
      <h2 class="text-xl font-bold tracking-tight text-white">Menu</h2>
      <button onclick={() => mobileMenuOpen = false} class="p-2 text-white/50 hover:text-white transition-colors">
        <X size={24} />
      </button>
    </div>

    <!-- Logo -->
    <div class="hidden lg:block mb-12 px-2">
      <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <Store size={16} class="text-white" />
        </div>
        Golden Fork
      </h1>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 flex flex-col gap-2">
      {#each links as link}
        {@const active = $page.url.pathname === link.href}
        <a
          href={link.href}
          class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 {active ? 'bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]' : 'hover:bg-white/10'}"
          onclick={() => mobileMenuOpen = false}
        >
          <link.icon size={20} strokeWidth={active ? 2.5 : 2} class="text-white drop-shadow-md" />
          <span class="text-[15px] font-medium tracking-wide {active ? 'text-white' : 'text-white/80'}">
            {link.label}
          </span>
        </a>
      {/each}
    </nav>

    <!-- Bottom Action -->
    <div class="mt-auto pt-6 border-t border-white/10">
      <form action="/auth/logout?next=/" method="POST">
        <button
          type="submit"
          class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl hover:bg-red-500/20 transition-all duration-300 group"
        >
          <LogOut size={20} class="text-white/70 group-hover:text-red-400 transition-colors drop-shadow-md" />
          <span class="text-[15px] font-medium tracking-wide text-white/70 group-hover:text-red-400 transition-colors">
            Sign Out
          </span>
        </button>
      </form>
    </div>
  </aside>

  <!-- Main Content Panel -->
  <div class="flex-1 flex flex-col h-full overflow-hidden relative z-10 lg:py-4 lg:pr-4">
    
    <!-- Header -->
    <header class="h-20 lg:h-auto lg:mb-6 flex items-center justify-between px-6 lg:px-8 py-4 lg:rounded-3xl liquid-glass lg:shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex-none">
      <div class="flex items-center gap-4">
        <button 
          class="p-2 -ml-2 rounded-xl text-white/70 hover:bg-white/10 lg:hidden transition-colors"
          onclick={() => mobileMenuOpen = true}
        >
          <Menu size={24} />
        </button>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="hidden md:flex items-center bg-white/10 border border-white/20 rounded-full px-4 py-2 w-64 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] focus-within:bg-white/20 transition-all">
          <Search size={16} class="text-white/60 mr-2" />
          <input type="text" placeholder="Search spatial..." class="bg-transparent border-none outline-none text-[14px] placeholder-white/40 w-full text-white" />
        </div>
        <button class="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <Bell size={18} />
        </button>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto px-4 lg:px-0 pb-12 lg:pb-0">
      <div class="max-w-6xl mx-auto h-full lg:pr-2">
        {@render children()}
      </div>
    </main>
  </div>
</div>
