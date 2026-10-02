import settings from '../settings.js';
import { doVideo, stopDoVideo } from './doVideo.js';
// 全局控制变量
let isRunning = true;
let currentVideoElement = null;

// 配置常量
const DELAY_BETWEEN_CLICKS = 20; // 点击之间的等待时间（毫秒）
const DELAY_AFTER_CLICK = 2000; // 操作后等待时间（毫秒）
const MAX_RETRY = 3; // 最大重试次数

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
  
  return parsedData.data.map((chapter, chapterIndex) => {
    const chapterChildren = chapter.children.map((section, localSectionIndex) => {
      const currentSectionIndex = globalSectionIndex++;
      return {
        name: section.name,
        sectionIndex: currentSectionIndex, // 使用全局递增的索引
        children: section.children.map((lesson, lessonIndex) => {
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
      const sectionResults = (chapter.children || []).map((section, localSectionIndex) => {
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
            <strong>${item.name}</strong>
            ${renderTree(item.children, depth + 1)}
          ` : `
            <label>
              <input type="checkbox" 
                class="task-checkbox" 
                ${item.selected ? 'checked' : ''}
                data-section="${item.sectionIndex}"
                data-lesson="${item.lessonIndex}"
                data-resource-type="${item.resourceType}">
              ${item.name} (${item.resourceType === 1 ? '视频' : '文档'})
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
      document.body.removeChild(modal);
      document.body.removeChild(style);
      resolve(selectedTasks);
    };

    const handleCancel = () => {
      document.body.removeChild(modal);
      document.body.removeChild(style);
      resolve(null);
    };

    modal.querySelector('#confirm-btn').addEventListener('click', handleConfirm);
    modal.querySelector('#cancel-btn').addEventListener('click', handleCancel);

    document.body.appendChild(style);
    document.body.appendChild(modal);
  });
}


// 查找节元素
function findSections() {
  return Array.from(document.querySelectorAll('li span.of_eno'))
    .filter(span => span.parentElement.tagName === 'LI');
}

// 查找未完成课程
function findLessons() {
  const allITags = document.getElementsByTagName('i');
  return Array.from(allITags).filter(tag =>
    tag.classList.contains('iconfont') && // 包含 iconfont 类
    tag.parentElement.tagName === 'SPAN' && // 父元素是 <SPAN>
    !tag.classList.contains('icon-bianji') // 不包含 icon-bianji 类
  );

  // return spansWithIconFont.filter(
  //   tag => !tag.classList.contains('complete')
  // ).map(tag => tag.parentElement);
}
// 视频播放控制
async function playVideo() {
  if (!isRunning) return;
  
  let errorCount = 0;
  let stuckCheckInterval = null;
  let lastTime = null;
  let stuckCounter = 0;
  const STUCK_THRESHOLD = 4;
  const CHECK_INTERVAL = 1000;
  const MAX_VIDEO_RETRY = 3; // 视频播放最大重试次数

  // 独立的卡住检测函数
  function startStuckDetection(video, onStuck) {
    console.log('开始视频卡住检测');
    
    function checkStuck() {
      try {
        const currentTime = video.currentTime;
        console.log('检测中 - 当前时间:', currentTime, '上次时间:', lastTime);
        
        if (lastTime !== null && Math.abs(lastTime - currentTime) < 0.1) {
          stuckCounter++;
          console.log('视频可能卡住，计数:', stuckCounter);
          
          if (stuckCounter >= STUCK_THRESHOLD) {
            stuckCounter = 0; // 重置卡住计数
            console.log('视频已卡住超过阈值');
            onStuck(); // 移除错误参数
          }
        } else {
          stuckCounter = 0;
        }
        lastTime = currentTime;
      } catch (e) {
        console.error('卡住检测出错:', e);
      }
    }

    // 立即执行一次检测
    checkStuck();
    
    // 启动定期检测
    stuckCheckInterval = setInterval(checkStuck, CHECK_INTERVAL);
    console.log('卡住检测定时器已启动，ID:', stuckCheckInterval);
    
    return stuckCheckInterval;
  }
  
  return new Promise((resolve, reject) => {
    console.log('开始准备播放视频...');
    
    setTimeout(() => {
      const video = document.querySelector('video');
      if (!video) {
        reject(new Error('未找到视频元素'));
        return resolve();
      }
  
      currentVideoElement = video;
      video.muted = settings.mute;
      video.playbackRate = parseFloat(settings.speed) || 1.0;
  
      const minPlayTime = 10000;
      let playTimer = null;
  
      const handleEnd = () => {
        if (stuckCheckInterval) {
          console.log('清理卡住检测定时器');
          clearInterval(stuckCheckInterval);
        }
        if (playTimer) clearTimeout(playTimer);
        currentVideoElement = null;
        console.log('视频播放完成');
        resolve();
      };
  
      const handleError = () => {
        if (stuckCheckInterval) {
          console.log('清理卡住检测定时器');
          clearInterval(stuckCheckInterval);
        }
        if (playTimer) clearTimeout(playTimer);
        errorCount++;
        console.log(`视频播放异常 (第${errorCount}次)`);
        
        if (errorCount >= MAX_VIDEO_RETRY) {
          console.log('视频播放失败次数超过限制，终止播放');
          reject(new Error('视频播放失败次数超过限制'));
          return;
        }
        
        setTimeout(() => {
          console.log('尝试重新播放视频');
          // 重置视频进度
          // video.currentTime = 0;
          video.play().catch(() => {
            handleError();
          });
  
          // 5秒后重新启动卡住检测
          setTimeout(() => {
            console.log('重新启动卡住检测');
            lastTime = null;
            stuckCounter = 0;
            startStuckDetection(video, () => {
              handleError();
            });
          }, 5000);
        }, 1000);
      };
  
      // 修改卡住检测的回调，只调用handleError
      startStuckDetection(video, () => {
        handleError(); // 只触发重试机制，不抛出异常
      });
  
      // 添加视频事件监听
      video.addEventListener('ended', handleEnd, { once: true });
      video.addEventListener('error', handleError, { once: true });
  
      const setupTimer = () => {
        const duration = video.duration;
        if (isNaN(duration) || !isFinite(duration)) {
          playTimer = setTimeout(handleEnd, minPlayTime);
          console.log(`无法获取视频时长，将播放至少${minPlayTime / 1000}秒`);
        } else {
          const actualPlayTime = Math.max(duration * 1000, minPlayTime);
          playTimer = setTimeout(handleEnd, actualPlayTime);
          console.log(`视频时长${duration}秒，将播放${actualPlayTime / 1000}秒`);
        }
      };
  
      if (video.readyState >= 1) {
        setupTimer();
      } else {
        video.addEventListener('loadedmetadata', setupTimer, { once: true });
      }
  
      console.log('开始播放视频');
      video.play().catch(err => {
        console.log('视频播放失败:', err);
        handleError();
      });
    }, 1000);
  });
}

// 完成学习按钮
async function completeLesson() {
  for (let retry = 0; retry < MAX_RETRY; retry++) {
    const button = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('完成学习'));

    if (button) {
      button.disabled = false;
      button.click();
      await new Promise(r => setTimeout(r, DELAY_AFTER_CLICK));
      return true;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

function setCompletedStatus(lessonElement) {
  if (!lessonElement) return;
  lessonElement.classList.add('complete');
  lessonElement.classList.remove('no-start');

}

// 停止执行
function stopAutoPlay() {
  console.log('正在停止自动播放...');
  isRunning = false;

  // 停止doVideo执行
  try {
    stopDoVideo();
    console.log('已停止doVideo执行');
  } catch (error) {
    console.error('停止doVideo时出错:', error);
  }

  // 停止视频播放
  if (currentVideoElement) {
    try {
      console.log('正在停止视频播放');
      currentVideoElement.pause();
      currentVideoElement.removeAttribute('src');
      currentVideoElement.load();
      
      // 移除所有事件监听器
      const videoEvents = ['ended', 'error', 'loadedmetadata', 'play'];
      videoEvents.forEach(event => {
        currentVideoElement.removeEventListener(event, () => {});
      });
      
      currentVideoElement = null;
    } catch (error) {
      console.error('停止视频播放时出错:', error);
    }
  }
  
  // 清理所有定时器
  const timers = window.setTimeout(() => {}, 0);
  for (let i = 0; i <= timers; i++) {
    window.clearTimeout(i);
  }
  
  // 清理所有定时任务
  const intervals = window.setInterval(() => {}, 0);
  for (let i = 0; i <= intervals; i++) {
    window.clearInterval(i);
  }
  
  // 关闭任务选择窗口
  try {
    const existingModal = document.querySelector('.task-modal');
    if (existingModal) {
      console.log('正在关闭任务选择窗口');
      const modalStyle = document.querySelector('style[data-for="task-modal"]');
      if (modalStyle) {
        document.body.removeChild(modalStyle);
      }
      document.body.removeChild(existingModal);
    }
  } catch (error) {
    console.error('关闭任务选择窗口时出错:', error);
  }

  // 关闭doVideo窗口
  try {
    const doVideoModal = document.querySelector('.do-video-modal');
    if (doVideoModal) {
      console.log('正在关闭doVideo窗口');
      const doVideoStyle = document.querySelector('style[data-for="do-video-modal"]');
      if (doVideoStyle) {
        document.head.removeChild(doVideoStyle);
      }
      document.body.removeChild(doVideoModal);
    }
  } catch (error) {
    console.error('关闭doVideo窗口时出错:', error);
  }

  console.log('自动播放已完全停止');
}


// 主流程
async function autoPlay(parsedData, listenRouteWarpper) {
  isRunning = true;
  console.log("视频速刷：",settings.doVideo)
  if(settings.doVideo){
    await doVideo();
    return ["success", "所有任务已完成"];
  }
  const sections = findSections();
  if (!sections.length) {
    console.log('未找到节元素');
    return ["error", "请进入 章节内容>任意课件 再尝试自动播放"];
  }

  if (!parsedData || Object.keys(parsedData).length === 0) {
    console.log('未找到数据');
    return ["error", "定位未完成课件失败,可能由于页面被刷新，正在从头排查课件"];
  }

  // 生成默认任务列表
  const defaultTasks = findTasks(parsedData);
  const taskTree = createTaskTree(parsedData, defaultTasks);

  // 显示选择弹窗
  const selectedTasks = await showTaskModal(taskTree);
  console.log(selectedTasks)
  if (!selectedTasks) {
    stopAutoPlay();
    return ["info", "用户取消任务"];
  }
  // 重组任务结构
  const taskMap = new Map();
  selectedTasks.forEach(({ sectionIndex, lessonIndex, resourceType }) => {
    if (!taskMap.has(sectionIndex)) {
      taskMap.set(sectionIndex, []);
    }
    taskMap.get(sectionIndex).push({ index: lessonIndex, resourceType });
  });

  const tasks = Array.from(taskMap.entries());
  if (!tasks.length) {
    console.log('所有任务已完成');
    return ["success", "所有任务已完成"];
  }

  // 新增：记录失败的任务
  const failedTasks = new Map();

  try {
    for (let retry = 0; retry < MAX_RETRY; retry++) {
      
    
    for (const [sectionIndex, lessons] of tasks) {
      console.log("这是一个提示：",tasks)
      if (!isRunning) break;

      listenRouteWarpper.listenRoute = false;
      sections[sectionIndex]?.click();
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_CLICKS));
      listenRouteWarpper.listenRoute = true;
      await new Promise(r => setTimeout(r, DELAY_AFTER_CLICK));

      const lessonElements = findLessons();
      console.log(lessonElements);

        // 在autoPlay函数中的相关部分
        for (const { index, resourceType } of lessons) {
          console.log('正在完成第', index, '/', lessonElements.length, '课', '资源类型:', resourceType);
          if (!isRunning) break;

          const lessonElement = lessonElements[index];
          listenRouteWarpper.listenRoute = false;
          lessonElement?.click();
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_CLICKS));
          listenRouteWarpper.listenRoute = true;
          console.log(lessonElement);
          await new Promise(r => setTimeout(r, DELAY_AFTER_CLICK));
          // 确保资源类型正确
          if (resourceType === 1) {
            console.log('开始播放视频');
            try{
              await playVideo();
              console.log('视频播放完成，继续下一步');
              // setCompletedStatus(lessonElement);
              // 更新parsedData中对应课程的状态
              // const currentSection = parsedData.data.flatMap(chapter => chapter.children)[sectionIndex];
              // if (currentSection && currentSection.children[index]) {
              //   currentSection.children[index].learnStatus = 2;
              // }
            }catch(error){
              console.log("已跳过")
              // 记录失败的任务
              if (!failedTasks.has(sectionIndex)) {
                failedTasks.set(sectionIndex, []);
              }
              failedTasks.get(sectionIndex).push({ index, resourceType });
              continue;
            }
            
            
          } else {
            console.log('处理文档类型资源');
            await completeLesson();
            // setCompletedStatus(lessonElement);
            // 更新parsedData中对应课程的状态
            // const currentSection = parsedData.data.flatMap(chapter => chapter.children)[sectionIndex];
            // if (currentSection && currentSection.children[index]) {
            //   currentSection.children[index].learnStatus = 2;
            // }
            
          }
          // 更新DOM状态和数据状态
          await new Promise(r => setTimeout(r, DELAY_AFTER_CLICK));
        }

      
    }

    // 如果没有失败的任务，退出循环
    if (failedTasks.size === 0) break;

    // 将失败的任务作为下次循环的任务
    tasks.length = 0;
    failedTasks.forEach((lessons, sectionIndex) => {
        tasks.push([sectionIndex, lessons]);
    });
    failedTasks.clear();

    console.log('开始重试失败的任务:', tasks);
  }
   } catch (error) {
      console.error('执行异常:', error);
      return ["error", "执行过程中发生异常: " + error.message];
    } finally {
      stopAutoPlay();
    }
    
    // 检查是否被用户主动停止
    if (!isRunning) {
      return ["info", "用户已停止任务"];
    }
    
    return ["success", "所有任务已完成"];
  }

export { autoPlay, stopAutoPlay };
