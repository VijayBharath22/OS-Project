/**
 * Detects a cycle in a directed graph using DFS.
 * @param {Array} nodes - Array of node objects { id: string, type: 'process' | 'resource' }
 * @param {Array} edges - Array of edge objects { source: string|object, target: string|object }
 * @returns {Array|null} Array of node IDs involved in the cycle, or null if no cycle.
 */
export function detectCycle(nodes, edges) {
  const adjList = {};
  nodes.forEach(n => { adjList[n.id] = []; });
  
  // D3 might convert source/target to node objects
  edges.forEach(e => {
    const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
    const targetId = typeof e.target === 'object' ? e.target.id : e.target;
    if (adjList[sourceId]) {
      adjList[sourceId].push(targetId);
    }
  });

  const visited = new Set();
  const recStack = new Set();
  const path = []; // tracks the current path to extract the cycle
  
  let cycle = null;

  function dfs(nodeId) {
    if (recStack.has(nodeId)) {
      // Cycle detected
      const cycleStartIndex = path.indexOf(nodeId);
      cycle = path.slice(cycleStartIndex);
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjList[nodeId] || [];
    for (let neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    path.pop();
    return false;
  }

  for (let node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        break;
      }
    }
  }

  return cycle;
}
