const CLOSE_ANIMATION_MS = 180;

/**
 * 显示一个确认对话框
 * @param {string} message - 要显示的消息
 * @param {string} title - 对话框标题
 * @returns {Promise<boolean>} - 用户点击"是"返回true，点击"否"返回false
 */
export function showConfirmDialog(message, title = '是否确认开启') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'ze-confirm-overlay';

        const modal = document.createElement('div');
        modal.className = 'ze-confirm-modal';
        modal.innerHTML = `
            <h3 class="ze-confirm-title">${title}</h3>
            <p class="ze-confirm-message">${message}</p>
            <div class="ze-confirm-actions">
                <button type="button" class="ze-confirm-button is-primary" data-confirm="yes">是</button>
                <button type="button" class="ze-confirm-button" data-confirm="no">否</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        const yesButton = modal.querySelector('[data-confirm="yes"]');
        const noButton = modal.querySelector('[data-confirm="no"]');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let closing = false;

        const close = (result) => {
            if (closing) {
                return;
            }
            closing = true;
            yesButton.disabled = true;
            noButton.disabled = true;

            const remove = () => {
                overlay.remove();
                modal.remove();
                resolve(result);
            };

            if (reduceMotion) {
                remove();
                return;
            }

            overlay.classList.add('is-closing');
            modal.classList.add('is-closing');
            window.setTimeout(remove, CLOSE_ANIMATION_MS);
        };

        yesButton.addEventListener('click', () => close(true));
        noButton.addEventListener('click', () => close(false));

        window.requestAnimationFrame(() => {
            overlay.classList.add('is-open');
            modal.classList.add('is-open');
        });
    });
}