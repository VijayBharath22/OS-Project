import { create } from 'zustand';
import { playAlarm, playSuccess } from '../utils/audio';
import {
  computeHoldAndWaitAllAtOnce,
  computeHoldAndWaitReleaseFirst,
  computeForceRelease,
  computePreemptFromBlocked,
  computeCircularWaitCheck
} from '../utils/preventionEngine';

// ─── Textbook Presets ───────────────────────────────────────────────────────
export const TEXTBOOK_PRESETS = {
  fig73: {
    label: 'Classic Safe State (Fig 7.3)',
    description: 'Demonstrates a classic Banker\'s algorithm safe state with 5 processes and 3 resources.',
    resources: [{ id: 'R1', instances: 10 }, { id: 'R2', instances: 5 }, { id: 'R3', instances: 7 }],
    processes: [
      { id: 'P1', max: { R1: 7, R2: 5, R3: 3 }, state: 'running' },
      { id: 'P2', max: { R1: 3, R2: 2, R3: 2 }, state: 'running' },
      { id: 'P3', max: { R1: 9, R2: 0, R3: 2 }, state: 'running' },
      { id: 'P4', max: { R1: 2, R2: 2, R3: 2 }, state: 'running' },
      { id: 'P5', max: { R1: 4, R2: 3, R3: 3 }, state: 'running' }
    ],
    edges: [
      { source: 'R2', target: 'P1', type: 'assignment' },
      { source: 'R1', target: 'P2', type: 'assignment' }, { source: 'R1', target: 'P2', type: 'assignment' },
      { source: 'R1', target: 'P3', type: 'assignment' }, { source: 'R1', target: 'P3', type: 'assignment' }, { source: 'R1', target: 'P3', type: 'assignment' },
      { source: 'R3', target: 'P3', type: 'assignment' }, { source: 'R3', target: 'P3', type: 'assignment' },
      { source: 'R1', target: 'P4', type: 'assignment' }, { source: 'R1', target: 'P4', type: 'assignment' },
      { source: 'R2', target: 'P4', type: 'assignment' },
      { source: 'R3', target: 'P4', type: 'assignment' },
      { source: 'R3', target: 'P5', type: 'assignment' }, { source: 'R3', target: 'P5', type: 'assignment' }
    ]
  },
  fig74: {
    label: 'Unsafe State — Deadlock (Fig 7.4)',
    description: 'Demonstrates a circular wait deadlock using 3 processes and 3 resources.',
    resources: [{ id: 'R1', instances: 1 }, { id: 'R2', instances: 1 }, { id: 'R3', instances: 1 }],
    processes: [
      { id: 'P1', max: { R1: 1, R2: 1, R3: 0 }, state: 'blocked' },
      { id: 'P2', max: { R1: 0, R2: 1, R3: 1 }, state: 'blocked' },
      { id: 'P3', max: { R1: 1, R2: 0, R3: 1 }, state: 'blocked' }
    ],
    edges: [
      { source: 'R1', target: 'P1', type: 'assignment' },
      { source: 'P1', target: 'R2', type: 'request' },
      { source: 'R2', target: 'P2', type: 'assignment' },
      { source: 'P2', target: 'R3', type: 'request' },
      { source: 'R3', target: 'P3', type: 'assignment' },
      { source: 'P3', target: 'R1', type: 'request' }
    ]
  }
};

// ─── Cycle Detection (pure function) ────────────────────────────────────────
export function detectCycleFromState(processes, resources, edges) {
  const nodes = [
    ...processes.map(p => ({ id: p.id, type: 'process' })),
    ...resources.map(r => ({ id: r.id, type: 'resource', instances: r.instances }))
  ];
  const adjList = {};
  nodes.forEach(n => { adjList[n.id] = []; });
  edges.forEach(e => {
    const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
    const targetId = typeof e.target === 'object' ? e.target.id : e.target;
    if (adjList[sourceId]) adjList[sourceId].push(targetId);
  });

  const visited = new Set();
  const recStack = new Set();
  const path = [];
  let cycle = null;

  function dfs(nodeId) {
    if (recStack.has(nodeId)) {
      const cycleStartIndex = path.indexOf(nodeId);
      cycle = path.slice(cycleStartIndex);
      return true;
    }
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);
    const neighbors = adjList[nodeId] || [];
    for (let neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }
    recStack.delete(nodeId);
    path.pop();
    return false;
  }

  for (let node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) break;
    }
  }
  return cycle;
}

