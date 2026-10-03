import { debugLog } from '../../core/debug.js';
import { runtime } from '../../core/runtime.js';
import { isOnChapterPage } from '../autoplay/autoPlay.js';
import { displayErrorNotification } from '../../ui/notifications.js';

export function installHistoryHooks({ onLeaveChapterPage, refreshAnswersForNewPage }) {
    let routeCheckTimer = null;
    let answerRefreshTimer = null;

    function handleRouteChange() {
        if (!runtime.routeGuard.listenRoute) return;
        if (runtime.isPlaying && window.location.hostname === 'www.zjooc.cn') {
            clearTimeout(routeCheckTimer);
            routeCheckTimer = setTimeout(() => {
                if (!runtime.isPlaying) return;
                if (isOnChapterPage()) {
                    debugLog('[ZE自动播放] 页面跳转后仍在章节页，继续播放', window.location.href);
                    return;
                }
                onLeaveChapterPage(window.location.href);
                displayErrorNotification('自动播放已停止', ['页面已离开章节内容']);
            }, 800);
        }
        if (runtime.showAnswer) {
            clearTimeout(answerRefreshTimer);
            answerRefreshTimer = setTimeout(() => {
                refreshAnswersForNewPage();
            }, 200);
        }
    }

    window.addEventListener('popstate', handleRouteChange);
    const originalPushState = history.pushState;
    history.pushState = function () {
        const result = originalPushState.apply(this, arguments);
        handleRouteChange();
        return result;
    };
    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
        const before = window.location.href;
        const result = originalReplaceState.apply(this, arguments);
        if (window.location.href !== before) {
            handleRouteChange();
        }
        return result;
    };
}
