<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { formatCurrency } from '$lib/utils';

  let { data = [] } = $props<{
    data: { date: Date; revenue: number }[]
  }>();

  let width = $state(600);
  let height = $state(300);
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };

  let svgRef: SVGSVGElement;
  let tooltipData = $state<{ x: number, y: number, date: Date, revenue: number } | null>(null);

  $effect(() => {
    if (!svgRef || data.length === 0 || width === 0) return;

    d3.select(svgRef).selectAll("*").remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, (d3.max(data, d => d.revenue) || 0) * 1.1]).nice()
      .range([innerHeight, 0]);

    const line = d3.line<any>()
      .x(d => x(d.date))
      .y(d => y(d.revenue))
      .curve(d3.curveMonotoneX);

    const area = d3.area<any>()
      .x(d => x(d.date))
      .y0(innerHeight)
      .y1(d => y(d.revenue))
      .curve(d3.curveMonotoneX);

    const svg = d3.select(svgRef)
      .attr("viewBox", [0, 0, width, height]);

    // Defs for gradient and clip path
    const defs = svg.append("defs");
    
    defs.append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    const gradient = defs.append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(99,102,241,0.3)");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(99,102,241,0.0)");

    // Main group translated by margins
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Axes
    const xAxisGroup = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr("font-family", "'Geist Mono', monospace")
      .attr("color", "#71717a");
    xAxisGroup.select(".domain").remove();

    const yAxisGroup = g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => "$" + (d as number) / 1000 + "k").tickSize(-innerWidth))
      .attr("font-family", "'Geist Mono', monospace")
      .attr("color", "#71717a");
    yAxisGroup.select(".domain").remove();
    yAxisGroup.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.05)");

    // Group for paths with clipping
    const pathGroup = g.append("g")
      .attr("clip-path", "url(#clip)");

    const areaPath = pathGroup.append("path")
      .datum(data)
      .attr("fill", "url(#area-gradient)")
      .attr("class", "area")
      .attr("d", area);

    const linePath = pathGroup.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#818cf8")
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("class", "line")
      .attr("d", line);

    // Initial draw animation
    const totalLength = (linePath.node() as SVGPathElement).getTotalLength();
    linePath
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);
    areaPath.style("opacity", 0).transition().delay(800).duration(1000).style("opacity", 1);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
      .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed(event: any) {
      const newX = event.transform.rescaleX(x);
      xAxisGroup.call(d3.axisBottom(newX).ticks(5));
      xAxisGroup.select(".domain").remove();
      
      linePath.attr("d", line.x(d => newX(d.date)));
      areaPath.attr("d", area.x(d => newX(d.date)));
    }

    // Double click to reset zoom
    svg.on("dblclick.zoom", () => {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });

    // Tooltip logic
    const bisectDate = d3.bisector((d: any) => d.date).left;
    const focusGroup = g.append("g").style("display", "none");
    
    focusGroup.append("line")
      .attr("class", "hover-line")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .style("stroke", "#818cf8")
      .style("stroke-width", "1px")
      .style("stroke-dasharray", "3 3")
      .style("opacity", 0.5)
      .style("pointer-events", "none");

    focusGroup.append("circle")
      .attr("class", "hover-circle")
      .attr("r", 4)
      .style("fill", "#09090b")
      .style("stroke", "#818cf8")
      .style("stroke-width", "2px")
      .style("pointer-events", "none");

    svg.on("pointerenter", () => {
        focusGroup.style("display", null);
      })
      .on("pointerleave", () => {
        focusGroup.style("display", "none");
        tooltipData = null;
      })
      .on("pointermove", (event) => {
        // Need to account for zoom transform
        const currentTransform = d3.zoomTransform(svg.node()!);
        const currentXScale = currentTransform.rescaleX(x);
        
        const [mx] = d3.pointer(event, g.node());
        if (mx < 0 || mx > innerWidth) {
          tooltipData = null;
          focusGroup.style("display", "none");
          return;
        }
        
        focusGroup.style("display", null);
        const x0 = currentXScale.invert(mx);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        if (!d0 || !d1) return;
        const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
        
        const cx = currentXScale(d.date);
        const cy = y(d.revenue);
        
        focusGroup.select(".hover-line").attr("transform", `translate(${cx}, 0)`);
        focusGroup.select(".hover-circle").attr("transform", `translate(${cx}, ${cy})`);
        
        tooltipData = {
          x: cx + margin.left,
          y: cy + margin.top,
          date: d.date,
          revenue: d.revenue
        };
      });
  });
</script>

<div class="w-full h-full relative" bind:clientWidth={width} bind:clientHeight={height}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <svg bind:this={svgRef} {width} {height} class="overflow-visible cursor-crosshair"></svg>
  
  {#if tooltipData}
    <div 
      class="absolute z-20 bg-zinc-900/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-lg p-3 pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+15px)] transition-all duration-75 ease-out"
      style="left: {tooltipData.x}px; top: {tooltipData.y}px;"
    >
      <div class="text-[10px] font-mono text-zinc-400 uppercase mb-1">
        {d3.timeFormat("%b %d, %Y")(tooltipData.date)}
      </div>
      <div class="font-bold text-lg text-indigo-400 font-display tracking-tight">
        {formatCurrency(tooltipData.revenue)}
      </div>
    </div>
  {/if}
</div>

