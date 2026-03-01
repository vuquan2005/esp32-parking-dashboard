import type { ElOptions } from '../types';

/**
 * Create a typed HTML element with optional class names and text.
 * Returns the correct HTMLElement subtype based on the tag name.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    opts?: ElOptions
): HTMLElementTagNameMap[K];
export function el(tag: string, opts?: ElOptions): HTMLElement;
export function el(tag: string, opts: ElOptions = {}): HTMLElement {
    const node = document.createElement(tag);

    if (opts.class) {
        const classes = Array.isArray(opts.class) ? opts.class : opts.class.split(' ');
        node.classList.add(...classes.filter(Boolean));
    }
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.attrs) {
        for (const [k, v] of Object.entries(opts.attrs)) {
            node.setAttribute(k, v);
        }
    }
    return node;
}

let _seq = 0;

/** Generate a unique id based on Unix timestamp. */
export function uid(): string {
    return `${Date.now()}-${++_seq}`;
}

/**
 * Returns a promise that resolves after the specified milliseconds.
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
