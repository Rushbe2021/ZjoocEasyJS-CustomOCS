import { deleteConfig, setConfig } from './gmStorage.js';
import { clearAnswerers } from './answererConfig.js';

export const CONFIG_KEYS = [
    'floating_window_position',
    'floating_window_size',
    'video_mute',
    'video_speed',
    'exam_mode',
    'do_video',
    'ze_answerer_wrappers',
    'ze_debug',
];

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

export function deleteUserConfig() {
    CONFIG_KEYS.forEach((key) => deleteConfig(key));
}
