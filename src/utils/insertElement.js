// 查找最深的子元素
function findDeepestElement(element) {
    let deepestElement = element;

    // 递归查找最深子元素
    for (let child of element.children) {
        // 获取子元素的计算样式
        const computedStyle = getComputedStyle(child);

        // 如果子元素是 input 或者 text-align 是 center，则跳过该元素
        if (child.tagName.toLowerCase() === 'input' || computedStyle.textAlign === 'center') {
            continue;
        }
        if (child.tagName.toLowerCase() === 'span') {
            deepestElement = child;
        }
        // 如果当前是 p 标签，优先考虑它
        if (child.tagName.toLowerCase() === 'p') {
            deepestElement = child;
        }

        // 递归查找更深层的子元素
        const deepChild = findDeepestElement(child);
        if (deepChild && deepChild !== child) {
            // 如果递归返回了更深的元素，更新最深的元素
            deepestElement = deepChild;
        }
    }

    return deepestElement;
}

// 用于解析 HTML 内容并仅返回纯文本
function parseTextContent(content) {
    // 创建一个临时的 DOM 元素并将 HTML 作为其内容
    const div = document.createElement('div');
    div.innerHTML = content;

    // 处理 <img> 标签，确保它们不会被转化为纯文本
    const images = div.querySelectorAll('img');
    images.forEach(img => {
        // 可以在这里做一些图片的额外处理，比如添加默认的 alt 或修改样式
        img.style.maxWidth = '100%'; // 例如设置图片的最大宽度为容器宽度
    });

    // 返回该元素的HTML内容, 其中包括保留的 <img> 标签
    return div.innerHTML;
}

// 插入内容到最深子元素
export default function insertIntoDeepestElement(parentElement, content) {
    const deepestElement = findDeepestElement(parentElement);

    // 保存原始文本，方便撤销
    const originalText = deepestElement.textContent;

    // 创建一个新的 <span> 标签并插入
    const newElement = document.createElement('span'); // 创建内联元素 <span>
    newElement.classList.add('modified');

    // 解析内容并保留 HTML 标签和图片
    const textContent = parseTextContent(content);
    newElement.innerHTML = textContent; // 使用 innerHTML 保留 HTML 标签

    newElement.style.opacity = 0.2;

    // 将新 <span> 标签添加到最深子元素
    deepestElement.appendChild(newElement);

    // 为该元素添加一个自定义属性，表示已修改
    deepestElement.dataset.originalText = originalText;
}

