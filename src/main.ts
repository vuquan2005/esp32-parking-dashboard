import './style.css';

import { delay } from './utils/helpers';
import { setState, getState, hydrate } from './core/store';
import { eventBus } from './core/eventBus';

// Modules
import { mountGrid } from './modules/grid/gridView';
import { mountStatusBar } from './modules/status/statusBar';
import { mountHistory, animateProgress } from './modules/history/historyView';
import { setAllSlots } from './modules/grid/gridModel';
import { addRecord, updateRecord } from './modules/history/historyModel';
import { SlotState, ProcessStatus, ActionType } from './utils/constants';
import { MessageType } from './types';
import { connect } from './core/websocket';

// ── Mount views ──────────────────────────────────────────────
mountStatusBar(document.querySelector('#stats-container')!);
mountGrid(document.querySelector('#parking-grid')!);
mountHistory(document.querySelector('#history-log')!);

// ── Filter wiring ────────────────────────────────────────────
eventBus.on('filter:change', (newFilters) => {
    setState({ filters: newFilters });
});

// ── WebSocket message handlers (fully typed via EventMap) ────

// SlotStatusMessage – full or partial slot state update
eventBus.on('ws:slot_status', (data) => {
    if (data.slots) setAllSlots(data.slots);
});

// HistoryMessage – single history record
eventBus.on('ws:history', (data) => {
    const rec = data.rec;
    if (!rec) return;
    const recId = addRecord({
        uid: rec.uid,
        act: rec.act,
        sid: rec.sid,
        st: rec.st,
    });
    // Animate for active statuses
    if (
        rec.st === ProcessStatus.PROCESSING ||
        rec.st === ProcessStatus.SUCCESS ||
        rec.st === ProcessStatus.PENDING
    ) {
        animateProgress(recId, rec.st === ProcessStatus.SUCCESS ? 100 : 10, 2000);
    }
});

// ProgressMessage – progress update for a running task
eventBus.on('ws:progress', async (data) => {
    animateProgress(String(data.rid), data.p, 2000);
});

// AckMessage – acknowledgment (used for task completion)
eventBus.on('ws:ack', async (data) => {
    if (data.st === ProcessStatus.SUCCESS) {
        await animateProgress(String(data.rid), 100, 1000);
        await delay(500);
        updateRecord(String(data.rid), { st: ProcessStatus.SUCCESS, progress: 100 });
    } else if (data.st === ProcessStatus.ERROR) {
        updateRecord(String(data.rid), { st: ProcessStatus.ERROR });
    }
});

