function checkIfZJLLL() {
    if (window.location.href.includes('https://www.zjlll.cn/')) {
        // 创建一个自定义对话框
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

        // 设置对话框内容
        dialogDiv.innerHTML = `
            <h3 style="margin-top: 0;">在这学助手无法当前网站运行</h3>
            <br>
            <p>请使用"<strong>浙江省全民终身学习公共服务平台自动播放</strong>"脚本</p>
            <p>脚本地址: <a href="https://scriptcat.org/zh-CN/script-show-page/4095" target="_blank" onclick="window.open(this.href); return false;">https://scriptcat.org/zh-CN/script-show-page/4095</a></p>
            <button style="
                padding: 8px 16px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                float: right;
            ">确定</button>
        `;

        // 添加对话框到页面
        document.body.appendChild(dialogDiv);

        // 添加关闭按钮事件
        const closeButton = dialogDiv.querySelector('button');
        closeButton.onclick = () => {
            dialogDiv.remove();
        };

        return true;
    }
    return false;
}

export default checkIfZJLLL;
