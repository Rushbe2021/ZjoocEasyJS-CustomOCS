// 修复/dist空白页

export default function fixBlankPage(LoggedWarpper){
    // 获取当前路径
    const currentPath = window.location.pathname;
    
    // 检查是否为 /dist 路径
    if (currentPath === '/dist' || currentPath === '/dist/') {
        // 跳转到根路径
        console.log('跳转到根路径');
        window.location.href = '/';
        LoggedWarpper.Logged = true;
    }
}
