import settings from '../../core/settings.js';
import { doVideo, stopDoVideo } from '../speedrun/doVideo.js';
// 全局控制变量
let isRunning = false;
let runId = 0;
let cancelCurrentVideo = null;
let closeTaskModal = null;

// 配置常量
const DELAY_BETWEEN_CLICKS = 200; // 点击后最短等待，给页面开始切换的时间
const DELAY_AFTER_CLICK = 2000; // 等待页面切换完成的最长时间（毫秒）
const DELAY_AFTER_FINISH = 500; // 单个课件完成后稍等，给站点保存进度
const MAX_RETRY = 3; // 最大重试次数
const CHECK_INTERVAL = 1000; // 视频进度检测间隔（毫秒）
const STUCK_LIMIT = 10000; // 正常播放时无进度多久算卡住（毫秒）
const BUFFERING_STUCK_LIMIT = 30000; // 缓冲时无进度多久算卡住（毫秒）
const START_TIMEOUT = 15000; // 调用 play() 后多久还没开始播放算失败（毫秒）
const FIND_VIDEO_TIMEOUT = 10000; // 等待视频元素出现的最长时间（毫秒）
const MIN_PLAY_TIME = 10000; // 无法获取时长时的最短播放时间（毫秒）
const MAX_VIDEO_RETRY = 3; // 视频播放最大重试次数

// 新增弹窗相关样式和逻辑
const modalStyle = `
  .task-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
    z-index: 9999;
    max-width: 80%;
    max-height: 80vh;
    overflow: auto;
    width: 500px;
  }
  .task-tree {
    margin: 10px 0;
  }
  .task-item {
    margin-left: 20px;
    padding: 5px 0;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  .modal-actions {
    text-align: right;
    margin-top: 15px;
  }
  .task-checkbox {
    margin-right: 8px;
  }
`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitUntil(predicate, { timeout = DELAY_AFTER_CLICK, interval = 100, active } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (active && !active()) return false;
    if (predicate()) return true;
    await sleep(interval);
  }
  return predicate();
}

function findCompleteButton() {
  return Array.from(document.querySelectorAll('button'))
    .find(btn => btn.textContent.includes('完成学习'));
}

