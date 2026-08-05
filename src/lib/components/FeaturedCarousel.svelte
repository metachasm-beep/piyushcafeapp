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
  let popIds = $state<Set<string>>(new Set());

  $effect(() => {
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

  function handleAdd(item: MenuItem) {
    onAdd(item);
    const nextSet = new Set(popIds);
    nextSet.add(item.id);
    popIds = nextSet;
    setTimeout(() => {
      const cleared = new Set(popIds);
      cleared.delete(item.id);
      popIds = cleared;
    }, 500);
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
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
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
              <div class="sg-media featured-carousel__media">
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
                <h3 class="sg-title-balance">{item.name}</h3>
                <p class="sg-text-pretty">{item.description}</p>
                <div class="featured-carousel__row">
                  <span class="featured-carousel__price sg-num">{formatCurrency(item.price)}</span>
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
                      <span class="sg-num">{getQuantity(item.id)}</span>
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
                      class="sg-qty-btn-add {popIds.has(item.id) ? 'is-pop' : ''}"
                      aria-label="Add {item.name}"
                      onclick={() => handleAdd(item)}
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
    margin-bottom: 28px;
  }

  .featured-carousel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .featured-carousel__title {
    font-size: 12px;
    font-family: var(--sg-font-mono, 'Geist Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--sg-muted, #6b6560);
    margin: 0;
  }

  .featured-carousel__nav {
    display: flex;
    gap: 6px;
  }

  .featured-carousel__nav-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--sg-radius-sm, 12px);
    border: 1px solid var(--sg-line, rgba(26, 22, 20, 0.08));
    background: rgba(255, 252, 247, 0.75);
    color: var(--sg-accent-strong, #6f4520);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  }

  .featured-carousel__nav-btn:focus-visible {
    outline: 2px solid var(--sg-accent, #8a5a2b);
    outline-offset: 2px;
  }

  .featured-carousel__nav-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .featured-carousel__viewport {
    overflow: hidden;
    width: 100%;
    border-radius: var(--sg-radius-xl, 24px);
    touch-action: pan-y;
    outline: none;
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
    padding: 12px;
    border-radius: var(--sg-radius-xl, 24px);
    background: rgba(255, 252, 247, 0.82);
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: var(--sg-shadow-md, 0 4px 20px rgba(26, 22, 20, 0.06));
    position: relative;
    overflow: hidden;
  }

  .featured-carousel__media {
    position: relative;
    z-index: 1;
    width: 100%;
    aspect-ratio: 16 / 10;
    /* concentric: outer 24 − padding 12 = 12 */
    border-radius: var(--sg-radius-sm, 12px);
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
    font-size: 17px;
    font-weight: 800;
    color: var(--sg-ink, #1a1614);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .featured-carousel__body p {
    font-size: 13px;
    color: var(--sg-muted, #6b6560);
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
    color: var(--sg-accent, #8a5a2b);
    font-size: 17px;
  }

  .featured-carousel__qty {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--sg-accent-soft, rgba(138, 90, 43, 0.12));
    border-radius: var(--sg-radius-pill, 99px);
    padding: 2px;
    border: 1px solid var(--sg-accent-border, rgba(138, 90, 43, 0.28));
  }

  .featured-carousel__qty span {
    min-width: 20px;
    text-align: center;
    font-weight: 700;
    font-size: 14px;
    color: var(--sg-ink, #1a1614);
  }

  .featured-carousel__dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
  }

  .featured-carousel__dot {
    width: 8px;
    height: 8px;
    border-radius: 99px;
    border: none;
    padding: 0;
    background: rgba(26, 22, 20, 0.16);
    cursor: pointer;
    transition: width 0.25s ease, background 0.25s ease;
  }

  .featured-carousel__dot:focus-visible {
    outline: 2px solid var(--sg-accent, #8a5a2b);
    outline-offset: 3px;
  }

  .featured-carousel__dot.is-active {
    width: 22px;
    background: linear-gradient(135deg, var(--sg-accent, #8a5a2b), var(--sg-accent-strong, #6f4520));
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