// ─── Main Store ─────────────────────────────────────────────────────────────
let _timelineIdCounter = 0;

const useSimulationStore = create((set, get) => {

  // ── Internal helpers ──────────────────────────────────────────────────────
  const logEvent = (msg, type = 'info') => {
    set((s) => ({
      logs: [...s.logs, {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        msg,
        type
      }].slice(-150)
    }));
  };

  const addTimelineEntry = (description, eventType = 'system') => {
    set((s) => ({
      timeline: [...s.timeline, {
        id: ++_timelineIdCounter,
        timestamp: Date.now(),
        timeLabel: new Date().toLocaleTimeString(),
        description,
        eventType, // 'allocation' | 'request' | 'cycle' | 'recovery' | 'prevention' | 'banker' | 'system'
        step: s.timeline.length
      }].slice(-200)
    }));
  };

  const updateProcessStates = () => {
    const s = get();
    const cycle = detectCycleFromState(s.processes, s.resources, s.edges);
    const cycleIds = cycle || [];

    set({
      processes: s.processes.map(p => {
        if (p.state === 'terminated') return p;
        const hasRequest = s.edges.some(e => e.type === 'request' && e.source === p.id);
        const inCycle = cycleIds.includes(p.id);
        let newState = 'running';
        if (inCycle) newState = 'blocked';
        else if (hasRequest) newState = 'waiting';
        return { ...p, state: newState };
      })
    });
  };

  // ── Initial State ─────────────────────────────────────────────────────────
  return {
    // Navigation
    activeModule: 'dashboard',
    visitedModules: ['dashboard'],

    // Global UI
    globalAlert: null,

    // Core System State
    processes: TEXTBOOK_PRESETS.fig73.processes.map(p => ({ ...p })),
    resources: TEXTBOOK_PRESETS.fig73.resources.map(r => ({ ...r })),
    edges: TEXTBOOK_PRESETS.fig73.edges.map(e => ({ ...e })),

    // Prevention Rules
    prevention: {
      mutualExclusion: false,
      holdAndWait: false,
      noPreemption: false,
      circularWait: false
    },

    // Simulation Controls
    simulationStatus: 'running', // 'running' | 'paused' | 'step'
    simulationSpeed: 1, // 0.5x, 1x, 2x

    // Timeline / Event History
    timeline: [
      { id: ++_timelineIdCounter, timestamp: Date.now(), timeLabel: new Date().toLocaleTimeString(), description: 'System boot sequence initiated', eventType: 'system', step: 0 }
    ],

    // Logs (terminal)
    logs: [
      { id: 1, time: new Date().toLocaleTimeString(), msg: 'SYSTEM BOOT SEQUENCE INITIATED', type: 'info' }
    ],

    // Recovery tracking
    recoveryLog: [],
    starvationCounters: {},

    // Quiz / Progress
    quizScores: {},
    completedChallenges: [],

    // Professor mode
    professorMode: false,

    // ════════════════════════════════════════════════════════════════════════
    //  ACTIONS
    // ════════════════════════════════════════════════════════════════════════

    // ── Navigation ──────────────────────────────────────────────────────────
    setActiveModule: (moduleName) => {
      set((s) => ({
        activeModule: moduleName,
        visitedModules: s.visitedModules.includes(moduleName)
          ? s.visitedModules
          : [...s.visitedModules, moduleName]
      }));
    },

    // ── Alerts ──────────────────────────────────────────────────────────────
    triggerAlert: (alertData) => {
      set({ globalAlert: alertData });
      playAlarm();
    },
    clearAlert: () => set({ globalAlert: null }),

    // ── Presets ─────────────────────────────────────────────────────────────
    loadPreset: (presetId) => {
      const preset = TEXTBOOK_PRESETS[presetId];
      if (preset) {
        set({
          resources: preset.resources.map(r => ({ ...r })),
          processes: preset.processes.map(p => ({ ...p })),
          edges: preset.edges.map(e => ({ ...e }))
        });
        logEvent(`Loaded textbook preset: ${preset.label}`);
        addTimelineEntry(`Loaded preset: ${preset.label}`, 'system');
        setTimeout(updateProcessStates, 0);
      }
    },

    injectState: (newState) => {
      set({
        resources: newState.resources.map(r => ({ ...r })),
        processes: newState.processes.map(p => ({ ...p, state: p.state || 'running' })),
        edges: newState.edges.map(e => ({ ...e }))
      });
      logEvent('Injected specific system topology.');
      addTimelineEntry('System topology injected', 'system');
      setTimeout(updateProcessStates, 0);
    },

    // ── Process Management ──────────────────────────────────────────────────
    addProcess: (pid = null) => {
      const s = get();
      const newPid = pid || `P${s.processes.length + 1}`;
      if (s.processes.find(p => p.id === newPid)) return;
      const newMax = {};
      s.resources.forEach(r => newMax[r.id] = 0);
      set({ processes: [...s.processes, { id: newPid, max: newMax, state: 'running' }] });
      logEvent(`Spawned process ${newPid}`);
      addTimelineEntry(`Process ${newPid} spawned`, 'system');
    },

    removeProcess: (pid) => {
      set((s) => ({
        processes: s.processes.filter(p => p.id !== pid),
        edges: s.edges.filter(e => e.source !== pid && e.target !== pid)
      }));
      logEvent(`Terminated process ${pid}`, 'warning');
      addTimelineEntry(`Process ${pid} terminated`, 'recovery');
      setTimeout(updateProcessStates, 0);
    },

    // ── Resource Management ─────────────────────────────────────────────────
    addResource: (payload = {}) => {
      const s = get();
      const newRid = payload.id || `R${s.resources.length + 1}`;
      if (s.resources.find(r => r.id === newRid)) return;
      set({
        resources: [...s.resources, { id: newRid, instances: payload.instances || 1 }],
        processes: s.processes.map(p => ({ ...p, max: { ...p.max, [newRid]: 0 } }))
      });
      logEvent(`Mounted resource ${newRid}`);
      addTimelineEntry(`Resource ${newRid} mounted (${payload.instances || 1} instances)`, 'system');
    },

    updateResource: (rid, instances) => {
      set((s) => ({
        resources: s.resources.map(r => r.id === rid ? { ...r, instances } : r)
      }));
      logEvent(`Updated ${rid} instance count to ${instances}`);
      addTimelineEntry(`${rid} instances updated to ${instances}`, 'system');
    },

    removeResource: (rid) => {
      set((s) => ({
        resources: s.resources.filter(r => r.id !== rid),
        edges: s.edges.filter(e => e.source !== rid && e.target !== rid),
        processes: s.processes.map(p => {
          const { [rid]: _removed, ...restMax } = p.max;
          return { ...p, max: restMax };
        })
      }));
      logEvent(`Dismounted resource ${rid}`, 'warning');
      addTimelineEntry(`Resource ${rid} dismounted`, 'system');
      setTimeout(updateProcessStates, 0);
    },

    // ── Edge Management ─────────────────────────────────────────────────────
    addEdge: (source, target, type) => {
      const s = get();

      // Prevention: Hold and Wait
      if (s.prevention.holdAndWait && type === 'request') {
        const holds = s.edges.some(e => e.type === 'assignment' && e.target === source);
        if (holds) {
          logEvent(`Prevention [Hold & Wait]: ${source} denied request.`, 'error');
          addTimelineEntry(`${source} request denied (Hold & Wait prevention)`, 'prevention');
          playAlarm();
          return;
        }
      }

      // Prevention: Circular Wait
      if (s.prevention.circularWait && type === 'request') {
        const heldResourceIds = s.edges
          .filter(e => e.type === 'assignment' && e.target === source)
          .map(e => e.source);
        if (heldResourceIds.length > 0) {
          const maxHeld = heldResourceIds.sort().pop();
          if (target <= maxHeld) {
            logEvent(`Prevention [Circular Wait]: ${source} denied request (must be > ${maxHeld}).`, 'error');
            addTimelineEntry(`${source} request denied (Circular Wait prevention)`, 'prevention');
            playAlarm();
            return;
          }
        }
      }

      // Capacity check for assignments
      if (type === 'assignment') {
        const resource = s.resources.find(r => r.id === source);
        const currentAssigned = s.edges.filter(e => e.type === 'assignment' && e.source === source).length;
        if (currentAssigned >= resource.instances) {
          logEvent(`Error: ${source} depleted.`, 'error');
          playAlarm();
          return;
        }
      }

      // Duplicate check
      const exists = s.edges.some(e => e.source === source && e.target === target && e.type === type);
      if (!exists) {
        set({ edges: [...s.edges, { source, target, type }] });
        const verb = type === 'request' ? 'requested' : 'allocated to';
        logEvent(`Added ${type} edge: ${source} → ${target}`);
        addTimelineEntry(`${source} ${verb} ${target}`, type === 'request' ? 'request' : 'allocation');
        setTimeout(updateProcessStates, 0);
      }
    },

    removeEdge: (payload) => {
      if (payload.exact) {
        set((s) => ({ edges: s.edges.filter(e => e !== payload.exact) }));
      } else {
        set((s) => ({
          edges: s.edges.filter(e => !(e.source === payload.source && e.target === payload.target))
        }));
      }
      logEvent('Removed edge.');
      addTimelineEntry('Edge removed', 'system');
      setTimeout(updateProcessStates, 0);
    },

    // ── Allocation (Banker's matrix direct edit) ────────────────────────────
    setAllocation: (pId, rId, newCount) => {
      const s = get();
      let currentAssigned = s.edges.filter(e => e.type === 'assignment' && e.source === rId && e.target === pId).length;

      if (newCount > currentAssigned) {
        const rObj = s.resources.find(r => r.id === rId);
        const totalAssignedR = s.edges.filter(e => e.type === 'assignment' && e.source === rId).length;
        if (totalAssignedR + (newCount - currentAssigned) > rObj.instances) {
          logEvent(`Cannot allocate ${rId} to ${pId}: Not enough instances.`, 'error');
          playAlarm();
          return;
        }
        const newEdges = [];
        for (let i = 0; i < (newCount - currentAssigned); i++) {
          newEdges.push({ source: rId, target: pId, type: 'assignment' });
        }
        set({ edges: [...s.edges, ...newEdges] });
        logEvent(`Allocated ${newCount - currentAssigned} instances of ${rId} to ${pId}`);
        addTimelineEntry(`${rId} ×${newCount - currentAssigned} allocated to ${pId}`, 'allocation');
      } else if (newCount < currentAssigned) {
        let removed = 0;
        const targetRemove = currentAssigned - newCount;
        set({
          edges: s.edges.filter(e => {
            if (e.type === 'assignment' && e.source === rId && e.target === pId && removed < targetRemove) {
              removed++;
              return false;
            }
            return true;
          })
        });
        logEvent(`Deallocated ${targetRemove} instances of ${rId} from ${pId}`);
        addTimelineEntry(`${rId} ×${targetRemove} deallocated from ${pId}`, 'allocation');
      }
      setTimeout(updateProcessStates, 0);
    },

    // ── Max Claim ───────────────────────────────────────────────────────────
    updateMaxClaim: (processId, resourceId, value) => {
      set((s) => ({
        processes: s.processes.map(p => {
          if (p.id === processId) return { ...p, max: { ...p.max, [resourceId]: value } };
          return p;
        })
      }));
      logEvent(`Updated Max Claim for ${processId}`);
    },

    // ── Prevention Toggles ──────────────────────────────────────────────────
    togglePrevention: (protocol) => {
      set((s) => ({
        prevention: { ...s.prevention, [protocol]: !s.prevention[protocol] }
      }));
      const s = get();
      const status = s.prevention[protocol] ? 'ENABLED' : 'DISABLED';
      logEvent(`Prevention rule ${protocol} ${status}.`);
      addTimelineEntry(`Prevention: ${protocol} ${status}`, 'prevention');
    },

    // ── Simulation Controls ─────────────────────────────────────────────────
    pauseSimulation: () => set({ simulationStatus: 'paused' }),
    resumeSimulation: () => set({ simulationStatus: 'running' }),
    setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

    // ── Recovery Actions ────────────────────────────────────────────────────
    abortAllDeadlocked: () => {
      const s = get();
      const cycle = detectCycleFromState(s.processes, s.resources, s.edges);
      if (!cycle || cycle.length === 0) return;
      const deadlockedPids = cycle.filter(id => s.processes.some(p => p.id === id));
      deadlockedPids.forEach(pid => {
        set((st) => ({
          processes: st.processes.filter(p => p.id !== pid),
          edges: st.edges.filter(e => e.source !== pid && e.target !== pid)
        }));
      });
      logEvent(`RECOVERY: Aborted all deadlocked processes: ${deadlockedPids.join(', ')}`, 'warning');
      addTimelineEntry(`Mass termination: ${deadlockedPids.join(', ')}`, 'recovery');
      set((st) => ({
        recoveryLog: [...st.recoveryLog, {
          id: Date.now(),
          action: 'abort_all',
          targets: deadlockedPids,
          timestamp: new Date().toLocaleTimeString()
        }]
      }));
      setTimeout(updateProcessStates, 0);
    },

    recordRecovery: (action, target) => {
      set((s) => ({
        recoveryLog: [...s.recoveryLog, {
          id: Date.now(),
          action,
          targets: [target],
          timestamp: new Date().toLocaleTimeString()
        }],
        starvationCounters: {
          ...s.starvationCounters,
          [target]: (s.starvationCounters[target] || 0) + 1
        }
      }));
    },

    // ── Prevention Protocol Execution ────────────────────────────────────────

    /**
     * Protocol 1: Hold and Wait — Request All At Once
     * Returns the computed result with steps for animation.
     */
    executeHoldAndWaitAllAtOnce: (processId, requestedResourceIds) => {
      const s = get();
      const result = computeHoldAndWaitAllAtOnce(s.processes, s.resources, s.edges, processId, requestedResourceIds);

      if (result.canAllocate) {
        const newEdges = requestedResourceIds.map(rId => ({ source: rId, target: processId, type: 'assignment' }));
        set({ edges: [...s.edges, ...newEdges] });
        logEvent(`PREVENTION [Hold&Wait P1]: ${processId} allocated all: ${requestedResourceIds.join(', ')}`, 'info');
        addTimelineEntry(`${processId} granted all resources atomically (Hold & Wait P1)`, 'prevention');
        playSuccess();
      } else {
        set({
          processes: s.processes.map(p => p.id === processId ? { ...p, state: 'waiting' } : p)
        });
        logEvent(`PREVENTION [Hold&Wait P1]: ${processId} denied — not all resources available`, 'error');
        addTimelineEntry(`${processId} request denied — partial allocation prevented (Hold & Wait P1)`, 'prevention');
        playAlarm();
      }
      setTimeout(updateProcessStates, 50);
      return result;
    },

    /**
     * Protocol 2: Hold and Wait — Request Only When Holding None
     * Returns the computed result with steps for animation.
     */
    executeHoldAndWaitReleaseFirst: (processId, newRequestedIds) => {
      const s = get();
      const result = computeHoldAndWaitReleaseFirst(s.processes, s.resources, s.edges, processId, newRequestedIds);

      if (result.mustRelease) {
        const remainingEdges = s.edges.filter(e => !(e.type === 'assignment' && e.target === processId));
        const releasedResources = [...new Set(s.edges.filter(e => e.type === 'assignment' && e.target === processId).map(e => e.source))];
        logEvent(`PREVENTION [Hold&Wait P2]: ${processId} releasing all held: ${releasedResources.join(', ')}`, 'warning');
        addTimelineEntry(`${processId} released all resources: ${releasedResources.join(', ')} (Hold & Wait P2)`, 'prevention');

        const allNeeded = result.allNeeded;
        if (result.allAvailable) {
          const newEdges = allNeeded.map(rId => ({ source: rId, target: processId, type: 'assignment' }));
          set({ edges: [...remainingEdges, ...newEdges] });
          logEvent(`PREVENTION [Hold&Wait P2]: ${processId} re-allocated all: ${allNeeded.join(', ')}`, 'info');
          addTimelineEntry(`${processId} re-granted all resources after release (Hold & Wait P2)`, 'prevention');
          playSuccess();
        } else {
          set({
            edges: remainingEdges,
            processes: s.processes.map(p => p.id === processId ? { ...p, state: 'waiting' } : p)
          });
          logEvent(`PREVENTION [Hold&Wait P2]: ${processId} released but cannot get all needed — WAITING`, 'error');
          addTimelineEntry(`${processId} released resources, re-request denied — WAITING (Hold & Wait P2)`, 'prevention');
          playAlarm();
        }
      } else {
        if (result.allAvailable) {
          const newEdges = newRequestedIds.map(rId => ({ source: rId, target: processId, type: 'assignment' }));
          set({ edges: [...s.edges, ...newEdges] });
          logEvent(`PREVENTION [Hold&Wait P2]: ${processId} holds nothing, allocated: ${newRequestedIds.join(', ')}`, 'info');
          addTimelineEntry(`${processId} allocated resources (held nothing) (Hold & Wait P2)`, 'prevention');
          playSuccess();
        } else {
          set({
            processes: s.processes.map(p => p.id === processId ? { ...p, state: 'waiting' } : p)
          });
          logEvent(`PREVENTION [Hold&Wait P2]: ${processId} denied — resources unavailable`, 'error');
          addTimelineEntry(`${processId} request denied (Hold & Wait P2)`, 'prevention');
          playAlarm();
        }
      }
      setTimeout(updateProcessStates, 50);
      return result;
    },

    /**
     * Protocol 3: No Preemption — Force Resource Release
     * Returns the computed result with steps for animation.
     */
    executeNoPreemptionForceRelease: (processId, requestedResourceId) => {
      const s = get();
      const result = computeForceRelease(s.processes, s.resources, s.edges, processId, requestedResourceId);

      if (result.resourceAvailable) {
        set({ edges: [...s.edges, { source: requestedResourceId, target: processId, type: 'assignment' }] });
        logEvent(`PREVENTION [NoPreemp P3]: ${requestedResourceId} allocated to ${processId}`, 'info');
        addTimelineEntry(`${requestedResourceId} allocated to ${processId} (No Preemption P3)`, 'prevention');
        playSuccess();
      } else if (result.preempted) {
        const remainingEdges = s.edges.filter(e => !(e.type === 'assignment' && e.target === processId));
        set({
          edges: remainingEdges,
          processes: s.processes.map(p => p.id === processId ? { ...p, state: 'waiting' } : p)
        });
        logEvent(`PREVENTION [NoPreemp P3]: Forcibly preempted all from ${processId}: ${result.heldResourceIds.join(', ')}`, 'warning');
        addTimelineEntry(`${processId} forcibly preempted — all resources released (No Preemption P3)`, 'prevention');
        playAlarm();
      } else {
        set({
          processes: s.processes.map(p => p.id === processId ? { ...p, state: 'waiting' } : p)
        });
        logEvent(`PREVENTION [NoPreemp P3]: ${processId} must wait for ${requestedResourceId}`, 'info');
        addTimelineEntry(`${processId} waiting for ${requestedResourceId} (No Preemption P3)`, 'prevention');
      }
      setTimeout(updateProcessStates, 50);
      return result;
    },

    /**
     * Protocol 4: No Preemption — Preempt From Blocked Process
     * Returns the computed result with steps for animation.
     */
    executeNoPreemptionFromBlocked: (requestingProcessId, resourceId) => {
      const s = get();
      const result = computePreemptFromBlocked(s.processes, s.resources, s.edges, requestingProcessId, resourceId);

      if (result.resourceAvailable) {
        set({ edges: [...s.edges, { source: resourceId, target: requestingProcessId, type: 'assignment' }] });
        logEvent(`PREVENTION [NoPreemp P4]: ${resourceId} available — allocated to ${requestingProcessId}`, 'info');
        addTimelineEntry(`${resourceId} allocated to ${requestingProcessId} (No Preemption P4)`, 'prevention');
        playSuccess();
      } else if (result.transferred && result.victim && result.victimEdge) {
        const newEdges = s.edges.filter(e => e !== result.victimEdge);
        newEdges.push({ source: resourceId, target: requestingProcessId, type: 'assignment' });
        set({ edges: newEdges });
        logEvent(`PREVENTION [NoPreemp P4]: ${resourceId} preempted from ${result.victim} → ${requestingProcessId}`, 'warning');
        addTimelineEntry(`${resourceId} preempted: ${result.victim} → ${requestingProcessId} (No Preemption P4)`, 'prevention');
        playSuccess();
      } else {
        set({
          processes: s.processes.map(p => p.id === requestingProcessId ? { ...p, state: 'waiting' } : p)
        });
        logEvent(`PREVENTION [NoPreemp P4]: No blocked holder for ${resourceId} — ${requestingProcessId} must wait`, 'info');
        addTimelineEntry(`${requestingProcessId} waiting — no preemptable holder (No Preemption P4)`, 'prevention');
      }
      setTimeout(updateProcessStates, 50);
      return result;
    },

    /**
     * Protocol 5: Circular Wait — Resource Ordering
     * Returns the computed result with steps for animation.
     */
    executeCircularWaitOrdering: (processId, resourceId) => {
      const s = get();
      const result = computeCircularWaitCheck(s.processes, s.resources, s.edges, processId, resourceId);

      if (result.allowed) {
        const resource = s.resources.find(r => r.id === resourceId);
        const currentAllocated = s.edges.filter(e => e.type === 'assignment' && e.source === resourceId).length;
        const available = resource ? resource.instances - currentAllocated : 0;

        if (available > 0) {
          set({ edges: [...s.edges, { source: resourceId, target: processId, type: 'assignment' }] });
          logEvent(`PREVENTION [CircWait]: ${processId} allocated ${resourceId} (order: ${result.requestedOrder} > max held: ${result.maxHeldOrder})`, 'info');
          addTimelineEntry(`${resourceId} allocated to ${processId} — ordering maintained (Circular Wait)`, 'prevention');
          playSuccess();
        } else {
          set({
            processes: s.processes.map(p => p.id === processId ? { ...p, state: 'waiting' } : p)
          });
          logEvent(`PREVENTION [CircWait]: Ordering OK but ${resourceId} depleted — ${processId} waiting`, 'info');
          addTimelineEntry(`${processId} waiting — ${resourceId} depleted (Circular Wait)`, 'prevention');
        }
      } else {
        logEvent(`PREVENTION [CircWait]: ${processId} DENIED ${resourceId} (order ${result.requestedOrder} ≤ max held ${result.maxHeldOrder})`, 'error');
        addTimelineEntry(`${processId} denied ${resourceId} — violates resource ordering (Circular Wait)`, 'prevention');
        playAlarm();
      }
      setTimeout(updateProcessStates, 50);
      return result;
    },

    /**
     * Utility: Directly set a process state (for protocol demos)
     */
    setProcessState: (processId, state) => {
      set((s) => ({
        processes: s.processes.map(p => p.id === processId ? { ...p, state } : p)
      }));
    },

    // ── Quiz / Progress ─────────────────────────────────────────────────────
    setQuizScore: (quizId, score) => {
      set((s) => ({ quizScores: { ...s.quizScores, [quizId]: score } }));
    },
    completeChallenge: (challengeId) => {
      set((s) => ({
        completedChallenges: s.completedChallenges.includes(challengeId)
          ? s.completedChallenges
          : [...s.completedChallenges, challengeId]
      }));
    },

    // ── Timeline ────────────────────────────────────────────────────────────
    clearTimeline: () => set({ timeline: [] }),

    // ── Logging ─────────────────────────────────────────────────────────────
    addLog: (msg, type = 'info') => { logEvent(msg, type); },

    // ── System Reset ────────────────────────────────────────────────────────
    resetSystem: () => {
      set({
        processes: [],
        resources: [],
        edges: [],
        timeline: [{ id: ++_timelineIdCounter, timestamp: Date.now(), timeLabel: new Date().toLocaleTimeString(), description: 'System reset', eventType: 'system', step: 0 }],
        logs: [{ id: 1, time: new Date().toLocaleTimeString(), msg: 'SYSTEM RESET', type: 'info' }],
        recoveryLog: [],
        starvationCounters: {},
        globalAlert: null
      });
    }
  };
});


