const STORAGE_KEY = 'ze_answerer_wrappers';

const CONTENT_TYPES = ['json', 'text'];
const METHODS = ['post', 'get'];
const REQUEST_TYPES = ['fetch', 'GM_xmlhttpRequest'];

export const DEFAULT_ANSWERERS = [];

// 仅作字段示例，不对应任何真实题库
export const SAMPLE_ANSWERERS = [
    {
        name: '示例题库',
        homepage: 'https://example.com',
        url: 'https://example.com/search',
        method: 'get',
        data: {
            title: '${title}',
            options: '${options}',
            type: '${type}',
        },
        headers: {},
        contentType: 'json',
        type: 'fetch',
        handler: "return (res) => res.code === 1 ? [res.question, res.answer] : undefined",
    },
];

export function validateAnswerers(value) {
    if (!Array.isArray(value)) {
        throw new Error('题库配置格式错误！');
    }
    if (value.length === 0) {
        throw new Error('题库为空！');
    }
    value.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
            throw new Error(`第 ${index + 1} 个题库配置格式错误`);
        }
        if (typeof item.name !== 'string') {
            throw new Error(`第 ${index + 1} 个题库的 名字(name) 为空`);
        }
        if (typeof item.url !== 'string') {
            throw new Error(`第 ${index + 1} 个题库的 接口地址(url) 为空`);
        }
        if (typeof item.handler !== 'string') {
            throw new Error(`第 ${index + 1} 个题库的 解析器(handler) 为空`);
        }
        if (item.headers && typeof item.headers !== 'object') {
            throw new Error(`第 ${index + 1} 个题库的 头部信息(header) 应为 对象 格式`);
        }
        if (item.data && typeof item.data !== 'object') {
            throw new Error(`第 ${index + 1} 个题库的 提交数据(data) 应为 对象 格式`);
        }
        if (item.contentType && !CONTENT_TYPES.includes(item.contentType)) {
            throw new Error(`第 ${index + 1} 个题库的 contentType 必须为以下选项中的一个  ${CONTENT_TYPES.join(', ')}`);
        }
        if (item.method && !METHODS.includes(item.method)) {
            throw new Error(`第 ${index + 1} 个题库的 method 必须为以下选项中的一个  ${METHODS.join(', ')}`);
        }
        if (item.type && !REQUEST_TYPES.includes(item.type)) {
            throw new Error(`第 ${index + 1} 个题库的 type 必须为以下选项中的一个  ${REQUEST_TYPES.join(', ')}`);
        }
    });
    return value;
}

export function loadAnswerers() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return [];
    }
    try {
        return validateAnswerers(JSON.parse(raw));
    } catch (error) {
        console.warn('[ZE题库] 本地配置无效，已忽略：', error.message);
        return [];
    }
}

export function saveAnswerers(value) {
    const validated = validateAnswerers(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    return validated;
}

export function clearAnswerers() {
    localStorage.removeItem(STORAGE_KEY);
}

export function getAnswerersRaw() {
    return localStorage.getItem(STORAGE_KEY) || '';
}

export function fromJSONString(text) {
    try {
        return validateAnswerers(JSON.parse(text));
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('格式错误，必须为：json字符串 或 题库配置链接');
        }
        throw error;
    }
}

export async function fromURL(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`题库配置下载失败：${response.statusText}`);
    }
    return fromJSONString(await response.text());
}

export function fromBase64(base64) {
    const binary = atob(String(base64).trim());
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return fromJSONString(new TextDecoder().decode(bytes));
}

export async function parseAnswerers(value) {
    if (typeof value === 'string') {
        const text = value.trim();
        if (text.startsWith('http://') || text.startsWith('https://')) {
            return fromURL(text);
        }
        return fromJSONString(text);
    }
    return validateAnswerers(value);
}
