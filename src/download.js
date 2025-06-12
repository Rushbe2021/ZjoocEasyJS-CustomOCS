export async function checkAndDownload() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);

        const response = await fetch('http://localhost:5233/courseware', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: "",
                password: ""
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return true; // 服务开启

    } catch (error) {
        // 只有在请求失败（服务未开启）时才显示弹窗
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            z-index: 10000;
            width: 400px;
        `;

        modal.innerHTML = `
            <h3 style="margin-top: 0;">无法连接到本地服务器，请下载ZError并开启服务，否则请关闭该选项</h3>
            <p>下载途径：</p>
            <ul style="list-style: none; padding-left: 0;">
                <li style="margin-bottom: 10px;">
                    <strong>蓝奏云：</strong>
                    <a href="https://wwyl.lanzouv.com/b00ocrzzje" target="_blank">点击下载</a>
                    （密码：43so）
                </li>
                <li style="margin-bottom: 10px;">
                    <strong>直链下载：</strong>
                    <a href="https://dwpan.com/f/bYhj/ZError_Setup_1.0.0.exe" target="_blank">点击下载</a>
                </li>
                    <li style="margin-bottom: 10px;">
                    <strong>官网：</strong>
                    <a href="https://zerror.neoregion.cn/" target="_blank">点击访问</a>
                </li>
            </ul>
            <button style="
                padding: 8px 16px;
                background: #4D6BFE;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                display: block;
                margin: 20px auto 0;
            ">关闭</button>
        `;

        document.body.appendChild(modal);

        const closeButton = modal.querySelector('button');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        return false; // 服务未开启
    }
}