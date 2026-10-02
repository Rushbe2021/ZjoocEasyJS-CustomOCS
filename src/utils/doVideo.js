import getCourseId from "./getCourseId";
import { md5 } from "./md5";

// 全局控制变量
let isDoVideoRunning = false;
let doVideoModal = null;
let doVideoStyle = null;

// 时间戳生成函数
function createTimestamp(e) {
  for (var t = e || 32, n = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678", i = n.length, r = "", o = 0; o < t; o++)
    r += n.charAt(Math.floor(Math.random() * i));
  return r;
}

function createAjaxTimestamp() {
  return createTimestamp(32) + Date.parse(new Date());
}

// 添加发送课件信息到本地服务器的函数
// async function sendCoursewareInfo() {
//   // 创建等待窗口样式
//   const style = document.createElement('style');
//   style.textContent = `
//     .loading-modal {
//       position: fixed;
//       top: 50%;
//       left: 50%;
//       transform: translate(-50%, -50%);
//       background: white;
//       padding: 20px;
//       border-radius: 8px;
//       box-shadow: 0 0 10px rgba(0,0,0,0.3);
//       z-index: 9999;
//       width: 300px;
//       text-align: center;
//     }
//     .loading-spinner {
//       border: 4px solid #f3f3f3;
//       border-top: 4px solid #3498db;
//       border-radius: 50%;
//       width: 30px;
//       height: 30px;
//       animation: spin 2s linear infinite;
//       margin: 15px auto;
//     }
//     @keyframes spin {
//       0% { transform: rotate(0deg); }
//       100% { transform: rotate(360deg); }
//     }
//     .loading-actions {
//       margin-top: 15px;
//     }
//   `;
//   style.setAttribute('data-for', 'loading-modal');
//   document.head.appendChild(style);

//   // 创建等待窗口
//   const modal = document.createElement('div');
//   modal.className = 'loading-modal';
//   modal.innerHTML = `
//     <h3>正在发送课件信息</h3>
//     <div class="loading-spinner"></div>
//     <p>本地服务器正在刷课，请稍候...</p>
//     <div class="loading-actions">
//       <button id="cancel-btn">取消</button>
//     </div>
//   `;
//   document.body.appendChild(modal);

//   // 设置取消按钮
//   let isCancelled = false;
//   const cancelBtn = modal.querySelector('#cancel-btn');
//   cancelBtn.addEventListener('click', () => {
//     isCancelled = true;
//     document.body.removeChild(modal);
//     document.head.removeChild(style);
//     console.log('用户取消了请求');
//   });

//   try {
//     // 准备数据
//     const courseId = getCourseId();
//     const cookie = localStorage.getItem('www.zjooc.cn_cookies');
//     console.log(cookie)

//     if (!courseId || !cookie) {
//       throw new Error('无法获取课程ID或Cookie');
//     }

//     // 发送请求
//     const controller = new AbortController();
//     const signal = controller.signal;

//     // 检查是否取消
//     const checkCancellation = setInterval(() => {
//       if (isCancelled) {
//         controller.abort();
//         clearInterval(checkCancellation);
//       }
//     }, 100);


//     function readCurrentUserAndPassword() {
//       // 获取当前用户
//       const currentUser = localStorage.getItem('currentUser');

//       if (currentUser) {
//         // 获取保存的账号信息
//         const storedAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
//         const currentAccount = storedAccounts.find(account => account.username === currentUser);

//         if (currentAccount) {
//           console.log("当前用户名:", currentAccount.username);
//           console.log("当前密码:", currentAccount.password);
//           return {
//             username: currentAccount.username,
//             password: currentAccount.password
//           };
//         } else {
//           console.log("未找到该用户的账号信息");
//           return null;
//         }
//       } else {
//         console.log("没有登录用户");
//         return null;
//       }
//     }
//     const currentUserInfo = readCurrentUserAndPassword();
//     const response = await fetch('http://localhost:5233/courseware', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         username: currentUserInfo.username,
//         password: currentUserInfo.password,
//         courseId: courseId
//       }),
//       signal: signal
//     });

//     clearInterval(checkCancellation);

//     if (isCancelled) return;

//     if (!response.ok) {
//       throw new Error(`服务器响应错误: ${response.status}`);
//     }

//     const result = await response.json();

//     // 更新窗口显示成功信息
//     modal.innerHTML = `
//       <h3>发送成功</h3>
//       <p>所有课件都已完成，可以手动刷新网页</p>
//       <div class="loading-actions">
//         <button id="close-btn">关闭</button>
//       </div>
//     `;

//     modal.querySelector('#close-btn').addEventListener('click', () => {
//       document.body.removeChild(modal);
//       document.head.removeChild(style);
//     });

//     console.log('课件信息发送成功:', result);

//   } catch (error) {
//     if (isCancelled) return;

//     // 显示错误信息
//     modal.innerHTML = `
//       <h3>发送失败</h3>
//       <p>错误信息: ${error.message}</p>
//       <div class="loading-actions">
//         <button id="close-btn">关闭</button>
//       </div>
//     `;

//     modal.querySelector('#close-btn').addEventListener('click', () => {
//       document.body.removeChild(modal);
//       document.head.removeChild(style);
//     });

//     console.error('发送课件信息失败:', error);
//   }
// }


// 获取视频信息的函数
async function getVideoMsg(courseId) {
  const time = createAjaxTimestamp();
  const checkTimeout = true;
  const url = `https://www.zjooc.cn/ajax?service=/jxxt/api/course/courseStudent/getStudentCourseChapters&params[pageNo]=1&params[courseId]=${courseId}&params[urlNeed]=0&time=${time}&checkTimeout=${checkTimeout}`;
  
  try {
    const l = Date.parse(new Date());
    const signcheck = md5(l + "gxpt_lanao");
    const timedate = Date.parse(new Date());
    
    const response = await fetch(url, {
      headers: {
        'signcheck': signcheck,
        'timedate': timedate
      }
    });
    const content = await response.text();
    const data = JSON.parse(content);
    
    const videoMsg = [];
    
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach(chapter => {
        const chapterName = chapter.name;
        
        if (chapter.children && Array.isArray(chapter.children)) {
          chapter.children.forEach(section => {
            const sectionName = section.name;
            
            if (section.children && Array.isArray(section.children)) {
              section.children.forEach(resource => {
                const videoInfo = {
                  Name: `${chapterName}-${sectionName}-${resource.name}`,
                  courseId: courseId,
                  chapterId: resource.id,
                  learnStatus: resource.learnStatus || 0,
                  time: resource.vedioTimeLength || 0
                };
                
                videoMsg.push(videoInfo);
              });
            }
          });
        }
      });
    }
    
    return videoMsg;
  } catch (error) {
    console.error('获取视频信息失败:', error);
    throw error;
  }
}

