import Settings from "../settings";
function createButton(text = 'Get started', onClick = () => { }) {
    // 添加样式（确保只添加一次）
    if (!createButton.styleAdded) {
        const style = document.createElement('style');
        style.textContent = `
        .VerificationCode{
        font-size:14px;
            color:white;
        font-weight:600;
        }
        .cssbuttons-io-button {
          background: #e8e8e8;
          color: rgb(13, 13, 13);
          font-family: inherit;
          padding: 0.35em;
          padding-left: 1.2em;
          font-size: 12px;
          font-weight: 500;
          border-radius: 0.9em;
          border: none;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          box-shadow: inset 0 0 1.6em -0.6em #ffffff;
          overflow: hidden;
          position: relative;
          height: 2.8em;
          padding-right: 3.3em;
          cursor: pointer;
        }
  
        .cssbuttons-io-button .icon {
          background: rgb(98 177 251);
          margin-left: 1em;
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 2.2em;
          width: 2.2em;
          border-radius: 0.7em;
          right: 0.3em;
          transition: all 0.3s;
        }
  
        .cssbuttons-io-button:hover .icon {
          width: calc(100% - 0.6em);
        }
  
        .cssbuttons-io-button .icon svg {
          width: 1.1em;
          transition: transform 0.3s;
          color: #e8e8e8;
        }
  
        .cssbuttons-io-button:hover .icon svg {
          transform: translateX(0.1em);
        }
  
        .cssbuttons-io-button:active .icon {
          transform: scale(0.95);
        }

        /* 加载动画样式 */
        .cssbuttons-io-button .wrapper {
            position: relative;
            width: 4.2em;
            height: 2em;
            margin-left: 0em;
        }

        .cssbuttons-io-button .circle {
            width: 6px;
            height: 6px;
            position: absolute;
            border-radius: 50%;
            background: #fff;
            animation: circleBounce 0.5s alternate infinite ease;
        }

        @keyframes circleBounce {
            0% { top: 15px; height: 5px; }
            100% { top: 5px; }
        }

        .cssbuttons-io-button .shadow {
            width: 6px;
            height: 2px;
            background: rgba(0,0,0,0.2);
            position: absolute;
            top: 18px;
            animation: shadowScale 0.5s alternate infinite ease;
        }

        @keyframes shadowScale {
            0% { transform: scaleX(1.5); }
            100% { transform: scaleX(0.5); }
        }

        /* 悬停状态调整 */
        .cssbuttons-io-button.loading:hover .icon {
            width: 2.2em !important;
        }

        /* 定位调整 */
        .cssbuttons-io-button .circle:nth-child(1) { left: 15%; }
        .cssbuttons-io-button .circle:nth-child(2) { left: 45%; animation-delay: 0.2s; }
        .cssbuttons-io-button .circle:nth-child(3) { right: 15%; animation-delay: 0.3s; }
        .cssbuttons-io-button .shadow:nth-child(4) { left: 15%; }
        .cssbuttons-io-button .shadow:nth-child(5) { left: 45%; animation-delay: 0.2s; }
        .cssbuttons-io-button .shadow:nth-child(6) { right: 15%; animation-delay: 0.3s; }
      
        /* 加载状态下的特殊处理 */
        .cssbuttons-io-button.loading .icon {
        width: calc(100% - 0.6em) !important;
        right: 0.3em !important;
        }
        /* 保持悬停效果 */
        .cssbuttons-io-button.loading:hover .icon {
        width: calc(100% - 0.6em) !important;
        }       
        `;
        document.head.appendChild(style);
        createButton.styleAdded = true;
    }

    // 创建按钮元素
    const button = document.createElement('button');
    button.className = 'cssbuttons-io-button';

    // 添加文本
    const textNode = document.createTextNode(text);
    button.appendChild(textNode);

    // 创建图标容器
    const iconDiv = document.createElement('div');
    iconDiv.className = 'icon';

    // 创建SVG元素
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('height', '24');
    svg.setAttribute('width', '24');
    svg.setAttribute('viewBox', '0 0 24 24');

    // 添加SVG路径
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M0 0h24v24H0z');
    path1.setAttribute('fill', 'none');

    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z');
    path2.setAttribute('fill', 'currentColor');

    svg.appendChild(path1);
    svg.appendChild(path2);
    iconDiv.appendChild(svg);
    button.appendChild(iconDiv);

    // 添加点击事件
    button.addEventListener('click', onClick);

    return button;
}