// ─── Computed Selectors ─────────────────────────────────────────────────────
export const useComputedSystemState = () => {
  const processes = useSimulationStore(s => s.processes);
  const resources = useSimulationStore(s => s.resources);
  const edges = useSimulationStore(s => s.edges);

  const nodes = [
    ...processes.map(p => ({ id: p.id, type: 'process', state: p.state })),
    ...resources.map(r => ({ id: r.id, type: 'resource', instances: r.instances }))
  ];

  const allocationMatrix = processes.map(p =>
    resources.map(r => edges.filter(e => e.type === 'assignment' && e.source === r.id && e.target === p.id).length)
  );

  const requestMatrix = processes.map(p =>
    resources.map(r => edges.filter(e => e.type === 'request' && e.source === p.id && e.target === r.id).length)
  );

  const maxMatrix = processes.map(p => resources.map(r => p.max[r.id] || 0));

  const needMatrix = processes.map((p, i) =>
    resources.map((r, j) => Math.max(0, maxMatrix[i][j] - allocationMatrix[i][j]))
  );

  const availableVector = resources.map((r, rIdx) => {
    const totalAllocated = allocationMatrix.reduce((sum, pAlloc) => sum + pAlloc[rIdx], 0);
    return r.instances - totalAllocated;
  });

  const blockedProcesses = processes.filter(p => p.state === 'blocked');
  const waitingProcesses = processes.filter(p => p.state === 'waiting');

  const cycleNodes = detectCycleFromState(processes, resources, edges);
  const hasDeadlock = cycleNodes && cycleNodes.length > 0;

  let deadlockRiskLevel = 'safe';
  if (hasDeadlock) {
    deadlockRiskLevel = 'deadlock';
  } else if (waitingProcesses.length > 0 || (processes.length > 0 && availableVector.some(v => v <= 0))) {
    deadlockRiskLevel = 'warning';
  }

  return {
    nodes,
    allocationMatrix,
    requestMatrix,
    maxMatrix,
    needMatrix,
    availableVector,
    blockedProcesses,
    waitingProcesses,
    cycleNodes: cycleNodes || [],
    hasDeadlock,
    deadlockRiskLevel
  };
};


export default useSimulationStore;
