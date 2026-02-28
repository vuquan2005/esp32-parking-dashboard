import './style.css';

import { delay } from './utils/helpers.js';
import { getState, setState } from './core/store.js';
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
mountStatusBar(document.querySelector('#stats-container'));
mountGrid(document.querySelector('#parking-grid'));
mountHistory(document.querySelector('#history-log'));

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

eventBus.on('ws:history', async (payload) => {
    // New history record from ESP32
    const recId = addRecord({
        uid: payload.uid,
        action: payload.action,
        slot: payload.slot,
        status: payload.status ?? TxStatus.PROCESSING,
    });

    // If processing, start progress animation
    if (payload.status === TxStatus.PROCESSING) {
        await delay(10);
        animateProgress(recId, payload.progress ?? 30, 2000);
    }
});

eventBus.on('ws:progress', async (payload) => {
    // Progress update for an existing record  { id, progress }
    updateRecord(payload.id, { progress: payload.progress });
    await delay(10);
    animateProgress(payload.id, payload.progress, 1000);
});

eventBus.on('ws:complete', async (payload) => {
    await animateProgress(payload.id, 100, 1000);
    await delay(500);
    updateRecord(payload.id, { status: TxStatus.SUCCESS, progress: 100 });
});

// ── Connect WebSocket ────────────────────────────────────────
connect();

// ── DEV-ONLY MOCK ────────────────────────────────────────────
if (import.meta.env.DEV) {
    // ─── 1. Initial slot states ──────────────────────────────
    setTimeout(() => {
        eventBus.emit('ws:init', {
            slots: [
                { name: 'A1', status: SlotStatus.OCCUPIED, uid: 'AB:12:CD:34' },
                { name: 'A2', status: SlotStatus.EMPTY, uid: null },
                { name: 'A3', status: SlotStatus.OCCUPIED, uid: 'EF:56:GH:78' },
                { name: 'B1', status: SlotStatus.EMPTY, uid: null },
                { name: 'B2', status: SlotStatus.MOVING, uid: '11:22:33:44' },
                { name: 'B3', status: SlotStatus.OCCUPIED, uid: 'AA:BB:CC:DD' },
                { name: 'C1', status: SlotStatus.OCCUPIED },
                { name: 'C2', status: SlotStatus.EMPTY },
                { name: 'C3', status: SlotStatus.OCCUPIED, uid: 'FF:EE:DD:CC' },
            ],
        });
    }, 300);

    // ─── 2. Existing history records ─────────────────────────
    setTimeout(() => {
        addRecord({ uid: 'AB:12:CD:34', action: Action.IN, slot: 'A1', status: TxStatus.SUCCESS });
        addRecord({ uid: 'EF:56:GH:78', action: Action.IN, slot: 'A3', status: TxStatus.SUCCESS });
        addRecord({ uid: 'XX:YY:ZZ:00', action: Action.OUT, slot: 'C1', status: TxStatus.ERROR });
        addRecord({ uid: 'AA:BB:CC:DD', action: Action.IN, slot: 'B3', status: TxStatus.SUCCESS });
    }, 500);

    // ─── 3. Live transaction: vehicle entering B2 ────────────
    let mockRecordId;
    setTimeout(() => {
        eventBus.emit('ws:history', {
            uid: '11:22:33:44',
            action: Action.IN,
            slot: 'B2',
            status: TxStatus.PROCESSING,
            progress: 10,
        });

        // Capture the record id from store (latest record = first item)
        const history = getState('history');
        mockRecordId = history[0]?.id;
    }, 1500);

    // Progress updates
    setTimeout(() => {
        if (mockRecordId) eventBus.emit('ws:progress', { id: mockRecordId, progress: 40 });
    }, 3000);

    setTimeout(() => {
        if (mockRecordId) eventBus.emit('ws:progress', { id: mockRecordId, progress: 70 });
    }, 4500);

    setTimeout(() => {
        if (mockRecordId) eventBus.emit('ws:progress', { id: mockRecordId, progress: 90 });
    }, 6000);

    // Complete → animate to 100% and mark SUCCESS
    setTimeout(() => {
        if (mockRecordId) eventBus.emit('ws:complete', { id: mockRecordId });
    }, 7500);

    // Update slot B2 to occupied after completion
    setTimeout(() => {
        eventBus.emit('ws:slot_update', {
            name: 'B2',
            status: SlotStatus.OCCUPIED,
            uid: '11:22:33:44',
        });
    }, 9000);

    // ─── 4. Second transaction: vehicle leaving A1 ───────────
    let mockRecordId2;
    setTimeout(() => {
        // Slot starts moving
        eventBus.emit('ws:slot_update', {
            name: 'A1',
            status: SlotStatus.MOVING,
            uid: 'AB:12:CD:34',
        });

        eventBus.emit('ws:history', {
            uid: 'AB:12:CD:34',
            action: Action.OUT,
            slot: 'A1',
            status: TxStatus.PROCESSING,
            progress: 15,
        });

        const history = getState('history');
        mockRecordId2 = history[0]?.id;
    }, 10000);

    setTimeout(() => {
        if (mockRecordId2) eventBus.emit('ws:progress', { id: mockRecordId2, progress: 50 });
    }, 11500);

    setTimeout(() => {
        if (mockRecordId2) eventBus.emit('ws:progress', { id: mockRecordId2, progress: 85 });
    }, 13000);

    setTimeout(() => {
        if (mockRecordId2) eventBus.emit('ws:complete', { id: mockRecordId2 });
    }, 14500);

    setTimeout(() => {
        eventBus.emit('ws:slot_update', {
            name: 'A1',
            status: SlotStatus.EMPTY,
            uid: null,
        });
    }, 16000);
}
