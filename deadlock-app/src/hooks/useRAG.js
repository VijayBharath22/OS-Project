import { useEffect } from 'react';
import * as d3 from 'd3';

export function useRAG(svgRef, data, cycleNodes, zoomRef) {
  useEffect(() => {
    if (!svgRef.current || !data || data.nodes.length === 0) return;

    let simulation;
    const initGraph = () => {
        if (!svgRef.current) return;
        const parent = svgRef.current.parentElement;
        const width = parent.clientWidth || 800;
        const height = parent.clientHeight || 500;
        
        if (width === 0 || height === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); 
        svg.attr("viewBox", [0, 0, width, height]);

        // Setup Zoom Container
        const g = svg.append("g").attr("class", "graph-container");

        const zoom = d3.zoom()
          .scaleExtent([0.1, 5])
          .on("zoom", (event) => {
             g.attr("transform", event.transform);
          });
        
        svg.call(zoom);

        if (zoomRef) {
           zoomRef.current = {
               zoomIn: () => svg.transition().duration(300).call(zoom.scaleBy, 1.3),
               zoomOut: () => svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.3),
               reset: () => svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
           };
        }

        const nodes = data.nodes.map(d => ({...d}));
        const edges = data.edges.map(d => ({...d}));

        const cycleEdges = [];
        if (cycleNodes && cycleNodes.length > 0) {
          for (let i = 0; i < cycleNodes.length; i++) {
            const u = cycleNodes[i];
            const v = cycleNodes[(i + 1) % cycleNodes.length];
            if (edges.some(e => 
              (typeof e.source === 'object' ? e.source.id : e.source) === u && 
              (typeof e.target === 'object' ? e.target.id : e.target) === v
            )) {
               cycleEdges.push({ source: u, target: v });
            }
          }
        }

        simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(edges).id(d => d.id).distance(140))
          .force("charge", d3.forceManyBody().strength(-800))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collide", d3.forceCollide().radius(50));

        // Academic Dark Theme Markers
        svg.append("defs").selectAll("marker")
          .data(["request", "assignment", "cycle"])
          .join("marker")
            .attr("id", d => `arrow-${d}`)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 28) 
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
          .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", d => d === 'request' ? '#38bdf8' : d === 'assignment' ? '#34d399' : '#f87171');

        // Solid paths
        const linkPath = g.append("g")
          .attr("class", "links")
          .selectAll("path")
          .data(edges)
          .join("path")
          .attr("fill", "none")
          .attr("stroke", d => {
            const sId = typeof d.source === 'object' ? d.source.id : d.source;
            const tId = typeof d.target === 'object' ? d.target.id : d.target;
            const isCycle = cycleEdges.some(ce => ce.source === sId && ce.target === tId);
            return isCycle ? '#f87171' : d.type === 'request' ? '#38bdf8' : '#34d399';
          })
          .attr("stroke-width", d => {
            const sId = typeof d.source === 'object' ? d.source.id : d.source;
            const tId = typeof d.target === 'object' ? d.target.id : d.target;
            return cycleEdges.some(ce => ce.source === sId && ce.target === tId) ? 3 : 2;
          })
          .attr("stroke-dasharray", d => d.type === 'request' ? "5,5" : "none")
          .attr("marker-end", d => {
            const sId = typeof d.source === 'object' ? d.source.id : d.source;
            const tId = typeof d.target === 'object' ? d.target.id : d.target;
            const isCycle = cycleEdges.some(ce => ce.source === sId && ce.target === tId);
            return `url(#arrow-${isCycle ? 'cycle' : d.type})`;
          });

        const nodeGroup = g.append("g").attr("class", "nodes").selectAll("g")
          .data(nodes)
          .join("g")
          .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        // Process nodes (circles) - dark theme
        nodeGroup.filter(d => d.type === 'process')
          .append("circle")
          .attr("r", 22)
          .attr("fill", "#0f172a")
          .attr("stroke", d => cycleNodes?.includes(d.id) ? "#f87171" : "#38bdf8")
          .attr("stroke-width", d => cycleNodes?.includes(d.id) ? 4 : 2);

        // Resource nodes (squares) - dark theme
        nodeGroup.filter(d => d.type === 'resource')
          .append("rect")
          .attr("width", 44)
          .attr("height", 44)
          .attr("x", -22)
          .attr("y", -22)
          .attr("rx", 4)
          .attr("fill", "#0f172a")
          .attr("stroke", d => cycleNodes?.includes(d.id) ? "#f87171" : "#34d399")
          .attr("stroke-width", d => cycleNodes?.includes(d.id) ? 4 : 2);

        // Instances
        nodeGroup.filter(d => d.type === 'resource').each(function(d) {
            const el = d3.select(this);
            const inst = d.instances || 1;
            
            for(let i=0; i<inst; i++) {
               const xOffset = -6 + (i%2)*12;
               const yOffset = -6 + Math.floor(i/2)*12;
               if (i < 4) {
                 el.append("circle")
                   .attr("r", 4)
                   .attr("cx", xOffset).attr("cy", yOffset)
                   .attr("fill", "#34d399");
               }
            }
            if (inst > 4) {
               el.append("text").attr("y", 28).attr("fill", "#34d399").attr("font-size", "10px").attr("text-anchor", "middle").text("+" + (inst - 4));
            }
        });

        nodeGroup.append("text")
          .attr("dy", d => d.type === 'process' ? 5 : 36)
          .attr("text-anchor", "middle")
          .attr("font-family", "system-ui, -apple-system, sans-serif")
          .attr("font-weight", "600")
          .attr("fill", "#f1f5f9")
          .text(d => d.id);

        simulation.on("tick", () => {
          linkPath.attr("d", d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
            const sweep = d.type === 'request' ? 1 : 0;
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,${sweep} ${d.target.x},${d.target.y}`;
          });

          nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
        
        function dragended(event) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
    };

    // Delay initialization slightly to allow Framer Motion to set initial layout dimensions
    const timer = setTimeout(initGraph, 100);

    return () => {
      clearTimeout(timer);
      if (simulation) simulation.stop();
    };


  }, [data, cycleNodes, svgRef]);
}
