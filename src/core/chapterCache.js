import getCourseId from '../platform/zjooc/getCourseId.js';
import { debugLog } from './debug.js';

const CHAPTER_CACHE_PREFIX = 'CourseChapters:';
const CHAPTER_CACHE_LIMIT = 5;
let latestCourseChapters = null;

export function saveCourseChapters(courseId, chapters) {
    latestCourseChapters = { courseId, data: chapters };
    if (!courseId) return;
    const key = CHAPTER_CACHE_PREFIX + courseId;
    const value = JSON.stringify(chapters);
    const cachedKeys = () => Object.keys(localStorage).filter(k => k.startsWith(CHAPTER_CACHE_PREFIX) && k !== key);
    localStorage.removeItem('CourseChapters');
    cachedKeys().slice(CHAPTER_CACHE_LIMIT - 1).forEach(k => localStorage.removeItem(k));
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        cachedKeys().forEach(k => localStorage.removeItem(k));
        try {
            localStorage.setItem(key, value);
        } catch (err) {
            console.log('[ZE章节] 章节数据过大，只保存在当前页面内存中', err);
        }
    }
}

export function getCurrentCourseChapters() {
    const urlCourseId = getCourseId();
    if (latestCourseChapters) {
        if (urlCourseId && latestCourseChapters.courseId && urlCourseId !== latestCourseChapters.courseId) {
            debugLog('[ZE章节] 地址里的课程号与章节数据不一致', urlCourseId, latestCourseChapters.courseId);
        }
        return latestCourseChapters.data;
    }
    if (!urlCourseId) return null;
    try {
        return JSON.parse(localStorage.getItem(CHAPTER_CACHE_PREFIX + urlCourseId));
    } catch (e) {
        return null;
    }
}
