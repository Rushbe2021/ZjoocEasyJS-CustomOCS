/**
 * 显示一个确认对话框
 * @param {string} message - 要显示的消息
 * @param {string} title - 对话框标题
 * @returns {Promise<boolean>} - 用户点击"是"返回true，点击"否"返回false
 */
export function showConfirmDialog(message, title = "是否确认开启") {
    return new Promise((resolve) => {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.36);
            z-index: 9999999;
        `;
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #1d1d1f;
            background: rgba(255, 255, 255, 0.72);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            backdrop-filter: blur(24px) saturate(180%);
            padding: 20px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.55);
            z-index: 10000000000000;
            width: 400px;
        `;

        modal.innerHTML = `
            <h3 style="margin-top: 0; font-size: 20px; font-weight: 600;">${title}</h3>
            <p>${message}</p>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button id="confirm-yes" style="
                    padding: 8px 16px;
                    background: #4D6BFE;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">是</button>
                <button id="confirm-no" style="
                    padding: 8px 16px;
                    background: #f5f5f5;
                    color: #333;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                ">否</button>
            </div>
        `;

        document.body.appendChild(modal);

        const yesButton = modal.querySelector('#confirm-yes');
        const noButton = modal.querySelector('#confirm-no');

        yesButton.addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.removeChild(overlay);
            resolve(true);
        });

        noButton.addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.removeChild(overlay);
            resolve(false);
        });
    });
}