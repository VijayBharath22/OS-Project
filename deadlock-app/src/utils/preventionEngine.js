// ─── Prevention Engine ─────────────────────────────────────────────────────
// Pure computation functions for deadlock prevention protocols.
// Each function analyzes the current system state and returns a structured
// result with step-by-step descriptions for animated visualization.
// No side effects — actual state mutation is done in the Zustand store.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Protocol 1: Hold and Wait Prevention — "Request All Resources At Once"
 *
 * A process must request ALL required resources before execution.
 * If all available → allocate everything. Otherwise → allocate nothing.
 */
export function computeHoldAndWaitAllAtOnce(processes, resources, edges, processId, requestedResourceIds) {
  const steps = [];
  const process = processes.find(p => p.id === processId);
  if (!process) return { canAllocate: false, steps: [{ type: 'error', msg: `Process ${processId} not found.` }] };

  // Step 1: Process declares all needed resources
  steps.push({
    type: 'request',
    msg: `${processId} requests all resources simultaneously: ${requestedResourceIds.join(', ')}`,
    highlight: requestedResourceIds,
    processState: 'requesting'
  });

  // Step 2: Check availability for EACH resource
  const availabilityChecks = [];
  let allAvailable = true;

  requestedResourceIds.forEach(rId => {
    const resource = resources.find(r => r.id === rId);
    if (!resource) {
      availabilityChecks.push({ rId, available: 0, total: 0, ok: false, reason: 'Resource does not exist' });
      allAvailable = false;
      return;
    }
    const currentAllocated = edges.filter(e => e.type === 'assignment' && e.source === rId).length;
    const available = resource.instances - currentAllocated;
    const ok = available > 0;
    if (!ok) allAvailable = false;
    availabilityChecks.push({ rId, available, total: resource.instances, ok });
  });

  steps.push({
    type: 'check',
    msg: `System checking availability of ${requestedResourceIds.length} resources...`,
    checks: availabilityChecks,
    allAvailable
  });

  // Step 3: Decision
  if (allAvailable) {
    steps.push({
      type: 'allocate',
      msg: `✓ All resources available — allocating ${requestedResourceIds.join(', ')} to ${processId}`,
      resources: requestedResourceIds,
      processState: 'running'
    });
    steps.push({
      type: 'success',
      msg: `${processId} received all resources atomically. No partial allocation occurred.`,
      banner: 'Hold and Wait condition eliminated — process requested everything at once.',
      processState: 'running'
    });
  } else {
    const unavailable = availabilityChecks.filter(c => !c.ok).map(c => c.rId);
    steps.push({
      type: 'deny',
      msg: `✗ Resources unavailable: ${unavailable.join(', ')} — Request DENIED`,
      unavailable,
      processState: 'waiting'
    });
    steps.push({
      type: 'prevention',
      msg: `No partial allocation. ${processId} gets NOTHING and enters WAITING state.`,
      banner: 'Hold and Wait condition eliminated — no partial allocation permitted.',
      processState: 'waiting'
    });
  }

  return { canAllocate: allAvailable, availabilityChecks, steps };
}


/**
 * Protocol 2: Hold and Wait Prevention — "Request Only When Holding None"
 *
 * A process can request resources ONLY if it currently holds NO resources.
 * If holding resources → must release all first, then re-request everything together.
 */
