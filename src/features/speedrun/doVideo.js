import getCourseId from '../../platform/zjooc/getCourseId.js';
import { md5 } from './md5.js';

let isDoVideoRunning = false;
let doVideoModal = null;
let doVideoStyle = null;

function createTimestamp(length = 32) {
    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function createAjaxTimestamp() {
    return createTimestamp(32) + Date.parse(new Date());
}

function signedHeaders() {
    const timedate = Date.parse(new Date());
    return {
        signcheck: md5(timedate + 'gxpt_lanao'),
        timedate: String(timedate),
    };
}

async function getVideoMsg(courseId) {
    const time = createAjaxTimestamp();
    const url = `https://www.zjooc.cn/ajax?service=/jxxt/api/course/courseStudent/getStudentCourseChapters&params[pageNo]=1&params[courseId]=${courseId}&params[urlNeed]=0&time=${time}&checkTimeout=true`;
    const response = await fetch(url, { headers: signedHeaders() });
    const data = JSON.parse(await response.text());
    const videoMsg = [];

    if (data.data && Array.isArray(data.data)) {
        data.data.forEach((chapter) => {
            if (!Array.isArray(chapter.children)) {
                return;
            }
            chapter.children.forEach((section) => {
                if (!Array.isArray(section.children)) {
                    return;
                }
                section.children.forEach((resource) => {
                    videoMsg.push({
                        Name: `${chapter.name}-${section.name}-${resource.name}`,
                        courseId,
                        chapterId: resource.id,
                        learnStatus: resource.learnStatus || 0,
                        time: resource.vedioTimeLength || 0,
                    });
                });
            });
        });
    }

    return videoMsg;
}

function createDoVideoModal() {
    doVideoStyle = document.createElement('style');
    doVideoStyle.setAttribute('data-for', 'do-video-modal');
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
    .do-video-actions { margin-top: 15px; }
    .do-video-progress { margin: 10px 0; font-size: 14px; color: #333; }
    .do-video-current { margin: 5px 0; font-size: 12px; color: #666; word-break: break-all; }
  `;
    document.head.appendChild(doVideoStyle);

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

function updateDoVideoProgress(current, total, currentName) {
    if (!doVideoModal) {
        return;
    }
    const progressElement = doVideoModal.querySelector('#do-video-progress');
    const currentElement = doVideoModal.querySelector('#do-video-current');
    const progress = total ? (current / total) * 100 : 0;
    const filled = Math.floor(progress / 10);
    const bar = '#'.repeat(filled) + '-'.repeat(10 - filled);
    progressElement.textContent = `进度: ${current}/${total} ${bar} [${Math.floor(progress)}%]`;
    currentElement.textContent = `当前: ${currentName}`;
}

function closeDoVideoModal() {
    if (doVideoModal) {
        doVideoModal.remove();
        doVideoModal = null;
    }
    if (doVideoStyle) {
        doVideoStyle.remove();
        doVideoStyle = null;
    }
}

export function stopDoVideo() {
    isDoVideoRunning = false;
    closeDoVideoModal();
}

export async function doVideo() {
    if (isDoVideoRunning) {
        return;
    }

    isDoVideoRunning = true;
    createDoVideoModal();

    const courseId = getCourseId();
    if (!courseId) {
        isDoVideoRunning = false;
        closeDoVideoModal();
        throw new Error('无法获取课程ID，请进入章节内容后再试');
    }

    try {
        const videoList = await getVideoMsg(courseId);
        const videoCount = videoList.length;

        if (videoCount === 0) {
            updateDoVideoProgress(0, 0, '没有未完成的视频！');
            await new Promise((resolve) => setTimeout(resolve, 2000));
            closeDoVideoModal();
            isDoVideoRunning = false;
            return true;
        }

        for (let idx = 0; idx < videoCount; idx++) {
            if (!isDoVideoRunning) {
                return;
            }

            const video = videoList[idx];
            updateDoVideoProgress(idx + 1, videoCount, video.Name);

            const time = createAjaxTimestamp();
            const url = video.time > 0
                ? `https://www.zjooc.cn/ajax?service=/learningmonitor/api/learning/monitor/videoPlaying&params[chapterId]=${video.chapterId}&params[courseId]=${video.courseId}&params[playTime]=${video.time}&params[percent]=100&time=${time}&checkTimeout=true`
                : `https://www.zjooc.cn/ajax?service=/learningmonitor/api/learning/monitor/finishTextChapter&params[courseId]=${video.courseId}&params[chapterId]=${video.chapterId}&time=${time}&checkTimeout=true`;

            await fetch(url, { headers: signedHeaders() });
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (doVideoModal && isDoVideoRunning) {
            doVideoModal.innerHTML = `
        <h3>完成</h3>
        <p>所有课程都已完成！</p>
        <p>共完成 ${videoCount} 个课程</p>
        <div class="do-video-actions">
          <button id="do-video-close-btn">关闭</button>
        </div>
      `;
            doVideoModal.querySelector('#do-video-close-btn').addEventListener('click', closeDoVideoModal);
        }

        isDoVideoRunning = false;
        return true;
    } catch (error) {
        if (doVideoModal && isDoVideoRunning) {
            doVideoModal.innerHTML = `
        <h3>错误</h3>
        <p>执行失败: ${error.message}</p>
        <div class="do-video-actions">
          <button id="do-video-close-btn">关闭</button>
        </div>
      `;
            doVideoModal.querySelector('#do-video-close-btn').addEventListener('click', closeDoVideoModal);
        }
        isDoVideoRunning = false;
        throw error;
    }
}
