import { runtime } from '../../core/runtime.js';

export default function fixBlankPage() {
    const currentPath = window.location.pathname;
    if (currentPath === '/dist' || currentPath === '/dist/') {
        console.log('跳转到根路径');
        window.location.href = '/';
        runtime.loginState.logged = true;
    }
}
