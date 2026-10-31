import { setConfig } from './gmStorage.js';
import { clearAnswerers } from './answererConfig.js';

const DEFAULT_VALUES = {
    floating_window_position: JSON.stringify({ left: 0, top: 0 }),
    floating_window_size: JSON.stringify({ width: 300, height: 400 }),
    video_mute: 'false',
    video_speed: '1',
    exam_mode: 'false',
    do_video: 'false',
    ze_debug: 'false',
};

export function resetUserConfig() {
    Object.entries(DEFAULT_VALUES).forEach(([key, value]) => setConfig(key, value));
    clearAnswerers();
}
