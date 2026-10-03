export const ZE_DEBUG = localStorage.getItem('ze_debug') === 'true';

export function debugLog(...args) {
    if (ZE_DEBUG) console.log(...args);
}
