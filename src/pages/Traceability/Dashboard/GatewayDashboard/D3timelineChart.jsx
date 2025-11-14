import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TimelineChart = ({ data, width = 1200, height = 80 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 10, right: 30, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get overall time range
    const minTime = d3.min(data, d => d.start);
    const maxTime = d3.max(data, d => d.end);

    // X scale (time)
    const x = d3.scaleTime()
      .domain([minTime, maxTime])
      .range([0, innerWidth]);

    // Add X axis with 1-hour intervals
    const xAxis = d3.axisBottom(x)
      .ticks(d3.timeHour.every(1)) // Force 1-hour intervals
      .tickFormat(d3.timeFormat("%H:%M"));

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("font-size", "11px")
      .attr("fill", "#555");

    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.75)")
      .style("color", "white")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Draw status bars
    g.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.start))
      .attr("y", 10)
      .attr("width", d => Math.max(x(d.end) - x(d.start), 1))
      .attr("height", innerHeight - 25)
      .attr("fill", d => d.color)
      .attr("rx", 2)
      .attr("ry", 2)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`
          <b>Status:</b> ${d.label}<br/>
          <b>Start:</b> ${d3.timeFormat("%H:%M:%S")(d.start)}<br/>
          <b>End:</b> ${d3.timeFormat("%H:%M:%S")(d.end)}
        `)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 30 + "px");
      })
      .on("mousemove", (event) => {
        tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 30 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(300).style("opacity", 0);
      });

    // Add gridlines with 1-hour intervals
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(x)
          .ticks(d3.timeHour.every(1)) // Also use 1-hour intervals for gridlines
          .tickSize(-innerHeight + 25)
          .tickFormat("")
      )
      .selectAll("line")
      .attr("stroke", "#e0e0e0")
      .attr("stroke-opacity", 0.7);

    // Cleanup on unmount
    return () => tooltip.remove();
  }, [data, width, height]);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default TimelineChart;