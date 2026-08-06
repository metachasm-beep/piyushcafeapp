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

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, (d3.max(data, d => d.revenue) || 0) * 1.1]).nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<any>()
      .x(d => x(d.date))
      .y(d => y(d.revenue))
      .curve(d3.curveMonotoneX);

    // Area gradient
    const area = d3.area<any>()
      .x(d => x(d.date))
      .y0(height - margin.bottom)
      .y1(d => y(d.revenue))
      .curve(d3.curveMonotoneX);

    const svg = d3.select(svgRef);

    // Defs for gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(99,102,241,0.3)");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(99,102,241,0.0)");

    // Grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-(height - margin.top - margin.bottom)).tickFormat(() => ""))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "rgba(99,102,241,0.08)"));

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(() => ""))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "rgba(99,102,241,0.08)"));

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr("font-family", "'Geist Mono', monospace")
      .attr("color", "#8b84c0")
      .call(g => g.select(".domain").remove());

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => "$" + (d as number) / 1000 + "k"))
      .attr("font-family", "'Geist Mono', monospace")
      .attr("color", "#8b84c0")
      .call(g => g.select(".domain").remove());

    // Area path
    const areaPath = svg.append("path")
      .datum(data)
      .attr("fill", "url(#area-gradient)")
      .attr("d", area);

    // Line path
    const path = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", line);

    // Draw animation
    const totalLength = (path.node() as SVGPathElement).getTotalLength();
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    areaPath
      .style("opacity", 0)
      .transition()
      .delay(1000)
      .duration(1000)
      .style("opacity", 1);

    // Interactive tooltip overlay
    const bisectDate = d3.bisector((d: any) => d.date).left;
    
    const focusGroup = svg.append("g").style("display", "none");
    focusGroup.append("line")
      .attr("class", "hover-line")
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .style("stroke", "#6366f1")
      .style("stroke-width", "1px")
      .style("stroke-dasharray", "4 4")
      .style("opacity", 0.5);

    focusGroup.append("circle")
      .attr("class", "hover-circle")
      .attr("r", 5)
      .style("fill", "#1e1b4b")
      .style("stroke", "#6366f1")
      .style("stroke-width", "2px");

    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", () => {
        focusGroup.style("display", null);
        tooltipData = null; // hide initial
      })
      .on("mouseout", () => {
        focusGroup.style("display", "none");
        tooltipData = null;
      })
      .on("mousemove", (event) => {
        const x0 = x.invert(d3.pointer(event)[0]);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        if (!d0 || !d1) return;
        const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
        
        focusGroup.select(".hover-line").attr("transform", `translate(${x(d.date)}, 0)`);
        focusGroup.select(".hover-circle").attr("transform", `translate(${x(d.date)}, ${y(d.revenue)})`);
        
        tooltipData = {
          x: x(d.date),
          y: y(d.revenue),
          date: d.date,
          revenue: d.revenue
        };
      });
  });
</script>

<div class="w-full h-full relative" bind:clientWidth={width} bind:clientHeight={height}>
  <svg bind:this={svgRef} {width} {height} class="overflow-visible"></svg>
  
  {#if tooltipData}
    <div 
      class="absolute z-10 bg-white/90 backdrop-blur border border-white/20 shadow-xl rounded-lg p-3 pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+15px)] transition-all duration-100 ease-out"
      style="left: {tooltipData.x}px; top: {tooltipData.y}px;"
    >
      <div class="text-[10px] font-mono text-gray-500 uppercase mb-1">
        {d3.timeFormat("%b %d, %Y")(tooltipData.date)}
      </div>
      <div class="font-bold text-lg text-indigo-600">
        {formatCurrency(tooltipData.revenue)}
      </div>
    </div>
  {/if}
</div>
