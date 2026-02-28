import { getState, subscribe } from '../../core/store.js';
import { eventBus } from '../../core/eventBus.js';
import { SlotStatus, STATUS_LABELS } from '../../utils/constants.js';
import { el } from '../../utils/helpers.js';

/** @type {HTMLElement} */
let container;

/**
 * Mount the 3×3 parking grid into the given panel element.
 * @param {HTMLElement} panelBody – the `.parking-grid` container
 */
export function mountGrid(panelBody) {
    container = panelBody;
    render();

    // Re-render when slots or filters change
    subscribe('slots', render);
    subscribe('filters', render);
}

/** Full re-render of the 3×3 grid. */
function render() {
    const slots = getState('slots');
    const filters = getState('filters');
    container.innerHTML = '';

    for (const slot of slots.values()) {
        const dimmed =
            (filters.status && slot.status !== filters.status) ||
            (filters.slot && slot.name !== filters.slot);

        const cell = el('div', {
            class: `slot ${slot.status}${dimmed ? ' dimmed' : ''}`,
        });

        cell.appendChild(el('div', { class: 'slot-name', text: slot.name }));

        let info = STATUS_LABELS[SlotStatus.EMPTY];
        if (slot.status === SlotStatus.OCCUPIED && slot.uid) {
            info = `UID: ${slot.uid}`;
        } else if (slot.status === SlotStatus.MOVING) {
            info = STATUS_LABELS[SlotStatus.MOVING];
        }
        cell.appendChild(el('div', { class: 'slot-info', text: info }));

        cell.addEventListener('click', () => {
            const current = getState('filters');
            eventBus.emit(
                'filter:change',
                current.slot === slot.name
                    ? { ...current, slot: null }
                    : { ...current, slot: slot.name, status: null }
            );
        });

        container.appendChild(cell);
    }
}
