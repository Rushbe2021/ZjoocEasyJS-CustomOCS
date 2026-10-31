import { getConfig } from './gmStorage.js';

export const ZE_DEBUG = getConfig('ze_debug', 'false') === 'true';

export function debugLog(...args) {
    if (ZE_DEBUG) console.log(...args);
}
