<script lang="ts">
  import { Plus, Minus, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import DietaryBadge from '$lib/components/DietaryBadge.svelte';
  import { formatCurrency } from '$lib/utils';
  import type { MenuItem } from '$lib/types';

  type Props = {
    items: MenuItem[];
    getQuantity: (id: string) => number;
    onAdd: (item: MenuItem) => void;
    onSetQuantity: (id: string, qty: number) => void;
  };

  let { items, getQuantity, onAdd, onSetQuantity }: Props = $props();

  let index = $state(0);
  let dragX = $state(0);
  let dragging = $state(false);
  let startX = 0;
  let startY = 0;
  let axis: 'x' | 'y' | null = null;
  let viewportEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    // Keep index in range when filters change the list
    if (items.length === 0) {
      index = 0;
      return;
    }
    if (index > items.length - 1) index = items.length - 1;
  });

  function goTo(i: number) {
    if (items.length === 0) return;
    index = Math.max(0, Math.min(items.length - 1, i));
    dragX = 0;
  }

  function prev() {
    goTo(index - 1);
  }

  function next() {
    goTo(index + 1);
  }

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    axis = null;
    dragging = true;
    dragX = 0;
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (!axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (axis === 'y') {
      dragging = false;
      dragX = 0;
      return;
    }

    // Resist at ends
    const atStart = index === 0 && dx > 0;
    const atEnd = index === items.length - 1 && dx < 0;
    dragX = atStart || atEnd ? dx * 0.35 : dx;
    e.preventDefault();
  }

  function onTouchEnd() {
    if (!dragging) return;
    dragging = false;
    const threshold = Math.min(80, (viewportEl?.clientWidth ?? 280) * 0.22);
    if (dragX <= -threshold) next();
    else if (dragX >= threshold) prev();
    else dragX = 0;
    axis = null;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  }
</script>

