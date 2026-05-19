import React, { createContext, useContext, useReducer } from 'react';
import { playBeep, playAlarm } from '../utils/audio';

const SystemContext = createContext();

export const TEXTBOOK_PRESETS = {
  fig73: {
    resources: [{ id: 'R1', instances: 10 }, { id: 'R2', instances: 5 }, { id: 'R3', instances: 7 }],
    processes: [
      { id: 'P1', max: { R1: 7, R2: 5, R3: 3 } },
      { id: 'P2', max: { R1: 3, R2: 2, R3: 2 } },
      { id: 'P3', max: { R1: 9, R2: 0, R3: 2 } },
      { id: 'P4', max: { R1: 2, R2: 2, R3: 2 } },
      { id: 'P5', max: { R1: 4, R2: 3, R3: 3 } }
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
    resources: [{ id: 'R1', instances: 1 }, { id: 'R2', instances: 1 }, { id: 'R3', instances: 1 }],
    processes: [
      { id: 'P1', max: { R1: 1, R2: 1, R3: 0 } },
      { id: 'P2', max: { R1: 0, R2: 1, R3: 1 } },
      { id: 'P3', max: { R1: 1, R2: 0, R3: 1 } }
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

const initialState = {
  activeModule: 'dashboard',
  globalAlert: null, // { type, msg, actionModule, actionText }
  ...TEXTBOOK_PRESETS.fig73,
  prevention: {
    mutualExclusion: false,
    holdAndWait: false,
    noPreemption: false,
    circularWait: false
  },
  logs: [
    { id: 1, time: new Date().toLocaleTimeString(), msg: 'SYSTEM BOOT SEQUENCE INITIATED', type: 'info' }
  ],
  professorMode: false
};

function systemReducer(state, action) {
  let newState = { ...state };

  const log = (msg, type = 'info') => {
    newState.logs = [...newState.logs, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), msg, type }].slice(-100);
  };

  switch (action.type) {
    case 'SET_ACTIVE_MODULE':
      newState.activeModule = action.payload;
      break;

    case 'TRIGGER_ALERT':
      newState.globalAlert = action.payload;
      playAlarm();
      break;

    case 'CLEAR_ALERT':
      newState.globalAlert = null;
      break;

    case 'LOAD_PRESET':
      const preset = TEXTBOOK_PRESETS[action.payload];
      if (preset) {
         newState.resources = preset.resources;
         newState.processes = preset.processes;
         newState.edges = preset.edges;
         log(`Loaded textbook preset: ${action.payload}`);
      }
      break;

    case 'INJECT_STATE':
      newState.resources = action.payload.resources;
      newState.processes = action.payload.processes;
      newState.edges = action.payload.edges;
      log(`Injected specific system topology.`);
      break;

    case 'SET_ALLOCATION':
       // Reverse sync: User edits Banker's allocation matrix directly.
       // We must update the edges array.
       const { pId, rId, newCount } = action.payload;
       let currentAssigned = state.edges.filter(e => e.type === 'assignment' && e.source === rId && e.target === pId).length;
       
       if (newCount > currentAssigned) {
          // Check capacity
          const rObj = state.resources.find(r => r.id === rId);
          const totalAssignedR = state.edges.filter(e => e.type === 'assignment' && e.source === rId).length;
          if (totalAssignedR + (newCount - currentAssigned) > rObj.instances) {
             log(`Cannot allocate ${rId} to ${pId}: Not enough instances.`, 'error');
             playAlarm();
             return state;
          }
          // Add edges
          for (let i = 0; i < (newCount - currentAssigned); i++) {
             newState.edges.push({ source: rId, target: pId, type: 'assignment' });
          }
          log(`Allocated ${newCount - currentAssigned} instances of ${rId} to ${pId}`);
       } else if (newCount < currentAssigned) {
          // Remove edges
          let removed = 0;
          const targetRemove = currentAssigned - newCount;
          newState.edges = state.edges.filter(e => {
             if (e.type === 'assignment' && e.source === rId && e.target === pId && removed < targetRemove) {
                 removed++;
                 return false;
             }
             return true;
          });
          log(`Deallocated ${targetRemove} instances of ${rId} from ${pId}`);
       }
       break;

    // ... (Keep existing process/resource/edge logic) ...
    case 'ADD_PROCESS':
      const newPid = action.payload || `P${state.processes.length + 1}`;
      if (state.processes.find(p => p.id === newPid)) return state;
      const newMax = {};
      state.resources.forEach(r => newMax[r.id] = 0);
      newState.processes = [...state.processes, { id: newPid, max: newMax }];
      log(`Spawned process ${newPid}`);
      break;

    case 'REMOVE_PROCESS':
      newState.processes = state.processes.filter(p => p.id !== action.payload);
      newState.edges = state.edges.filter(e => e.source !== action.payload && e.target !== action.payload);
      log(`Terminated process ${action.payload}`, 'warning');
      break;

    case 'ADD_RESOURCE':
      const newRid = action.payload.id || `R${state.resources.length + 1}`;
      if (state.resources.find(r => r.id === newRid)) return state;
      newState.resources = [...state.resources, { id: newRid, instances: action.payload.instances || 1 }];
      newState.processes = state.processes.map(p => ({ ...p, max: { ...p.max, [newRid]: 0 } }));
      log(`Mounted resource ${newRid}`);
      break;

    case 'UPDATE_RESOURCE':
      newState.resources = state.resources.map(r => r.id === action.payload.id ? { ...r, instances: action.payload.instances } : r);
      log(`Updated ${action.payload.id} instance count`);
      break;

    case 'REMOVE_RESOURCE':
      newState.resources = state.resources.filter(r => r.id !== action.payload);
      newState.edges = state.edges.filter(e => e.source !== action.payload && e.target !== action.payload);
      newState.processes = state.processes.map(p => {
        const { [action.payload]: removed, ...restMax } = p.max;
        return { ...p, max: restMax };
      });
      log(`Dismounted resource ${action.payload}`, 'warning');
      break;

    case 'ADD_EDGE':
      const { source, target, type } = action.payload;
      if (state.prevention.holdAndWait && type === 'request') {
         const holds = state.edges.some(e => e.type === 'assignment' && e.target === source);
         if (holds) {
             log(`Prevention [Hold & Wait]: ${source} denied request.`, 'error');
             playAlarm();
             return state;
         }
      }
      if (state.prevention.circularWait && type === 'request') {
         const heldResourceIds = state.edges.filter(e => e.type === 'assignment' && e.target === source).map(e => e.source);
         if (heldResourceIds.length > 0) {
            const maxHeld = heldResourceIds.sort().pop();
            if (target <= maxHeld) {
               log(`Prevention [Circular Wait]: ${source} denied request (must be > ${maxHeld}).`, 'error');
               playAlarm();
               return state;
            }
         }
      }
      if (type === 'assignment') {
         const resource = state.resources.find(r => r.id === source);
         const currentAssigned = state.edges.filter(e => e.type === 'assignment' && e.source === source).length;
         if (currentAssigned >= resource.instances) {
            log(`Error: ${source} depleted.`, 'error');
            playAlarm();
            return state;
         }
      }
      const exists = state.edges.some(e => e.source === source && e.target === target && e.type === type);
      if (!exists) {
        newState.edges = [...state.edges, { source, target, type }];
        log(`Added ${type} edge: ${source} -> ${target}`);
      }
      break;

    case 'REMOVE_EDGE':
      if (action.payload.exact) {
         // remove specific edge object
         newState.edges = state.edges.filter(e => e !== action.payload.exact);
      } else {
         newState.edges = state.edges.filter(e => !(e.source === action.payload.source && e.target === action.payload.target));
      }
      log(`Removed edge.`);
      break;

    case 'UPDATE_MAX_CLAIM':
      const { processId, resourceId, value } = action.payload;
      newState.processes = state.processes.map(p => {
        if (p.id === processId) return { ...p, max: { ...p.max, [resourceId]: value } };
        return p;
      });
      log(`Updated Max Claim for ${processId}`);
      break;

    case 'TOGGLE_PREVENTION':
      newState.prevention = { ...state.prevention, [action.payload]: !state.prevention[action.payload] };
      log(`Prevention rule updated.`);
      break;

    case 'ADD_LOG':
      log(action.payload.msg, action.payload.type);
      break;

    default:
      return state;
  }

  return newState;
}

export function SystemProvider({ children }) {
  const [state, dispatch] = useReducer(systemReducer, initialState);

  const nodes = [
    ...state.processes.map(p => ({ id: p.id, type: 'process' })),
    ...state.resources.map(r => ({ id: r.id, type: 'resource', instances: r.instances }))
  ];

  const allocationMatrix = state.processes.map(p => {
    return state.resources.map(r => state.edges.filter(e => e.type === 'assignment' && e.source === r.id && e.target === p.id).length);
  });

  const requestMatrix = state.processes.map(p => {
    return state.resources.map(r => state.edges.filter(e => e.type === 'request' && e.source === p.id && e.target === r.id).length);
  });

  const maxMatrix = state.processes.map(p => state.resources.map(r => p.max[r.id] || 0));

  const availableVector = state.resources.map((r, rIdx) => {
    const totalAllocated = allocationMatrix.reduce((sum, pAlloc) => sum + pAlloc[rIdx], 0);
    return r.instances - totalAllocated;
  });

  const value = {
    state,
    dispatch,
    computed: { nodes, allocationMatrix, requestMatrix, maxMatrix, availableVector }
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem() {
  return useContext(SystemContext);
}
