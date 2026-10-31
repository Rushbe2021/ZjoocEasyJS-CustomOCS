const hasGMStorage =
    typeof GM_getValue === 'function' &&
    typeof GM_setValue === 'function' &&
    typeof GM_deleteValue === 'function';

export function getConfig(key, defaultValue) {
    if (hasGMStorage) {
        try {
            return GM_getValue(key, defaultValue);
        } catch (error) {
            console.warn('[ZE存储] 读取配置失败，使用默认值：', key, error);
            return defaultValue;
        }
    }
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? defaultValue : raw;
    } catch (error) {
        return defaultValue;
    }
}

export function setConfig(key, value) {
    if (hasGMStorage) {
        try {
            GM_setValue(key, value);
        } catch (error) {
            console.warn('[ZE存储] 保存配置失败：', key, error);
        }
        return;
    }
    try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (error) {
        console.warn('[ZE存储] 保存配置失败：', key, error);
    }
}

export function deleteConfig(key) {
    if (hasGMStorage) {
        try {
            GM_deleteValue(key);
        } catch (error) {
            console.warn('[ZE存储] 删除配置失败：', key, error);
        }
        return;
    }
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('[ZE存储] 删除配置失败：', key, error);
    }
}