{#if items.length > 0}
  <section
    class="featured-carousel"
    aria-roledescription="carousel"
    aria-label="Featured dishes"
    onkeydown={onKeydown}
  >
    <div class="featured-carousel__head">
      <h2 class="featured-carousel__title">Featured</h2>
      {#if items.length > 1}
        <div class="featured-carousel__nav">
          <button
            type="button"
            class="featured-carousel__nav-btn"
            aria-label="Previous featured item"
            disabled={index === 0}
            onclick={prev}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            class="featured-carousel__nav-btn"
            aria-label="Next featured item"
            disabled={index === items.length - 1}
            onclick={next}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      {/if}
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="featured-carousel__viewport"
      bind:this={viewportEl}
      ontouchstart={onTouchStart}
      ontouchmove={onTouchMove}
      ontouchend={onTouchEnd}
      ontouchcancel={onTouchEnd}
      role="presentation"
      aria-live="polite"
    >
      <div
        class="featured-carousel__track"
        style="transform: translate3d(calc({-index * 100}% + {dragX}px), 0, 0); transition: {dragging
          ? 'none'
          : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)'};"
      >
        {#each items as item, i}
          <div
            class="featured-carousel__slide"
            aria-hidden={i !== index}
            aria-roledescription="slide"
            aria-label="{i + 1} of {items.length}"
          >
            <article class="featured-carousel__card">
              <div class="featured-carousel__media">
                <img
                  src={item.image_url}
                  alt={item.name}
                  width="640"
                  height="360"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  draggable="false"
                />
                <div class="featured-carousel__badges">
                  {#each item.dietary_tags as tag}
                    <DietaryBadge {tag} />
                  {/each}
                </div>
              </div>

              <div class="featured-carousel__body">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div class="featured-carousel__row">
                  <span class="featured-carousel__price">{formatCurrency(item.price)}</span>
                  {#if getQuantity(item.id) > 0}
                    <div class="featured-carousel__qty">
                      <button
                        type="button"
                        class="sg-qty-btn sg-qty-btn-minus"
                        aria-label="Decrease quantity"
                        onclick={() => onSetQuantity(item.id, getQuantity(item.id) - 1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span>{getQuantity(item.id)}</span>
                      <button
                        type="button"
                        class="sg-qty-btn sg-qty-btn-plus"
                        aria-label="Increase quantity"
                        onclick={() => onSetQuantity(item.id, getQuantity(item.id) + 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  {:else}
                    <button
                      type="button"
                      class="sg-qty-btn-add"
                      aria-label="Add {item.name}"
                      onclick={() => onAdd(item)}
                    >
                      <Plus size={18} />
                    </button>
                  {/if}
                </div>
              </div>
            </article>
          </div>
        {/each}
      </div>
    </div>

    {#if items.length > 1}
      <div class="featured-carousel__dots" role="tablist" aria-label="Featured slides">
        {#each items as _, i}
          <button
            type="button"
            class="featured-carousel__dot"
            class:is-active={i === index}
            role="tab"
            aria-selected={i === index}
            aria-label="Go to featured item {i + 1}"
            onclick={() => goTo(i)}
          ></button>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
  .featured-carousel {
    margin-bottom: 32px;
  }

  .featured-carousel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .featured-carousel__title {
    font-size: 13px;
    font-family: 'Geist Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8b84c0;
    margin: 0;
  }

  .featured-carousel__nav {
    display: flex;
    gap: 6px;
  }

  .featured-carousel__nav-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.18);
    background: rgba(255, 255, 255, 0.7);
    color: #4338ca;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .featured-carousel__nav-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .featured-carousel__viewport {
    overflow: hidden;
    width: 100%;
    border-radius: 24px;
    touch-action: pan-y;
    outline: none;
    /* Room for soft shadow without clipping siblings */
    margin: 0;
  }

  .featured-carousel__track {
    display: flex;
    width: 100%;
    will-change: transform;
  }

  .featured-carousel__slide {
    flex: 0 0 100%;
    width: 100%;
    min-width: 100%;
    box-sizing: border-box;
    padding: 2px;
  }

  .featured-carousel__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.92);
    box-shadow:
      0 16px 40px rgba(99, 102, 241, 0.14),
      0 2px 8px rgba(99, 102, 241, 0.06);
    position: relative;
    overflow: hidden;
  }

  .featured-carousel__card::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -40px;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent 70%);
    pointer-events: none;
  }

  .featured-carousel__media {
    position: relative;
    z-index: 1;
    width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(99, 102, 241, 0.08);
  }

  .featured-carousel__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    user-select: none;
    -webkit-user-drag: none;
  }

  .featured-carousel__badges {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .featured-carousel__body {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .featured-carousel__body h3 {
    font-size: 18px;
    font-weight: 800;
    color: #1e1b4b;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .featured-carousel__body p {
    font-size: 13px;
    color: #8b84c0;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .featured-carousel__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    gap: 12px;
  }

  .featured-carousel__price {
    font-weight: 800;
    color: #6366f1;
    font-size: 18px;
  }

  .featured-carousel__qty {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(99, 102, 241, 0.08);
    border-radius: 99px;
    padding: 2px;
    border: 1px solid rgba(99, 102, 241, 0.15);
  }

  .featured-carousel__qty span {
    min-width: 20px;
    text-align: center;
    font-weight: 700;
    font-size: 14px;
    color: #1e1b4b;
  }

  .featured-carousel__dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 14px;
  }

  .featured-carousel__dot {
    width: 8px;
    height: 8px;
    border-radius: 99px;
    border: none;
    padding: 0;
    background: rgba(99, 102, 241, 0.22);
    cursor: pointer;
    transition: width 0.25s ease, background 0.25s ease;
  }

  .featured-carousel__dot.is-active {
    width: 22px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }

  @media (prefers-reduced-motion: reduce) {
    .featured-carousel__track {
      transition: none !important;
    }
    .featured-carousel__dot {
      transition: none !important;
    }
  }
</style>