// 创建doVideo进度窗口
function createDoVideoModal() {
  // 创建样式
  doVideoStyle = document.createElement('style');
  doVideoStyle.textContent = `
    .do-video-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      z-index: 9999;
      width: 400px;
      height: 200px;
      text-align: center;
      font-family: Arial, sans-serif;
      overflow: auto;
    }
    .do-video-spinner {
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
    .do-video-actions {
      margin-top: 15px;
    }
    .do-video-progress {
      margin: 10px 0;
      font-size: 14px;
      color: #333;
    }
    .do-video-current {
      margin: 5px 0;
      font-size: 12px;
      color: #666;
      word-break: break-all;
    }
  `;
  doVideoStyle.setAttribute('data-for', 'do-video-modal');
  document.head.appendChild(doVideoStyle);

  // 创建窗口
  doVideoModal = document.createElement('div');
  doVideoModal.className = 'do-video-modal';
  doVideoModal.innerHTML = `
    <h3>正在完成课程</h3>
    <div class="do-video-spinner"></div>
    <div class="do-video-progress" id="do-video-progress">准备中...</div>
    <div class="do-video-current" id="do-video-current"></div>
  `;
  document.body.appendChild(doVideoModal);


}

// 更新doVideo进度
function updateDoVideoProgress(current, total, currentName) {
  if (!doVideoModal) return;
  
  const progressElement = doVideoModal.querySelector('#do-video-progress');
  const currentElement = doVideoModal.querySelector('#do-video-current');
  
  const progress = (current / total) * 100;
  const progressBar = '#'.repeat(Math.floor(progress / 10)) + '-'.repeat(10 - Math.floor(progress / 10));
  
  progressElement.textContent = `进度: ${current}/${total} ${progressBar} [${Math.floor(progress)}%]`;
  currentElement.textContent = `当前: ${currentName}`;
}

// 关闭doVideo窗口
function closeDoVideoModal() {
  if (doVideoModal) {
    document.body.removeChild(doVideoModal);
    doVideoModal = null;
  }
  if (doVideoStyle) {
    document.head.removeChild(doVideoStyle);
    doVideoStyle = null;
  }
}

// 停止doVideo执行
function stopDoVideo() {
  isDoVideoRunning = false;
  closeDoVideoModal();
  console.log('doVideo已停止');
}

