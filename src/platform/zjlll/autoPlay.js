import settings from '../../core/settings.js';

let isRunning = false;
let runId = 0;
let cancelWait = null;

export function stopAutoPlayZJLLL() {
  isRunning = false;
  if (cancelWait) cancelWait();
  const video = document.querySelector('video');
  if (video) video.pause();
}

export default async function autoPlayZJLLL() {
  const myRun = ++runId;
  isRunning = true;
  const active = () => isRunning && runId === myRun;

  const findChapters = () => {
    const chapters = document.querySelectorAll('div.chapter');
    console.log('找到的章节数量:', chapters.length);
    return chapters;
  };

  // 等待指定时间，停止时立即返回
  const wait = (ms) => new Promise(resolve => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      if (cancelWait === done) cancelWait = null;
      resolve();
    }
    cancelWait = done;
  });

  // 等待视频播放完成，停止时立即返回
  const waitForVideoComplete = () => {
    return new Promise((resolve) => {
      const checkVideo = setInterval(() => {
        const video = document.querySelector('video');
        if (!active() || !video || video.ended) {
          done();
        } else {
          // 设置视频播放速度
          video.playbackRate = parseFloat(settings.speed) || 1.0;
        }
      }, 1000);
      function done() {
        clearInterval(checkVideo);
        if (cancelWait === done) cancelWait = null;
        resolve();
      }
      cancelWait = done;
    });
  };

  const chapters = findChapters();

  for (const chapter of chapters) {
    if (!active()) break;
    const chapterText = chapter.textContent;
    if (!chapterText.includes('100%')) {
      console.log('开始播放章节:', chapterText);

      // 点击章节
      chapter.click();

      // 等待3秒让页面加载
      await wait(3000);
      if (!active()) break;

      // 等待视频播放完成
      await waitForVideoComplete();
      if (!active()) break;

      // 等待额外2秒确保进度保存
      await wait(2000);
    }
  }

  if (active()) {
    isRunning = false;
    console.log('所有章节播放完成');
    return ["success", "所有章节播放完成"];
  }
  return ["info", "已停止自动播放"];
}
