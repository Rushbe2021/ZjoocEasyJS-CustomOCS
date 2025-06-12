import settings from '../settings.js';

export default async function autoPlayZJLLL() {
  const findChapters = () => {
    const chapters = document.querySelectorAll('div.chapter');
    console.log('找到的章节数量:', chapters.length);
    return chapters;
  };

  // 等待指定时间
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 等待视频播放完成
  const waitForVideoComplete = () => {
    return new Promise((resolve) => {
      const checkVideo = setInterval(() => {
        const video = document.querySelector('video');
        if (!video || video.ended) {
          clearInterval(checkVideo);
          resolve();
        } else if (video) {
          // 设置视频播放速度
          video.playbackRate = parseFloat(settings.speed) || 1.0;
        }
      }, 1000);
    });
  };

  const autoPlay = async () => {
    const chapters = findChapters();
    
    for (const chapter of chapters) {
      const chapterText = chapter.textContent;
      if (!chapterText.includes('100%')) {
        console.log('开始播放章节:', chapterText);
        
        // 点击章节
        chapter.click();
        
        // 等待3秒让页面加载
        await wait(3000);
        
        // 等待视频播放完成
        await waitForVideoComplete();
        
        // 等待额外2秒确保进度保存
        await wait(2000);
      }
    }
    
    console.log('所有章节播放完成');
  };

  await autoPlay();
}