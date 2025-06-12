import getCourseId from "./getCourseId";

// 添加发送课件信息到本地服务器的函数
async function sendCoursewareInfo() {
  // 创建等待窗口样式
  const style = document.createElement('style');
  style.textContent = `
    .loading-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      z-index: 9999;
      width: 300px;
      text-align: center;
    }
    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 2s linear infinite;
      margin: 15px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-actions {
      margin-top: 15px;
    }
  `;
  style.setAttribute('data-for', 'loading-modal');
  document.head.appendChild(style);

  // 创建等待窗口
  const modal = document.createElement('div');
  modal.className = 'loading-modal';
  modal.innerHTML = `
    <h3>正在发送课件信息</h3>
    <div class="loading-spinner"></div>
    <p>本地服务器正在刷课，请稍候...</p>
    <div class="loading-actions">
      <button id="cancel-btn">取消</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 设置取消按钮
  let isCancelled = false;
  const cancelBtn = modal.querySelector('#cancel-btn');
  cancelBtn.addEventListener('click', () => {
    isCancelled = true;
    document.body.removeChild(modal);
    document.head.removeChild(style);
    console.log('用户取消了请求');
  });

  try {
    // 准备数据
    const courseId = getCourseId();
    const cookie = localStorage.getItem('www.zjooc.cn_cookies');
    console.log(cookie)

    if (!courseId || !cookie) {
      throw new Error('无法获取课程ID或Cookie');
    }

    // 发送请求
    const controller = new AbortController();
    const signal = controller.signal;

    // 检查是否取消
    const checkCancellation = setInterval(() => {
      if (isCancelled) {
        controller.abort();
        clearInterval(checkCancellation);
      }
    }, 100);


    function readCurrentUserAndPassword() {
      // 获取当前用户
      const currentUser = localStorage.getItem('currentUser');

      if (currentUser) {
        // 获取保存的账号信息
        const storedAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
        const currentAccount = storedAccounts.find(account => account.username === currentUser);

        if (currentAccount) {
          console.log("当前用户名:", currentAccount.username);
          console.log("当前密码:", currentAccount.password);
          return {
            username: currentAccount.username,
            password: currentAccount.password
          };
        } else {
          console.log("未找到该用户的账号信息");
          return null;
        }
      } else {
        console.log("没有登录用户");
        return null;
      }
    }
    const currentUserInfo = readCurrentUserAndPassword();
    const response = await fetch('http://localhost:5233/courseware', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: currentUserInfo.username,
        password: currentUserInfo.password,
        courseId: courseId
      }),
      signal: signal
    });

    clearInterval(checkCancellation);

    if (isCancelled) return;

    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status}`);
    }

    const result = await response.json();

    // 更新窗口显示成功信息
    modal.innerHTML = `
      <h3>发送成功</h3>
      <p>所有课件都已完成，可以手动刷新网页</p>
      <div class="loading-actions">
        <button id="close-btn">关闭</button>
      </div>
    `;

    modal.querySelector('#close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });

    console.log('课件信息发送成功:', result);

  } catch (error) {
    if (isCancelled) return;

    // 显示错误信息
    modal.innerHTML = `
      <h3>发送失败</h3>
      <p>错误信息: ${error.message}</p>
      <div class="loading-actions">
        <button id="close-btn">关闭</button>
      </div>
    `;

    modal.querySelector('#close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });

    console.error('发送课件信息失败:', error);
  }
}


// Change the export to named export instead of default export
export { sendCoursewareInfo };