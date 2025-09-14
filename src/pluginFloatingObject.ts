import joplin from '../api';

/**
 * 悬浮窗体相关代码。
 */

const FLOATING_OBJECT_ID = 'notellm-floating-object';
export const FLOATING_OBJECT_BG = '#4d53b3'; // 深蓝  // 'rgba(10, 100, 200, 0.9)';
export const COLOR_FLOAT_FINISH = '#3bba9c'  // 绿色
export const COLOR_FLOAT_SETTING = '#535f80'  // 蓝灰提示
export const COLOR_FLOAT_NORMAL = '#388087' // 青绿色
export const COLOR_FLOAT_WARNING = '#e67235'  // 橙色警告

export const COLOR_FLOAT = {
    BG: FLOATING_OBJECT_BG,
    FINISH: COLOR_FLOAT_FINISH,
    SETTING: COLOR_FLOAT_SETTING,
    NORMAL: COLOR_FLOAT_NORMAL,
    WARNING: COLOR_FLOAT_WARNING
}

export function add_floating_object (text: string, floatId:string, 
    bgColor:string = FLOATING_OBJECT_BG) {
    //
    // 1. 检查悬浮对象是否已存在
    let floatingEl = document.getElementById(floatId);

    // 2. 如果不存在，则创建它
    if (!floatingEl) {
        floatingEl = document.createElement('div');
        floatingEl.id = floatId;
        
        // 关键：使用 position: fixed 来实现窗口级悬浮
        floatingEl.style.position = 'fixed';//'absolute';
        // floatingEl.style.right = '20%';
        // floatingEl.style.left = '20%';
        floatingEl.style.right = '-100px';
        floatingEl.style.bottom = '60px';
        // floatingEl.style.transform = 'translateX(-50%)';

        // 设置一个较高的 z-index 确保它在 Joplin 其他 UI 之上
        floatingEl.style.zIndex = '2048'; 
        
        // 添加一些样式让它更显眼
        floatingEl.style.padding = '10px 80px 10px 40px';
        floatingEl.style.boxShadow = '2px 2px 5px rgba(0, 0, 0, 0.2)';
        floatingEl.style.opacity = '0.0';
        floatingEl.style.backgroundColor = bgColor;
        floatingEl.style.color = 'white';
        floatingEl.style.borderRadius = '60px';
        floatingEl.style.fontFamily = 'sans-serif';
        floatingEl.style.fontSize = '14px';
        floatingEl.style.transition = 'all 200ms ease';
        floatingEl.style.minWidth = '120px';
        
        // 只用于显示，不允许任何操作交互，避免干扰
        floatingEl.style.pointerEvents = 'none';
        floatingEl.style.userSelect = 'none';
        
        // 将其添加到主文档的 body 中，而不是编辑器内部
        document.body.appendChild(floatingEl);

    }
    
    // 3. 更新其内容
    // floatingEl.textContent = text;  // 纯文本
    floatingEl.innerHTML = text;  // 兼容 html 元素
    setTimeout(() => {
        floatingEl.style.opacity = '1';
        floatingEl.style.right = '-60px';
    }, 10);
}

export function remove_floating_object (floatId:string) {
    const floatingEl = document.getElementById(floatId);
    if (floatingEl) {
        floatingEl.style.opacity = '0';
        floatingEl.style.right = '-100px';
        setTimeout(() => {
            floatingEl.remove();
        }, 500);
        // floatingEl.remove();
    }
}

export function temp_floating_object( text: string, floatId:string, bgColor:string = FLOATING_OBJECT_BG, ms: number = 2000){
    //
    add_floating_object(text, floatId, bgColor);
    //
    setTimeout(() =>{
        remove_floating_object(floatId);
    }, ms);
}

function get_html_template (temp_type:string) {
    
}

