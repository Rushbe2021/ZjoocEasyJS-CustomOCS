export default function createPushButton({
    text = '保存',
    onClick = () => console.log('Button clicked!')
  } = {}) {
    // 创建按钮元素
    const button = document.createElement('button');
    button.className = 'btn';
    button.innerText = text;
    
  
    // 添加点击事件
    button.addEventListener('click', onClick);
  
    // 动态注入CSS（只会执行一次）
    const addStyles = () => {
      const css = `
        .btn {
            width: 80px;
            border-radius: 8px;
            background-color:rgb(111, 181, 255);
            color: white;
            font-weight: 800;
            transition: scale 0.2s;
        }
        .btn:active  {
            scale: 0.9;
        }
  
      `;
  
      const style = document.createElement('style');
      style.textContent = css;
      document.head.append(style);
      return true;
    };
  
    // 保证样式只注入一次
    if (!createPushButton.stylesAdded) {
      createPushButton.stylesAdded = addStyles();
    }
  
    return button;
  }
  
