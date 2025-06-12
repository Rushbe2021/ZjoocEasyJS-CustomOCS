import settings from './settings';
import styles from './styles.css';
import { imageData } from './utils/imageBase64.js';
import insertIntoDeepestElement from './utils/insertElement.js';
import createFloatingImageWorld from './utils/floatPic.js';
import fixBlankPage from './utils/fixBlankPage.js';
import { autoPlay, stopAutoPlay } from './utils/autoPlay.js';
import { createButton, toggleButtonState } from './components/button.js';
import loadFont from './utils/loadFont.js';
import createPushButton from './components/saveButton.js';
import insertButtonAndFetchContent from './utils/createDeepSeekButton.js';
import { checkAndDownload } from './download.js';
import { showConfirmDialog } from './utils/dialog.js';
import autoPlayZJLLL from './utils/autoPlayZJLLL.js';
(function () {

    loadFont('SmileySans-Oblique', 'https://fastly.jsdelivr.net/gh/Miaozeqiu/fontRepository/SmileySans-Oblique.ttf.ec5470fd.woff2').then(success => {
        if (success) {
            // 字体加载完成后执行操作
            document.body.style.fontFamily = 'SmileySans-Oblique, sans-serif';
        }
    });
    const LoggedWarpper = { Logged: false, code: '' };
    var CourseChapters = {}
    var isPlaying = false;
    var stopAnimation

    const listenRouteWarpper = { listenRoute: true };
    'use strict';

    if (window.top != window) {
        console.log('当前脚本在iframe中执行，窗口不渲染');
        return;
    };

    // 创建 <style> 元素
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = styles;
    // 假设文件名是 "example.txt"

    // 将 <style> 添加到 <head> 中
    document.head.appendChild(style);
    var originalJson = {};
    let showAnswer = false;

    // 初始化时从localStorage载入配置

    function copyText(element) {
        const range = document.createRange();
        range.selectNode(element);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        try {
            document.execCommand('copy');
            displaySuccessNotification('复制成功', '😀')
        } catch (err) {
            alert('复制失败');
        }
        window.getSelection().removeAllRanges();
    }
    try {
        unsafeWindow.copyText = copyText;
    } catch (e) {
        window.copyText = copyText;
    }

    // 获取浮动窗口的位置
    function getWindowPosition() {

        const position = settings.position;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // 如果位置超出屏幕范围，返回默认位置
        if (position &&
            position.left >= 0 &&
            position.top >= 0 &&
            position.left <= screenWidth &&
            position.top <= screenHeight) {
            return position;
        }
        return { left: 10, top: 10 }; // 默认位置
    }


    // 创建浮动窗口元素
    const windowDiv = document.createElement('div');
    windowDiv.id = 'scriptWindow';

    const initialPosition = getWindowPosition();
    windowDiv.style.left = `${initialPosition.left}px`;
    windowDiv.style.top = `${initialPosition.top}px`;

    // 创建header
    const header = document.createElement('div');
    header.id = 'window-header'
    const zzxLogo = document.createElement('img')
    zzxLogo.src = imageData['zzxLogo']
    zzxLogo.style.width = '20px'

    const titleText = document.createElement('span')
    titleText.innerHTML = 'ZE网课助手 v2.1.1';
    titleText.style.marginLeft = '10px'

    const title = document.createElement('div')
    title.style.display = 'flex'

    title.appendChild(zzxLogo)
    title.appendChild(titleText)

    header.appendChild(title)

    // 创建最小化按钮
    const minimizeButton = document.createElement('button');
    minimizeButton.style.backgroundColor = 'transparent';
    minimizeButton.style.border = 'none';
    minimizeButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path d="M0 0h24v24H0V0z" fill="none"></path>
              <path d="M19 13H5v-2h14v2z" fill="white"></path>
          </svg>
      `;
    minimizeButton.style.cursor = 'pointer';
    header.appendChild(minimizeButton);

    // 创建主体容器
    const contentDiv = document.createElement('div');
    contentDiv.style.display = 'flex';
    contentDiv.style.height = 'calc(100% - 40px)';

    // 创建导航栏
    const navBar = document.createElement('div');
    navBar.id = 'window-navBar'

    // 创建示例页面链接
    const pages = ['🏠', '⚙️'];

    pages.forEach(page => {
        const pageLink = document.createElement('div');
        pageLink.id = 'window-pageLink';
        pageLink.textContent = page;
        pageLink.addEventListener('click', () => {
            if (page === '⚙️') {
                renderSettingsPage();
            } else if (page === '🏠') {
                renderHomePage();
            } else if (page === '在线搜题') {
                //renderWebPage();
            }
            else {
                displayArea.innerHTML = page + ' 内容';
            }
        });
        pageLink.addEventListener('mouseenter', () => {
            pageLink.style.backgroundColor = '#51AFEF';
            pageLink.style.color = '#fff';
        });
        pageLink.addEventListener('mouseleave', () => {
            pageLink.style.backgroundColor = 'transparent';
            pageLink.style.color = '#333';
        });
        navBar.appendChild(pageLink);
    });

    // 创建内容显示区域
    const displayArea = document.createElement('div');
    displayArea.style.flex = '1';
    displayArea.style.padding = '10px';
    displayArea.innerHTML = '内容显示';

    // 组装元素
    contentDiv.appendChild(navBar);
    contentDiv.appendChild(displayArea);
    windowDiv.appendChild(header);
    windowDiv.appendChild(contentDiv);
    document.body.appendChild(windowDiv);

    let isMinimized = false;

    // 最小化/还原功能
    minimizeButton.addEventListener('click', () => {
        if (!isMinimized) {
            contentDiv.style.display = 'none';
            windowDiv.style.height = '50px';
            minimizeButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path d="M0 0h24v24H0V0z" fill="none"></path>
              <path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H6V6h12v12z" fill="white"></path>
          </svg>
      `;
        } else {
            contentDiv.style.display = 'flex';
            windowDiv.style.height = '400px';
            minimizeButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path d="M0 0h24v24H0V0z" fill="none"></path>
              <path d="M19 13H5v-2h14v2z" fill="white"></path>
          </svg>
      `;
        }
        isMinimized = !isMinimized;
    });

    // 拖动功能
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - windowDiv.offsetLeft;
        offsetY = e.clientY - windowDiv.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (isDragging) {
            const windowWidth = windowDiv.offsetWidth;
            const windowHeight = windowDiv.offsetHeight;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            // 计算新的位置
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // 限制左侧边界
            if (newLeft < 0) {
                newLeft = 0;
            }
            // 限制右侧边界
            if (newLeft + windowWidth > screenWidth) {
                newLeft = screenWidth - windowWidth;
            }
            // 限制顶部边界
            if (newTop < 0) {
                newTop = 0;
            }
            // 限制底部边界
            if (newTop + windowHeight > screenHeight) {
                newTop = screenHeight - windowHeight;
            }

            // 设置新位置
            windowDiv.style.left = `${newLeft}px`;
            windowDiv.style.top = `${newTop}px`;
        }
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const newPosition = {
            left: windowDiv.offsetLeft,
            top: windowDiv.offsetTop,
        };
        settings.position = newPosition;

    }

    function toggleMute() {
        const videoElement = document.querySelector('video');
        // 通过 .switch 找到包含复选框的父元素
        const muteLabel = document.querySelector('.switch');

        // 在 .switch 中找到复选框
        const muteCheckbox = muteLabel ? muteLabel.querySelector('input[type="checkbox"]') : null;
        if (videoElement) { // 确保视频元素存在
            videoElement.muted = muteCheckbox.checked; // 根据复选框状态设置视频的静音
        }

        // 更新静音状态到 localStorage
        settings.mute = muteCheckbox.checked;

    }

    function setVideoSpeed(speed) {
        const videoElement = document.querySelector('video'); // 获取视频元素

        // 确保视频元素存在，并且speed值有效
        if (videoElement && speed) {
            // 设置视频播放速度
            videoElement.playbackRate = parseFloat(speed); // 转换为浮动数值，例如 1.5, 2, 0.5 等
        }
        // 更新速度到 localStorage
        settings.speed = speed;

    }

    function applySwitchStyles() {
        // 获取所有的 switch 元素
        const switches = document.querySelectorAll('.switch');

        // 遍历每一个 switch 元素，应用样式
        switches.forEach(switchElement => {
            const checkbox = switchElement.querySelector('.checkbox');
            const slider = switchElement.querySelector('.slider');

            // 隐藏 checkbox
            checkbox.style.display = 'none';

            // 设置 slider 样式
            slider.style.width = '60px';
            slider.style.height = '30px';
            slider.style.backgroundColor = 'lightgray';
            slider.style.borderRadius = '20px';
            slider.style.overflow = 'hidden';
            slider.style.display = 'flex';
            slider.style.alignItems = 'center';
            slider.style.border = '4px solid transparent';
            slider.style.transition = '.3s';
            slider.style.cursor = 'pointer';
            slider.style.position = 'relative';

            // 设置 slider::before 样式
            const before = document.createElement('div');
            before.style.content = '""';
            before.style.width = '100%';
            before.style.height = '100%';
            before.style.backgroundColor = '#fff';
            before.style.transform = 'translateX(-30px)';
            before.style.borderRadius = '20px';
            before.style.transition = '.3s';
            before.style.position = 'absolute';
            slider.appendChild(before);

            // 监听 checkbox 状态变化，控制样式
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    slider.style.backgroundColor = '#2196F3';
                    before.style.transform = 'translateX(30px)';
                } else {
                    slider.style.backgroundColor = 'lightgray';
                    before.style.transform = 'translateX(-30px)';
                }
            });

            // 点击状态时调整样式
            slider.addEventListener('mousedown', () => {
                if (!checkbox.checked) {
                    before.style.transform = 'translateX(0)';
                }
            });

            slider.addEventListener('mouseup', () => {
                if (checkbox.checked) {
                    before.style.transform = 'translateX(30px)';
                }
            });

            // 初始化状态：根据 checkbox 的初始状态调整样式
            if (checkbox.checked) {
                slider.style.backgroundColor = '#2196F3';
                before.style.transform = 'translateX(30px)';
            }
        });
    }

    // 设置页面
    function renderSettingsPage() {
        displayArea.innerHTML = '';

        const userInfoContainer = document.createElement('div');
        userInfoContainer.setAttribute('id', 'userInfoContainer');
        userInfoContainer.style.display = 'flex';
        userInfoContainer.style.marginBottom = '10px';

        const userInfo = document.createElement('div');
        const avatarContainer = document.createElement('div');
        avatarContainer.setAttribute('id', 'avatarContainer');

        // 创建 svg 元素
        const avatar = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        avatar.setAttribute('t', '1734414003129');
        avatar.setAttribute('class', 'icon');
        avatar.setAttribute('viewBox', '0 0 1024 1024');
        avatar.setAttribute('version', '1.1');
        avatar.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        avatar.setAttribute('p-id', '15777');
        avatar.setAttribute('width', '132');
        avatar.setAttribute('height', '132');

        // 创建第一个路径元素
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M511.990738 510.660058H1.33068A510.660058 510.660058 0 1 0 511.990738 0 510.660058 510.660058 0 0 0 1.33068 510.660058z');
        path1.setAttribute('fill', '#23a3f8');
        path1.setAttribute('p-id', '15778');

        // 创建第二个路径元素
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path2.setAttribute('d', 'M496.041101 430.881001h31.917798v95.753392h-31.917798z');
        path2.setAttribute('fill', '#F4BAC2');
        path2.setAttribute('p-id', '15779');

        // 创建第三个路径元素
        const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path3.setAttribute('d', 'M287.41840599 469.33024634a223.418406 223.418406 0 1 0 223.418407-223.418407L287.41840599 245.91183934z');
        path3.setAttribute('fill', '#FFFFFF');
        path3.setAttribute('p-id', '15780');

        // 创建第四个路径元素
        const path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path4.setAttribute('d', 'M506.96055065 494.698072a15.078983 15.078983 0 0 1-15.955811-15.955812L491.00473965 414.919015a15.955811 15.955811 0 0 1 31.917797 0l0 63.835595a15.078983 15.078983 0 0 1-15.961986 15.943462z m111.709203-1e-8a15.078983 15.078983 0 0 1-15.955811-15.95581199L602.71394265 414.919015a15.955811 15.955811 0 0 1 31.917798 0l0 63.835595a15.078983 15.078983 0 0 1-15.961987 15.94346199z');
        path4.setAttribute('fill', '#23a3f8');
        path4.setAttribute('p-id', '15781');

        // 创建第五个路径元素
        const path5 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path5.setAttribute('d', 'M208.256063 921.250504c0-122.879506 101.069937-187.165865 223.949444-187.165865h159.582811c122.879506 0 222.072289 65.453405 222.07229 188.332911 0 0-109.486257 101.934416-300.097688 101.563925s-305.506856-102.730972-305.506857-102.730971z');
        path5.setAttribute('fill', '#FFFFFF');
        path5.setAttribute('p-id', '15782');

        // 将路径元素添加到 svg 元素中
        avatar.appendChild(path1);
        avatar.appendChild(path2);
        avatar.appendChild(path3);
        avatar.appendChild(path4);
        avatar.appendChild(path5);

        // 将 svg 添加到页面中
        document.body.appendChild(avatar);
        avatar.setAttribute('id', 'avatar');
        avatar.style.width = '40px';
        avatar.style.height = '40px';
        avatar.style.marginLeft = '10px';
        userInfo.appendChild(avatar);

        const userTextContainer = document.createElement('div');
        userTextContainer.setAttribute('id', 'userTextContainer');
        userTextContainer.style.display = 'flex';
        userTextContainer.style.flexDirection = 'column';
        userTextContainer.style.marginLeft = '10px';

        const username = document.createElement('span');
        username.textContent = settings.username;
        username.style.fontSize = '16px';
        username.style.fontWeight = 'bold';
        username.setAttribute('id', 'username');
        userTextContainer.appendChild(username);

        const createTime = document.createElement('span');
        createTime.setAttribute('id', 'createTime');
        createTime.textContent = settings.createTime + '注册';
        userTextContainer.appendChild(createTime);

        const uaerDataContainer = document.createElement('div');
        uaerDataContainer.setAttribute('id', 'uaerDataContainer');

        if (!LoggedWarpper.Logged) {
            userInfoContainer.style.display = 'none';
        } else {
            userInfoContainer.style.display = 'flex';
        }

        userInfoContainer.appendChild(userInfo);
        userInfoContainer.appendChild(userTextContainer);
        displayArea.appendChild(userInfoContainer);


        const imgContainer = document.createElement('div');
        imgContainer.setAttribute('id', 'imgContainer');
        if (LoggedWarpper.Logged) {
            imgContainer.style.display = 'none';
        } else {
            imgContainer.style.display = 'flex';
        }
        imgContainer.style.width = '100%';
        imgContainer.style.marginBottom = '20px';
        const imge = document.createElement('img');
        imge.src = imageData['weChatQr'];
        imge.style.width = '50%';
        imgContainer.appendChild(imge);

        const rightContainer = document.createElement('div');
        rightContainer.style.width = '50%';
        rightContainer.style.alignContent = 'center';
        rightContainer.style.justifyItems = 'center';
        // rightContainer.style.backgroundColor = '#e8e8e8';

        const instructions = document.createElement('instructions');
        const span1 = document.createElement('span');
        const fingerImg = document.createElement('img');
        fingerImg.src = imageData['fingerEmoji'];
        fingerImg.style.width = '16.8px';
        instructions.appendChild(fingerImg);
        span1.innerHTML = '关注公众号';
        span1.style.fontFamily = 'SmileySans-Oblique, sans-serif';
        span1.style.fontSize = '12px';


        const span2 = document.createElement('span');
        span2.innerHTML = '未耕之地';
        span2.style.color = '#03a9f5';
        span2.style.fontFamily = 'SmileySans-Oblique, sans-serif';
        span2.style.fontSize = '12px';

        const div2 = document.createElement('div');

        const span3 = document.createElement('span');
        span3.innerHTML = '发送验证码完成登录';
        span3.style.fontFamily = 'SmileySans-Oblique, sans-serif';
        span3.style.fontSize = '12px';
        div2.appendChild(span3);

        instructions.appendChild(span1);
        instructions.appendChild(span2);
        instructions.appendChild(div2);

        const text = document.createElement('p');
        text.innerHTML = '验证码：';
        text.style.fontFamily = 'SmileySans-Oblique, sans-serif';
        const btn = createButton('点击生成', async () => {
            await toggleButtonState(btn, true, LoggedWarpper);
        });
        if (LoggedWarpper.code) {
            const iconContainer = btn.querySelector('.icon');
            btn.classList.add('loading');
            iconContainer.innerHTML = `<div class="VerificationCode">${LoggedWarpper.code}<div>`;
            btn.disabled = true;
        }
        rightContainer.appendChild(instructions)
        rightContainer.appendChild(text);
        rightContainer.appendChild(btn);
        imgContainer.appendChild(rightContainer);

        // 将元素添加到 displayArea
        displayArea.appendChild(imgContainer);

        // 创建“视频静音”按钮
        const examModeLabel = document.createElement('label');
        examModeLabel.classList.add('switch');

        const examModeCheckbox = document.createElement('input');
        examModeCheckbox.type = 'checkbox';
        examModeCheckbox.classList.add('checkbox');
        examModeCheckbox.classList.add('examMode');

        const sliderDiv = document.createElement('div');
        sliderDiv.classList.add('slider');



        // 创建静音文本
        const examModeText = document.createElement('span');
        examModeText.textContent = '考试模式';
        examModeText.style.whiteSpace = 'nowrap';
        examModeText.style.marginRight = '112px'; // 给文字和开关之间添加间距

        // 包装文字和静音开关的容器
        const examModeWrapper = document.createElement('div');
        examModeWrapper.style.display = 'flex';
        examModeWrapper.style.width = '89%'; // 宽度设置为100%
        examModeWrapper.style.alignItems = 'center'; // 对齐方式设置为垂直居中
        examModeWrapper.style.justifyContent = 'flex-start'; // 靠左对齐
        examModeWrapper.style.marginTop = '8px'; // 添加上方间隔
        examModeWrapper.style.marginBottom = '0px'; // 添加下方间隔
        examModeWrapper.appendChild(examModeText);
        examModeWrapper.appendChild(examModeLabel);

        // 设置考试模式开关的初始状态
        examModeCheckbox.checked = settings.examMode;
        examModeCheckbox.addEventListener('change', toggleExamMode);
        examModeLabel.appendChild(examModeCheckbox);
        examModeLabel.appendChild(sliderDiv);


        // 创建“DeepSeekProxy”按钮
        const DeepSeekProxyLabel = document.createElement('label');
        DeepSeekProxyLabel.classList.add('switch');

        const DeepSeekProxyCheckbox = document.createElement('input');
        DeepSeekProxyCheckbox.type = 'checkbox';
        DeepSeekProxyCheckbox.classList.add('checkbox');
        DeepSeekProxyCheckbox.classList.add('examMode');

        const sliderDiv2 = document.createElement('div');
        sliderDiv2.classList.add('slider');

        DeepSeekProxyLabel.appendChild(DeepSeekProxyCheckbox);
        DeepSeekProxyLabel.appendChild(sliderDiv2);

        // 创建静音文本
        const DeepSeekProxyText = document.createElement('span');
        DeepSeekProxyText.textContent = '本地AI';
        DeepSeekProxyText.style.whiteSpace = 'nowrap';
        DeepSeekProxyText.style.marginRight = '0px'; // 给文字和开关之间添加间距

        // 包装文字和静音开关的容器
        const DeepSeekProxyWrapper = document.createElement('div');
        DeepSeekProxyWrapper.setAttribute('id', 'DeepSeekProxyWrapper');
        DeepSeekProxyWrapper.style.display = 'flex';
        DeepSeekProxyWrapper.style.width = '89%'; // 宽度设置为100%
        DeepSeekProxyWrapper.style.alignItems = 'center'; // 对齐方式设置为垂直居中
        DeepSeekProxyWrapper.style.justifyContent = 'flex-start'; // 靠左对齐
        DeepSeekProxyWrapper.style.marginBottom = '0px'; // 添加下方间隔
        DeepSeekProxyWrapper.appendChild(DeepSeekProxyText);
        const questionMark = document.createElement('div');
        questionMark.addEventListener('click', () => {
            window.open('https://pages.zaizhexue.top/home/DeepSeek');
        });
        questionMark.classList.add('question-mark');
        questionMark.innerHTML = '<svg t="1741083582512" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5218" width="20" height="20"><path d="M512 981.3C253.2 981.3 42.7 770.8 42.7 512S253.2 42.7 512 42.7 981.3 253.2 981.3 512 770.8 981.3 512 981.3z m0-853.3c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z" fill="#BDBDBD" p-id="5219"></path><path d="M512 640c-23.6 0-42.7-19.1-42.7-42.7 0-53.5 28.7-101.8 74.8-126.2 22.9-12.1 42.6-40.4 35.1-76.2-5.4-25.7-26.2-46.6-51.9-51.9-21.4-4.5-42.3 0.4-58.7 13.8-16.2 13.2-25.5 32.6-25.5 53.5 0 23.6-19.1 42.7-42.7 42.7s-42.7-19.1-42.7-42.7c0-46.6 20.8-90.2 57-119.7 36.2-29.4 83.6-40.8 129.9-31.1 58.4 12.2 105.9 59.6 118.1 118.1 14.3 68.6-17.3 136.6-78.8 169-18.1 9.6-29.4 29.1-29.4 50.8 0.2 23.5-18.9 42.6-42.5 42.6z" fill="#BDBDBD" p-id="5220"></path><path d="M512 725.3m-42.7 0a42.7 42.7 0 1 0 85.4 0 42.7 42.7 0 1 0-85.4 0Z" fill="#BDBDBD" p-id="5221"></path></svg>';
        questionMark.style.marginLeft = '4px';
        questionMark.style.marginRight = '103px';
        DeepSeekProxyWrapper.appendChild(questionMark);
        DeepSeekProxyWrapper.appendChild(DeepSeekProxyLabel);

        // 设置考试模式开关的初始状态
        DeepSeekProxyCheckbox.checked = settings.deepseekProxy;
        console.log("deepseekProxy", settings.deepseekProxy)
        DeepSeekProxyCheckbox.addEventListener('change', () => {
            if (settings.deepseekProxy) {
                settings.deepseekProxy = false;
            } else {
                settings.deepseekProxy = true;
                
                checkAndDownload();
            }

        });


        displayArea.appendChild(DeepSeekProxyWrapper);


        // 创建“DeepSeekProxy”按钮
        const DoVideoLabel = document.createElement('label');
        DoVideoLabel.classList.add('switch');

        const DoVideoCheckbox = document.createElement('input');
        DoVideoCheckbox.type = 'checkbox';
        DoVideoCheckbox.classList.add('checkbox');
        DoVideoCheckbox.classList.add('dovideo');

        const sliderDiv3 = document.createElement('div');
        sliderDiv3.classList.add('slider');

        DoVideoLabel.appendChild(DoVideoCheckbox);
        DoVideoLabel.appendChild(sliderDiv3);

        // 创建静音文本
        const DoVideoText = document.createElement('span');
        DoVideoText.textContent = '课件速刷';
        DoVideoText.style.whiteSpace = 'nowrap';
        DoVideoText.style.marginRight = '0px'; // 给文字和开关之间添加间距

        // 包装文字和静音开关的容器
        const DoVideoWrapper = document.createElement('div');
        DoVideoWrapper.setAttribute('id', 'DoVideoWrapper');
        DoVideoWrapper.style.display = 'flex';
        DoVideoWrapper.style.width = '89%'; // 宽度设置为100%
        DoVideoWrapper.style.alignItems = 'center'; // 对齐方式设置为垂直居中
        DoVideoWrapper.style.justifyContent = 'flex-start'; // 靠左对齐
        DoVideoWrapper.style.marginBottom = '0px'; // 添加下方间隔
        DoVideoWrapper.style.marginTop = '8px'; // 添加下方间隔
        DoVideoWrapper.appendChild(DoVideoText);
        const questionMark2 = document.createElement('div');
        questionMark2.addEventListener('click', () => {
            window.open('https://pages.zaizhexue.top/home/QuickCoursewareBrowsing');
        });
        questionMark2.classList.add('question-mark');
        questionMark2.innerHTML = '<svg t="1741083582512" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5218" width="20" height="20"><path d="M512 981.3C253.2 981.3 42.7 770.8 42.7 512S253.2 42.7 512 42.7 981.3 253.2 981.3 512 770.8 981.3 512 981.3z m0-853.3c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z" fill="#BDBDBD" p-id="5219"></path><path d="M512 640c-23.6 0-42.7-19.1-42.7-42.7 0-53.5 28.7-101.8 74.8-126.2 22.9-12.1 42.6-40.4 35.1-76.2-5.4-25.7-26.2-46.6-51.9-51.9-21.4-4.5-42.3 0.4-58.7 13.8-16.2 13.2-25.5 32.6-25.5 53.5 0 23.6-19.1 42.7-42.7 42.7s-42.7-19.1-42.7-42.7c0-46.6 20.8-90.2 57-119.7 36.2-29.4 83.6-40.8 129.9-31.1 58.4 12.2 105.9 59.6 118.1 118.1 14.3 68.6-17.3 136.6-78.8 169-18.1 9.6-29.4 29.1-29.4 50.8 0.2 23.5-18.9 42.6-42.5 42.6z" fill="#BDBDBD" p-id="5220"></path><path d="M512 725.3m-42.7 0a42.7 42.7 0 1 0 85.4 0 42.7 42.7 0 1 0-85.4 0Z" fill="#BDBDBD" p-id="5221"></path></svg>';
        questionMark2.style.marginLeft = '4px';
        questionMark2.style.marginRight = '88px';
        DoVideoWrapper.appendChild(questionMark2);
        DoVideoWrapper.appendChild(DoVideoLabel);

        // 设置考试模式开关的初始状态
        DoVideoCheckbox.checked = settings.doVideo;
        DoVideoCheckbox.addEventListener('change', async function () {
            console.log(DoVideoCheckbox);
            if(!settings.doVideo) {
            const result = await showConfirmDialog(`不建议开启，关闭该选项也可以使用"自动播放"挂课，但开启后的"自动播放"将使用速刷软件在几秒内完成所有课件，这意味着有清空分数的风险，以及需要下载额外的软件（ZError），因此除非正常刷课时间来不及了，否则不建议开启！<br>注意:你在软件中开启服务后，需要关闭该选项，再次打开以进行登录`);
                if (!result) {
                    console.log('取消开启');
                    renderSettingsPage();
                    return;
                }
            }
            // 检测是否从关闭变为开启
            if (!settings.doVideo && this.checked) {
                settings.doVideo = true;
                const ServerLive = await checkAndDownload();
                if(!ServerLive){
                    return;
                }
                // 创建一个新的窗口
                const windowWidth = 600;
                const windowHeight = 300;

                // 获取屏幕宽度和高度
                const screenWidth = window.screen.width;
                const screenHeight = window.screen.height;

                // 计算弹出窗口的左上角位置，使其居中
                const left = (screenWidth - windowWidth) / 2;
                const top = (screenHeight - windowHeight) / 2;

                // 打开窗口并设置位置
                const loginWindow = window.open('', 'login', `width=${windowWidth},height=${windowHeight},left=${left},top=${top}`);

                // 插入HTML内容
                loginWindow.document.write(`
                    <html>
                        <head>
                            <title>登录</title>
                            <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                .container { text-align: center; }
                                input { margin: 10px; padding: 5px; }
                                button { padding: 5px 15px; }
                                button:disabled { opacity: 0.6; cursor: not-allowed; }
                                select { margin: 10px; padding: 5px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h2>请输入在浙学的账号和密码</h2>
                                
                                <select id="usernameSelect" onchange="loadUsername()">
                                    <option value="">选择之前登录的账号</option>
                                </select>
                                <br>
                                <input type="text" id="username" placeholder="用户名">
                                <br>
                                <input type="password" id="password" placeholder="密码">
                                <br>
                                <button id="loginBtn" onclick="login()">确定</button>
                                <button onclick="deleteAccount()">删除账号</button>
                            </div>
                            <script>
                                // 从localStorage加载账号信息
function loadUsername() {
                    const selectedUsername = document.getElementById('usernameSelect').value;
                    if (selectedUsername) {
                        document.getElementById('username').value = selectedUsername;
                        const storedData = JSON.parse(localStorage.getItem('accounts')) || [];
                        const account = storedData.find(acc => acc.username === selectedUsername);
                        if (account) {
                            document.getElementById('password').value = account.password;
                        }
                    }
                }

                // 加载之前保存的账号
                function loadSavedAccounts() {
                    const storedAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
                    const selectElement = document.getElementById('usernameSelect');
                    selectElement.innerHTML = '<option value="">选择之前登录的账号</option>';  // 清空现有的选项
                    storedAccounts.forEach(account => {
                        const option = document.createElement('option');
                        if(account.username){
                            option.value = account.username;
                            option.textContent = account.username;
                            selectElement.appendChild(option);
                        }
                    });
                }

                // 删除账号
                function deleteAccount() {
                    const selectedUsername = document.getElementById('usernameSelect').value;
                    if (!selectedUsername) {
                        alert('请先选择一个账号进行删除');
                        return;
                    }
                    
                    let storedAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
                    storedAccounts = storedAccounts.filter(account => account.username !== selectedUsername);
                    localStorage.setItem('accounts', JSON.stringify(storedAccounts));
                    loadSavedAccounts();
                    document.getElementById('username').value = '';
                    document.getElementById('password').value = '';
                    alert('账号已删除');
                }
                
                                // 登录
                                function login() {
                                    const username = document.getElementById('username').value;
                                    const password = document.getElementById('password').value;
                                    const loginBtn = document.getElementById('loginBtn');
                                    
                                    // 禁用登录按钮
                                    loginBtn.disabled = true;
                                    loginBtn.textContent = '登录中...';
                                    
                                    // 发送POST请求
                                    const xhr = new XMLHttpRequest();
                                    xhr.open('POST', 'http://localhost:5233/courseware', true);
                                    
                                    // 设置请求头
                                    xhr.setRequestHeader('Content-Type', 'application/json');
                                    
                                    // 处理响应
                                    xhr.onload = function() {
                                        if (xhr.status === 200) {
                                            const response = JSON.parse(xhr.responseText);
                                            if (response.status === 'success') {
                                                alert('登录成功');
                                                
                                                // 保存当前登录的用户名到localStorage
                                                localStorage.setItem('currentUser', username);
                
                                                // 保存账号和密码到localStorage中的一个专门的数组中
                                                let storedAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
                                                const existingAccount = storedAccounts.find(account => account.username === username);
                                                if (!existingAccount) {
                                                    storedAccounts.push({ username: username, password: password });
                                                    localStorage.setItem('accounts', JSON.stringify(storedAccounts));
                                                }
                
                                                loadSavedAccounts();
                                                window.close();
                                            } else {
                                                alert('处理失败：' + response.message);
                                                // 恢复按钮状态
                                                loginBtn.disabled = false;
                                                loginBtn.textContent = '确定';
                                            }
                                        } else {
                                            alert('请求失败，请检查账号密码，状态码：' + xhr.status);
                                            // 恢复按钮状态
                                            loginBtn.disabled = false;
                                            loginBtn.textContent = '确定';
                                        }
                                    };
                                    
                                    xhr.onerror = function() {
                                        alert('网络错误，请求失败，请检查软件服务是否开启');
                                        // 恢复按钮状态
                                        loginBtn.disabled = false;
                                        loginBtn.textContent = '确定';
                                    };
                                    
                                    // 发送数据
                                    const data = { username: username, password: password };
                                    xhr.send(JSON.stringify(data));
                                }
                
                                // 页面加载时加载保存的账号
                                window.onload = function() {
                                    loadSavedAccounts();
                                }
                            </script>
                        </body>
                    </html>
                `);     

                // 确保在写入后关闭document.write
                loginWindow.document.close();
            } else {
                settings.doVideo = this.checked;
            }
        });



        displayArea.appendChild(DoVideoWrapper);



        const apiSettingText = document.createElement('span');
        apiSettingText.textContent = 'DeepSeek API Key';
        apiSettingText.style.fontFamily = 'SmileySans-Oblique, sans-serif';
        apiSettingText.style.fontSize = '14px';
        apiSettingText.style.paddingBottom = '10px'; // 给文字和开关之间添加间距
        const apiSettingText2 = document.createElement('span');
        apiSettingText2.textContent = '(可选,用于AI解析)';
        apiSettingText2.style.fontFamily = 'SmileySans-Oblique, sans-serif';
        apiSettingText2.style.color = '#888';


        const apiSettingContainer = document.createElement('div');
        apiSettingContainer.setAttribute('id', 'apiSettingContainer');
        apiSettingContainer.style.display = 'flex';
        apiSettingContainer.style.alignContent = 'center';

        const deepSeekApiKey = document.createElement('input');
        deepSeekApiKey.type = 'text';
        deepSeekApiKey.style.width = '100%';
        deepSeekApiKey.style.padding = '8px';
        deepSeekApiKey.style.marginRight = '4px';
        deepSeekApiKey.style.boxSizing = 'border-box';
        deepSeekApiKey.style.border = '2px solid #ccc';
        deepSeekApiKey.style.borderRadius = '8px';
        deepSeekApiKey.style.fontSize = '16px';
        deepSeekApiKey.style.outline = 'none'; // 移除默认 outline，下面我们会自定义聚焦颜色
        deepSeekApiKey.value = settings.deepseekApiKey;

        // 添加聚焦时的样式变化
        deepSeekApiKey.addEventListener('focus', () => {
            deepSeekApiKey.style.border = '2px solid #4A90E2'; // 聚焦时改变边框颜色
        });

        deepSeekApiKey.addEventListener('blur', () => {
            deepSeekApiKey.style.border = '2px solid #ccc'; // 失去焦点时恢复边框颜色
        });

        // 创建保存按钮
        // 示例使用
        const saveButton = createPushButton({
            className: 'save-btn large',
            text: '保存',
            onClick: () => settings.deepseekApiKey = deepSeekApiKey.value,
        });

        apiSettingContainer.appendChild(deepSeekApiKey);
        apiSettingContainer.appendChild(saveButton);



        displayArea.appendChild(examModeWrapper);


        applySwitchStyles();
    }

    function renderHomePage() {
        displayArea.innerHTML = '';

        // 创建按钮容器 div
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column'; // 按钮垂直排列

        buttonContainer.style.justifyContent = 'flex-start'; // 靠左对齐
        buttonContainer.style.gap = '20px'; // 按钮之间的间距
        buttonContainer.style.marginTop = '20px'; // 给容器添加顶部间距

        // 创建“显示答案”按钮
        const showAnswerButton = document.createElement('button');
        if (!showAnswer) {
            showAnswerButton.textContent = '显示答案';
        } else {
            showAnswerButton.textContent = '隐藏答案';
        }
        showAnswerButton.classList.add('showAnswerButton');

        // 应用你提供的按钮样式
        showAnswerButton.style.padding = '12.5px 30px';
        showAnswerButton.style.border = '0';
        showAnswerButton.style.borderRadius = '10px';
        showAnswerButton.style.marginLeft = '10px';
        showAnswerButton.style.marginRight = '10px';
        showAnswerButton.style.backgroundColor = '#2ba8fb';
        showAnswerButton.style.color = '#ffffff';
        showAnswerButton.style.fontWeight = 'Bold';
        showAnswerButton.style.transition = 'all 0.2s';
        showAnswerButton.style.webkitTransition = 'all 0.2s';

        showAnswerButton.addEventListener('click', async () => {
            await toggleModifiedElements();
        });

        // 鼠标悬浮时的效果
        showAnswerButton.addEventListener('mouseenter', () => {
            showAnswerButton.style.backgroundColor = '#6fc5ff';
            showAnswerButton.style.boxShadow = '0 0 20px #6fc5ff50';
            showAnswerButton.style.transform = 'scale(1.1)';
        });
        showAnswerButton.addEventListener('mouseleave', () => {
            showAnswerButton.style.backgroundColor = '#2ba8fb';
            showAnswerButton.style.boxShadow = 'none';
            showAnswerButton.style.transform = 'scale(1)';
        });

        // 修复按钮点击时的效果
        showAnswerButton.addEventListener('mousedown', () => {
            showAnswerButton.style.transform = 'scale(0.98)';
        });
        showAnswerButton.addEventListener('mouseup', () => {
            showAnswerButton.style.transform = 'scale(1.1)';
        });

        // 创建“初始化同步”按钮
        const syncButton = document.createElement('button');
        syncButton.textContent = '解除复制限制';

        // 应用相同的按钮样式
        syncButton.style.padding = '12.5px 30px';
        syncButton.style.border = '0';
        syncButton.style.borderRadius = '10px';
        syncButton.style.marginLeft = '10px';
        syncButton.style.marginRight = '10px';
        syncButton.style.backgroundColor = '#2ba8fb';
        syncButton.style.color = '#ffffff';
        syncButton.style.fontWeight = 'Bold';
        syncButton.style.transition = 'all 0.2s';
        syncButton.style.webkitTransition = 'all 0.2s';

        // 为“初始化同步”按钮添加点击事件
        syncButton.addEventListener('click', initializeEditorSync);

        // 鼠标悬浮时的效果
        syncButton.addEventListener('mouseenter', () => {
            syncButton.style.backgroundColor = '#6fc5ff';
            syncButton.style.boxShadow = '0 0 20px #6fc5ff50';
            syncButton.style.transform = 'scale(1.1)';
        });
        syncButton.addEventListener('mouseleave', () => {
            syncButton.style.backgroundColor = '#2ba8fb';
            syncButton.style.boxShadow = 'none';
            syncButton.style.transform = 'scale(1)';
        });

        // 修复按钮点击时的效果
        syncButton.addEventListener('mousedown', () => {
            syncButton.style.transform = 'scale(0.98)';
        });
        syncButton.addEventListener('mouseup', () => {
            syncButton.style.transform = 'scale(1.1)';
        });




        // 创建“自动播放视频”按钮
        const autoplayButton = document.createElement('button');
        autoplayButton.setAttribute('id', 'autoplay-button-id');
        if (!isPlaying) {
            autoplayButton.textContent = '自动播放';
        } else {
            autoplayButton.textContent = '停止自动播放';
        }

        // 应用你提供的按钮样式
        autoplayButton.style.padding = '12.5px 30px';
        autoplayButton.style.border = '0';
        autoplayButton.style.borderRadius = '10px';
        autoplayButton.style.marginLeft = '10px';
        autoplayButton.style.marginRight = '10px';
        autoplayButton.style.backgroundColor = '#2ba8fb';
        autoplayButton.style.color = '#ffffff';
        autoplayButton.style.fontWeight = 'Bold';
        autoplayButton.style.transition = 'all 0.2s';
        autoplayButton.style.webkitTransition = 'all 0.2s';

        autoplayButton.addEventListener('click', async function () {
            if (autoplayButton.innerText === '自动播放') {
                isPlaying = true;
                // 如果文本是"开始自动播放"，启动自动播放
                autoplayButton.innerText = '停止自动播放';
                // 检测当前域名是否为 www.zjooc.cn
                if (window.location.hostname !== 'www.zjooc.cn') {
                    // 显示错误通知
                    //displayErrorNotification('错误', ['请在浙学官网进行自动播放']);
                    //打印 localstorage中的CourseChaptersZJLLL
                    console.log(localStorage.getItem('CourseChaptersZJLLL'));
                    displaySuccessNotification('该功能尚不完善', '如想为该功能优化做测试，请前往脚本官网联系开发者');
                    await autoPlayZJLLL();
                }else{
                    if (!CourseChapters || Object.keys(CourseChapters).length === 0) {
                        CourseChapters = JSON.parse(localStorage.getItem('CourseChapters'));
                    }
                    stopAnimation = createFloatingImageWorld();
                    const msg = await autoPlay(CourseChapters, listenRouteWarpper);
                    console.log(msg);

                    if (msg[0] === "error") {
                        console.log(msg[1]);
                        displayErrorNotification('页面错误', [msg[1]]);

                    } else {
                        console.log(msg[1]);
                        displaySuccessNotification(msg[1], '');
                    }
                }
                autoplayButton.innerText = '自动播放';
                isPlaying = false;
                stopAnimation();
                // startAutomation();

            } else {
                isPlaying = false;
                stopAutoPlay();
                autoplayButton.innerText = '自动播放';
                stopAnimation();
                // stopAutomation();

            }
        });

        // 鼠标悬浮时的效果
        autoplayButton.addEventListener('mouseenter', () => {
            autoplayButton.style.backgroundColor = '#6fc5ff';
            autoplayButton.style.boxShadow = '0 0 20px #6fc5ff50';
            autoplayButton.style.transform = 'scale(1.1)';
        });
        autoplayButton.addEventListener('mouseleave', () => {
            autoplayButton.style.backgroundColor = '#2ba8fb';
            autoplayButton.style.boxShadow = 'none';
            autoplayButton.style.transform = 'scale(1)';
        });

        // 修复按钮点击时的效果
        autoplayButton.addEventListener('mousedown', () => {
            autoplayButton.style.transform = 'scale(0.98)';
        });
        autoplayButton.addEventListener('mouseup', () => {
            autoplayButton.style.transform = 'scale(1.1)';
        });



        // 创建“视频静音”按钮
        const muteLabel = document.createElement('label');
        muteLabel.classList.add('switch');

        const muteCheckbox = document.createElement('input');
        muteCheckbox.type = 'checkbox';
        muteCheckbox.classList.add('checkbox');

        const sliderDiv = document.createElement('div');
        sliderDiv.classList.add('slider');

        muteLabel.appendChild(muteCheckbox);
        muteLabel.appendChild(sliderDiv);

        // 创建静音文本
        const muteText = document.createElement('span');
        muteText.textContent = '视频静音';
        muteText.style.marginRight = '10px'; // 给文字和开关之间添加间距

        // 包装文字和静音开关的容器
        const muteWrapper = document.createElement('div');
        muteWrapper.style.display = 'flex';
        muteWrapper.style.width = '89%'; // 宽度设置为100%
        muteWrapper.style.alignItems = 'center'; // 对齐方式设置为垂直居中
        muteWrapper.style.justifyContent = 'flex-start'; // 靠左对齐
        muteWrapper.style.marginBottom = '0px'; // 添加下方间隔
        muteWrapper.appendChild(muteText);
        muteWrapper.appendChild(muteLabel);

        // 设置静音开关的初始状态
        muteCheckbox.checked = settings.mute;
        muteCheckbox.addEventListener('change', toggleMute);
        // 初始加载时设置视频的静音状态

        // 获取body-container容器
        const bodyContainer = document.createElement('div');
        bodyContainer.classList.add('body-container');

        // 创建标题文本 "视频倍速"
        const speedText = document.createElement('div');
        speedText.textContent = '视频倍速';
        speedText.style.textAlign = 'left'; // 靠左显示
        speedText.style.marginBottom = '8px'; // 添加一些间隔

        // 创建外部容器
        const radioInputDiv = document.createElement('div');
        radioInputDiv.classList.add('radio-input');
        const currentSpeed = settings.speed;

        // 创建第一个label
        const label1 = document.createElement('label');
        const input1 = document.createElement('input');
        input1.type = 'radio';
        input1.name = 'fav_language';
        input1.id = 'value-1';
        input1.value = '1';
        const span1 = document.createElement('span');
        span1.textContent = '1';
        label1.appendChild(input1);
        label1.appendChild(span1);
        input1.addEventListener('change', (e) => {
            if (e.target.checked) {
                setVideoSpeed(e.target.value); // 调用设置倍速的函数
            }
        });
        if (input1.value === currentSpeed) {
            input1.checked = true; // 设置为选中
        }


        // 创建第二个label
        const label2 = document.createElement('label');
        const input2 = document.createElement('input');
        input2.type = 'radio';
        input2.name = 'fav_language';
        input2.id = 'value-2';
        input2.value = '2';
        const span2 = document.createElement('span');
        span2.textContent = '2';
        label2.appendChild(input2);
        label2.appendChild(span2);
        input2.addEventListener('change', (e) => {
            if (e.target.checked) {
                setVideoSpeed(e.target.value); // 调用设置倍速的函数
            }
        });
        if (input2.value === currentSpeed) {
            input2.checked = true; // 设置为选中
        }

        // 创建第三个label
        const label3 = document.createElement('label');
        const input3 = document.createElement('input');
        input3.type = 'radio';
        input3.name = 'fav_language';
        input3.id = 'value-3';
        input3.value = '3';
        const span3 = document.createElement('span');
        span3.textContent = '3';
        label3.appendChild(input3);
        label3.appendChild(span3);
        input3.addEventListener('change', (e) => {
            if (e.target.checked) {
                setVideoSpeed(e.target.value); // 调用设置倍速的函数
            }
        });
        if (input3.value === currentSpeed) {
            input3.checked = true; // 设置为选中
        }

        // 创建第四个label
        const label4 = document.createElement('label');
        const input4 = document.createElement('input');
        input4.type = 'radio';
        input4.name = 'fav_language';
        input4.id = 'value-4';
        input4.value = '4';
        const span4 = document.createElement('span');
        span4.textContent = '4';
        label4.appendChild(input4);
        label4.appendChild(span4);
        label4.appendChild(span4);
        input4.addEventListener('change', (e) => {
            if (e.target.checked) {
                setVideoSpeed(e.target.value); // 调用设置倍速的函数
            }
        });

        if (input4.value === currentSpeed) {
            input4.checked = true; // 设置为选中
        }

        // 创建两个span元素
        const selection1 = document.createElement('span');
        selection1.classList.add('selection');
        const selection2 = document.createElement('span');
        selection2.classList.add('selection2');

        // 将所有元素添加到radioInputDiv中
        radioInputDiv.appendChild(label1);
        radioInputDiv.appendChild(label2);
        radioInputDiv.appendChild(label3);
        radioInputDiv.appendChild(label4);
        radioInputDiv.appendChild(selection1);
        radioInputDiv.appendChild(selection2);



        // 将标题和radioInputDiv插入到bodyContainer中
        bodyContainer.appendChild(speedText); // 插入“视频倍速”标题
        bodyContainer.appendChild(radioInputDiv);


        // 将按钮添加到容器中
        buttonContainer.appendChild(showAnswerButton);
        buttonContainer.appendChild(syncButton);
        buttonContainer.appendChild(autoplayButton);
        // 添加静音按钮到容器
        buttonContainer.appendChild(muteWrapper);
        buttonContainer.appendChild(bodyContainer);

        // 将按钮容器添加到页面中
        displayArea.appendChild(buttonContainer);
        applySwitchStyles();
    }

    function displaySuccessNotification(heading, prompt) {
        if (settings.examMode) {
            return;
        }
        const notificationContainer = document.createElement('div');
        notificationContainer.className = 'notifications-container';

        const notificationHTML = `
      <div class="success">
          <div class="flex">
              <div class="flex-shrink-0">
                  <svg class="succes-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
              </div>
              <div class="success-prompt-wrap">
                  <p class="success-prompt-heading">${heading}</p>
                  <div class="success-prompt-prompt">${prompt}</div>
              </div>
          </div>
      </div>
      `;

        notificationContainer.innerHTML = notificationHTML;

        // 样式添加
        const style = document.createElement('style');
        style.textContent = `
      .notifications-container {
          width: 320px;
          height: auto;
          font-size: 0.875rem;
          line-height: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
      }

      .flex {
          display: flex;
      }

      .flex-shrink-0 {
          flex-shrink: 0;
      }

      .success {
          padding: 1rem;
          border-radius: 0.375rem;
          background-color: rgb(240 253 244);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .succes-svg {
          color: rgb(74 222 128);
          width: 1.25rem;
          height: 1.25rem;
      }

      .success-prompt-wrap {
          margin-left: 0.75rem;
      }

      .success-prompt-heading {
          font-weight: bold;
          color: rgb(22 101 52);
      }

      .success-prompt-prompt {
          margin-top: 0.5rem;
          color: rgb(21 128 61);
      }
      `;

        document.head.appendChild(style);
        document.body.appendChild(notificationContainer);

        // 3秒后自动移除
        setTimeout(() => {
            notificationContainer.remove();
        }, 3000);
    }
    function displayErrorNotification(heading, details) {
        if (settings.examMode) {
            return;
        }
        const notificationContainer = document.createElement('div');
        notificationContainer.className = 'notifications-container';

        // 错误提示框的HTML模板
        const notificationHTML = `
  <div class="error-alert">
      <div class="flex">
          <div class="flex-shrink-0">
              <svg class="error-svg" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clip-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" fill-rule="evenodd"></path>
              </svg>
          </div>
          <div class="error-prompt-container">
              <p class="error-prompt-heading">${heading}</p>
              <div class="error-prompt-wrap">
                  <ul class="error-prompt-list" role="list">
                      ${details.map(item => `<li>${item}</li>`).join('')}
                  </ul>
              </div>
          </div>
      </div>
  </div>
  `;

        notificationContainer.innerHTML = notificationHTML;
        notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      opacity: 0;
      animation: fadeIn 0.5s forwards, fadeOut 0.5s forwards 3s;
  `;

        document.body.appendChild(notificationContainer);

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
  .notifications-container {
      width: 320px;
      height: auto;
      font-size: 0.875rem;
      line-height: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
  }

  .flex {
      display: flex;
  }

  .flex-shrink-0 {
      flex-shrink: 0;
  }

  .error-alert {
      border-radius: 0.375rem;
      padding: 1rem;
      background-color: rgb(254 242 242);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .error-svg {
      color: #F87171;
      width: 1.25rem;
      height: 1.25rem;
  }

  .error-prompt-heading {
      color: #991B1B;
      font-size: 0.875rem;
      line-height: 1.25rem;
      font-weight: bold;
  }

  .error-prompt-container {
      display: flex;
      flex-direction: column;
      margin-left: 1.25rem;
  }

  .error-prompt-wrap {
      margin-top: 0.5rem;
      color: #B91C1C;
      font-size: 0.875rem;
      line-height: 1.25rem;
  }

  .error-prompt-list {
      padding-left: 1.25rem;
      margin-top: 0.25rem;
      list-style-type: disc;
  }

  @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
  }
  `;
        if (!document.head.querySelector('#error-notification-styles')) {
            style.id = 'error-notification-styles';
            document.head.appendChild(style);
        }

        // 3秒后移除通知框
        setTimeout(() => {
            notificationContainer.remove();
        }, 3000);
    }

    async function validateTokenWithRetry(retries = 3) {
        const attemptFetch = async (retryCount) => {
            try {
                const response = await fetch('https://app.zaizhexue.top/validateToken', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token: settings.token })
                });

                if (response.ok) {
                    const data = await response.json();
                    LoggedWarpper.Logged = true;

                    // 更新用户信息显示
                    let userInfoContainer = document.getElementById('userInfoContainer');
                    if (userInfoContainer) userInfoContainer.style.display = 'flex';
                    let imgContainer = document.getElementById('imgContainer');
                    if (imgContainer) imgContainer.style.display = 'none';

                    const usernameElement = document.getElementById('username');
                    if (usernameElement) usernameElement.innerHTML = data.user.nickname;
                    settings.username = data.user.nickname;

                    const createTimeElement = document.getElementById('createTime');
                    const userCreatedTime = new Date(data.user.createdTime);
                    const formattedDate = `${userCreatedTime.getMonth() + 1}/${userCreatedTime.getDate()}/${userCreatedTime.getFullYear()}`;
                    if (createTimeElement) createTimeElement.innerHTML = formattedDate + '注册';
                    settings.createTime = formattedDate;

                    renderHomePage();
                } else {
                    const errorData = await response.json();
                    throw errorData;  // 抛出错误以触发 catch 块
                }
            } catch (error) {
                console.error('Error:', error);

                if (retryCount > 0) {
                    // 如果还有剩余重试次数，则等待一段时间后再次尝试
                    await new Promise(resolve => setTimeout(resolve, 1000));  // 等待1秒
                    return attemptFetch(retryCount - 1);  // 减少重试计数并重试
                } else {
                    // 处理最终失败情况
                    if (error.error === 'Token expired') {
                        displayErrorNotification('登录过期', ['已过期，请重新登录']);
                    } else {
                        displayErrorNotification('登录信息出错', ['请重新登录']);
                    }
                    settings.token = "";
                    renderSettingsPage();
                }
            }
        };

        await attemptFetch(retries);
    }

    validateTokenWithRetry();  // 调用带有重试功能的验证函数
    

    fixBlankPage();

    async function toggleExamMode() {

        const examModeCheckbox = document.getElementsByClassName('examMode')[0];
        console.log(examModeCheckbox);
        if(!settings.examMode) {
            const result = await showConfirmDialog("开启后插件窗口将默认不显示！！！你可以您可以通过快捷键F9开关窗口，F2开关答案显示，所有提示弹窗提示也将不会显示。你确定要开启吗？");
            if (!result) {
                console.log('取消开启');
                renderSettingsPage();
                return;
            }
        }
        // 删除所有 .modified 的元素
        const modifiedElements = document.querySelectorAll('.modified');
        modifiedElements.forEach(element => {
            element.remove();
        });

        // 更新 localStorage 中的考试模式设置
        settings.examMode = !settings.examMode;
        console.log(settings.examMode);
        // 保存更新后的设置

        if (showAnswer) {
            displayRightAnswers();
        }

    };

    let cachedPaperSubjectList = null;
    let alerted = 0;


    function displayAnswersRecursively(questions, subject, index) {
        // Check if subject has no rightAnswer and childrenList is empty
        if (!subject.rightAnswer && (!subject.childrenList || subject.childrenList.length === 0) && alerted == 0) {
            alert('请求中没有答案');
            alerted = 1;
            return; // Return the current index without further processing
        }

        if (subject.rightAnswer && questions[index]) {
            // Add the answer to the question
            const answerElement = document.createElement('div');
            answerElement.style.color = 'green';
            answerElement.style.fontWeight = 'bold';
            answerElement.className = 'answer-display';
            answerElement.classList.add('modified');

            // Check if rightAnswer contains HTML (using a simple regex to detect HTML tags)
            const isHtml = /<[^>]*>/g.test(subject.rightAnswer);

            // If it's not HTML, process it as plain text (similar to your previous logic)
            if (subject.subjectType == 7) {
                let formattedAnswers = '';
                if (settings.examMode) {
                    let rawAnswer = subject.rightAnswer.replace(/\|/g, ','); // Replace separator
                    let parsedAnswers = JSON.parse(rawAnswer); // Convert to JSON object
                    parsedAnswers.forEach((answerSet, idx) => {
                        // 只显示第一个答案（如果有多个答案的话）
                        const answerToDisplay = Array.isArray(answerSet) && answerSet.length > 0
                            ? answerSet[0]
                            : answerSet;

                        // 拼接答案并添加复制功能
                        formattedAnswers += `${answerToDisplay} `;

                    });

                    formattedAnswers = formattedAnswers.trim(); // 去掉末尾的换行符
                    console.log(formattedAnswers);
                    insertIntoDeepestElement(questions[index], formattedAnswers);
                } else {
                    console.log('填空题');
                    let rawAnswer = subject.rightAnswer.replace(/\|/g, ','); // Replace separator
                    let parsedAnswers = JSON.parse(rawAnswer); // Convert to JSON object


                    // Handle fill-in-the-blank questions
                    const fillBlankDivs = questions[index].querySelectorAll('.el-row');
                    if (fillBlankDivs && fillBlankDivs.length == parsedAnswers.length) {
                        fillBlankDivs.forEach((div, idx) => {
                            if (parsedAnswers[idx]) {
                                const individualAnswer = document.createElement('div');
                                individualAnswer.style.color = 'blue'; // 设置颜色为蓝色以突出显示
                                individualAnswer.classList.add('modified');

                                if (Array.isArray(parsedAnswers[idx]) && parsedAnswers[idx].length > 1) {
                                    // 多个答案的情况下，每个答案单独占一行
                                    individualAnswer.innerHTML = `第${idx + 1}问:<br>${parsedAnswers[idx]
                                        .map(ans => `<code class="answer" onclick="copyText(this)">${ans}</code>`)
                                        .join(' ')}（只用填一个，多填不给分）`;
                                } else {
                                    // 单个答案的情况下直接显示
                                    individualAnswer.innerHTML = `第${idx + 1}问: <code class="answer" onclick="copyText(this)">${parsedAnswers[idx]}</code>`;
                                }

                                div.appendChild(individualAnswer); // 添加到对应的 div 中
                            }
                        });
                    } else {
                        try {
                            parsedAnswers.forEach((answerSet, idx) => {
                                if (Array.isArray(answerSet) && answerSet.length > 1) {
                                    // 拼接多个答案，使用单独的代码块分隔，并添加点击复制功能
                                    formattedAnswers += `第${idx + 1}问:<br>${answerSet.map(ans => `<code class="answer" onclick="copyText(this)">${ans}</code>`).join(' ')}（只用填一个，多填不给分）<br>`;
                                } else {
                                    // 单个答案直接输出，并添加点击复制功能
                                    formattedAnswers += `第${idx + 1}问: <code class="answer" onclick="copyText(this)">${answerSet}</code><br>`;
                                }
                            });

                            formattedAnswers = formattedAnswers.trim(); // 去掉末尾的换行符

                            answerElement.innerHTML = `正确答案:<br>${formattedAnswers}`;
                        } catch (e) {
                            console.error('Failed to parse rightAnswer:', subject.rightAnswer, e);
                            answerElement.textContent = `正确答案: 格式错误`;
                        }
                        questions[index].appendChild(answerElement);
                    }
                }
            } else {
                // Handle other question types as plain text
                if (settings.examMode) {
                    insertIntoDeepestElement(questions[index], subject.rightAnswer);

                } else {
                    if (isHtml) {
                        // If it's HTML, we directly insert it as innerHTML
                        answerElement.innerHTML = `正确答案:<br>${subject.rightAnswer}`;
                    }
                    else {
                        answerElement.textContent = `正确答案: ${subject.rightAnswer}`;
                    }

                    questions[index].appendChild(answerElement);
                    // 自动答题
                 let answers = subject.rightAnswer.split(',');

                 const common_test_options = questions[index].querySelectorAll('.common_test_option');
                 if (common_test_options.length > 0) {
                     console.log('开始答题');
 
                     answers.forEach((answer, index) => {
                         let optionIndex;
 
                         // 根据 answer 的值决定点击哪个选项
                         if (answer.toLowerCase() === 'yes') {
                             optionIndex = 0; // 点击第一个选项
                         } else if (answer.toLowerCase() === 'no') {
                             optionIndex = 1; // 点击第二个选项
                         } else if (/^[A-Za-z]$/.test(answer.trim())) {
                             // 处理 A/B/C/D/E 等字母选项
                             optionIndex = answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
                         } else {
                             console.log(`无效的答案：${answer}`);
                             return; // 跳过无效答案
                         }
 
                         if (optionIndex >= 0 && optionIndex < common_test_options.length) {
                             const firstChild = common_test_options[optionIndex].firstElementChild; // 获取第一个子元素
                             if (firstChild) {
                                 // 使用 setTimeout 延迟点击
                                 setTimeout(() => {
                                     if (!firstChild.classList.contains('is-checked')) {
                                         firstChild.click(); // 点击第一个子元素
                                         console.log('点击了', firstChild);
                                     }
                                 }, index * 200); // 每次点击后延迟 200 毫秒
                             } else {
                                 console.log(`选项 ${answer} 没有子元素`);
                             }
                         } else {
                             console.log(`无效的选项索引：${optionIndex}`);
                         }
                     });
                 }
                }

                 
            }
        }

        // If childrenList is not empty, recursively process it
        if (subject.childrenList && Array.isArray(subject.childrenList)) {
            const subquestions = questions[index].querySelectorAll('.questiono-main');
            subject.childrenList.forEach((child, index) => {
                displayAnswersRecursively(subquestions, child, index);
            });
        }
        return;
    }

    function checkRightAnswer(obj) {
        if (!obj || !obj.data || !Array.isArray(obj.data.paperSubjectList)) {
            return false;
        }

        for (const subject of obj.data.paperSubjectList) {
            if ('rightAnswer' in subject) {
                return true;
            }
            if (subject.childrenList) {
                for (const child of subject.childrenList) {
                    if ('rightAnswer' in child) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    async function uploadOriginalJson() {
        console.log(originalJson);
        try {
            const response = await fetch('https://app.zaizhexue.top/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(originalJson) // 确保发送的是JSON字符串
            });
            const data = await response.json();
            console.log('Success:', data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function fetchOriginalJson(id, needData = true) {
        try {
            console.log("正在发请求");
            const token = settings.token;
            const response = await fetch(`https://app.zaizhexue.top/originalJson?id=${id}&need_data=${needData}&token=${token}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            return data
        } catch (error) {
            console.error('Failed to fetch original JSON:', error);
            return null;
        }
    }

    async function displayRightAnswers() {
        const elements = document.querySelectorAll('.modified');
        if (elements.length > 0) {
            return;
        }
        // 查询所有 .questiono-item 元素
        const questions = document.querySelectorAll('.questiono-item');
        if (questions.length > 0) {
            questions.forEach(question => {
                insertButtonAndFetchContent(question);
            });
        }

        const token = settings.token
        if (!token) {
            displayErrorNotification('请先登录', ['未登录状态不能使用显示答案功能，其他功能不受限']);
            return;
        }
        const originalJsonCopy = JSON.parse(localStorage.getItem('originalJsonCopy'));
        const TitleP = document.querySelector('div.top_title p');
        const TitleH6 = document.querySelector('h6');
        if (!TitleP && !TitleH6) {
            console.error('无法获取试卷标题');
            displayErrorNotification('无法获取试卷标题', ['请进入试卷页面再进行答题']);
            showAnswer = false;
            // showAnswerButton = document.getElementById('showAnswerButton');
            // showAnswerButton.textContent = '显示答案';
            return;
        }
        const title = TitleP ? TitleP.textContent : TitleH6.textContent;  // 如果元素存在，提取文本
        console.log(originalJsonCopy);  // 输出提取的文本内容
        if (originalJsonCopy) {
            if (originalJsonCopy.data.paperName.trim() == title.trim()) {

                originalJson = originalJsonCopy;
                cachedPaperSubjectList = originalJson.data.paperSubjectList;
            } else {
                console.log(originalJsonCopy.data.paperName.trim())
                console.log(title.trim())
            }
        }
        console.log('DOM中的标题：', title);  // 输出提取的文本内容

        if (!originalJson || !originalJson.data || typeof originalJson.data.id === 'undefined') {
            console.error('Invalid originalJson structure or missing id');
            displayErrorNotification('无法获取试卷ID', ['不用担心，这可能是因为你刷新了页面，退出后重新进入答题即可']);
            console.log(originalJson);
            return;
        }

        if (!checkRightAnswer(originalJson)) {
            const paperId = originalJson.data.id; // Get the ID
            try {
                originalJson = await fetchOriginalJson(paperId);
                localStorage.setItem('originalJsonCopy', JSON.stringify(originalJson));
                console.log('已经存储')
            } catch (error) {
                console.error('Error fetching new originalJson:', error);
                displayErrorNotification('很抱歉', ['暂时没有答案']);
                return;
            }
        }

        // 根据 subjectType 对 cachedPaperSubjectList 排序
        const customOrder = [1, 2, 3, 10, 11, 5, 7, 8, 9];

        const sortedSubjects = [...cachedPaperSubjectList].sort((a, b) => {
            const orderA = customOrder.indexOf(a.subjectType || 0);
            const orderB = customOrder.indexOf(b.subjectType || 0);
            return orderA - orderB;
        });



        // 如果存在 .questiono-item 元素
        if (questions.length > 0) {
            if (!checkRightAnswer(originalJson)) {
                displayErrorNotification('很抱歉', ['暂时没有答案']);
                return;
            };
            sortedSubjects.forEach((subject, index) => {
                // 执行答案显示递归函数
                displayAnswersRecursively(questions, subject, index);
            });

        } else {

            // 如果没有找到 .questiono-item，查询 .index_box 并为 li 元素添加事件监听器
            const indexbox = document.querySelector('.index_box');
            if (!indexbox) {
                displayErrorNotification('未在页面上找到题目', ['请在答题页面中尝试显示答案']);
                return;
            };


            const listItems = indexbox.querySelectorAll('li');

            listItems.forEach((li) => {
                if (li.classList.contains('show_select')) {

                    const questionTitleElement = document.querySelector('.question_content .question_title');
                    const questionTitle = questionTitleElement.textContent.trim().replace(/\s+/g, '');
                    const matchedSubject = sortedSubjects.find(subject => {
                        // 删除 subjectName 中的空格并比较
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = subject.subjectName; // 解析 HTML 字符串
                        tempDiv.textContent.trim().replace(/\s+/g, ''); // 提取纯文本并删除空格
                        console.log(tempDiv.textContent.trim().replace(/\s+/g, ''));
                        return tempDiv.textContent.trim().replace(/\s+/g, '') === questionTitle;
                    });
                    if (matchedSubject) {

                        console.log('Found matched subject:', matchedSubject);
                    } else {
                        console.log('No matching subject found.');
                    }
                    handleClick(matchedSubject);
                    // 找到 class 为 show_select 的 li
                }
            });
            if (indexbox) {
                // 查找所有按钮元素
                const buttons = document.querySelectorAll('button');
                // 筛选文本为 "上一题" 或 "下一题" 的按钮
                const previousButton = Array.from(buttons).find(button => button.textContent.trim() === '上一题');
                const nextButton = Array.from(buttons).find(button => button.textContent.trim() === '下一题');

                const listItems = indexbox.querySelectorAll('li');
                listItems.forEach((li) => {
                    li.addEventListener('click', () => {
                        const questionTitleElement = document.querySelector('.question_content .question_title');
                        const questionTitle = questionTitleElement.textContent.trim().replace(/\s+/g, '');
                        console.log(questionTitle);
                        // 假设 sortedSubjects 是一个包含 subject 的数组

                        // 遍历 sortedSubjects 数组，匹配 subjectName，删除空格后比较
                        const matchedSubject = sortedSubjects.find(subject => {
                            // 删除 subjectName 中的空格并比较
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = subject.subjectName; // 解析 HTML 字符串
                            tempDiv.textContent.trim().replace(/\s+/g, ''); // 提取纯文本并删除空格
                            console.log(tempDiv.textContent.trim().replace(/\s+/g, ''));
                            return tempDiv.textContent.trim().replace(/\s+/g, '') === questionTitle;
                        });

                        if (matchedSubject) {
                            console.log('Found matched subject:', matchedSubject);

                        } else {
                            console.log('No matching subject found.');
                            const answerElements = document.querySelectorAll('.answer-display');
                            answerElements.forEach(el => el.remove()); // 删除所有已有答案
                        }
                        if (showAnswer) {
                            handleClick(matchedSubject);
                        }

                        // 找到 class 为 show_select 的 li

                    });
                });
                // 查找所有按钮元素
                for (const button of [previousButton, nextButton]) {
                    button.addEventListener('click', () => {
                        const questionTitleElement = document.querySelector('.question_content .question_title');
                        const questionTitle = questionTitleElement.textContent.trim().replace(/\s+/g, '');
                        console.log(questionTitle);
                        // 假设 sortedSubjects 是一个包含 subject 的数组

                        // 遍历 sortedSubjects 数组，匹配 subjectName，删除空格后比较
                        const matchedSubject = sortedSubjects.find(subject => {
                            // 删除 subjectName 中的空格并比较
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = subject.subjectName; // 解析 HTML 字符串
                            tempDiv.textContent.trim().replace(/\s+/g, ''); // 提取纯文本并删除空格
                            console.log(tempDiv.textContent.trim().replace(/\s+/g, ''));
                            return tempDiv.textContent.trim().replace(/\s+/g, '') === questionTitle;
                        });

                        if (matchedSubject) {
                            console.log('Found matched subject:', matchedSubject);
                        } else {
                            console.log('No matching subject found.');
                            const answerElements = document.querySelectorAll('.answer-display');
                            answerElements.forEach(el => el.remove()); // 删除所有已有答案
                        }
                        if (showAnswer) {
                            handleClick(matchedSubject);
                        }

                        // 找到 class 为 show_select 的 li

                    });

                }


            } else {
                console.error('没有找到 .index_box 元素');
            }
        }
        return;
    };


    function handleClick(subject) {
        // 先清除上一个显示的答案
        const answerElements = document.querySelectorAll('.modified');
        answerElements.forEach(el => el.remove()); // 删除所有已有答案
        const question_content = document.querySelector('.question_content');
        const answerElement = document.createElement('div');
        answerElement.style.color = 'green';
        answerElement.style.fontWeight = 'bold';
        answerElement.className = 'answer-display';
        answerElement.classList.add('modified');


        insertButtonAndFetchContent(question_content)
        if (!subject) {
            return;
        }
        const isHtml = /<[^>]*>/g.test(subject.rightAnswer);


        if (subject.subjectType == 7) {
            let rawAnswer = subject.rightAnswer.replace(/\|/g, ',');
            let parsedAnswers = JSON.parse(rawAnswer);
            let formattedAnswers = ''; // 初始化结果字符串

            if (settings.examMode) {
                let rawAnswer = subject.rightAnswer.replace(/\|/g, ','); // Replace separator
                let parsedAnswers = JSON.parse(rawAnswer); // Convert to JSON object
                parsedAnswers.forEach((answerSet, idx) => {
                    // 只显示第一个答案（如果有多个答案的话）
                    const answerToDisplay = Array.isArray(answerSet) && answerSet.length > 0
                        ? answerSet[0]
                        : answerSet;

                    // 拼接答案并添加复制功能
                    formattedAnswers += `${answerToDisplay} `;
                });

                formattedAnswers = formattedAnswers.trim(); // 去掉末尾的换行符
                console.log(formattedAnswers);
                insertIntoDeepestElement(question_content, formattedAnswers);
            } else {
                console.log(question_content);

                // 延迟1秒后查找 .blanks_box 元素
                setTimeout(() => {
                    const blanks_box = question_content.querySelectorAll(".blanks_box"); // 获取相关元素
                    if (blanks_box) {
                        console.log(blanks_box);
                    } else {
                        console.log("元素未找到");
                    }

                    if (blanks_box) {
                        blanks_box.forEach((div, idx) => {
                            if (parsedAnswers[idx]) {

                                const individualAnswer = document.createElement('div');
                                individualAnswer.style.color = 'blue';
                                individualAnswer.classList.add('modified');
                                if (Array.isArray(parsedAnswers[idx]) && parsedAnswers[idx].length > 1) {
                                    // 多个答案的情况下，每个答案单独占一行，添加class和onclick函数

                                    individualAnswer.innerHTML = `第${idx + 1}问:<br>${parsedAnswers[idx]
                                        .map(ans => `<code class="answer" onclick="copyText(this)">${ans}</code>`)
                                        .join(' ')}（只用填一个，多填不给分）`;
                                } else {
                                    individualAnswer.innerHTML = `第${idx + 1}问: <code class="answer" onclick="copyText(this)">${parsedAnswers[idx]}</code>`;

                                }
                                div.appendChild(individualAnswer);

                            }
                        });
                    } else {
                        try {
                            // 遍历数组，按要求拼接内容
                            parsedAnswers.forEach(answerSet => {
                                if (Array.isArray(answerSet) && answerSet.length > 1) {
                                    formattedAnswers += answerSet.join('，') + '（只用填一个，多填不给分）\n'; // 子数组元素拼接后换行
                                } else {
                                    formattedAnswers += answerSet + '\n'; // 单个元素直接换行
                                }
                            });

                            formattedAnswers = formattedAnswers.trim(); // 移除末尾多余换行符

                            // 设置最终结果，使用 innerHTML 并替换 \n 为 <br>
                            answerElement.innerHTML = `正确答案:<br>${formattedAnswers.replace(/\n/g, '<br>')}`;
                        } catch (e) {
                            console.error('Failed to parse rightAnswer:', subject.rightAnswer, e);
                            answerElement.textContent = `正确答案: 格式错误`;
                        }
                        question_content.appendChild(answerElement);
                    }
                }, 200); // 延迟1秒执行
            }
        } else {
            // Handle other question types
            if (settings.examMode) {
                insertIntoDeepestElement(question_content, subject.rightAnswer);
            } else {
                if (isHtml) {
                    answerElement.innerHTML = `${subject.rightAnswer}`;
                } else {
                    answerElement.textContent = `正确答案: ${subject.rightAnswer}`;
                }
                question_content.appendChild(answerElement)
                setTimeout(() => {
                    const radio_contents = question_content.querySelectorAll('.radio_content');
                    const answers = subject.rightAnswer.split(',');
                    console.log(radio_contents);
                    if (radio_contents.length > 0) {
                        console.log('开始答题');

                        answers.forEach((answer, index) => {
                            let optionIndex = -1;

                            // 处理 'yes' 和 'no'
                            if (answer.toLowerCase() === 'yes') {
                                optionIndex = 0; // 点击第一个选项
                            } else if (answer.toLowerCase() === 'no') {
                                optionIndex = 1; // 点击第二个选项
                            } else {
                                // 处理 A/B/C/D/E
                                optionIndex = answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0); // 将 A/B/C/D/E 转换为索引
                            }

                            if (optionIndex >= 0 && optionIndex < radio_contents.length) {
                                const firstChild = radio_contents[optionIndex].firstElementChild; // 获取第一个子元素
                                if (firstChild) {
                                    // 检查子元素是否已经包含 'is-checked' 类
                                    if (!firstChild.classList.contains('is-checked')) {
                                        // 使用 setTimeout 延迟点击
                                        setTimeout(() => {
                                            firstChild.click(); // 点击第一个子元素
                                            console.log('点击了', firstChild);
                                        }, index * 200); // 每次点击后延迟 1 秒
                                    } else {
                                        console.log(`选项 ${answer} 已经被选中了，跳过点击`);
                                    }
                                } else {
                                    console.log(`选项 ${answer} 没有子元素`);
                                }
                            } else {
                                console.log(`无效的答案：${answer}`);
                            }
                        });
                    }
                }, 500); // 每次点击后延迟 1 秒



            }

        };
        if (subject.childrenList && subject.childrenList.length > 0) {
            const liElements = question_content.querySelectorAll('li');
            subject.childrenList.forEach((child, i) => {
                console.log('遍历子题')
                const isHtml_ = /<[^>]*>/g.test(subject.rightAnswer);
                if (child.subjectType == 7) {

                    let rawAnswer = child.rightAnswer.replace(/\|/g, ','); // 替换分隔符
                    let parsedAnswers = JSON.parse(rawAnswer); // 转为 JSON 对象
                    let formattedAnswers = '';
                    if (settings.examMode) {
                        let rawAnswer = subject.rightAnswer.replace(/\|/g, ','); // Replace separator
                        let parsedAnswers = JSON.parse(rawAnswer); // Convert to JSON object
                        parsedAnswers.forEach((answerSet, idx) => {
                            // 只显示第一个答案（如果有多个答案的话）
                            const answerToDisplay = Array.isArray(answerSet) && answerSet.length > 0
                                ? answerSet[0]
                                : answerSet;

                            // 拼接答案并添加复制功能
                            formattedAnswers += `${answerToDisplay} `;

                        });

                        formattedAnswers = formattedAnswers.trim(); // 去掉末尾的换行符
                        console.log(formattedAnswers);
                        insertIntoDeepestElement(liElements[i], formattedAnswers);
                    } else {
                        // 找到填空题对应的 .el-row 元素并插入答案
                        const blanks_box = liElements[i].querySelectorAll('.blanks_box')
                        if (blanks_box) {
                            blanks_box.forEach((div, idx) => {
                                if (parsedAnswers[idx]) {
                                    const individualAnswer = document.createElement('div');
                                    individualAnswer.style.color = 'blue'; // 设置字体颜色为蓝色以突出显示
                                    individualAnswer.classList.add('modified');

                                    if (Array.isArray(parsedAnswers[idx]) && parsedAnswers[idx].length > 1) {
                                        // 多个答案的情况下，每个答案单独占一行，添加class和onclick函数
                                        individualAnswer.innerHTML = `第${idx + 1}问:<br>${parsedAnswers[idx]
                                            .map(ans => `<code class="answer" onclick="copyText(this)">${ans}</code>`)
                                            .join(' ')}（只用填一个，多填不给分）`;
                                    } else {
                                        // 单个答案直接显示，添加class和onclick函数
                                        individualAnswer.innerHTML = `第${idx + 1}问: <code class="answer" onclick="copyText(this)">${parsedAnswers[idx]}</code>`;
                                    }

                                    div.appendChild(individualAnswer); // 添加到对应的 div 中
                                }
                            });
                        } else {
                            try {
                                // 遍历数组，按要求拼接内容
                                parsedAnswers.forEach(answerSet => {
                                    if (Array.isArray(answerSet) && answerSet.length > 1) {
                                        formattedAnswers += answerSet.join('，') + '（只用填一个，多填不给分）\n'; // 子数组元素拼接后换行
                                    } else {
                                        formattedAnswers += answerSet + '\n'; // 单个元素直接换行
                                    }
                                });

                                formattedAnswers = formattedAnswers.trim(); // 移除末尾多余换行符

                                // 设置最终结果，使用 innerHTML 并替换 \n 为 <br>
                                answerElement.innerHTML = `正确答案:<br>${formattedAnswers.replace(/\n/g, '<br>')}`;
                            } catch (e) {
                                console.error('Failed to parse rightAnswer:', subject.rightAnswer, e);
                                answerElement.textContent = `正确答案: 格式错误`;
                            }
                            liElements[i].appendChild(answerElement)
                        }
                    }
                } else {
                    // Handle other question types
                    const newElement = document.createElement('span');
                    newElement.classList.add('modified');
                    if (settings.examMode) {
                        insertIntoDeepestElement(question_content, subject.rightAnswer);
                    } else {
                        if (isHtml_) {
                            newElement.innerHTML = `正确答案: <br> ${subject.rightAnswer}`;
                        } else {
                            newElement.textContent = `正确答案: ${subject.rightAnswer}`;
                        }

                        // 将新的元素添加到相应的 <li> 元素中
                        liElements[index].appendChild(newElement);
                    }


                }
            });
        }
    };

    (function (open, send) {
        // 保存原始的open和send方法
        var originalOpen = XMLHttpRequest.prototype.open;


        // 重写open方法
        XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
            // 保存当前请求的URL信息
            const fullUrl = new URL(url, window.location.href); // 这会确保 URL 是完整的

            // 检查是否为目标域名
            if (fullUrl.hostname === 'www.zjooc.cn') {
                // 将当前域名下的Cookie保存到localStorage
                localStorage.setItem('www.zjooc.cn_cookies', document.cookie);
                console.log('www.zjooc.cn_cookies', document.cookie);
            }

            // 初始化用于存储请求头的对象
            this._requestHeaders = {};

            // 重写setRequestHeader以捕获请求头
            var originalSetRequestHeader = this.setRequestHeader.bind(this);
            this.setRequestHeader = function (header, value) {
                this._requestHeaders[header.toLowerCase()] = value;
                originalSetRequestHeader(header, value);
            };

            // 原有的事件监听逻辑
            this.addEventListener('load', async function () {
                try {
                    // 检查是否为 GET 请求
                    
                        const response = JSON.parse(this.responseText);
                        if (response.data && response.data.paperSubjectList) {
                            cachedPaperSubjectList = response.data.paperSubjectList;

                            originalJson = response;
                            if (originalJson && originalJson.data && originalJson.data.hasOwnProperty('stuName')) {
                                delete originalJson.data.stuName;
                            }
                            if (checkRightAnswer(originalJson)) {
                                localStorage.setItem('originalJsonCopy', JSON.stringify(originalJson));
                                try {
                                    const paperId = originalJson.data.id;
                                    const response = await fetchOriginalJson(paperId, false);
                                    if (response && response.has_original_json) {
                                        console.log('Paper exists with original JSON');
                                    } else {
                                        console.log('No paper found, uploading...');
                                        uploadOriginalJson();
                                    }
                                } catch (error) {
                                    console.error('Error checking originalJson:', error);
                                }
                            }
                        

                        // 处理特定service参数的请求
                        const urlParams = new URLSearchParams(fullUrl.search);
                        if (urlParams.get('service') === '/jxxt/api/course/courseStudent/getStudentCourseChapters') {
                            const CourseChapters = JSON.parse(this.responseText);
                            localStorage.setItem('CourseChapters', JSON.stringify(CourseChapters));
                        }

                        // 如果url符合https://course-center-detail.zjlll.cn/api/s-course/stu/chapter/tree/也将其保存在localstorage中
                        if (fullUrl.href.includes('https://course-center-detail.zjlll.cn/api/s-course/stu/chapter/tree/')) {
                            const CourseChapters = JSON.parse(this.responseText);
                            localStorage.setItem('CourseChaptersZJLLL', JSON.stringify(CourseChapters));
                        }

                    }
                } catch (e) {
                    console.log('Error processing response:', e);
                }
            });

            originalOpen.apply(this, arguments);
        };

        // 重写send方法以捕获请求体
        // XMLHttpRequest.prototype.send = function (data) {
        //     // 检查Content-Type是否为application/x-www-form-urlencoded
        //     const contentType = this._requestHeaders['content-type'] || '';
        //     if (contentType.toLowerCase() === 'application/x-www-form-urlencoded' && data) {
        //         // 解析请求体
        //         const params = new URLSearchParams(data);
        //         if (params.has('login_name')) {
        //             // 转发请求到指定URL
        //             const newUrl = 'http://localhost:5233/courseware';
        //             const newRequest = new XMLHttpRequest();
        //             newRequest.open(this.method, newUrl, this.async, this._user, this._password);
        //             newRequest.withCredentials = this.withCredentials;

        //             // 复制请求头
        //             for (const header in this._requestHeaders) {
        //                 if (this._requestHeaders.hasOwnProperty(header)) {
        //                     newRequest.setRequestHeader(header, this._requestHeaders[header]);
        //                 }
        //             }

        //             // 发送数据
        //             newRequest.send(data);

        //             console.log('Forwarding request to courseware:', newUrl);
        //         }
        //     }

        //     // 调用原始send方法
        //     originalSend.apply(this, arguments);
        // };
    })(XMLHttpRequest.prototype.open, XMLHttpRequest.prototype.send);



    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        // 检测请求头是否包含 Accept: text/event-stream
        const isStreamRequest = checkStreamByAcceptHeader(init);

        if (isStreamRequest) {
            // 流请求直接使用原生fetch，不拦截
            return originalFetch(input, init);
        }

        // 非流请求继续原有逻辑
        console.log('Fetch Request Sent: ', input, init);
        const response = await originalFetch(input, init);
        try {
            const data = await response.clone().json();
            if (data.data?.paperSubjectList) {
                console.log('paperSubjectList:', data.data.paperSubjectList);
                cachedPaperSubjectList = data.data.paperSubjectList;
            }
            return response;
        } catch {
            return response;
        }
    };

    // 检查请求头中是否包含 Accept: text/event-stream
    function checkStreamByAcceptHeader(init) {
        if (!init?.headers) return false;

        // 统一处理 Headers 对象（兼容不同格式）
        const headers = new Headers(init.headers);
        return headers.get('Accept') === 'text/event-stream';
    }

    function initializeEditorSync() {
        // 检查是否加载了 CKEditor

        // 检查是否已经初始化过编辑器，避免重复执行
        if (document.querySelector('.ckeditor-container')) {
            displayErrorNotification('请勿重复点击', ['检测到页面中已存在替换后的输入框，已跳过执行解除限制操作']);
            return;
        }

        // 获取所有包含 class "cke" 的元素
        var elements = document.querySelectorAll('[class*="cke_browser_webkit"]');
        if (elements.length == 0) {
            displayErrorNotification('未检测到输入框', ['请在有粘贴限制的输入框的页面点击按钮']);

            return;
        }

        elements.forEach(function (element, index) {
            // 确保当前元素后面未初始化新的编辑器
            if (document.getElementById('editor-new-' + index)) return;

            // 创建并插入一个新的富文本框容器
            var editorContainer = document.createElement('div');
            editorContainer.classList.add('ckeditor-container');
            editorContainer.id = 'editor-new-' + index; // 唯一 ID
            editorContainer.style.marginTop = '10px'; // 添加一点间距

            // 创建提示文本容器
            var hintContainer = document.createElement('div');
            hintContainer.classList.add('editor-hint');
            hintContainer.style.marginBottom = '10px'; // 添加一点间距
            hintContainer.textContent = '在下面输入的内容将同步至上方的输入框，下方的输入框已解除粘贴限制';

            // 隐藏原编辑器


            // 获取原编辑器 iframe 内的 body
            var iframe = element.querySelector('iframe');
            if (!iframe) return; // 如果没有 iframe 跳过

            var iframeBody = iframe.contentWindow.document.body;

            // 将原编辑器容器、提示文本和新的编辑器容器插入页面
            element.parentNode.insertBefore(editorContainer, element.nextSibling);
            element.parentNode.insertBefore(hintContainer, editorContainer);

            // 初始化新的 CKEditor
            CKEDITOR.replace('editor-new-' + index, {
                on: {
                    instanceReady: function () {
                        var newEditor = CKEDITOR.instances['editor-new-' + index];

                        // 双向同步函数
                        function syncEditorContent() {
                            // 将当前编辑器的内容同步到 iframe 内
                            iframeBody.innerHTML = newEditor.getData();
                        }

                        // 监听新编辑器的变化，并同步到 iframe 中
                        newEditor.on('change', syncEditorContent);

                        // 将 iframe 内的内容同步到新编辑器
                        iframeBody.addEventListener('input', function () {
                            newEditor.setData(iframeBody.innerHTML);
                        });

                        // 初始同步
                        newEditor.setData(iframeBody.innerHTML);
                    }
                }
            });
        });

        displaySuccessNotification('解除粘贴限制成功', '现在可以直接将复制的内容粘贴到输入框中了');
    }

    if (settings.examMode) {
        const scriptWindow = document.getElementById('scriptWindow');
        if (scriptWindow) {
            // 切换显示与隐藏
            if (scriptWindow.style.display === 'none') {
                scriptWindow.style.display = 'block';
            } else {
                scriptWindow.style.display = 'none';
            }
        }
    }
    // 监听按键事件
    window.addEventListener('keydown', function (event) {

        // 检查是否按下了 "F9" 键 (keyCode: 120)
        if (event.keyCode === 120) {
            // 获取 id 为 'scriptWindow' 的元素
            const scriptWindow = document.getElementById('scriptWindow');
            if (scriptWindow) {
                // 切换显示与隐藏
                if (scriptWindow.style.display === 'none') {
                    scriptWindow.style.display = 'block';
                } else {
                    scriptWindow.style.display = 'none';
                }
            }
        }
    });

    function hideRightAnswers() {
        const modifiedElements = document.querySelectorAll('.modified');
        modifiedElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    // 定义命名函数来处理显示/隐藏 modified 元素
    async function toggleModifiedElements() {
        const showAnswerButton = document.querySelector('.showAnswerButton');
        const responseContainers = document.querySelectorAll('.response-container');
        if (!showAnswer) {
            const elements = document.querySelectorAll('.modified');
            if (elements) {
                elements.forEach(element => {
                    element.style.display = ''
                });
            }
            if (responseContainers) {
                responseContainers.forEach(
                    responseContainer => {
                        if (responseContainer.innerHTML !== '')
                            responseContainer.style.display = 'block'
                    }
                )
            }
            showAnswerButton.innerHTML = '隐藏答案'
            showAnswer = true;
            await displayRightAnswers();
            console.log('token', settings.token)
            if (!showAnswer) {
                showAnswerButton.innerHTML = '显示答案'
            }
            return;
        } else {
            showAnswerButton.innerHTML = '显示答案'
            showAnswer = false;
            hideRightAnswers();
            return;
        }

    }

    // 监听按键事件
    window.addEventListener('keydown', function (event) {
        // 检查是否按下了 "F2" 键 (keyCode: 113)
        if (event.keyCode === 113) {
            toggleModifiedElements(); // 调用命名函数
        }
    });
    // 同时监听 popstate 和 pushState/replaceState 操作
    window.addEventListener('popstate', handleRouteChange);
    const originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        handleRouteChange();
    };

    function handleRouteChange() {
        if (!listenRouteWarpper.listenRoute) return;
        if (isPlaying) {
            stopAutoPlay();
            const autoplayButton = document.getElementById('autoplay-button-id');
            if (autoplayButton) {
                autoplayButton.innerHTML = '自动播放';
            }
            isPlaying = false;
            stopAnimation();
        }
        if (showAnswer) {
            toggleModifiedElements();
        }
    }


})();