export function computeHoldAndWaitReleaseFirst(processes, resources, edges, processId, newRequestedIds) {
  const steps = [];
  const process = processes.find(p => p.id === processId);
  if (!process) return { mustRelease: false, steps: [{ type: 'error', msg: `Process ${processId} not found.` }] };

  // Step 1: Check what the process currently holds
  const heldEdges = edges.filter(e => e.type === 'assignment' && e.target === processId);
  const heldResourceIds = [...new Set(heldEdges.map(e => e.source))];

  steps.push({
    type: 'inspect',
    msg: `Inspecting ${processId}'s current resource holdings...`,
    held: heldResourceIds,
    heldCount: heldEdges.length
  });

  const mustRelease = heldResourceIds.length > 0;

  if (mustRelease) {
    // Step 2: Process holds resources — must release
    steps.push({
      type: 'violation',
      msg: `⚠ ${processId} currently holds: ${heldResourceIds.join(', ')} — Cannot request while holding resources!`,
      held: heldResourceIds,
      processState: 'releasing'
    });

    // Step 3: Force release all
    steps.push({
      type: 'release',
      msg: `Forcibly releasing all resources from ${processId}: ${heldResourceIds.join(', ')}`,
      released: heldResourceIds,
      releasedEdges: heldEdges,
      processState: 'idle'
    });

    // Step 4: Combine old + new into unified request
    const allNeeded = [...new Set([...heldResourceIds, ...newRequestedIds])];
    steps.push({
      type: 'rerequest',
      msg: `${processId} now re-requests ALL needed resources: ${allNeeded.join(', ')}`,
      allNeeded,
      processState: 'requesting'
    });

    // Step 5: Check availability of the combined set
    let allAvailable = true;
    const checks = [];
    allNeeded.forEach(rId => {
      const resource = resources.find(r => r.id === rId);
      // After release, we have the released instances back
      const wasHeldCount = heldEdges.filter(e => e.source === rId).length;
      const currentAllocated = edges.filter(e => e.type === 'assignment' && e.source === rId).length - wasHeldCount;
      const available = resource ? resource.instances - Math.max(0, currentAllocated) : 0;
      const ok = available > 0;
      if (!ok) allAvailable = false;
      checks.push({ rId, available, ok });
    });

    if (allAvailable) {
      steps.push({
        type: 'allocate',
        msg: `✓ All resources available after release — allocating ${allNeeded.join(', ')} to ${processId}`,
        resources: allNeeded,
        processState: 'running'
      });
    } else {
      steps.push({
        type: 'deny',
        msg: `✗ Not all resources available even after release — ${processId} must WAIT`,
        processState: 'waiting'
      });
    }

    steps.push({
      type: 'prevention',
      msg: 'Process cannot request resources while holding others.',
      banner: 'Hold and Wait condition eliminated — process must hold nothing before requesting.',
      processState: allAvailable ? 'running' : 'waiting'
    });

    return { mustRelease, heldResourceIds, heldEdges, newRequestedIds, allNeeded: [...new Set([...heldResourceIds, ...newRequestedIds])], allAvailable, steps };
  } else {
    // Process holds nothing — can proceed normally
    steps.push({
      type: 'clear',
      msg: `✓ ${processId} holds no resources — may proceed with request: ${newRequestedIds.join(', ')}`,
      processState: 'requesting'
    });

    // Check availability
    let allAvailable = true;
    newRequestedIds.forEach(rId => {
      const resource = resources.find(r => r.id === rId);
      const currentAllocated = edges.filter(e => e.type === 'assignment' && e.source === rId).length;
      const available = resource ? resource.instances - currentAllocated : 0;
      if (available <= 0) allAvailable = false;
    });

    if (allAvailable) {
      steps.push({
        type: 'allocate',
        msg: `✓ All resources available — allocating ${newRequestedIds.join(', ')} to ${processId}`,
        resources: newRequestedIds,
        processState: 'running'
      });
    } else {
      steps.push({
        type: 'deny',
        msg: `✗ Some resources unavailable — ${processId} must WAIT`,
        processState: 'waiting'
      });
    }

    steps.push({
      type: 'prevention',
      msg: 'Hold and Wait condition eliminated — process was holding nothing.',
      banner: 'Hold and Wait condition eliminated.',
      processState: allAvailable ? 'running' : 'waiting'
    });

    return { mustRelease: false, heldResourceIds: [], allAvailable, steps };
  }
}


/**
 * Protocol 3: No Preemption — "Force Resource Release"
 *
 * If a process holding resources requests another unavailable resource,
 * the OS forcibly preempts all currently held resources and puts the process in WAITING.
 */