export const FLOATING_HTML_THINKING = `
    <div class="scoped-thinking-loader">
    <!-- 内部CSS样式和动画定义 -->
    <style>
        /* 
        * 所有样式都封装在 .scoped-thinking-loader 内部，以避免全局样式冲突。
        */
        .scoped-thinking-loader {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        min-height: 30px; /* 确保有足够的高度来展示动画 */
        font-family: 'Arial', sans-serif; /* 您可以更换成您喜欢的字体 */
        font-size: 1rem; /* 字体大小 */
        color: #FFFFFF; /* 字体颜色 */
        }

        /* 每个字母的容器 */
        .scoped-thinking-loader .letter-container {
        display: flex;
        }

        /* 应用于每个字母的动画 */
        .scoped-thinking-loader .letter {
        /* 
        * 动画名称: scoped-letter-bounce
        * 持续时间: 1.4s
        * 速度曲线: ease-in-out (慢-快-慢，效果更自然)
        * 循环次数: infinite (无限循环)
        */
        animation: scoped-letter-bounce 2.5s linear infinite;
        }

        /* 
        * 使用 :nth-child 选择器为每个字母设置不同的动画延迟（animation-delay）
        * 这是实现“不同步”跳动的关键！
        */
        .scoped-thinking-loader .letter:nth-child(1) { animation-delay: 0s; }
        .scoped-thinking-loader .letter:nth-child(2) { animation-delay: 0.2s; }
        .scoped-thinking-loader .letter:nth-child(3) { animation-delay: 0.4s; }
        .scoped-thinking-loader .letter:nth-child(4) { animation-delay: 0.6s; }
        .scoped-thinking-loader .letter:nth-child(5) { animation-delay: 0.8s; }
        .scoped-thinking-loader .letter:nth-child(6) { animation-delay: 1s; }
        .scoped-thinking-loader .letter:nth-child(7) { animation-delay: 1.2s; }
        .scoped-thinking-loader .letter:nth-child(8) { animation-delay: 1.4s; }
        .scoped-thinking-loader .letter:nth-child(9) { animation-delay: 1.6s; }
        .scoped-thinking-loader .letter:nth-child(10) { animation-delay: 1.8s; }
        .scoped-thinking-loader .letter:nth-child(11) { animation-delay: 2.0s; }

        /* 
        * 定义一个唯一的动画名称，避免冲突
        * 0% -> 50% -> 100% 的关键帧定义了一个完整的“跳起再落下”的动作
        */
        @keyframes scoped-letter-bounce {
        0%, 20%, 100% {
            transform: translateY(0px);
        }
        10% { transform: translateY(-5px);}
        }
    </style>

    <!-- HTML结构：将每个字母用 <span> 包裹起来 -->
    <div class="letter-container">
        <span class="letter">T</span>
        <span class="letter">h</span>
        <span class="letter">i</span>
        <span class="letter">n</span>
        <span class="letter">k</span>
        <span class="letter">i</span>
        <span class="letter">n</span>
        <span class="letter">g</span>
        <span class="letter">.</span>
        <span class="letter">.</span>
        <span class="letter">.</span>
    </div>
    </div>`

export function makeJumpingHtml(jumping_str = 'Thinking...') {
    const letters = jumping_str.split('').map((char, index) => {
        const safeChar = char === ' ' ? '&nbsp;' : char;
        return `<span class="letter">${safeChar}</span>`;
    }).join('');

    return `
        <div class="scoped-thinking-loader">
        <style>
            .scoped-thinking-loader {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                min-height: 30px;
                font-family: 'Arial', 'Microsoft YaHei', sans-serif;
                font-size: 1rem;
                color: #FFFFFF;
            }
            .scoped-thinking-loader .letter-container {
                display: flex;
            }
            .scoped-thinking-loader .letter {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                line-height: 1; /* 统一行高 */
                animation: scoped-letter-bounce 5.0s linear infinite;
            }

            ${jumping_str.split('').map((_, i) => {
                const delay = (i * 0.2).toFixed(1);
                return `.scoped-thinking-loader .letter:nth-child(${i + 1}) { animation-delay: ${delay}s; }`;
            }).join('\n')}

            @keyframes scoped-letter-bounce {
                0%, 10%, 100% {
                    transform: translateY(0px);
                }
                5% {
                    transform: translateY(-5px);
                }
            }
        </style>
        <div class="letter-container">
            ${letters}
        </div>
        </div>
    `;
}

export const FLOATING_HTML_WAITING = `
    <div class="scoped-progress-bar-wrapper">
    <!-- CSS样式和动画定义 -->
    <style>
        .scoped-progress-bar-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 10px 0; /* 增加一些内边距，方便展示 */
        }
        .scoped-progress-bar-wrapper .progress-container {
        width: 80%;
        max-width: 300px;
        height: 10px;
        background-color: #ffffff;
        border-radius: 5px;
        overflow: hidden;
        }
        .scoped-progress-bar-wrapper .progress-bar {
        width: 100%;
        height: 100%;
        background-size: 200% 100%;
        background-image: linear-gradient(
            to right,
            #BBBBBB 50%, /* 您可以修改这个颜色 */
            transparent 50%
        );
        animation: scoped-move-progress 1.5s linear infinite;
        }

        /* 定义进度条移动动画 */
        @keyframes scoped-move-progress {
        from {
            background-position: 100% 0;
        }
        to {
            background-position: -100% 0;
        }
        }
    </style>

    <!-- 实现动画的HTML元素 -->
    <div class="progress-container">
        <div class="progress-bar"></div>
    </div>
    </div>
`