// 执行视频学习的函数
async function doVideo() {
  if (isDoVideoRunning) {
    console.log('doVideo已在运行中');
    return;
  }
  
  isDoVideoRunning = true;
  createDoVideoModal();
  
  const courseId = getCourseId();
  try {
    const videoList = await getVideoMsg(courseId);
    const videoCount = videoList.length;
    
    if (videoCount === 0) {
      updateDoVideoProgress(0, 0, '没有未完成的视频！');
      setTimeout(() => {
        closeDoVideoModal();
        isDoVideoRunning = false;
      }, 2000);
      return;
    }
    
    for (let idx = 0; idx < videoCount; idx++) {
      // 检查是否被停止
      if (!isDoVideoRunning) {
        console.log('doVideo被用户停止');
        return;
      }
      
      const video = videoList[idx];
      updateDoVideoProgress(idx + 1, videoCount, video.Name);
      
      const time = createAjaxTimestamp();
      const checkTimeout = true;
      let url;
      
      if (video.time > 0) {
        // 视频类型的章节
        url = `https://www.zjooc.cn/ajax?service=/learningmonitor/api/learning/monitor/videoPlaying` +
              `&params[chapterId]=${video.chapterId}` +
              `&params[courseId]=${video.courseId}` +
              `&params[playTime]=${video.time}` +
              `&params[percent]=100` +
              `&time=${time}&checkTimeout=${checkTimeout}`;
      } else {
        // 文本类型的章节
        url = `https://www.zjooc.cn/ajax?service=/learningmonitor/api/learning/monitor/finishTextChapter` +
              `&params[courseId]=${video.courseId}` +
              `&params[chapterId]=${video.chapterId}` +
              `&time=${time}&checkTimeout=${checkTimeout}`;
      }
      
      const l = Date.parse(new Date());
      const signcheck = md5(l + "gxpt_lanao");
      const timedate = Date.parse(new Date());
      
      await fetch(url, {
        headers: {
          'signcheck': signcheck,
          'timedate': timedate
        }
      });
      
      console.log(`${video.Name}正在完成！[${Math.floor(((idx + 1) / videoCount) * 100)}%]`);
      
      // 添加小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 显示完成信息
    if (doVideoModal && isDoVideoRunning) {
      doVideoModal.innerHTML = `
        <h3>✅ 完成</h3>
        <p>所有课程都已完成！</p>
        <p>共完成 ${videoCount} 个课程</p>
        <div class="do-video-actions">
          <button id="do-video-close-btn">关闭</button>
        </div>
      `;
      
      doVideoModal.querySelector('#do-video-close-btn').addEventListener('click', () => {
        closeDoVideoModal();
      });
    }
    
    console.log('全部完成！');
    isDoVideoRunning = false;
    return true;
  } catch (error) {
    console.error('执行视频学习失败:', error);
    
    // 显示错误信息
    if (doVideoModal && isDoVideoRunning) {
      doVideoModal.innerHTML = `
        <h3>❌ 错误</h3>
        <p>执行失败: ${error.message}</p>
        <div class="do-video-actions">
          <button id="do-video-close-btn">关闭</button>
        </div>
      `;
      
      doVideoModal.querySelector('#do-video-close-btn').addEventListener('click', () => {
        closeDoVideoModal();
      });
    }
    
    isDoVideoRunning = false;
    throw error;
  }
}

// 主要的发送课件信息函数
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
    .progress-info {
      margin: 10px 0;
      font-size: 12px;
    }
  `;
  style.setAttribute('data-for', 'loading-modal');
  document.head.appendChild(style);

  // 创建等待窗口
  const modal = document.createElement('div');
  modal.className = 'loading-modal';
  modal.innerHTML = `
    <h3>正在处理视频课件</h3>
    <div class="loading-spinner"></div>
    <p>正在自动完成视频学习，请稍候...</p>
    <div class="progress-info" id="progress-info">准备中...</div>
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

    if (!courseId) {
      throw new Error('无法获取课程ID');
    }

    // 执行视频学习
    await doVideo(courseId);

    if (isCancelled) return;

    // 更新窗口显示成功信息
    modal.innerHTML = `
      <h3>处理完成</h3>
      <p>所有视频课件都已完成，可以手动刷新网页查看结果</p>
      <div class="loading-actions">
        <button id="close-btn">关闭</button>
      </div>
    `;

    modal.querySelector('#close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });

    console.log('视频课件处理成功');

  } catch (error) {
    if (isCancelled) return;

    // 显示错误信息
    modal.innerHTML = `
      <h3>处理失败</h3>
      <p>错误信息: ${error.message}</p>
      <div class="loading-actions">
        <button id="close-btn">关闭</button>
      </div>
    `;

    modal.querySelector('#close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });

    console.error('处理视频课件失败:', error);
  }
}

// Change the export to named export instead of default export
// export { sendCoursewareInfo };

export { doVideo, stopDoVideo };