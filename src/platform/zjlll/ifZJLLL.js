export default function checkIfZJLLL() {
    if (!/(^|\.)zjlll\.cn$/i.test(window.location.hostname)) {
        return false;
    }

    const dialogDiv = document.createElement('div');
    dialogDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 400px;
    `;

    dialogDiv.innerHTML = `
        <h3 style="margin-top: 0;">在浙学助手无法在当前网站运行</h3>
        <br>
        <p>请使用"<strong>浙江省全民终身学习公共服务平台自动播放</strong>"脚本</p>
        <p>脚本地址: <a href="https://scriptcat.org/zh-CN/script-show-page/4095" target="_blank" rel="noopener noreferrer">https://scriptcat.org/zh-CN/script-show-page/4095</a></p>
        <button type="button" style="
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            float: right;
        ">确定</button>
    `;

    document.body.appendChild(dialogDiv);
    dialogDiv.querySelector('button').onclick = () => {
        dialogDiv.remove();
    };
    return true;
}