export function computeForceRelease(processes, resources, edges, processId, requestedResourceId) {
  const steps = [];
  const process = processes.find(p => p.id === processId);
  if (!process) return { preempted: false, steps: [{ type: 'error', msg: `Process ${processId} not found.` }] };

  // Step 1: Process requests a resource
  steps.push({
    type: 'request',
    msg: `${processId} requests ${requestedResourceId}`,
    highlight: [requestedResourceId],
    processState: 'requesting'
  });

  // Step 2: Check if requested resource is available
  const resource = resources.find(r => r.id === requestedResourceId);
  const currentAllocated = resource ? edges.filter(e => e.type === 'assignment' && e.source === requestedResourceId).length : 0;
  const available = resource ? resource.instances - currentAllocated : 0;

  if (available > 0) {
    // Resource IS available — just allocate normally
    steps.push({
      type: 'available',
      msg: `${requestedResourceId} is available (${available} free) — allocating normally`,
      processState: 'running'
    });
    steps.push({
      type: 'allocate',
      msg: `✓ ${requestedResourceId} allocated to ${processId}`,
      resources: [requestedResourceId],
      processState: 'running'
    });
    return { preempted: false, resourceAvailable: true, steps };
  }

  // Step 3: Resource unavailable — check what the process holds
  steps.push({
    type: 'unavailable',
    msg: `✗ ${requestedResourceId} is UNAVAILABLE (0 free of ${resource?.instances || 0})`,
    processState: 'requesting'
  });

  const heldEdges = edges.filter(e => e.type === 'assignment' && e.target === processId);
  const heldResourceIds = [...new Set(heldEdges.map(e => e.source))];

  if (heldEdges.length === 0) {
    steps.push({
      type: 'info',
      msg: `${processId} holds no resources — simply enters WAITING`,
      processState: 'waiting'
    });
    return { preempted: false, resourceAvailable: false, heldResourceIds: [], steps };
  }

  // Step 4: Trigger preemption protocol
  steps.push({
    type: 'preempt_trigger',
    msg: `⚠ NO PREEMPTION PROTOCOL TRIGGERED — ${processId} holds ${heldResourceIds.join(', ')} while requesting unavailable ${requestedResourceId}`,
    held: heldResourceIds,
    processState: 'preempting'
  });

  // Step 5: Forcibly release each held resource
  heldResourceIds.forEach(rId => {
    const count = heldEdges.filter(e => e.source === rId).length;
    steps.push({
      type: 'force_release',
      msg: `Forcibly releasing ${rId} (×${count}) from ${processId} — returned to available pool`,
      resource: rId,
      count,
      processState: 'preempting'
    });
  });

  // Step 6: Process enters waiting
  steps.push({
    type: 'waiting',
    msg: `${processId} moved to WAITING queue. Will retry when resources become available.`,
    processState: 'waiting'
  });

  steps.push({
    type: 'prevention',
    msg: 'No process is allowed to indefinitely hold resources while waiting.',
    banner: 'No Preemption condition eliminated — resources forcibly released.',
    processState: 'waiting'
  });

  return { preempted: true, resourceAvailable: false, heldResourceIds, heldEdges, steps };
}


/**
 * Protocol 4: No Preemption — "Preempt Resource From Blocked Process"
 *
 * If requested resource is unavailable, check if it's held by a WAITING/BLOCKED process.
 * If yes → preempt it from the victim and assign to the requester.
 */
export function computePreemptFromBlocked(processes, resources, edges, requestingProcessId, resourceId) {
  const steps = [];
  const requester = processes.find(p => p.id === requestingProcessId);
  if (!requester) return { transferred: false, steps: [{ type: 'error', msg: `Process ${requestingProcessId} not found.` }] };

  // Step 1: Request
  steps.push({
    type: 'request',
    msg: `${requestingProcessId} requests ${resourceId}`,
    highlight: [resourceId],
    processState: 'requesting'
  });

  // Step 2: Check availability
  const resource = resources.find(r => r.id === resourceId);
  const currentAllocated = resource ? edges.filter(e => e.type === 'assignment' && e.source === resourceId).length : 0;
  const available = resource ? resource.instances - currentAllocated : 0;

  if (available > 0) {
    steps.push({
      type: 'available',
      msg: `${resourceId} is available — allocating normally to ${requestingProcessId}`,
      processState: 'running'
    });
    return { transferred: false, resourceAvailable: true, steps };
  }

  steps.push({
    type: 'unavailable',
    msg: `✗ ${resourceId} is UNAVAILABLE — searching for blocked holders...`,
    processState: 'searching'
  });

  // Step 3: Find who holds this resource and is WAITING or BLOCKED
  const holders = edges
    .filter(e => e.type === 'assignment' && e.source === resourceId)
    .map(e => e.target);
  const uniqueHolders = [...new Set(holders)];

  const blockedHolders = uniqueHolders.filter(pId => {
    const proc = processes.find(p => p.id === pId);
    return proc && (proc.state === 'waiting' || proc.state === 'blocked');
  });

  steps.push({
    type: 'scan',
    msg: `${resourceId} is held by: ${uniqueHolders.join(', ')}. Checking for blocked/waiting holders...`,
    holders: uniqueHolders,
    blockedHolders
  });

  if (blockedHolders.length === 0) {
    steps.push({
      type: 'no_victim',
      msg: `No blocked/waiting process holds ${resourceId}. Cannot preempt — ${requestingProcessId} must WAIT.`,
      processState: 'waiting'
    });
    return { transferred: false, resourceAvailable: false, victim: null, steps };
  }

  // Step 4: Select victim (first blocked holder)
  const victim = blockedHolders[0];
  steps.push({
    type: 'victim_select',
    msg: `⚠ VICTIM SELECTED: ${victim} (state: ${processes.find(p => p.id === victim)?.state}) holds ${resourceId}`,
    victim,
    processState: 'preempting'
  });

  // Step 5: Preempt
  const victimEdge = edges.find(e => e.type === 'assignment' && e.source === resourceId && e.target === victim);
  steps.push({
    type: 'preempt',
    msg: `Preempting ${resourceId} from ${victim} → Reassigning to ${requestingProcessId}`,
    from: victim,
    to: requestingProcessId,
    resource: resourceId,
    victimEdge,
    processState: 'transferring'
  });

  // Step 6: Update complete
  steps.push({
    type: 'transfer_complete',
    msg: `✓ ${resourceId} successfully transferred: ${victim} → ${requestingProcessId}`,
    processState: 'running'
  });

  steps.push({
    type: 'prevention',
    msg: 'Blocked processes cannot indefinitely hold resources needed by others.',
    banner: 'No Preemption condition eliminated — resource preempted from blocked process.',
    processState: 'running'
  });

  return { transferred: true, resourceAvailable: false, victim, victimEdge, steps };
}


