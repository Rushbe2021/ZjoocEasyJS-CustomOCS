import { displayErrorNotification, displaySuccessNotification } from '../../ui/notifications.js';

export function initializeEditorSync() {
    if (document.querySelector('.ckeditor-container')) {
        displayErrorNotification('请勿重复点击', ['检测到页面中已存在替换后的输入框，已跳过执行解除限制操作']);
        return;
    }

    var elements = document.querySelectorAll('[class*="cke_browser_webkit"]');
    if (elements.length == 0) {
        displayErrorNotification('未检测到输入框', ['请在有粘贴限制的输入框的页面点击按钮']);
        return;
    }

    elements.forEach(function (element, index) {
        if (document.getElementById('editor-new-' + index)) return;

        var editorContainer = document.createElement('div');
        editorContainer.classList.add('ckeditor-container');
        editorContainer.id = 'editor-new-' + index;
        editorContainer.style.marginTop = '10px';

        var hintContainer = document.createElement('div');
        hintContainer.classList.add('editor-hint');
        hintContainer.style.marginBottom = '10px';
        hintContainer.textContent = '在下面输入的内容将同步至上方的输入框，下方的输入框已解除粘贴限制';

        var iframe = element.querySelector('iframe');
        if (!iframe) return;

        var iframeBody = iframe.contentWindow.document.body;

        element.parentNode.insertBefore(editorContainer, element.nextSibling);
        element.parentNode.insertBefore(hintContainer, editorContainer);

        CKEDITOR.replace('editor-new-' + index, {
            on: {
                instanceReady: function () {
                    var newEditor = CKEDITOR.instances['editor-new-' + index];

                    function syncEditorContent() {
                        iframeBody.innerHTML = newEditor.getData();
                    }

                    newEditor.on('change', syncEditorContent);
                    iframeBody.addEventListener('input', function () {
                        newEditor.setData(iframeBody.innerHTML);
                    });
                    newEditor.setData(iframeBody.innerHTML);
                }
            }
        });
    });

    displaySuccessNotification('解除粘贴限制成功', '现在可以直接将复制的内容粘贴到输入框中了');
}
