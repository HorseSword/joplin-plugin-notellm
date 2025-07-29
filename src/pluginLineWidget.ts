import joplin from '../api';

/**
 * text animation class
 * 
// 1. 插件初始化时，创建一个实例
// const waitingAnimator = new TextProgressAnimator();

// 2. 当需要开启动画时
// await waitingAnimator.start();

// 3. 当需要关闭动画时
// await waitingAnimator.stop();
 */

class TextProgressAnimator {
    // 1. 在顶部声明所有类属性及其类型
    private note_id: string | null;  // 记录笔记编号，避免中途切换
    private animation_interval_id: any; // setTimeout 返回的 ID 类型在不同环境（Node/Browser）可能不同，any 是最简单的选择
    private animation_start_pos: number | null;  // 开始位置
    private animation_end_pos: number | null;  // 结束位置
    private animation_row: number | null;
    private animation_uuid: string | null;
    private animation_progress_str: string;  // 
    private animation_index: number; // 当前的动画序号
    private is_running: boolean;  // 运行状态
    //
    // 这些属性可以在构造时传入，设为 public
    public animation_interval: number;
    public is_enabled: boolean;  // 这个数来自设置文件，但最好传参获取
    //
    // 私有常量
    private readonly animationStates: string[];
    //
    constructor(animation_interval: number = 100, is_enabled: boolean = true, anim_text: string = 'Waiting') {
        // 在构造函数中初始化属性
        this.animation_interval = animation_interval;
        this.is_enabled = is_enabled;
        //
        // 初始化其他内部状态
        this.note_id = null;
        this.animation_interval_id = null;
        this.animation_start_pos = null;
        this.animation_end_pos = null;
        this.animation_row = null;
        this.animation_uuid = 'widget-' + Date.now();
        this.animation_progress_str = '';
        this.animation_index = 0;
        this.is_running = false;
        this.animationStates = [
            `(${anim_text}......)`, `(.${anim_text}.....)`, `(..${anim_text}....)`, 
            `(...${anim_text}...)`, `(....${anim_text}..)`, `(.....${anim_text}.)`, 
            `(......${anim_text})`, `(.....${anim_text}.)`, `(....${anim_text}..)`, 
            `(...${anim_text}...)`, `(..${anim_text}....)`, `(.${anim_text}.....)`,
        ];
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
            let current_note = await joplin.workspace.selectedNote();
            this.note_id = current_note.id;
            this.is_running = true;
            //
            // 获取当前的光标位置
            let tmp_cur_pos = await joplin.commands.execute('editor.execCommand', {
                name: 'cm-getCursorPos'
            });
            this.animation_start_pos = tmp_cur_pos.startLine.from + tmp_cur_pos.startPosition.column;
            this.animation_end_pos = this.animation_start_pos;
            this.animation_index = 0;
            this.animation_row = tmp_cur_pos.endLine.number - 1;
        }
        catch {
            this.note_id = null;
            this.is_running = false;
            return;
        }
        //
        // 立即执行第一次动画，然后设置下一次的延时
        this.animate();
    }

    /**
     * 停止等待动画 (公共方法)
     * @param clear_text - 是否需要清除编辑器中的等待文本
     */
    public async stop(clear_text: boolean = true): Promise<void> {
        //
        if (!this.is_running) {
            return;
        }
        await joplin.commands.execute('editor.execCommand', {
            name: 'cm-removeFloatingObject',
            args: [this.animation_uuid]
        });
        //
        if (this.animation_interval_id) {
            clearTimeout(this.animation_interval_id);
            this.animation_interval_id = null;
        }
        else {
            return;
        }
        //
        if (clear_text) {
            // await joplin.commands.execute('editor.execCommand', {
            //     name: 'cm-replaceRange',
            //     args: [this.animation_start_pos, this.animation_end_pos, '']  // 删除等待文本
            // });
            // await joplin.commands.execute('editor.execCommand', {
            //     name: 'cm-removeLineWidget',
            //     args: [{ 
            //         widgetId: this.animation_uuid, 
            //     }]
            // });
            await joplin.commands.execute('editor.execCommand', {
                name: 'cm-removeFloatingObject',
                args: [this.animation_uuid]
            });
        }
        //
        this.note_id = null;
        this.is_running = false;
        //
    }

    // 内部动画循环 (私有方法)
    private async animate(): Promise<void> {
        if (!this.is_running) {
            return;
        }
        //
        try {
            // 每次都获取笔记编号，避免切换
            const current_note = await joplin.workspace.selectedNote();
            if (!current_note || current_note.id !== this.note_id) {
                console.log("Note changed or is null, stopping animation gracefully.");
                await this.stop(false);
                return;
            }
            if (this.is_running) {
                this.animation_index = (this.animation_index + 1) % this.animationStates.length;
                this.animation_progress_str = this.animationStates[this.animation_index];

                // await joplin.commands.execute('editor.execCommand', {
                //     name: 'cm-replaceRange',
                //     args: [this.animation_start_pos, this.animation_end_pos, this.animation_progress_str]
                // });
                if (this.animation_end_pos == this.animation_start_pos){
                    // await joplin.commands.execute('editor.execCommand', {
                    //     name: 'cm-addLineWidget',
                    //     args: [{ 
                    //         line: this.animation_row, 
                    //         htmlString:`<center>${this.animation_progress_str}</center>`,
                    //         // htmlString:`<p>${this.animation_progress_str}</p>`,
                    //         // htmlString:`${this.animation_progress_str}`,
                    //         widgetId: this.animation_uuid, 
                    //     }]
                    // });
                    await joplin.commands.execute('editor.execCommand', {
                        name: 'cm-addFloatingObject',
                        args: [{ text: this.animation_progress_str, floatId: this.animation_uuid }]
                    });
                }
                else {
                    // await joplin.commands.execute('editor.execCommand', {
                    //     name: 'cm-updateLineWidget',
                    //     args: [{ 
                    //         // line: this.animation_row, 
                    //         htmlString:`<center>${this.animation_progress_str}</center>`,
                    //         // htmlString:`${this.animation_progress_str}`,
                    //         // htmlString:`<p>${this.animation_progress_str}</p>`,
                    //         widgetId: this.animation_uuid, 
                    //     }]
                    // });
                    // await joplin.commands.execute('editor.execCommand', {
                    //     name: 'cm-removeFloatingObject',
                    // });
                    await joplin.commands.execute('editor.execCommand', {
                        name: 'cm-addFloatingObject',
                        args: [{ text: this.animation_progress_str, floatId: this.animation_uuid }]
                    });
                }

                // await joplin.commands.execute('editor.execCommand', {
                //     name: 'cm-removeLineWidget',
                //     args: [{ 
                //         widgetId: this.animation_uuid, 
                //     }]
                // });
                // await joplin.commands.execute('editor.execCommand', {
                //     name: 'cm-addLineWidget',
                //     args: [{ 
                //         line: this.animation_row, 
                //         htmlString:`<center>${this.animation_progress_str}</center>`,
                //         widgetId: this.animation_uuid, 
                //     }]
                // });
                
                this.animation_end_pos = this.animation_start_pos + this.animation_progress_str.length;

                this.animation_interval_id = setTimeout(() => this.animate(), this.animation_interval);
            }
            //
        } catch (error) {
            console.error("Error during animation:", error);
            await this.stop(false);
        }
    }
}