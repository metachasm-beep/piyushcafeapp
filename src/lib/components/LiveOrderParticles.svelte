<script lang="ts">
  let canvasRef: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let particles: { x: number, y: number, vx: number, vy: number, life: number, maxLife: number, color: string }[] = [];
  let animationFrameId: number;

  const colors = ['#6366f1', '#8b5cf6', '#22c55e', '#06b6d4'];

  $effect(() => {
    if (!canvasRef) return;
    ctx = canvasRef.getContext('2d');
    
    const resize = () => {
      canvasRef.width = canvasRef.parentElement?.clientWidth || window.innerWidth;
      canvasRef.height = canvasRef.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

      // Randomly spawn particle (simulating a live order flowing up)
      if (Math.random() < 0.05) {
        particles.push({
          x: Math.random() * canvasRef.width,
          y: canvasRef.height + 10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 2 - 0.5,
          life: 0,
          maxLife: Math.random() * 150 + 100,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        
        const opacity = 1 - (p.life / p.maxLife);
        if (opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity * 0.4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  });
</script>

<div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
  <canvas bind:this={canvasRef} class="w-full h-full opacity-50"></canvas>
</div>