async function getVerificationCode() {
    try {
        // 设置请求体的数据
        const requestBody = {
            // 根据实际情况设置需要发送的字段
            // 例如，如果需要发送 JSON 数据，你可以构造如下：
            // key: value
        };

        // 发送 POST 请求
        const response = await fetch('https://app.zaizhexue.top/trigger_login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // 设置请求头，告知服务器请求体的格式
            },
            body: JSON.stringify(requestBody), // 将请求体转换为 JSON 字符串
        });

        // 确保请求成功
        if (!response.ok) {
            throw new Error('网络请求失败');
        }

        // 解析返回的 JSON 数据
        const data =await response.json();

        // 返回 verification_code
        return data.verification_code;
    } catch (error) {
        console.error('请求失败:', error);
        return null;
    }
}

function pollLogin(verificationCode,LoggedWarpper) {
    const url = 'https://app.zaizhexue.top/polling';
    let attempts = 0;

    // 定义发送请求的函数
    const sendRequest = async () => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    verification_code: verificationCode,
                }),
            });

            if (!response.ok) {
                throw new Error('请求失败');
            }

            const data = await response.json();

            if (data.logged_in) {
                // 如果登录成功，返回用户信息
                LoggedWarpper.Logged = true;
                return data.user;
            ;
            }
        } catch (error) {
            console.error('请求失败:', error);
        }

        attempts++;

        // 如果尝试次数达到60次，则停止请求
        if (attempts >= 60) {
            console.log('已发送60次请求，停止请求');
            return null;
        }
    };

    // 设置每隔3秒发送请求
    const interval = setInterval(async () => {
        const user = await sendRequest();
        if (user) {
            clearInterval(interval);  // 登录成功时停止请求
            console.log('登录成功！')
            Settings.token = user.token.split('|')[0]; 
            const imgContainer = document.getElementById('imgContainer');
            if (imgContainer) {
                imgContainer.style.display = 'none';
            }  
            const username = document.getElementById('username');
            if (username) {
                username.innerHTML = user.nickname;

            }
            Settings.username = user.nickname;
            const createTime = document.getElementById('createTime');
            const userCreatedTime = new Date(user.createdTime);
            const month = userCreatedTime.getMonth() + 1;  // getMonth 返回 0 到 11，所以需要加 1
            const day = userCreatedTime.getDate();
            const year = userCreatedTime.getFullYear();
            const formattedDate = `${month}/${day}/${year}`;
            if (createTime) {

                createTime.innerHTML = formattedDate + '注册';
                
            }
            Settings.createTime = formattedDate;
            const userInfoContainer = document.getElementById('userInfoContainer');
            if (userInfoContainer) {
                userInfoContainer.style.display = 'flex';
            }
            return user;  // 返回用户信息
        }
    }, 3000);
}

// 静态标记样式是否已添加
createButton.styleAdded = false;

// 状态切换函数
async function toggleButtonState(button, isLoading = true, LoggedWarpper) {
    const iconContainer = button.querySelector('.icon');
    if (!iconContainer) return;

    if (isLoading) {
        // 切换为加载状态
        iconContainer.innerHTML = `
            <div class="wrapper">
                <div class="circle"></div>
                <div class="circle"></div>
                <div class="circle"></div>
            </div>
        `;
        button.classList.add('loading');
    } else {
        // 恢复原始状态
        iconContainer.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path fill="currentColor" d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"/>
            </svg>
        `;
        button.classList.remove('loading');
    }
    console.log('切换状态');
    const code = await getVerificationCode();
    iconContainer.innerHTML = `<div class="VerificationCode">${code}<div>`;
    LoggedWarpper.code = code;
    button.disabled = true;
    pollLogin(code,LoggedWarpper);

}

// 修改后的样式注入（在createButton函数中）


export { createButton, toggleButtonState };
// 使用示例：
// const myButton = createButton('点击我', () => console.log('按钮被点击'));
// document.body.appendChild(myButton);