function currentVideoKey() {
  const video = document.querySelector('video');
  if (!video) return '';
  return video.currentSrc || video.src || video.getAttribute('src') || '';
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function normalizeText(text) {
  return String(text ?? '').replace(/\s+/g, '');
}

// 所有节展平成一维数组，下标与页面上的节一一对应
function flattenSections(parsedData) {
  return (parsedData.data || []).flatMap(chapter => chapter.children || []);
}

// 创建任务树结构
function createTaskTree(parsedData, defaultTasks) {
  const taskMap = new Map();
  defaultTasks.forEach(([sectionIndex, lessons]) => {
    lessons.forEach(lesson => {
      taskMap.set(`${sectionIndex}-${lesson.index}`, true);
    });
  });

  // 计算全局的sectionIndex
  let globalSectionIndex = 0;

  return (parsedData.data || []).map((chapter, chapterIndex) => {
    const chapterChildren = (chapter.children || []).map((section) => {
      const currentSectionIndex = globalSectionIndex++;
      return {
        name: section.name,
        sectionIndex: currentSectionIndex, // 使用全局递增的索引
        children: (section.children || []).map((lesson, lessonIndex) => {
          const isNotCompleted = lesson.learnStatus !== 2;
          return {
            name: lesson.name,
            chapterIndex,
            sectionIndex: currentSectionIndex, // 使用全局递增的索引
            lessonIndex,
            resourceType: lesson.resourceType,
            defaultSelected: isNotCompleted,
            selected: taskMap.has(`${currentSectionIndex}-${lessonIndex}`) || isNotCompleted
          };
        })
      };
    });

    return {
      name: chapter.name,
      children: chapterChildren
    };
  });
}

// 修改findTasks函数，使用全局递增的sectionIndex
function findTasks(parsedData) {
  let globalSectionIndex = 0;

  return (parsedData.data || [])
    .flatMap(chapter => {
      const sectionResults = (chapter.children || []).map((section) => {
        const currentSectionIndex = globalSectionIndex++;

        const lessons = (section.children || [])
          .map((lesson, lessonIndex) =>
            lesson.learnStatus !== 2
              ? {
                index: lessonIndex,
                resourceType: lesson.resourceType,
                chapterName: "",
                sectionName: section.name,
                lessonName: lesson.name
              }
              : null
          )
          .filter(Boolean);

        return lessons.length ? [currentSectionIndex, lessons] : null;
      }).filter(Boolean);

      return sectionResults;
    });
}

// 显示任务选择弹窗
function showTaskModal(taskTree) {
  return new Promise(resolve => {
    const style = document.createElement('style');
    style.textContent = modalStyle;
    style.setAttribute('data-for', 'task-modal'); // 添加标识

    const modal = document.createElement('div');
    modal.className = 'task-modal';

    const renderTree = (items, depth = 0) => {
      return items.map(item => `
        <div class="task-item" style="margin-left: ${depth * 20}px">
          ${item.children ? `
            <strong>${escapeHtml(item.name)}</strong>
            ${renderTree(item.children, depth + 1)}
          ` : `
            <label>
              <input type="checkbox" 
                class="task-checkbox" 
                ${item.selected ? 'checked' : ''}
                data-section="${item.sectionIndex}"
                data-lesson="${item.lessonIndex}"
                data-resource-type="${item.resourceType}">
              ${escapeHtml(item.name)} (${item.resourceType === 1 ? '视频' : '文档'})
            </label>
          `}
        </div>
      `).join('');
    };

    modal.innerHTML = `
      <h3>请选择要完成的课件</h3>
      <div class="task-tree">
        ${renderTree(taskTree)}
      </div>
      <div class="modal-actions">
        <button id="confirm-btn">开始任务</button>
        <button id="cancel-btn">取消</button>
      </div>
    `;

    const close = (result) => {
      closeTaskModal = null;
      modal.remove();
      style.remove();
      resolve(result);
    };

    const handleConfirm = () => {
      const selectedTasks = [];
      // 使用更可靠的选择器并确保正确获取所有选中的复选框
      const checkboxes = modal.querySelectorAll('input.task-checkbox:checked');
      console.log('选中的复选框数量:', checkboxes.length);

      checkboxes.forEach(checkbox => {
        // 确保数据属性存在且正确转换为整数
        const sectionIndex = parseInt(checkbox.dataset.section, 10);
        const lessonIndex = parseInt(checkbox.dataset.lesson, 10);
        const resourceType = parseInt(checkbox.dataset.resourceType, 10);

        // 验证数据有效性
        if (!isNaN(sectionIndex) && !isNaN(lessonIndex) && !isNaN(resourceType)) {
          selectedTasks.push({
            sectionIndex,
            lessonIndex,
            resourceType
          });
        } else {
          console.error('无效的任务数据:', checkbox.dataset);
        }
      });

      console.log('最终选择的任务:', selectedTasks);
      close(selectedTasks);
    };

    modal.querySelector('#confirm-btn').addEventListener('click', handleConfirm);
    modal.querySelector('#cancel-btn').addEventListener('click', () => close(null));
    closeTaskModal = () => close(null);

    document.body.appendChild(style);
    document.body.appendChild(modal);
  });
}


// 查找节元素
function findSections() {
  return Array.from(document.querySelectorAll('li span.of_eno'))
    .filter(span => span.parentElement.tagName === 'LI');
}

// 当前页面是否还是课程章节页
function isOnChapterPage() {
  return findSections().length > 0;
}

// 查找课件元素
function findLessons() {
  const allITags = document.getElementsByTagName('i');
  return Array.from(allITags).filter(tag =>
    tag.classList.contains('iconfont') && // 包含 iconfont 类
    tag.parentElement.tagName === 'SPAN' && // 父元素是 <SPAN>
    !tag.classList.contains('icon-bianji') // 不包含 icon-bianji 类
  );
}

// 按名称在元素列表里定位：先精确匹配，再找唯一包含匹配，都不行再退回下标
function pickByName(elements, name, fallbackIndex, getText) {
  const target = normalizeText(name);
  if (target) {
    const exact = elements.filter(el => normalizeText(getText(el)) === target);
    if (exact.length === 1) return { element: exact[0], matchedBy: 'name' };
    const partial = elements.filter(el => normalizeText(getText(el)).includes(target));
    if (partial.length === 1) return { element: partial[0], matchedBy: 'name' };
  }
  return { element: elements[fallbackIndex], matchedBy: 'index' };
}

// 视频播放控制
function playVideo(active) {
  if (!active()) return Promise.resolve('cancelled');

  return new Promise((resolve, reject) => {
    let settled = false;
    let video = null;
    let findTimer = null;
    let checkTimer = null;
    let startTimer = null;
    let retryTimer = null;
    let fallbackTimer = null;
    let started = false;
    let errorCount = 0;
    let lastTime = null;
    let stuckMs = 0;

    const onEnded = () => finish('done');
    const onError = () => retry('视频加载出错');
    const onPlaying = () => {
      started = true;
      clearTimeout(startTimer);
    };
    const onMetadata = () => setupFallback();

    const cleanup = () => {
      clearInterval(findTimer);
      clearInterval(checkTimer);
      clearTimeout(startTimer);
      clearTimeout(retryTimer);
      clearTimeout(fallbackTimer);
      if (video) {
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('error', onError);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('loadedmetadata', onMetadata);
      }
      if (cancelCurrentVideo === cancel) cancelCurrentVideo = null;
    };

    function finish(result, error) {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) {
        reject(error);
      } else {
        console.log(result === 'done' ? '视频播放完成' : '视频播放已取消');
        resolve(result);
      }
    }

    function cancel() {
      if (video) video.pause();
      finish('cancelled');
    }
    cancelCurrentVideo = cancel;

    function applySettings() {
      video.muted = settings.mute;
      const rate = parseFloat(settings.speed) || 1.0;
      if (video.playbackRate !== rate) video.playbackRate = rate;
    }

    // 时长未知时才用定时兜底，时长已知以 ended 或进度到头为准
    function setupFallback() {
      clearTimeout(fallbackTimer);
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        fallbackTimer = setTimeout(() => finish('done'), MIN_PLAY_TIME);
        console.log(`无法获取视频时长，将播放至少${MIN_PLAY_TIME / 1000}秒`);
      } else {
        console.log(`视频时长${video.duration}秒`);
      }
    }

    function checkProgress() {
      if (settled) return;
      if (!active()) {
        cancel();
        return;
      }
      applySettings();
      if (!started || video.ended) return;

      const duration = video.duration;
      const currentTime = video.currentTime;
      if (Number.isFinite(duration) && duration > 0 && duration - currentTime < 0.5) {
        finish('done');
        return;
      }

      const buffering = video.readyState < 3 || video.seeking;
      if (lastTime !== null && Math.abs(currentTime - lastTime) < 0.1) {
        stuckMs += CHECK_INTERVAL;
      } else {
        stuckMs = 0;
      }
      lastTime = currentTime;

      const limit = buffering ? BUFFERING_STUCK_LIMIT : STUCK_LIMIT;
      if (stuckMs >= limit) {
        stuckMs = 0;
        retry(buffering ? '视频缓冲时间过长' : '视频长时间没有进度');
      }
    }

    function startPlayback() {
      if (settled) return;
      lastTime = null;
      stuckMs = 0;
      applySettings();
      clearTimeout(startTimer);
      startTimer = setTimeout(() => {
        if (!started && video.paused) retry('视频未能开始播放');
      }, START_TIMEOUT);
      console.log('开始播放视频');
      video.play().catch(err => {
        console.log('视频播放失败:', err);
        retry('浏览器拒绝播放');
      });
    }

    function retry(reason) {
      if (settled) return;
      errorCount++;
      console.log(`视频播放异常（${reason}），第${errorCount}次`);
      if (errorCount >= MAX_VIDEO_RETRY) {
        finish(null, new Error(reason));
        return;
      }
      clearTimeout(retryTimer);
      retryTimer = setTimeout(startPlayback, 1000);
    }

    function attach(found) {
      video = found;
      video.addEventListener('ended', onEnded);
      video.addEventListener('error', onError);
      video.addEventListener('playing', onPlaying);
      if (!video.paused && video.currentTime > 0) started = true;
      if (video.readyState >= 1) {
        setupFallback();
      } else {
        video.addEventListener('loadedmetadata', onMetadata, { once: true });
      }
      checkTimer = setInterval(checkProgress, CHECK_INTERVAL);
      startPlayback();
    }

    console.log('开始准备播放视频...');
    const findStart = Date.now();
    findTimer = setInterval(() => {
      if (!active()) {
        cancel();
        return;
      }
      const found = document.querySelector('video');
      if (found) {
        clearInterval(findTimer);
        attach(found);
      } else if (Date.now() - findStart >= FIND_VIDEO_TIMEOUT) {
        finish(null, new Error('未找到视频元素'));
      }
    }, 500);
  });
}

