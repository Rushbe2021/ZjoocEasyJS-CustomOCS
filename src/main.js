import settings from './core/settings.js';
import { runtime } from './core/runtime.js';
import { getCurrentCourseChapters } from './core/chapterCache.js';
import styles from './styles.css';
import { imageData } from './assets/imageBase64.js';
import { displayRightAnswers, toggleAnswers, refreshAnswersForNewPage } from './features/answers/display.js';
import createFloatingImageWorld from './features/decoration/floatPic.js';
import fixBlankPage from './platform/zjooc/fixBlankPage.js';
import { autoPlay, stopAutoPlay } from './features/autoplay/autoPlay.js';
import { createButton, toggleButtonState } from './components/button.js';
import loadFont from './ui/loadFont.js';
import { showConfirmDialog } from './ui/dialog.js';
import { displaySuccessNotification, displayErrorNotification } from './ui/notifications.js';
import { exposeCopyText } from './ui/copyText.js';
import { createIcon, icons } from './ui/icons.js';
import { createLinkIcon } from './assets/linkIcons.js';
import { createUserAvatar, syncUserAvatar } from './ui/userAvatar.js';
import autoPlayZJLLL, { stopAutoPlayZJLLL } from './platform/zjlll/autoPlay.js';
import { initializeEditorSync } from './features/editor/pasteUnlock.js';
import { installNetworkHooks } from './features/intercept/network.js';
import { installHistoryHooks } from './features/intercept/history.js';
import checkIfZJLLL from './platform/zjlll/ifZJLLL.js';
(function () {

    if (checkIfZJLLL()) {
        return;
    }

    loadFont('SmileySans-Oblique', 'https://fastly.jsdelivr.net/gh/Miaozeqiu/fontRepository/SmileySans-Oblique.ttf.ec5470fd.woff2').then(success => {
        if (success) {
            document.body.style.fontFamily = 'SmileySans-Oblique, sans-serif';
        }
    });
    const loginState = runtime.loginState;
    const routeGuard = runtime.routeGuard;

    function stopFloatingImageSafely() {
        if (typeof runtime.stopFloatingImage === 'function') {
            runtime.stopFloatingImage();
        }
        runtime.stopFloatingImage = null;
    }

    function stopAllAutoPlay(reason) {
        console.log('[ZE自动播放] 停止：', reason);
        stopAutoPlay();
        stopAutoPlayZJLLL();
    }

    if (window.top != window) {
        console.log('当前脚本在iframe中执行，窗口不渲染');
        return;
    };

    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = styles;
    document.head.appendChild(style);
    exposeCopyText();

    // 创建浮动窗口元素
    const windowRoot = document.createElement('div');
    windowRoot.id = 'scriptWindow-root';
    const windowDiv = document.createElement('div');
    windowDiv.id = 'scriptWindow';

    function clampWindowPosition(left, top) {
        const width = windowDiv.offsetWidth || 300;
        const height = windowDiv.offsetHeight || 400;
        const maxLeft = Math.max(0, window.innerWidth - width);
        const maxTop = Math.max(0, window.innerHeight - height);
        return {
            left: Math.min(Math.max(0, Number(left) || 0), maxLeft),
            top: Math.min(Math.max(0, Number(top) || 0), maxTop),
        };
    }

    function applyWindowPosition(left, top, persist = false) {
        const next = clampWindowPosition(left, top);
        windowDiv.style.left = `${next.left}px`;
        windowDiv.style.top = `${next.top}px`;
        if (persist) {
            settings.position = next;
        }
        return next;
    }

    const storedPosition = settings.position || { left: 10, top: 10 };
    windowDiv.style.left = `${storedPosition.left ?? 10}px`;
    windowDiv.style.top = `${storedPosition.top ?? 10}px`;

    // 创建header
    const header = document.createElement('div');
    header.id = 'window-header'
    const zzxLogo = document.createElement('img')
    zzxLogo.src = imageData['zzxLogo']
    zzxLogo.style.width = '20px'

    const titleText = document.createElement('span')
    const scriptVersion = typeof GM_info !== 'undefined' && GM_info.script ? GM_info.script.version : '';
    titleText.textContent = scriptVersion ? `在浙学助手 v${scriptVersion}` : '在浙学助手';
    titleText.style.marginLeft = '10px'

    const title = document.createElement('div')
    title.style.display = 'flex'

    title.appendChild(zzxLogo)
    title.appendChild(titleText)

    header.appendChild(title)

    // 创建最小化按钮
    const minimizeButton = document.createElement('button');
    minimizeButton.type = 'button';
    minimizeButton.setAttribute('aria-label', '最小化');
    minimizeButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path d="M0 0h24v24H0V0z" fill="none"></path>
              <path d="M19 13H5v-2h14v2z"></path>
          </svg>
      `;
    header.appendChild(minimizeButton);

    // 创建主体容器
    const contentDiv = document.createElement('div');
    contentDiv.style.display = 'flex';
    contentDiv.style.height = 'calc(100% - 40px)';

    // 创建导航栏
    const navBar = document.createElement('div');
    navBar.id = 'window-navBar';
    navBar.dataset.active = 'home';

    const navIndicator = document.createElement('div');
    navIndicator.className = 'nav-indicator';
    navBar.appendChild(navIndicator);

    const pages = [
        { id: 'home', label: '首页', icon: icons.home },
        { id: 'settings', label: '设置', icon: icons.settings },
        { id: 'links', label: '链接', icon: icons.links },
    ];

    let currentPage = null;
    let pageSwitchToken = 0;

    function syncNav(pageId) {
        navBar.dataset.active = pageId;
        navBar.querySelectorAll('.window-pageLink').forEach((el) => {
            const active = el.dataset.page === pageId;
            el.classList.toggle('is-active', active);
            el.setAttribute('aria-current', active ? 'page' : 'false');
        });
    }

    function switchTo(pageId) {
        if (currentPage === pageId) {
            return;
        }
        currentPage = pageId;
        syncNav(pageId);
        const token = ++pageSwitchToken;
        const renderers = {
            home: renderHomePage,
            settings: renderSettingsPage,
            links: renderLinksPage,
        };
        const render = renderers[pageId] || renderHomePage;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            render();
            return;
        }
        displayArea.classList.add('is-switching');
        window.setTimeout(() => {
            if (token !== pageSwitchToken) {
                return;
            }
            render({ fromSwitch: true });
            requestAnimationFrame(() => {
                if (token !== pageSwitchToken) {
                    return;
                }
                displayArea.classList.remove('is-switching');
            });
        }, 140);
    }

    pages.forEach((page) => {
        const pageLink = document.createElement('button');
        pageLink.type = 'button';
        pageLink.className = 'window-pageLink';
        pageLink.dataset.page = page.id;
        pageLink.title = page.label;
        pageLink.setAttribute('aria-label', page.label);
        pageLink.appendChild(createIcon(page.icon));
        pageLink.addEventListener('click', () => switchTo(page.id));
        navBar.appendChild(pageLink);
    });

    // 创建内容显示区域
    const displayArea = document.createElement('div');
    displayArea.id = 'window-display';

    // 组装元素
    contentDiv.appendChild(navBar);
    contentDiv.appendChild(displayArea);
    windowDiv.appendChild(header);
    windowDiv.appendChild(contentDiv);
    windowRoot.appendChild(windowDiv);
    document.body.appendChild(windowRoot);
    applyWindowPosition(windowDiv.offsetLeft, windowDiv.offsetTop);
    renderHomePage();

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
        applyWindowPosition(windowDiv.offsetLeft, windowDiv.offsetTop, true);
    });

    // 拖动功能
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) {
            return;
        }
        e.preventDefault();
        isDragging = true;
        offsetX = e.clientX - windowDiv.offsetLeft;
        offsetY = e.clientY - windowDiv.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) {
            return;
        }
        applyWindowPosition(e.clientX - offsetX, e.clientY - offsetY);
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        applyWindowPosition(windowDiv.offsetLeft, windowDiv.offsetTop, true);
    }

    window.addEventListener('resize', () => {
        applyWindowPosition(windowDiv.offsetLeft, windowDiv.offsetTop, true);
    });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            applyWindowPosition(windowDiv.offsetLeft, windowDiv.offsetTop, true);
        });
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

    function renderLinksPage(options = {}) {
        if (!options.fromSwitch) {
            pageSwitchToken += 1;
            displayArea.classList.remove('is-switching');
        }
        currentPage = 'links';
        syncNav('links');
        displayArea.innerHTML = '';

        const groups = [
            {
                title: '本脚本',
                items: [
                    {
                        name: '官网',
                        desc: '使用文档与题库',
                        href: 'https://pages.zaizhexue.top/',
                        icon: 'site',
                    },
                    {
                        name: 'GitHub',
                        desc: '源码仓库',
                        href: 'https://github.com/Miaozeqiu/ZjoocEasyJS',
                        icon: 'github',
                    },
                ],
            },
            {
                title: '其他平台',
                items: [
                    {
                        name: 'OCS 网课助手',
                        tags: ['学习通', '智慧树', '中国大学MOOC', '雨课堂（更新中）', '职教云', '智慧职教'],
                        href: 'https://docs.ocsjs.com/',
                        icon: 'ocs',
                    },
                ],
            },
            {
                title: '题库',
                items: [
                    {
                        name: 'ZE 题库',
                        desc: 'ZError AI 在线题库',
                        badge: 'OCS 官方授权',
                        href: 'https://tiku.zerror.cc',
                        icon: 'tiku',
                    },
                ],
            },
        ];

        const root = document.createElement('div');
        root.className = 'ze-links';
        groups.forEach((group) => {
            const section = document.createElement('div');
            section.className = 'ze-links-group';
            const heading = document.createElement('div');
            heading.className = 'ze-links-title';
            heading.textContent = group.title;
            section.appendChild(heading);
            group.items.forEach((item) => {
                const link = document.createElement('a');
                link.className = 'ze-link-card';
                link.href = item.href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';

                const text = document.createElement('div');
                text.className = 'ze-link-text';
                const title = document.createElement('strong');
                title.textContent = item.name;
                text.appendChild(title);
                if (item.desc) {
                    const desc = document.createElement('span');
                    desc.textContent = item.desc;
                    text.appendChild(desc);
                }
                if (item.badge) {
                    const badge = document.createElement('em');
                    badge.className = 'ze-link-badge';
                    badge.textContent = item.badge;
                    text.appendChild(badge);
                }
                if (item.tags && item.tags.length) {
                    const tags = document.createElement('div');
                    tags.className = 'ze-link-tags';
                    item.tags.forEach((label) => {
                        const tag = document.createElement('span');
                        tag.className = 'ze-link-tag';
                        if (label.includes('更新中')) {
                            tag.classList.add('is-wip');
                        }
                        tag.textContent = label;
                        tags.appendChild(tag);
                    });
                    text.appendChild(tags);
                }

                link.appendChild(createLinkIcon(item.icon));
                link.appendChild(text);
                section.appendChild(link);
            });
            root.appendChild(section);
        });
        displayArea.appendChild(root);
    }

    // 设置页面
    function renderSettingsPage(options = {}) {
        if (!options.fromSwitch) {
            pageSwitchToken += 1;
            displayArea.classList.remove('is-switching');
        }
        currentPage = 'settings';
        syncNav('settings');
        displayArea.innerHTML = '';

        const userInfoContainer = document.createElement('div');
        userInfoContainer.setAttribute('id', 'userInfoContainer');

        const userInfo = document.createElement('div');
        userInfo.appendChild(createUserAvatar({
            userId: settings.userId,
            name: settings.username,
        }));
        if (loginState.logged && settings.token && !settings.userId) {
            syncUserAvatar();
        }

        const userTextContainer = document.createElement('div');
        userTextContainer.setAttribute('id', 'userTextContainer');

        const username = document.createElement('span');
        username.textContent = settings.username;
        username.setAttribute('id', 'username');
        userTextContainer.appendChild(username);

        const createTime = document.createElement('span');
        createTime.setAttribute('id', 'createTime');
        createTime.textContent = settings.createTime || '';
        userTextContainer.appendChild(createTime);

        const userDataContainer = document.createElement('div');
        userDataContainer.setAttribute('id', 'userDataContainer');

        if (!loginState.logged) {
            userInfoContainer.style.display = 'none';
        } else {
            userInfoContainer.style.display = 'flex';
        }

        userInfoContainer.appendChild(userInfo);
        userInfoContainer.appendChild(userTextContainer);
        displayArea.appendChild(userInfoContainer);


        const imgContainer = document.createElement('div');
        imgContainer.setAttribute('id', 'imgContainer');
        if (loginState.logged) {
            imgContainer.style.display = 'none';
        } else {
            imgContainer.style.display = 'flex';
        }
        imgContainer.style.width = '100%';
        imgContainer.style.marginBottom = '20px';
        const qrImage = document.createElement('img');
        qrImage.src = imageData['weChatQr'];
        qrImage.style.width = '50%';
        imgContainer.appendChild(qrImage);

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
            await toggleButtonState(btn, true, loginState);
        });
        if (loginState.code) {
            const iconContainer = btn.querySelector('.icon');
            btn.classList.add('loading');
            iconContainer.innerHTML = `<div class="VerificationCode">${loginState.code}<div>`;
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


        // 创建“课件速刷”开关
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
        DoVideoCheckbox.checked = settings.speedRun;
        DoVideoCheckbox.addEventListener('change', async function () {
            if (!settings.speedRun) {
                const result = await showConfirmDialog(`不建议开启，关闭该选项也可以使用"自动播放"挂课，但开启后"自动播放"将在几秒内完成所有课件，会有被清空的风险，因此除真的非来不及，否则不建议开启！`);
                if (!result) {
                    renderSettingsPage();
                    return;
                }
            }
            settings.speedRun = this.checked;
        });



        displayArea.appendChild(DoVideoWrapper);
        displayArea.appendChild(examModeWrapper);


        applySwitchStyles();
    }

    function renderHomePage(options = {}) {
        if (!options.fromSwitch) {
            pageSwitchToken += 1;
            displayArea.classList.remove('is-switching');
        }
        currentPage = 'home';
        syncNav('home');
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
        if (!runtime.showAnswer) {
            showAnswerButton.textContent = '显示答案';
        } else {
            showAnswerButton.textContent = '隐藏答案';
        }
        showAnswerButton.classList.add('showAnswerButton', 'ze-action-button');

        showAnswerButton.addEventListener('click', async () => {
            await toggleAnswers();
        });

        // 创建“初始化同步”按钮
        const syncButton = document.createElement('button');
        syncButton.textContent = '解除复制限制';
        syncButton.classList.add('ze-action-button');
        syncButton.addEventListener('click', initializeEditorSync);




        // 创建“自动播放视频”按钮
        const autoplayButton = document.createElement('button');
        autoplayButton.setAttribute('id', 'autoplay-button-id');
        if (!runtime.isPlaying) {
            autoplayButton.textContent = '自动播放';
        } else {
            autoplayButton.textContent = '停止自动播放';
        }
        autoplayButton.classList.add('ze-action-button');

        autoplayButton.addEventListener('click', async function () {
            if (autoplayButton.innerText === '自动播放') {
                const myRun = ++runtime.autoPlayRunId;
                runtime.isPlaying = true;
                // 如果文本是"开始自动播放"，启动自动播放
                autoplayButton.innerText = '停止自动播放';
                let msg = null;
                try {
                // 检测当前域名是否为 www.zjooc.cn
                if (window.location.hostname !== 'www.zjooc.cn') {
                    displaySuccessNotification('该功能尚不完善', '如想为该功能优化做测试，请前往脚本官网联系开发者');
                        msg = await autoPlayZJLLL();
                    } else {
                        const chapters = getCurrentCourseChapters();
                        if (!chapters) {
                            msg = ["error", "没有拿到当前课程的章节数据，请刷新页面后重新进入章节内容"];
                        } else {
                            runtime.stopFloatingImage = createFloatingImageWorld();
                            msg = await autoPlay(chapters, routeGuard);
                        }
                    }
                } catch (error) {
                    console.error('自动播放出错:', error);
                    msg = ["error", `自动播放出错：${error.message}`];
                }
                    console.log(msg);

                if (myRun !== runtime.autoPlayRunId) return;
                autoplayButton.innerText = '自动播放';
                runtime.isPlaying = false;
                stopFloatingImageSafely();

                if (msg && msg[0] === "error") {
                    displayErrorNotification('自动播放未完成', [msg[1]]);
                } else if (msg) {
                        displaySuccessNotification(msg[1], '');
                    }
            } else {
                runtime.autoPlayRunId++;
                runtime.isPlaying = false;
                stopAllAutoPlay('用户点击停止');
                autoplayButton.innerText = '自动播放';
                stopFloatingImageSafely();
                displaySuccessNotification('已停止自动播放', '');
            }
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

        const speedRow = document.createElement('div');
        speedRow.className = 'ze-speed-row';

        const speedText = document.createElement('div');
        speedText.className = 'ze-speed-label';
        speedText.textContent = '视频倍速';

        // 创建外部容器
        const radioInputDiv = document.createElement('div');
        radioInputDiv.classList.add('radio-input');
        const currentSpeed = settings.speed;

        // 创建第一个label
        const label1 = document.createElement('label');
        const input1 = document.createElement('input');
        input1.type = 'radio';
        input1.name = 'video_speed';
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
        input2.name = 'video_speed';
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
        input3.name = 'video_speed';
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
        input4.name = 'video_speed';
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



        speedRow.appendChild(speedText);
        speedRow.appendChild(radioInputDiv);
        bodyContainer.appendChild(speedRow);


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
                    loginState.logged = true;

                    // 更新用户信息显示
                    let userInfoContainer = document.getElementById('userInfoContainer');
                    if (userInfoContainer) userInfoContainer.style.display = 'flex';
                    let imgContainer = document.getElementById('imgContainer');
                    if (imgContainer) imgContainer.style.display = 'none';

                    settings.username = data.user.nickname;
                    await syncUserAvatar(data.user);

                    const createTimeElement = document.getElementById('createTime');
                    const userCreatedTime = new Date(data.user.createdTime);
                    const formattedDate = `${userCreatedTime.getMonth() + 1}/${userCreatedTime.getDate()}/${userCreatedTime.getFullYear()}`;
                    if (createTimeElement) createTimeElement.textContent = formattedDate;
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

        if (runtime.showAnswer) {
            displayRightAnswers();
        }

    };


    installNetworkHooks();

    if (settings.examMode) {
        const scriptWindow = document.getElementById('scriptWindow');
        if (scriptWindow) {
            if (scriptWindow.style.display === 'none') {
                scriptWindow.style.display = 'block';
            } else {
                scriptWindow.style.display = 'none';
            }
        }
    }
    window.addEventListener('keydown', function (event) {
        if (event.keyCode === 113) {
            toggleAnswers();
        }
        if (event.keyCode === 120) {
            const scriptWindow = document.getElementById('scriptWindow');
            if (scriptWindow) {
                scriptWindow.style.display = scriptWindow.style.display === 'none' ? 'block' : 'none';
            }
        }
    });

    installHistoryHooks({
        onLeaveChapterPage(href) {
            runtime.autoPlayRunId++;
            runtime.isPlaying = false;
            stopAllAutoPlay('页面已离开章节内容：' + href);
            const autoplayButton = document.getElementById('autoplay-button-id');
            if (autoplayButton) {
                autoplayButton.innerText = '自动播放';
            }
            stopFloatingImageSafely();
        },
        refreshAnswersForNewPage
    });
})();
