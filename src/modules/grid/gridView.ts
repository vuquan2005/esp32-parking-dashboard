import { getState, subscribe } from '../../core/store';
import { eventBus } from '../../core/eventBus';
import { SlotState, STATUS_LABELS, SLOT_STATE_CLASS } from '../../utils/constants';
import { SLOT_MAP, formatUid } from '../../core/protocol';
import { el } from '../../utils/helpers';

let container: HTMLElement;

/**
 * Mount the 3×3 parking grid into the given panel element.
 */
export function mountGrid(panelBody: HTMLElement): void {
    container = panelBody;
    render();

    // Re-render when slots or filters change
    subscribe('slots', render);
    subscribe('filters', render);
}

/** Full re-render of the 3×3 grid. */
function render(): void {
    const slots = getState('slots');
    const filters = getState('filters');
    container.innerHTML = '';

    for (const slot of slots.values()) {
        const dimmed =
            (filters.status != null && slot.st !== filters.status) ||
            (filters.sid != null && slot.sid !== filters.sid);

        const stateClass = SLOT_STATE_CLASS[slot.st] ?? 'empty';
        const cell = el('div', {
            class: `slot ${stateClass}${dimmed ? ' dimmed' : ''}`,
        });

        const displayName = SLOT_MAP[slot.sid] ?? `#${slot.sid}`;
        cell.appendChild(el('div', { class: 'slot-name', text: displayName }));

        let info: string = STATUS_LABELS[slot.st] ?? STATUS_LABELS[SlotState.EMPTY];
        if (slot.st === SlotState.OCCUPIED && slot.uid != null) {
            info = `UID: ${formatUid(slot.uid)}`;
        }
        cell.appendChild(el('div', { class: 'slot-info', text: info }));

        cell.addEventListener('click', () => {
            const current = getState('filters');
            eventBus.emit(
                'filter:change',
                current.sid === slot.sid
                    ? { ...current, sid: null }
                    : { ...current, sid: slot.sid, status: null }
            );
        });

        container.appendChild(cell);
    }
}