/**
 * Protocol 5: Circular Wait Prevention — "Resource Ordering"
 *
 * Resources are ordered: R1 < R2 < R3 ...
 * Processes may only request resources with a higher order number than their highest held resource.
 */
export function computeCircularWaitCheck(processes, resources, edges, processId, requestedResourceId) {
  const steps = [];
  const process = processes.find(p => p.id === processId);
  if (!process) return { allowed: false, steps: [{ type: 'error', msg: `Process ${processId} not found.` }] };

  // Build ordering map
  const ordering = {};
  resources.forEach((r, idx) => { ordering[r.id] = idx + 1; });

  const requestedOrder = ordering[requestedResourceId] || 0;

  steps.push({
    type: 'request',
    msg: `${processId} requests ${requestedResourceId} (order: ${requestedOrder})`,
    highlight: [requestedResourceId],
    ordering
  });

  // Check what process currently holds
  const heldEdges = edges.filter(e => e.type === 'assignment' && e.target === processId);
  const heldResourceIds = [...new Set(heldEdges.map(e => e.source))];
  const heldOrders = heldResourceIds.map(rId => ({ rId, order: ordering[rId] || 0 }));
  const maxHeldOrder = heldOrders.length > 0 ? Math.max(...heldOrders.map(h => h.order)) : 0;
  const maxHeldResource = heldOrders.find(h => h.order === maxHeldOrder)?.rId || 'none';

  steps.push({
    type: 'inspect',
    msg: `${processId} currently holds: ${heldResourceIds.length > 0 ? heldResourceIds.map(r => `${r}(${ordering[r]})`).join(', ') : 'nothing'}`,
    held: heldOrders,
    maxHeldOrder,
    maxHeldResource
  });

  // Show the ordering chain
  steps.push({
    type: 'ordering',
    msg: `Resource ordering: ${resources.map(r => `${r.id}(${ordering[r.id]})`).join(' < ')}`,
    ordering,
    maxHeldOrder,
    requestedOrder
  });

  const allowed = heldResourceIds.length === 0 || requestedOrder > maxHeldOrder;

  if (allowed) {
    steps.push({
      type: 'allowed',
      msg: `✓ Request ALLOWED: ${requestedResourceId}(${requestedOrder}) > ${maxHeldResource}(${maxHeldOrder})`,
      processState: 'running'
    });
    steps.push({
      type: 'prevention',
      msg: 'Resource ordering maintained — circular wait impossible.',
      banner: 'Circular Wait condition eliminated — resources requested in proper order.',
      processState: 'running'
    });
  } else {
    steps.push({
      type: 'denied',
      msg: `✗ Request DENIED: ${requestedResourceId}(${requestedOrder}) ≤ ${maxHeldResource}(${maxHeldOrder}) — violates ordering!`,
      processState: 'blocked'
    });
    steps.push({
      type: 'prevention',
      msg: `${processId} must only request resources with order > ${maxHeldOrder}`,
      banner: 'Circular Wait condition eliminated — out-of-order request denied.',
      processState: 'waiting'
    });
  }

  return { allowed, ordering, maxHeldOrder, requestedOrder, steps };
}
