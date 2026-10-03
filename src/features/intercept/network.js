import { debugLog } from '../../core/debug.js';
import { runtime } from '../../core/runtime.js';
import { saveCourseChapters } from '../../core/chapterCache.js';
import { checkRightAnswer, fetchOriginalJson, uploadOriginalJson } from '../answers/paper.js';

const CHAPTER_SERVICES = [
    '/jxxt/api/course/courseStudent/getStudentCourseChapters',
    '/jxxt/api/course/courseStudent/v2/getStudentCourseChapters'
];

function checkStreamByAcceptHeader(init) {
    if (!init?.headers) return false;
    const headers = new Headers(init.headers);
    return headers.get('Accept') === 'text/event-stream';
}

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
        if (response && response.data && response.data.paperSubjectList) {
            runtime.cachedPaperSubjectList = response.data.paperSubjectList;
            runtime.paperData = response;
            if (runtime.paperData.data && runtime.paperData.data.hasOwnProperty('stuName')) {
                delete runtime.paperData.data.stuName;
            }
            if (checkRightAnswer(runtime.paperData)) {
                localStorage.setItem('originalJsonCopy', JSON.stringify(runtime.paperData));
                try {
                    const paperId = runtime.paperData.data.id;
                    const remote = await fetchOriginalJson(paperId, false);
                    if (remote && remote.has_original_json) {
                        console.log('Paper exists with original JSON');
                    } else {
                        console.log('No paper found, uploading...');
                        uploadOriginalJson();
                    }
                } catch (error) {
                    console.error('Error checking originalJson:', error);
                }
            }
        }

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

    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        if (checkStreamByAcceptHeader(init)) {
            return originalFetch(input, init);
        }
        const response = await originalFetch(input, init);
        try {
            const data = await response.clone().json();
            if (data?.data?.paperSubjectList) {
                console.log('paperSubjectList:', data.data.paperSubjectList);
                runtime.cachedPaperSubjectList = data.data.paperSubjectList;
            }
            return response;
        } catch (e) {
            return response;
        }
    };
}
