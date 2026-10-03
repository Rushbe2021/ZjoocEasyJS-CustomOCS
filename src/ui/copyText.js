import { displaySuccessNotification } from './notifications.js';

export function copyText(element) {
    const range = document.createRange();
    range.selectNode(element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    try {
        document.execCommand('copy');
        displaySuccessNotification('复制成功', '😀');
    } catch (err) {
        alert('复制失败');
    }
    window.getSelection().removeAllRanges();
}

export function exposeCopyText() {
    try {
        unsafeWindow.copyText = copyText;
    } catch (e) {
        window.copyText = copyText;
    }
}
