// 字体加载函数 (支持异步/await)
export default async function loadFont(fontName, fontUrl) {
    try {
      // 创建字体对象
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
  
      // 加载字体文件
      const loadedFont = await fontFace.load();
  
      // 将字体添加到文档
      document.fonts.add(loadedFont);
  
      // 全局标记已加载 (可选)
      window[`${fontName}Loaded`] = true;
  
      console.log(`字体 ${fontName} 加载成功`);
      return true;
    } catch (error) {
      console.error(`字体加载失败: ${error}`);
      return false;
    }
  }