export const FLOATING_HTML_BASIC = `
    <div class="scoped-bouncing-loader">
    <!-- CSS样式和动画定义 -->
    <style>
        .scoped-bouncing-loader {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            min-height: 30px;
        }
        .scoped-bouncing-loader .ball {
            width: 8px;
            height: 8px;
            margin: 0 8px;
            background-color: #ffffff; /* 您可以修改这个颜色 */
            border-radius: 50%;
            animation: scoped-bounce 0.6s infinite alternate;
        }
        /* 为第二个和第三个小球设置动画延迟 */
        .scoped-bouncing-loader .ball:nth-child(2) {
            animation-delay: 0.2s;
        }
        .scoped-bouncing-loader .ball:nth-child(3) {
            animation-delay: 0.4s;
        }

        /* 定义跳动动画 */
        @keyframes scoped-bounce {
            from {
                transform: translateY(10px);
            }
            to {
                transform: translateY(-10px);
            }
        }
    </style>

    <!-- 实现动画的HTML元素 -->
    <div class="ball"></div>
    <div class="ball"></div>
    <div class="ball"></div>
    </div>`

    /**
 * 用自定义悬浮体实现的进度显示
 */
export class FloatProgressAnimator {
    // 1. 在顶部声明所有类属性及其类型
    private animation_uuid: string | null;
    private animation_progress_str: string;  // 显示进度的 html 文本
    private is_running: boolean;  // 运行状态
    private height: number;
    private bottom: number;
    private div: any;
    //
    // 这些属性可以在构造时传入，设为 public
    public animation_interval: number;  // 暂时没用
    public is_enabled: boolean;  // 这个数来自设置文件，但最好传参获取
    public bg_color:string;
    //
    constructor(animation_uuid: string = 'notellm_animation', is_enabled: boolean = true, 
        anim_text: string = '', bg_color:string = FLOATING_OBJECT_BG) {
        // 在构造函数中初始化属性
        this.is_enabled = is_enabled;
        this.bg_color = bg_color;
        //
        // 初始化其他内部状态
        this.animation_uuid = animation_uuid;
        this.animation_progress_str = anim_text;
        this.is_running = false;
        if (this.animation_progress_str.trim().length < 1) {  // 如果外部没有定义的话
            this.animation_progress_str = FLOATING_HTML_BASIC
        }
    }
    /**
     * 启动等待动画 (公共方法)
     * @param note_id - 当前笔记的 ID
     */
    public async start(): Promise<void> {
        if (this.is_running || !this.is_enabled) {
            return;
        }
        //
        try {
            //
            this.is_running = true;
            //
            let d = await joplin.commands.execute('editor.execCommand', {
                name: 'cm-addFloatingObject',
                args: [{ text: this.animation_progress_str, floatId: this.animation_uuid, bgColor: this.bg_color }]
            });
            this.height = d['height'];
            this.bottom = d['bottom'];
            console.log(this.animation_uuid);
            console.log(d);
        }
        catch {
            this.stop();
            this.is_running = false;
            return;
        }
    }

    /**
     * 停止等待动画 (公共方法)
     * @param clear_float - 是否需要清除编辑器中的等待文本
     */
    public async stop(clear_float: boolean = true): Promise<void> {
        //
        await joplin.commands.execute('editor.execCommand', {
            name: 'cm-removeFloatingObject',
            args: [this.animation_uuid]
        });
        this.is_running = false;
        //
    }
}

/**
 * 自定义 Toast 管理器
 * 用途：
 * - 生成toast
 * - 关闭toast
 */
export class FloatingToastManager {
    // 1. 在顶部声明所有类属性及其类型
    private animation_uuid: string | null;
    private animation_progress_str: string;  // 显示进度的 html 文本
    private is_running: boolean;  // 运行状态
    private dict_toast = [];
    //
    // 这些属性可以在构造时传入，设为 public
    public is_enabled: boolean;  // 这个数来自设置文件，但最好传参获取
    public bg_color:string;
    //
    constructor(animation_uuid: string = 'notellm_animation', is_enabled: boolean = true, 
        anim_text: string = '', bg_color:string = FLOATING_OBJECT_BG) {
        // 在构造函数中初始化属性
        this.is_enabled = is_enabled;
        this.bg_color = bg_color;
        //
        // 初始化其他内部状态
        this.animation_uuid = animation_uuid;
        this.animation_progress_str = anim_text;
        this.is_running = false;
        if (this.animation_progress_str.trim().length < 1) {  // 如果外部没有定义的话
            this.animation_progress_str = FLOATING_HTML_BASIC
        }
    }

    public async add_toast(toast_id:string, toast_html:string, 
        toast_type:string='default'): Promise<void> {
        // 添加 toast
        //
        if (toast_type == 'default') {
            //
        }
        // 旧的上移

        // 增加新的
        let waitingAnimator = new FloatProgressAnimator('notellm_waiting_anim', true, toast_html);
        this.dict_toast[toast_id] = waitingAnimator;
        this.dict_toast[toast_id].start();
    }

    public async add_temp_toast(): Promise<void> {
        // 临时 toast
        // 定时结束后，检查移动需求

    }

    public async stop_toast(toast_id:string) {
        this.dict_toast[toast_id].stop();
        //
        // 以上的向下移动
    }

    public async stop_all() {
    }
}