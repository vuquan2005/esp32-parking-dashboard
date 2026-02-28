import './style.css';

import { qs } from './utils/helpers.js';
import { setState, subscribe } from './core/store.js';
import { eventBus } from './core/eventBus.js';
import { connect } from './core/websocket.js';

// Modules
import { mountGrid } from './modules/grid/gridView.js';
import { mountStatusBar } from './modules/status/statusBar.js';
import { mountHistory, animateProgress } from './modules/history/historyView.js';
import { updateSlot, setAllSlots } from './modules/grid/gridModel.js';
import { addRecord, updateRecord } from './modules/history/historyModel.js';
import { SlotStatus, TxStatus, Action } from './utils/constants.js';

// ── Mount views ──────────────────────────────────────────────
mountStatusBar(qs('#stats-container'));
mountGrid(qs('#parking-grid'));
mountHistory(qs('#history-log'));

// ── Filter wiring ────────────────────────────────────────────
eventBus.on('filter:change', (newFilters) => {
    setState({ filters: newFilters });
});

// ── WebSocket message handlers ───────────────────────────────
eventBus.on('ws:init', (payload) => {
    // Full state sync from ESP32
    if (payload.slots) setAllSlots(payload.slots);
});

eventBus.on('ws:slot_update', (payload) => {
    // Single slot change  { name, status, uid }
    updateSlot(payload.name, { status: payload.status, uid: payload.uid });
});

eventBus.on('ws:history', (payload) => {
    // New history record from ESP32
    const recId = addRecord({
        uid: payload.uid,
        action: payload.action,
        slot: payload.slot,
        status: payload.status ?? TxStatus.PROCESSING,
    });

    // If processing, start progress animation
    if (payload.status === TxStatus.PROCESSING) {
        // Render first, then animate
        requestAnimationFrame(() => {
            animateProgress(recId, payload.progress ?? 30, 2000);
        });
    }
});

eventBus.on('ws:progress', (payload) => {
    // Progress update for an existing record  { id, progress }
    updateRecord(payload.id, { progress: payload.progress });
    requestAnimationFrame(() => {
        animateProgress(payload.id, payload.progress, 1000);
    });
});

eventBus.on('ws:complete', (payload) => {
    // Mark record as success  { id }
    requestAnimationFrame(() => {
        animateProgress(payload.id, 100, 1000);
    });
    // After animation, update model
    setTimeout(() => {
        updateRecord(payload.id, { status: TxStatus.SUCCESS, progress: 100 });
    }, 1500);
});

// ── Connect WebSocket ────────────────────────────────────────
connect();

// ── DEV-ONLY MOCK ────────────────────────────────────────────
if (import.meta.env.DEV) {
    // Seed initial slot data (mirroring test.html)
    setAllSlots([
        { name: 'A1', status: SlotStatus.OCCUPIED, uid: 'A3:B4:C5:D6' },
        { name: 'A2', status: SlotStatus.EMPTY },
        { name: 'A3', status: SlotStatus.OCCUPIED, uid: 'F1:E2:D3:C4' },
        { name: 'B1', status: SlotStatus.MOVING, uid: '12:34:56:78' },
        { name: 'B2', status: SlotStatus.EMPTY },
        { name: 'B3', status: SlotStatus.EMPTY },
        { name: 'C1', status: SlotStatus.EMPTY },
        { name: 'C2', status: SlotStatus.OCCUPIED, uid: '99:88:77:66' },
        { name: 'C3', status: SlotStatus.EMPTY },
    ]);

    // Seed history records
    const mockHistory = [
        { uid: '12:34:56:78', action: Action.IN, slot: 'B1', status: TxStatus.PROCESSING },
        { uid: '99:88:77:66', action: Action.IN, slot: 'C2', status: TxStatus.SUCCESS },
        { uid: 'AA:BB:CC:DD', action: Action.OUT, slot: 'B2', status: TxStatus.SUCCESS },
        { uid: 'EE:FF:00:11', action: Action.IN, slot: '-', status: TxStatus.ERROR },
        { uid: 'A3:B4:C5:D6', action: Action.IN, slot: 'A1', status: TxStatus.SUCCESS },
    ];

    for (const rec of mockHistory) {
        addRecord(rec);
    }

    // Simulate processing progress on the first record
    const processingRec = mockHistory[0];
    setTimeout(() => {
        const history = import('./core/store.js').then((mod) => {
            const records = mod.getState('history');
            const rec = records.find(
                (r) => r.uid === processingRec.uid && r.status === TxStatus.PROCESSING
            );
            if (rec) {
                animateProgress(rec.id, 30, 2000);
                setTimeout(() => animateProgress(rec.id, 70, 2500), 3000);
                setTimeout(() => animateProgress(rec.id, 100, 1000), 6500);
            }
        });
    }, 500);
}
