import { getState, subscribe } from '../../core/store';
import { eventBus } from '../../core/eventBus';
import { SlotState, SLOT_STATE_CLASS } from '../../utils/constants';
import { el } from '../../utils/helpers';

let container: HTMLElement;

/**
 * Mount the status bar into the given container.
 */
export function mountStatusBar(statsContainer: HTMLElement): void {
    container = statsContainer;
    render();
    subscribe('slots', render);
    subscribe('filters', render);
}

interface StatItem {
    label: string;
    value: number;
    colorClass: string;
    filterKey: SlotState | null;
}

function render(): void {
    const slots = [...getState('slots').values()];
    const filters = getState('filters');

    const counts = {
        total: slots.length,
        empty: slots.filter((s) => s.st === SlotState.EMPTY).length,
        occupied: slots.filter((s) => s.st === SlotState.OCCUPIED).length,
        moving: slots.filter((s) => s.st === SlotState.MOVING).length,
    };

    container.innerHTML = '';

    const items: StatItem[] = [
        { label: 'Tổng số ô', value: counts.total, colorClass: '', filterKey: null },
        {
            label: 'Chỗ trống',
            value: counts.empty,
            colorClass: SLOT_STATE_CLASS[SlotState.EMPTY],
            filterKey: SlotState.EMPTY,
        },
        {
            label: 'Đã có xe',
            value: counts.occupied,
            colorClass: SLOT_STATE_CLASS[SlotState.OCCUPIED],
            filterKey: SlotState.OCCUPIED,
        },
        {
            label: 'Đang xử lý',
            value: counts.moving,
            colorClass: SLOT_STATE_CLASS[SlotState.MOVING],
            filterKey: SlotState.MOVING,
        },
    ];

    for (const item of items) {
        const isActive = filters.status === item.filterKey && item.filterKey != null;
        const box = el('div', {
            class: `stat-box ${item.colorClass} ${isActive ? 'active' : ''}`.trim(),
        });

        box.appendChild(
            el('div', {
                class: 'stat-label',
                text: item.label,
            })
        );

        const valueEl = el('div', {
            class: `stat-value ${item.colorClass}`,
            text: String(item.value),
        });
        box.appendChild(valueEl);

        box.style.cursor = 'pointer';

        box.addEventListener('click', () => {
            const current = getState('filters');

            if (item.filterKey === null) {
                eventBus.emit('filter:change', { ...current, status: null, sid: null });
            } else {
                eventBus.emit(
                    'filter:change',
                    current.status === item.filterKey
                        ? { ...current, status: null }
                        : { ...current, status: item.filterKey, sid: null }
                );
            }
        });

        container.appendChild(box);
    }
}