// SyncResponseMessage – response to a sync request
eventBus.on('ws:sync_res', (data) => {
    if (data.updates?.slots) setAllSlots(data.updates.slots);
    if (data.updates?.recs) {
        for (const rec of data.updates.recs) {
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
eventBus.on('ws:error', (data) => {
    console.error('[System Error] code:', data.c);
});

// ── Hydrate views with localStorage data ─────────────────────
hydrate();

// ── Connect WebSocket ────────────────────────────────────────
connect();

// ── DEV-ONLY MOCK ────────────────────────────────────────────
async function runMock() {
    // ─── 1. Initial slot states (SlotStatusMessage format) ───
    await delay(300);
    eventBus.emit('ws:slot_status', {
        id: 1,
        v: 0,
        t: MessageType.SLOT_STATUS,
        slots: [
            { sid: 1, st: SlotState.OCCUPIED, uid: 0xab12cd34 },
            { sid: 2, st: SlotState.EMPTY, uid: undefined },
            { sid: 3, st: SlotState.OCCUPIED, uid: 0xef56ab78 },
            { sid: 4, st: SlotState.EMPTY, uid: undefined },
            { sid: 5, st: SlotState.MOVING, uid: 0x11223344 },
            { sid: 6, st: SlotState.OCCUPIED, uid: 0xaabbccdd },
            { sid: 7, st: SlotState.OCCUPIED },
            { sid: 8, st: SlotState.EMPTY },
            { sid: 9, st: SlotState.OCCUPIED, uid: 0xffeeddcc },
        ],
    });

    // ─── 2. Existing history records ─────────────────────────
    await delay(200);
    eventBus.emit('ws:history', {
        id: 2,
        v: 0,
        t: MessageType.HISTORY,
        rec: {
            ts: Date.now(),
            uid: 0xab12cd34,
            act: ActionType.IN,
            sid: 1,
            st: ProcessStatus.SUCCESS,
        },
    });
    eventBus.emit('ws:history', {
        id: 3,
        v: 0,
        t: MessageType.HISTORY,
        rec: {
            ts: Date.now(),
            uid: 0xef56ab78,
            act: ActionType.IN,
            sid: 3,
            st: ProcessStatus.SUCCESS,
        },
    });
    eventBus.emit('ws:history', {
        id: 4,
        v: 0,
        t: MessageType.HISTORY,
        rec: {
            ts: Date.now(),
            uid: 0xaabb0000,
            act: ActionType.OUT,
            sid: 7,
            st: ProcessStatus.ERROR,
        },
    });
    eventBus.emit('ws:history', {
        id: 5,
        v: 0,
        t: MessageType.HISTORY,
        rec: {
            ts: Date.now(),
            uid: 0xaabbccdd,
            act: ActionType.IN,
            sid: 6,
            st: ProcessStatus.SUCCESS,
        },
    });

    // ─── 3. Live transaction: vehicle entering B2 (sid=5) ────
    await delay(1000);
    eventBus.emit('ws:history', {
        id: 6,
        v: 0,
        t: MessageType.HISTORY,
        rec: {
            ts: Date.now(),
            uid: 0x11223344,
            act: ActionType.IN,
            sid: 5,
            st: ProcessStatus.PROCESSING,
        },
    });

    // Grab the auto-generated record ID for progress updates
    const recId1 = getState('history')[0].id;

    // Progress updates
    await delay(1500);
    eventBus.emit('ws:progress', {
        id: 7,
        v: 0,
        t: MessageType.PROGRESS,
        rid: recId1 as unknown as number,
        p: 40,
    });

    await delay(1500);
    eventBus.emit('ws:progress', {
        id: 8,
        v: 0,
        t: MessageType.PROGRESS,
        rid: recId1 as unknown as number,
        p: 70,
    });

    await delay(1500);
    eventBus.emit('ws:progress', {
        id: 9,
        v: 0,
        t: MessageType.PROGRESS,
        rid: recId1 as unknown as number,
        p: 90,
    });

    // Complete → animate to 100% and mark SUCCESS
    await delay(1500);
    eventBus.emit('ws:ack', {
        id: 10,
        v: 0,
        t: MessageType.ACK,
        rid: recId1 as unknown as number,
        st: ProcessStatus.SUCCESS,
    });

    // Update slot B2 to occupied after completion
    await delay(1500);
    eventBus.emit('ws:slot_status', {
        id: 11,
        v: 0,
        t: MessageType.SLOT_STATUS,
        slots: [{ sid: 5, st: SlotState.OCCUPIED, uid: 0x11223344 }],
    });

    // ─── 4. Second transaction: vehicle leaving A1 (sid=1) ───
    await delay(1000);
    // Slot starts moving
    eventBus.emit('ws:slot_status', {
        id: 12,
        v: 0,
        t: MessageType.SLOT_STATUS,
        slots: [{ sid: 1, st: SlotState.MOVING, uid: 0xab12cd34 }],
    });

    eventBus.emit('ws:history', {
        id: 13,
        v: 0,
        t: MessageType.HISTORY,
        rec: {
            ts: Date.now(),
            uid: 0xab12cd34,
            act: ActionType.OUT,
            sid: 1,
            st: ProcessStatus.PROCESSING,
        },
    });
    const recId2 = getState('history')[0].id;

    await delay(1500);
    eventBus.emit('ws:progress', {
        id: 14,
        v: 0,
        t: MessageType.PROGRESS,
        rid: recId2 as unknown as number,
        p: 50,
    });

    await delay(1500);
    eventBus.emit('ws:progress', {
        id: 15,
        v: 0,
        t: MessageType.PROGRESS,
        rid: recId2 as unknown as number,
        p: 85,
    });

    await delay(1500);
    eventBus.emit('ws:ack', {
        id: 16,
        v: 0,
        t: MessageType.ACK,
        rid: recId2 as unknown as number,
        st: ProcessStatus.SUCCESS,
    });

    await delay(1500);
    eventBus.emit('ws:slot_status', {
        id: 17,
        v: 0,
        t: MessageType.SLOT_STATUS,
        slots: [{ sid: 1, st: SlotState.EMPTY, uid: undefined }],
    });
}
if (import.meta.env.DEV) {
    runMock();
}