// 完成学习按钮
async function completeLesson(active) {
  for (let retry = 0; retry < MAX_RETRY; retry++) {
    if (!active()) return false;
    const button = findCompleteButton();

    if (button) {
      button.disabled = false;
      button.click();
      await sleep(DELAY_AFTER_FINISH);
      return true;
    }
    await sleep(1000);
  }
  return false;
}

// 点击页面元素，等新内容出现后再恢复路由监听
async function clickAndSettle(element, routeGuard, ready, active) {
  routeGuard.listenRoute = false;
  try {
    element?.click();
    await sleep(DELAY_BETWEEN_CLICKS);
    if (ready) {
      await waitUntil(ready, { timeout: DELAY_AFTER_CLICK, active });
    } else {
      await sleep(DELAY_AFTER_CLICK);
    }
  } finally {
    routeGuard.listenRoute = true;
  }
}

// 停止执行
function stopAutoPlay() {
  console.log('正在停止自动播放...');
  isRunning = false;

  try {
    stopDoVideo();
  } catch (error) {
    console.error('停止课件速刷时出错:', error);
  }

  if (cancelCurrentVideo) {
    try {
      cancelCurrentVideo();
    } catch (error) {
      console.error('停止视频播放时出错:', error);
    }
  }

  if (closeTaskModal) {
    console.log('正在关闭任务选择窗口');
    closeTaskModal();
  }

  console.log('自动播放已停止');
}


