import './style.css';

import { delay } from './utils/helpers.js';
import { getState, setState } from './core/store.js';
import { eventBus } from './core/eventBus.js';
import { connect } from './core/websocket.js';
import { SLOT_ID_MAP } from './core/protocol.js';

// Modules
import { mountGrid } from './modules/grid/gridView.js';
import { mountStatusBar } from './modules/status/statusBar.js';
import { mountHistory, animateProgress } from './modules/history/historyView.js';
import { updateSlot, setAllSlots } from './modules/grid/gridModel.js';
import { addRecord, updateRecord } from './modules/history/historyModel.js';
import { SlotState, ProcessStatus, ActionType } from './utils/constants.js';

// ── Mount views ──────────────────────────────────────────────
mountStatusBar(document.querySelector('#stats-container'));
mountGrid(document.querySelector('#parking-grid'));
mountHistory(document.querySelector('#history-log'));

// ── Filter wiring ────────────────────────────────────────────
eventBus.on('filter:change', (newFilters) => {
    setState({ filters: newFilters });
});

// ── WebSocket message handlers (api.ts protocol) ─────────────

// SlotStatusMessage – full or partial slot state update
eventBus.on('ws:slot_status', (msg) => {
    if (msg.slots) setAllSlots(msg.slots);
});

// BatchHistoryMessage – batch of history records
eventBus.on('ws:batch_history', (msg) => {
    if (msg.recs) {
        for (const rec of msg.recs) {
            addRecord({
                uid: rec.uid,
                act: rec.act,
                sid: rec.sid,
                st: rec.st,
            });
        }
    }
});

// ProgressMessage – progress update for a running task
eventBus.on('ws:progress', async (msg) => {
    animateProgress(msg.rid, msg.p, 1000);
});

// AckMessage – acknowledgment (used for task completion)
eventBus.on('ws:ack', async (msg) => {
    if (msg.st === ProcessStatus.SUCCESS) {
        await animateProgress(msg.rid, 100, 1000);
        await delay(500);
        updateRecord(msg.rid, { st: ProcessStatus.SUCCESS, progress: 100 });
    } else if (msg.st === ProcessStatus.ERROR) {
        updateRecord(msg.rid, { st: ProcessStatus.ERROR });
    }
});

// SyncResponseMessage – response to a sync request
eventBus.on('ws:sync_res', (msg) => {
    if (msg.updates?.slots) setAllSlots(msg.updates.slots);
    if (msg.updates?.recs) {
        for (const rec of msg.updates.recs) {
            addRecord({
                uid: rec.uid,
                act: rec.act,
                sid: rec.sid,
                st: rec.st,
            });
        }
    }
});

// ErrorMessage – system error
eventBus.on('ws:error', (msg) => {
    console.error('[System Error] code:', msg.c);
});

// ── Connect WebSocket ────────────────────────────────────────
connect();

// ── DEV-ONLY MOCK ────────────────────────────────────────────
async function runMock() {
    // ─── 1. Initial slot states (SlotStatusMessage format) ───
    await delay(300);
    setAllSlots([
        { sid: 1, st: SlotState.OCCUPIED, uid: 0xab12cd34 },
        { sid: 2, st: SlotState.EMPTY, uid: null },
        { sid: 3, st: SlotState.OCCUPIED, uid: 0xef56ab78 },
        { sid: 4, st: SlotState.EMPTY, uid: null },
        { sid: 5, st: SlotState.MOVING, uid: 0x11223344 },
        { sid: 6, st: SlotState.OCCUPIED, uid: 0xaabbccdd },
        { sid: 7, st: SlotState.OCCUPIED },
        { sid: 8, st: SlotState.EMPTY },
        { sid: 9, st: SlotState.OCCUPIED, uid: 0xffeeddcc },
    ]);

    // ─── 2. Existing history records ─────────────────────────
    await delay(200);
    addRecord({ uid: 0xab12cd34, act: ActionType.IN, sid: 1, st: ProcessStatus.SUCCESS });
    addRecord({ uid: 0xef56ab78, act: ActionType.IN, sid: 3, st: ProcessStatus.SUCCESS });
    addRecord({ uid: 0xaabb0000, act: ActionType.OUT, sid: 7, st: ProcessStatus.ERROR });
    addRecord({ uid: 0xaabbccdd, act: ActionType.IN, sid: 6, st: ProcessStatus.SUCCESS });

    // ─── 3. Live transaction: vehicle entering B2 (sid=5) ────
    await delay(1000);
    const recId = addRecord({
        uid: 0x11223344,
        act: ActionType.IN,
        sid: 5,
        st: ProcessStatus.PROCESSING,
    });

    // Start progress animation
    await delay(10);
    animateProgress(recId, 10, 2000);

    // Progress updates
    await delay(1500);
    animateProgress(recId, 40, 1000);

    await delay(1500);
    animateProgress(recId, 70, 1000);

    await delay(1500);
    animateProgress(recId, 90, 1000);

    // Complete → animate to 100% and mark SUCCESS
    await delay(1500);
    await animateProgress(recId, 100, 1000);
    await delay(500);
    updateRecord(recId, { st: ProcessStatus.SUCCESS, progress: 100 });

    // Update slot B2 to occupied after completion
    await delay(1500);
    updateSlot(5, { st: SlotState.OCCUPIED, uid: 0x11223344 });

    // ─── 4. Second transaction: vehicle leaving A1 (sid=1) ───
    await delay(1000);
    // Slot starts moving
    updateSlot(1, { st: SlotState.MOVING, uid: 0xab12cd34 });

    const recId2 = addRecord({
        uid: 0xab12cd34,
        act: ActionType.OUT,
        sid: 1,
        st: ProcessStatus.PROCESSING,
    });

    await delay(10);
    animateProgress(recId2, 15, 2000);

    await delay(1500);
    animateProgress(recId2, 50, 1000);

    await delay(1500);
    animateProgress(recId2, 85, 1000);

    await delay(1500);
    await animateProgress(recId2, 100, 1000);
    await delay(500);
    updateRecord(recId2, { st: ProcessStatus.SUCCESS, progress: 100 });

    await delay(1500);
    updateSlot(1, { st: SlotState.EMPTY, uid: null });
}
if (import.meta.env.DEV) {
    runMock();
}
