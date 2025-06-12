import Settings from '../settings.js';
export default function insertButtonAndFetchContent(element) {
    if(Settings.examMode){
        return;
    }
    // ============== 样式增强 ==============
    // 创建样式元素
    const style = document.createElement('style');
    style.textContent = `
        .deepseek-button {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 8px;
            transition: all 0.3s;
            position: relative;
            display: flex;
            align-items: center;
        }

        .deepseek-button svg {
            width: 24px;
            height: 24px;
            transition: transform 0.3s;
        }

        .deepseek-button:hover svg {
            transform: scale(1.1);
        }

        .deepseek-button.loading .icon {
            display: none;
        }

        .deepseek-button .wrapper {
            position: relative;
            width: 24px;
            height: 24px;
            display: none;
        }

        .deepseek-button.loading .wrapper {
            display: block;
        }

        .deepseek-button .circle {
            width: 4px;
            height: 4px;
            position: absolute;
            border-radius: 50%;
            background: #4D6BFE;
            animation: circleBounce 0.5s alternate infinite ease;
        }

        @keyframes circleBounce {
            0% { top: 12px; height: 4px; }
            100% { top: 4px; }
        }

        .deepseek-button .circle:nth-child(1) { left: 15%; }
        .deepseek-button .circle:nth-child(2) { left: 45%; animation-delay: 0.2s; }
        .deepseek-button .circle:nth-child(3) { right: 15%; animation-delay: 0.3s; }

        .response-container {
            display: none;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px;
            margin-left: 12px;
            background: #f8f9fa;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            white-space: pre-wrap;
        }
    `;
    document.head.appendChild(style);

    // 添加 KaTeX 支持
    // 修改 KaTeX 支持部分
    if (!document.getElementById('katex-css')) {
    // 创建一个 Promise 来等待所有脚本加载完成
    const loadKaTeX = new Promise((resolve) => {
        const katexCSS = document.createElement('link');
        katexCSS.id = 'katex-css';
        katexCSS.rel = 'stylesheet';
        katexCSS.href = 'https://fastly.jsdelivr.net/gh/Miaozeqiu/fontRepository/katex.min.css';
        document.head.appendChild(katexCSS);
        
        const katexJS = document.createElement('script');
        katexJS.src = 'https://fastly.jsdelivr.net/gh/Miaozeqiu/fontRepository/katex.min.js';
        
        const katexAutoJS = document.createElement('script');
        katexAutoJS.src = 'https://fastly.jsdelivr.net/gh/Miaozeqiu/fontRepository/auto-render.min.js';
        
        // 确保按顺序加载脚本
        katexJS.onload = () => {
            document.head.appendChild(katexAutoJS);
            katexAutoJS.onload = resolve;
        };
        
        document.head.appendChild(katexJS);
    });
    
    // 将 Promise 存储在全局变量中
    window.katexReady = loadKaTeX;
    }

    // ============== 组件结构优化 ==============
    const button = document.createElement('button');
    button.className = 'deepseek-button';
    button.classList['add']('modified'); // 添加加载状态类
    button.innerHTML = `
<svg t="1740664524049" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4489" width="200" height="200"><path d="M1013.248 166.8608c-10.8032-5.4272-15.5136 4.864-21.8624 10.0864-2.1504 1.7408-3.9936 3.9424-5.7856 5.9392-15.872 17.3056-34.4064 28.672-58.5728 27.2384-35.4304-1.9456-65.6384 9.3696-92.3136 36.9664-5.6832-34.048-24.576-54.3744-53.248-67.3792-15.0016-6.7584-30.208-13.568-40.704-28.2624-7.3728-10.496-9.3184-22.1184-13.056-33.6384-2.304-6.912-4.6592-14.0288-12.4928-15.2576-8.4992-1.3824-11.8272 5.9392-15.1552 12.032-13.4144 24.832-18.5344 52.224-18.0736 80.0256 1.1776 62.464 27.0848 112.128 78.4384 147.5584 5.888 3.9936 7.3728 8.1408 5.5296 14.0288-3.4816 12.1856-7.68 24.0128-11.3664 36.1984-2.304 7.7824-5.8368 9.472-13.9776 6.0416a234.752 234.752 0 0 1-74.0864-51.2c-36.5568-36.0448-69.632-75.776-110.848-106.9056a475.4432 475.4432 0 0 0-29.3376-20.48c-42.0864-41.6768 5.5296-75.8784 16.4864-79.872 11.52-4.2496 3.9936-18.7904-33.2288-18.6368-37.1712 0.1536-71.2192 12.8512-114.5856 29.696-6.3488 2.6112-13.0048 4.5056-19.8656 5.9392a404.8384 404.8384 0 0 0-123.0336-4.352c-80.384 9.216-144.64 47.9232-191.8976 114.0736C3.4816 346.1632-9.8304 436.5312 6.4512 530.7904c17.2032 99.2768 66.9184 181.5552 143.36 245.8624 79.3088 66.56 170.5984 99.2256 274.688 92.9792 63.232-3.6864 133.6832-12.288 213.0944-80.8448 20.0704 10.1376 41.0624 14.1824 75.9808 17.2544 26.88 2.56 52.736-1.3824 72.7552-5.5808 31.3856-6.7584 29.184-36.352 17.8688-41.8304-91.9552-43.6224-71.7824-25.856-90.1632-40.192 46.7456-56.4224 117.1968-114.944 144.7424-304.5376 2.0992-15.104 0.256-24.5248 0-36.7616-0.2048-7.3728 1.4336-10.2912 9.7792-11.1616 23.04-2.6624 45.4144-9.1136 65.9456-20.6336 59.5968-33.1776 83.5584-87.6032 89.2416-152.9344 0.8704-9.9328-0.1536-20.3264-10.4448-25.6zM494.08 754.6368c-89.088-71.424-132.3008-94.9248-150.1696-93.9008-16.64 0.9728-13.6704 20.4288-10.0352 33.1264 3.84 12.4928 8.8576 21.1456 15.872 32.1024 4.864 7.3216 8.192 18.176-4.8128 26.2656-28.672 18.176-78.592-6.144-80.9472-7.3216-58.112-34.816-106.6496-80.7936-140.8512-143.7184a445.7984 445.7984 0 0 1-55.3984-194.9184c-0.8192-16.7936 3.9936-22.7328 20.3264-25.7024 21.504-4.096 43.776-4.9152 65.28-1.7408 90.9312 13.568 168.3968 55.04 233.2672 120.6272 37.0688 37.4272 65.1264 82.0736 94.0032 125.7472 30.72 46.336 63.744 90.4704 105.7792 126.6688 14.848 12.6976 26.7264 22.3744 38.0416 29.4912-34.2016 3.84-91.2896 4.7104-130.304-26.7776z m42.752-280.064a13.2096 13.2096 0 0 1 17.7152-12.4928 11.52 11.52 0 0 1 4.8128 3.2256 13.1072 13.1072 0 0 1 3.6864 9.2672 13.2096 13.2096 0 0 1-13.2096 13.3632 13.056 13.056 0 0 1-13.0048-13.312z m132.608 69.4272c-8.448 3.5328-16.9472 6.656-25.088 6.9632a53.0944 53.0944 0 0 1-34.0992-11.0592c-11.6736-9.9328-19.968-15.5136-23.552-33.024a78.2336 78.2336 0 0 1 0.6656-25.5488c3.072-14.2336-0.3072-23.296-10.1376-31.5904-8.0384-6.8096-18.176-8.6016-29.3888-8.6016a23.5008 23.5008 0 0 1-10.8544-3.4304 11.1616 11.1616 0 0 1-4.864-15.5648 50.688 50.688 0 0 1 8.192-9.1136c15.2064-8.8064 32.7168-5.888 48.896 0.6656 15.0528 6.2976 26.368 17.7664 42.7008 33.9456 16.7424 19.6608 19.712 25.1392 29.2352 39.7824 7.4752 11.5712 14.336 23.3984 19.0464 36.9664 2.816 8.3968-0.8704 15.36-10.752 19.6096z" fill="#4D6BFE" p-id="4490"></path></svg>
        <div class="wrapper">
            <div class="circle"></div>
            <div class="circle"></div>
            <div class="circle"></div>
        </div>
    `;
    element.appendChild(button);

    const outputElement = document.createElement('div');
    outputElement.className = 'response-container';
    outputElement.classList.add('modified');
    element.appendChild(outputElement);

    let abortController = null;

    // ============== 交互优化 ==============
    function updateButtonState(loading = false, error = false) {
        button.disabled = loading;
        button.classList[loading ? 'add' : 'remove']('loading');

    }

    // ============== 滚动优化 ==============
    function keepScrolledToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }

    button.addEventListener('click', async function () {
        if (button.disabled) return;
        
        // 初始化状态
        updateButtonState(true);
        outputElement.innerHTML = '';
        outputElement.style.display = 'block';
        abortController = new AbortController();

        try {
            // 获取元素的所有子节点，包括文本和图片
            const nodes = Array.from(element.querySelectorAll('*'));
            let combinedContent = '';
            
            // 递归处理节点，保持文本和图片的顺序
            function processNode(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    // 处理文本节点
                    const text = node.textContent.trim();
                    if (text) combinedContent += text + ' ';
                } else if (node.nodeName === 'IMG') {
                    // 处理图片节点
                    const alt = node.getAttribute('alt');
                    if (alt) combinedContent += `[图片: ${alt}] `;
                } else {
                    // 递归处理子节点
                    Array.from(node.childNodes).forEach(child => processNode(child));
                }
            }
            
            // 处理整个元素
            processNode(element);
            
            // 如果没有提取到内容，使用备用方法
            if (!combinedContent.trim()) {
                combinedContent = element.textContent.trim();
            }
            
            if (!combinedContent) {
                outputElement.innerHTML = `<div class="error-message">⚠️ 未找到可提取的文本内容</div>`;
                return;
            }
            
            var apiUrl = 'https://api.csid.cc/deepseek';
            if (Settings.deepseekProxy) {
                apiUrl = 'http://localhost:5233'
            }
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Settings.token}`,
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    // model: "deepseek-v3",
                    messages: [
                        { 
                            role: "system", 
                            content: "你是有用的人工智能助手，请用清晰格式回答，适当使用段落和列表，但不要使用markdown格式，并且在开头都要回答出你认为对的回答" 
                        },
                        { role: "user", content: combinedContent }
                    ],
                    stream: true
                }),
                signal: abortController.signal
            });

            if (!response.ok) {
                response.json().then(data => {
                    if (data.error === 'Authorization limit reached') {
                        outputElement.innerHTML = `<div>请求失败：今日使用次数已用完,请尝试</div><a href='https://pages.zaizhexue.top/home/DeepSeek' target='_blank'>DeepSeekProxy</a>`;
                    } else {
                        outputElement.textContent = `请求失败: ${response.status}`;
                    }
                }).catch(() => {
                    outputElement.textContent = `请求失败: ${response.status}`;
                }).finally(() => {
                    throw new Error(`请求失败: ${response.status}`);
                });
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                console.log('lines:', lines);
                lines.forEach(line => {
                    if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                        try {
                            const { choices } = JSON.parse(line.slice(6));
                            if (choices?.[0]?.delta?.content) {
                                // 渐进式渲染优化
                                outputElement.innerHTML += choices[0].delta.content;
                                keepScrolledToBottom(outputElement);
                                
                                // 尝试渲染 LaTeX 公式
                                if (window.renderMathInElement && outputElement.querySelectorAll('.katex').length === 0) {
                                    try {
                                        window.renderMathInElement(outputElement, {
                                            delimiters: [
                                                {left: '$$', right: '$$', display: true},
                                                {left: '$', right: '$', display: false},
                                                {left: '\\(', right: '\\)', display: false},
                                                {left: '\\[', right: '\\]', display: true}
                                            ],
                                            throwOnError: false
                                        });
                                    } catch (e) {
                                        console.error('LaTeX 渲染错误:', e);
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('解析错误:', e);
                        }
                    }
                });
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                outputElement.innerHTML += `<div class="error-message">⚠️ 请求中断：${e}</div><a href='https://pages.zaizhexue.top/home/DeepSeek' target="_blank">使用教程</a>`;
            }
        } finally {
            updateButtonState(false);
            // 确保所有 LaTeX 公式都被渲染
            setTimeout(() => {
                if (window.renderMathInElement) {
                    try {
                        window.renderMathInElement(outputElement, {
                            delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '$', right: '$', display: false},
                                {left: '\\(', right: '\\)', display: false},
                                {left: '\\[', right: '\\]', display: true}
                            ],
                            throwOnError: false
                        });
                    } catch (e) {
                        console.error('LaTeX 渲染错误:', e);
                    }
                }
            }, 500);
        } 
    });
}
