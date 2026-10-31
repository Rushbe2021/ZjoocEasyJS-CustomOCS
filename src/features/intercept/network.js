import { debugLog } from '../../core/debug.js';
import { saveCourseChapters } from '../../core/chapterCache.js';

const CHAPTER_SERVICES = [
    '/jxxt/api/course/courseStudent/getStudentCourseChapters',
    '/jxxt/api/course/courseStudent/v2/getStudentCourseChapters'
];

async function handleXhrLoad() {
    const fullUrl = this._zeUrl;
    if (!fullUrl) return;
    if (this.responseType && this.responseType !== 'text') return;
    const raw = this.responseText || '';
    if (!/^\s*[\[{]/.test(raw)) return;

    let response;
    try {
        response = JSON.parse(raw);
    } catch (e) {
        debugLog('[ZE请求] 响应不是有效的 JSON', fullUrl.href, e);
        return;
    }
    const urlParams = new URLSearchParams(fullUrl.search);
    const service = urlParams.get('service');
    try {
        if (CHAPTER_SERVICES.includes(service)) {
            if (Array.isArray(response.data)) {
                const courseId = urlParams.get('params[courseId]') || response.data[0]?.courseId || null;
                saveCourseChapters(courseId, response);
                console.log('[ZE章节] 已更新章节数据，课程号:', courseId);
            } else {
                console.log('[ZE章节] 章节接口返回的不是章节列表:', response.message);
            }
        } else if (Array.isArray(response.data) && response.data.some(item => item && Array.isArray(item.children))) {
            debugLog('[ZE章节] 响应像章节目录，但接口地址不在列表里，未保存', service, fullUrl.href);
        }

        if (fullUrl.href.includes('https://course-center-detail.zjlll.cn/api/s-course/stu/chapter/tree/')) {
            localStorage.setItem('CourseChaptersZJLLL', raw);
            debugLog('[ZE章节] 已写入 CourseChaptersZJLLL', fullUrl.href);
        }
    } catch (e) {
        console.log('Error processing response:', fullUrl.href, e);
    }
}

export function installNetworkHooks() {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        let fullUrl = null;
        try {
            fullUrl = new URL(url, window.location.href);
        } catch (e) {
            fullUrl = null;
        }
        this._zeUrl = fullUrl;
        this._zeMethod = method;

        if (fullUrl && fullUrl.hostname === 'www.zjooc.cn') {
            localStorage.setItem('www.zjooc.cn_cookies', document.cookie);
        }

        this._requestHeaders = {};

        if (!this._zeHooked) {
            this._zeHooked = true;
            const originalSetRequestHeader = this.setRequestHeader.bind(this);
            this.setRequestHeader = function (header, value) {
                this._requestHeaders[header.toLowerCase()] = value;
                originalSetRequestHeader(header, value);
            };
            this.addEventListener('load', handleXhrLoad);
        }

        return originalOpen.apply(this, arguments);
    };
}
