import Matter from './matter.min.js';
import { imageData } from './imageBase64.js';
export default function createFloatingImageWorld(imageKey = 'defaultImage') {
    const imageSrc = imageData[imageKey];
    const engine = Matter.Engine.create({
        gravity: {
            x: 0,
            y: 0,
            scale: 0
        }
    });
    const world = engine.world;
    // 存储清理函数需要的引用
    let runner;
    let floatingImage;
    let mouseConstraint;

    // 设置窗口边界
    const createWalls = () => {
        const thickness = 999;  // 增加边界厚度
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        return [
            Matter.Bodies.rectangle(width / 2, -thickness / 2, width, thickness, { isStatic: true }), // 上边界
            Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { isStatic: true }), // 左边界
            Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true }), // 右边界
            Matter.Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { isStatic: true }) // 下边界
        ];
    };
    // 存储当前的墙体
    let currentWalls = [];
    // 更新边界位置
    const updateWalls = () => {
        // 移除旧的墙体
        Matter.World.remove(world, currentWalls);
        // 创建新的墙体
        currentWalls = createWalls();
        Matter.World.add(world, currentWalls);
    };
    // 创建浮动图片
    const createFloatingImage = (src) => {
        // 创建DOM元素
        const img = document.createElement('img');
        img.src = src;
        img.style.position = 'fixed';
        img.style.transform = 'translate(-50%, -50%)';
        img.style.pointerEvents = 'auto';  // 改为 auto 以启用鼠标事件
        img.style.zIndex = '9999';
        img.style.width = '130px';
        
        // 添加鼠标事件监听器
        img.addEventListener('dragstart', (e) => e.preventDefault());
        img.addEventListener('contextmenu', (e) => e.preventDefault());
        
        document.body.appendChild(img);
        console.log('已经创建图片标签');
        // 等待图片加载完成后创建物理实体
        return new Promise((resolve) => {
            img.onload = () => {
                const body = Matter.Bodies.rectangle(
                    window.innerWidth / 2,
                    window.innerHeight / 2,
                    130,
                    191,
                    {
                        restitution: 0.8,
                        frictionAir: 0.002,
                        render: { visible: false },
                        chamfer: { radius: 5 }
                    }
                );
                // 设置随机的初始速度
                Matter.Body.setVelocity(body, {
                    x: (Math.random() - 0.5) * 5,
                    y: (Math.random() - 0.5) * 5
                });
    
                // 设置随机的初始角速度
                Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
    
                // 改进位置同步逻辑
                Matter.Events.on(engine, 'beforeUpdate', () => {
                    // 重置变换
                    img.style.transform = '';
                    img.style.left = '0';
                    img.style.top = '0';
                    
                    // 应用新的变换
                    const angle = body.angle;
                    const translateX = body.position.x;
                    const translateY = body.position.y;
                    
                    // 使用单次变换，避免累积误差
                    img.style.transform = `
                        translate(${translateX}px, ${translateY}px)
                        translate(-50%, -50%)
                        rotate(${angle}rad)
                    `;
                });
    
                resolve(body);
            };
        });
    };
    // 初始化场景
    const init = async () => {
        currentWalls = createWalls();
        Matter.World.add(world, currentWalls);
        
        try {
            // 添加图片（等待加载完成）
            const imageBody = await createFloatingImage(imageSrc);
            floatingImage = imageBody;  // 保存引用
            Matter.World.add(world, imageBody);
    
            // 添加鼠标控制（可选）
            const mouse = Matter.Mouse.create(document.body);
            mouseConstraint = Matter.MouseConstraint.create(engine, { mouse });
            Matter.World.add(world, mouseConstraint);
    
            // 运行动画并保存runner引用
            runner = Matter.Runner.run(engine);
        } catch (error) {
            console.error('初始化失败:', error);
        }
    };
    // 添加停止函数
    const stop = () => {
        // 停止物理引擎
        if (runner) {
            Matter.Runner.stop(runner);
        }
    
        // 移除所有物体
        if (floatingImage) {
            Matter.World.remove(world, floatingImage);
        }
        if (mouseConstraint) {
            Matter.World.remove(world, mouseConstraint);
        }
        Matter.World.remove(world, currentWalls);
    
        // 移除所有事件监听器
        window.removeEventListener('resize', updateWalls);
        window.removeEventListener('load', init);
    
        // 移除DOM中的图片元素
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.style.position === 'fixed' && img.style.zIndex === '9999') {
                img.remove();
            }
        });
    };
    // 移除 load 事件监听，直接调用初始化
    init().catch(error => console.error('初始化过程出错:', error));
    // 窗口大小变化处理
    window.addEventListener('resize', () => {
        // 更新边界
        updateWalls();
        console.log('已经更新边界');
        // 重新设置渲染器尺寸
        document.body.style.width = window.innerWidth + 'px';
        document.body.style.height = window.innerHeight + 'px';
    });
    // 等待图片加载
    window.addEventListener('load', init);
    // 返回停止函数供外部使用
    return stop;
}