// 主流程
async function autoPlay(parsedData, routeGuard) {
  const myRun = ++runId;
  isRunning = true;
  const active = () => isRunning && runId === myRun;

  console.log("视频速刷：", settings.speedRun);
  if (settings.speedRun) {
    try {
      const ok = await doVideo();
      if (!active() || !ok) {
        return ["info", "用户已停止任务"];
      }
      return ["success", "所有任务已完成"];
    } catch (error) {
      return ["error", "课件速刷失败：" + error.message];
    }
  }
  const sections = findSections();
  if (!sections.length) {
    console.log('未找到节元素');
    return ["error", "请进入 章节内容>任意课件 再尝试自动播放"];
  }

  if (!parsedData || !Array.isArray(parsedData.data) || parsedData.data.length === 0) {
    console.log('未找到数据');
    return ["error", "没有拿到当前课程的章节数据，请刷新页面后重新进入章节内容"];
  }

  const sectionsData = flattenSections(parsedData);
  if (sectionsData.length !== sections.length) {
    console.log(`[ZE自动播放] 页面节数(${sections.length})与章节数据节数(${sectionsData.length})不一致，将优先按名称定位`);
  }

  // 生成默认任务列表
  const defaultTasks = findTasks(parsedData);
  const taskTree = createTaskTree(parsedData, defaultTasks);

  // 显示选择弹窗
  const selectedTasks = await showTaskModal(taskTree);
  console.log(selectedTasks);
  if (!selectedTasks) {
    if (runId === myRun) isRunning = false;
    return ["info", "用户取消任务"];
  }
  if (!active()) return ["info", "已停止自动播放"];

  // 重组任务结构
  const taskMap = new Map();
  selectedTasks.forEach(({ sectionIndex, lessonIndex, resourceType }) => {
    if (!taskMap.has(sectionIndex)) {
      taskMap.set(sectionIndex, []);
    }
    taskMap.get(sectionIndex).push({ index: lessonIndex, resourceType });
  });

  let tasks = Array.from(taskMap.entries());
  if (!tasks.length) {
    console.log('所有任务已完成');
    if (runId === myRun) isRunning = false;
    return ["success", "所有任务已完成"];
  }

  const lessonName = (sectionIndex, index) =>
    sectionsData[sectionIndex]?.children?.[index]?.name || `第${sectionIndex + 1}节第${index + 1}课`;

  let failedTasks = new Map();

  try {
    for (let retry = 0; retry < MAX_RETRY; retry++) {
      failedTasks = new Map();
      const markFailed = (sectionIndex, lesson) => {
        if (!failedTasks.has(sectionIndex)) failedTasks.set(sectionIndex, []);
        failedTasks.get(sectionIndex).push(lesson);
      };

      for (const [sectionIndex, lessons] of tasks) {
        if (!active()) break;

        const currentSections = findSections();
        const section = pickByName(
          currentSections,
          sectionsData[sectionIndex]?.name,
          sectionIndex,
          el => el.textContent
        );
        if (!section.element) {
          console.log('[ZE自动播放] 找不到节，跳过:', sectionsData[sectionIndex]?.name);
          lessons.forEach(lesson => markFailed(sectionIndex, lesson));
          continue;
        }
        const firstLessonName = sectionsData[sectionIndex]?.children?.[lessons[0].index]?.name;
        await clickAndSettle(section.element, routeGuard, () => {
          const lessonElements = findLessons();
          if (!lessonElements.length) return false;
          if (!firstLessonName) return true;
          return lessonElements.some(el => normalizeText(el.parentElement?.textContent).includes(normalizeText(firstLessonName)));
        }, active);
        if (!active()) break;

        for (const lesson of lessons) {
          if (!active()) break;
          const { index, resourceType } = lesson;
          const name = lessonName(sectionIndex, index);

          const lessonElements = findLessons();
          const picked = pickByName(lessonElements, name, index, el => el.parentElement?.textContent);
          console.log(`[ZE自动播放] 正在完成「${name}」（${picked.matchedBy === 'name' ? '按名称' : '按序号'}定位，共${lessonElements.length}个课件）`);
          if (!picked.element) {
            console.log('[ZE自动播放] 找不到课件，跳过:', name);
            markFailed(sectionIndex, lesson);
            continue;
          }

          const previousVideoKey = currentVideoKey();
          await clickAndSettle(picked.element, routeGuard, () => {
            if (resourceType === 1) {
              const key = currentVideoKey();
              if (!key) return false;
              return !previousVideoKey || key !== previousVideoKey;
            }
            return !!findCompleteButton();
          }, active);
          if (!active()) break;

          if (resourceType === 1) {
            try {
              const result = await playVideo(active);
              if (result === 'cancelled') break;
              console.log('视频播放完成，继续下一步');
            } catch (error) {
              console.log(`[ZE自动播放] 视频「${name}」播放失败:`, error.message);
              markFailed(sectionIndex, lesson);
              continue;
            }
          } else {
            console.log('处理文档类型资源');
            routeGuard.listenRoute = false;
            try {
              const ok = await completeLesson(active);
              if (!ok && active()) {
                console.log(`[ZE自动播放] 文档「${name}」没有找到完成学习按钮`);
                markFailed(sectionIndex, lesson);
                continue;
              }
            } finally {
              routeGuard.listenRoute = true;
            }
          }
          await sleep(DELAY_AFTER_FINISH);
        }
      }

      if (!active() || failedTasks.size === 0 || retry === MAX_RETRY - 1) break;

      tasks = Array.from(failedTasks.entries());
      console.log('开始重试失败的任务:', tasks);
    }
  } catch (error) {
    console.error('执行异常:', error);
    if (runId === myRun) isRunning = false;
    return ["error", `自动播放出错：${error.message}`];
  }

  if (!active()) {
    return ["info", "已停止自动播放"];
  }
  isRunning = false;

  if (failedTasks.size > 0) {
    const names = Array.from(failedTasks.entries())
      .flatMap(([sectionIndex, lessons]) => lessons.map(({ index }) => lessonName(sectionIndex, index)));
    return ["error", `有${names.length}个课件未完成：${names.join('、')}`];
  }
  return ["success", "所有任务已完成"];
}

export { autoPlay, stopAutoPlay, isOnChapterPage };
