import { getCurves } from 'crypto';
import joplin from '../api';
import {getTxt} from './texts';

/**
 * 对话的消息体类
 */
interface OneMessage {
    role: string;
    content: string;
  }
// 
/**
 * 滚动条移动到光标位置
 */
export async function scroll_to_view (mode:string='none') {
    if (mode === 'desktop'){  					
        await joplin.commands.execute('editor.execCommand', {
            name: 'cm-moveCursorToSelectionEnd' 
        });
    }
    else if (mode === 'mobile'){        
        await joplin.commands.execute('editor.execCommand', {
            name: 'cm-scrollToCursor' 
        });
    }
    else{
        // 其他的不做任何事情
    }
}
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
        if (!this.is_running) {
            return;
        }
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
            await joplin.commands.execute('editor.execCommand', {
                name: 'cm-replaceRange',
                args: [this.animation_start_pos, this.animation_end_pos, '']  // 删除等待文本
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

                await joplin.commands.execute('editor.execCommand', {
                    name: 'cm-replaceRange',
                    args: [this.animation_start_pos, this.animation_end_pos, this.animation_progress_str]
                });

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
//
/**
 * 流式回复的可调用函数
 * 
 * 这个函数的作用是，根据传入的文本，流式返回结果。
 */
export async function llmReplyStream({inp_str, lst_msg = [], query_type='chat',
    is_selection_exists=true, str_before='', str_after=''}) {
    //
    const head_tail_n_cnt = 1
    const locale = await joplin.settings.globalValue('locale');
    let dictText = getTxt(locale);
    //
    console.log(inp_str);
    console.log(lst_msg);
    // ===============================================================
    // 读取设置的参数
    const llmSettingValues = await joplin.settings.values([
        'llmModel','llmServerUrl','llmKey','llmExtra',
        'llmModel2','llmServerUrl2','llmKey2','llmExtra2',
        'llmModel3','llmServerUrl3','llmKey3','llmExtra3',
        'llmSelect',
        'llmTemperature','llmMaxTokens','llmScrollType',
        'llmChatType','llmChatSkipThink', 'llmWaitAnimation',
        'llmChatPrompt'
    ]);
    // 基础参数
    let llmSelect = llmSettingValues['llmSelect'];
    llmSelect = parseInt(String(llmSelect));
    //
    let apiModel = '', apiUrl = '', apiKey = '', extraConfig;
    if(llmSelect==2){
        apiModel = String(llmSettingValues['llmModel2']);
        apiUrl = String(llmSettingValues['llmServerUrl2']) + '/chat/completions';
        apiKey = String(llmSettingValues['llmKey2']);
        extraConfig = String(llmSettingValues['llmExtra2']);
    }
    else if(llmSelect==3){
        apiModel = String(llmSettingValues['llmModel3']);
        apiUrl = String(llmSettingValues['llmServerUrl3']) + '/chat/completions';
        apiKey = String(llmSettingValues['llmKey3']);
        extraConfig = String(llmSettingValues['llmExtra3']);
    }
    else{
        apiModel = String(llmSettingValues['llmModel']);
        apiUrl = String(llmSettingValues['llmServerUrl']) + '/chat/completions';
        apiKey = String(llmSettingValues['llmKey']);
        extraConfig = String(llmSettingValues['llmExtra']);
    }
    // 如果关键参数缺失，直接报错，不需要走后面的流程
    if (apiModel.trim() === '' || apiUrl.trim() === '' || apiKey.trim() === '') {
        alert(`ERROR 57: ${dictText['err_llm_conf']}`);
        return;
    }
    // 高级参数
    let apiTemperature = llmSettingValues['llmTemperature'];
    apiTemperature = parseFloat(String(apiTemperature));
    //
    let apiMaxTokens = llmSettingValues['llmMaxTokens']
    apiMaxTokens = parseInt(String(apiMaxTokens)) ;
    //
    let llmScrollType = llmSettingValues['llmScrollType']
    llmScrollType = parseInt(String(llmScrollType)) ;
    //
    let platform = 'desktop';
    if (llmScrollType==1){platform = 'desktop'}
    else if (llmScrollType==2){platform = 'mobile'}
    else{platform = 'none'}
    // 
    let prompt_for_chat = String(llmSettingValues['llmChatPrompt']);
    //
    const chat_head = `Response from ${apiModel}:`;  // 不需要加粗
    const chat_tail = '**End of response**';
    //
    // 文字动效参数
    const ANIMATION_INTERVAL_MS = 100;
    //
    // ===============================================================
    // 实时更新笔记中的回复
    // 
    let result = ''
    const insertContentToNote = async (new_text: string) => {
        result += new_text; // 将新内容拼接到结果中
        await joplin.commands.execute('insertText', new_text); // 插入最新内容到笔记
    };
    // 光标移动到选区最末尾
    await joplin.commands.execute('editor.execCommand', {name: 'cm-moveCursorToSelectionEnd'});
    // 打印 chat_head
    await insertContentToNote(`\n\n**${chat_head}**`+'\n'.repeat(head_tail_n_cnt));
    // 滚动条移动到光标位置
    await scroll_to_view(platform);
    // 
    // 构造对话列表
    let prompt_messages = [];
    // 如果有传入的，直接使用
    if (lst_msg.length>0){ 
        prompt_messages = lst_msg;
    }
    else{
        // 基础参数
        let chatType = parseInt(String(llmSettingValues['llmChatType']));
        let prompt_head = 'You are a helpful assistant.';
        //
        // Chat message list
        if(query_type === 'chat' && chatType == 1){
            if(prompt_for_chat.trim() === ''){
                prompt_head = dictText['prompt_chat'];
            }
            else{
                prompt_head = prompt_for_chat.trim();
            }           
        }
        prompt_messages.push({ role: 'system', content: prompt_head});
        if(query_type === 'chat' && chatType == 1){
            let lstSplited = splitText(inp_str);
            prompt_messages = prompt_messages.concat(lstSplited);
            console.log(prompt_messages);
        }
        else{
            prompt_messages.push({ role: 'user', content: inp_str });
        }
    }
    //
    // waiting 动效
    //
    const show_waiting = Number(llmSettingValues['llmWaitAnimation']) === 1;
    const waitingAnimator = new TextProgressAnimator(ANIMATION_INTERVAL_MS, show_waiting, 'Waiting'); 
    try {
        await waitingAnimator.start();
    }
    catch {
        await waitingAnimator.stop();
    }
    //
    // 构造请求体
    let requestBody = {
        model: apiModel, // 模型名称
        messages:prompt_messages,
        stream: true, // 启用流式输出
        temperature: apiTemperature,
        max_tokens: apiMaxTokens,
    };
    // 根据自定义设置，覆盖修改现有的配置项
    try{
        if(extraConfig.trim().length>0){
            let newConfig = JSON.parse(extraConfig);
            requestBody = {...requestBody, ...newConfig};
        }
        console.log(JSON.stringify(requestBody));
    }
    catch(err){
        console.warn('JSON parse failed:', err);
    }
    //
    // 发起 HTTP 请求
    let response:any;
    try{
        let dict_headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`, // 设置 API 密钥
        }
        // 为 claude 特殊处理：
        if (apiUrl.includes('api.anthropic.com')){
            dict_headers['anthropic-dangerous-direct-browser-access'] = 'true';
        }
        //
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: dict_headers,
            body: JSON.stringify(requestBody), // 将请求体序列化为 JSON
        });
        // 检查 HTTP 响应状态
        if (!response.ok || !response.body) {
            const errorText = await response.text();
            console.error('Error from LLM API:', errorText);
            alert(`ERROR 156: ${response.status} ${response.statusText}`);
            return;
        }
    }
    catch(err){  // 这里如果出错，最可能的是CORS限制。此时得到的response是空对象。
        await waitingAnimator.stop();
        //
        if (err.message.includes('Failed to fetch')){
            console.error('Error 173:', err);
            alert(`Error 173: ${err}. \n ${dictText['err_cors']}`);
        }
        else{
            console.error('Error 177:',err);
            alert(`ERROR 177: ${err} \n response = ${response}.`);
        }
        return;
    }   
    finally{
        // 此处暂时没有需要做的
    }
    //
    // 解析流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    //
    // 逐块读取流式数据
    let output_str = '';
    let need_add_head = true;
    let fail_count = 0
    const FAIL_COUNT_MAX = 3
    //
    // think part
    const hide_thinking = Number(llmSettingValues['llmChatSkipThink']) === 1;
    const thinkingAnimator = new TextProgressAnimator(ANIMATION_INTERVAL_MS, hide_thinking, 'Thinking'); 
    let thinking_status = 'not_started';
    //
    // 开始思考
    async function think_start(){
        await thinkingAnimator.start();
    }
    // 思考中
    async function think_going(){
    }
    // 结束思考
    async function think_end(){
        await thinkingAnimator.stop();
    }
    //
    // 输出解析部分
    //
    try{
        let cur_pos:any;
        //
        let start_note = await joplin.workspace.selectedNote(); 
        while (true) {
            //
            // 切换笔记后退出
            let current_note = await joplin.workspace.selectedNote();
            if (current_note.id != start_note.id){
                alert('ERROR: ' + dictText['err_note_changed'])
                await waitingAnimator.stop();
                await thinkingAnimator.stop();
                return;  
            }
            // 连续失败后退出
            if (fail_count >= FAIL_COUNT_MAX) {
                alert(dictText['err_wrong'])                
                await waitingAnimator.stop();
                await thinkingAnimator.stop();
                break;  
            }
            //
            const { done, value } = await reader.read();
            if (done) {
                await waitingAnimator.stop();
                await thinkingAnimator.stop();
                break; // 流结束时退出循环
            }
            //
            // 解码并解析数据块
            const chunk:string = decoder.decode(value, { stream: true });
            // console.info('Stream Chunk:', chunk);
            // 解析 JSON 行
            if (typeof chunk === "string"){  // 块作为整理，可能有多行
                for (const line of chunk.split('\n')) { // 逐行拆解
                    const trimmedLine = line.trim();
                    // 忽略空行或无效行
                    if (!trimmedLine || !trimmedLine.startsWith('data:')) {
                        continue;
                    }
                    // 处理 "data:" 前缀
                    const jsonString = trimmedLine.replace(/^data:/, ''); // 去掉 "data:" 前缀
                    // 特殊情况：处理流结束的标志 "data: [DONE]"
                    if (jsonString.trim() === '[DONE]') {
                        console.info('Got [DONE]. Stream finished.');
                        break;
                    }
                    try {
                        // 解析 JSON 数据
                        const parsed = JSON.parse(jsonString);
                        let new_content = parsed.choices[0]?.delta?.content || '';
                        //
                        if (new_content.trim().length >0){  // 如果有返回值了；
                            // 先停止waiting提示
                            await waitingAnimator.stop();
                        }
                        //
                        if (thinking_status === 'not_started') {
                            //
                            // only when startswith <think>
                            if (new_content.trim() === '<think>'){
                                // // 保险起见，先停一下
                                await waitingAnimator.stop();  
                                thinking_status = 'thinking'
                                // 
                                // 思考期间的等待可视化
                                if (hide_thinking){
                                    await think_start();
                                    continue;
                                }
                            }
                            else{
                                // 如果不是 <think> 开头，说明不是推理模式，直接跳过
                                thinking_status = 'think_finished';
                            }
                        }
                        else if(thinking_status === 'thinking') {  // 如果已经在思考中了
                            if (new_content.trim() === '</think>'){  // 结束思考的标志
                                thinking_status = 'think_ends';
                                await think_end();
                            }
                            if (hide_thinking){
                                continue;
                            }
                        } 
                        else if (thinking_status === 'think_ends'){
                            if(new_content.trim() === ''){
                                if (hide_thinking){
                                    continue;
                                }
                            }
                            else if (new_content.trim().length > 0){
                                thinking_status = 'think_finished'
                                if (hide_thinking){
                                    new_content = new_content.trim();
                                }
                            }
                        }
                        //
                        output_str += new_content;
                        // 还原光标位置，避免意外移动光标后输入到错误的位置
                        try{
                            let last_pos = cur_pos.startLine.from + cur_pos.startPosition.column;
                            await joplin.commands.execute('editor.execCommand', {
                                name: 'cm-moveCursorPosition',
                                args: [last_pos]
                            });
                        }
                        catch{
                            //
                        }
                        //
                        if(need_add_head){
                            if (output_str.length>10 && !output_str.trim().startsWith('**')){  // 肯定不是重复出现
                                await insertContentToNote(output_str);
                                need_add_head = false;
                            }
                            else if(output_str.length>(5 + `**${chat_head}**`.length) ){
                                if(output_str.trim().startsWith(`**${chat_head}**`)){  // 
                                    output_str = output_str.replace(`**${chat_head}**`,''); // 避免重复出现
                                    await insertContentToNote(output_str);
                                }
                                else{
                                    await insertContentToNote(output_str);
                                }
                                need_add_head = false;
                            }
                            fail_count = 0;
                        }
                        else{
                            await insertContentToNote(new_content); // 实时更新内容
                        }
                        // 滚动条移动到光标位置
                        await scroll_to_view(platform);
                        //
                        // 存储光标位置，避免意外移动光标后输入到错误的位置
                        try{
                            cur_pos = await joplin.commands.execute('editor.execCommand', {
                                name: 'cm-getCursorPos' 
                            });
                            // console.log('cur_pos = ',cur_pos);
                        }
                        catch(err){
                            console.warn('cm-getCursorPos:', err);
                        }
                    } catch (err) {
                        console.warn('Failed to parse line:', trimmedLine, err);
                        // alert(`Failed to parse line: ${err}`);
                        fail_count += 1;
                    }
                }
            }
            else{
                console.info('Chunk is not string: ', chunk);
            }
        }
        //
        // 收尾工作
        try{
            // 万一总长度不足导致上面没有执行；
            if (need_add_head){ 
                await insertContentToNote(output_str);
            }
            // 防止大模型抽风，重复输出手动设定的结束语。
            if (output_str.trim().endsWith(chat_tail)){  
                await insertContentToNote('\n\n');
            }
            else{  // 正常情况，由程序输出结束语
                await insertContentToNote('\n'.repeat(head_tail_n_cnt) + `${chat_tail}\n\n`);
            }
            //
            await scroll_to_view(platform);
            // 显示完成提示
            await (joplin.views.dialogs as any).showToast({
                message:'Finished.', 
                duration:2500+(Date.now()%500), 
                type:'success',
                timestamp: Date.now()
            });
        }
        catch(err){
            console.error('ERR501_in_utils.ts: ',err);
        }
    }
    catch(err){
        console.error('ERR531_in_utils.ts: ',err);
    }
    finally{
        try{
            await waitingAnimator.stop();
        }
        catch(err){
            //
        }
        //
        try{
            
            await thinkingAnimator.stop();
        }
        catch{
            //
        }
    }
}

/**
 * 切换 LLM 模型选项
 * @param llm_no 数字，代表了使用的模型序号
 */
export async function changeLLM(llm_no=0) {
    let int_target_llm=0;
    if (llm_no!=0){
        int_target_llm = llm_no;
    }
    else{
        let current_llm = await joplin.settings.values(['llmSelect']);
        let int_current_llm = parseInt(String(current_llm['llmSelect']));
        if(int_current_llm==1){
            int_target_llm = 2
        }
        else if(int_current_llm==3){
            int_target_llm = 3
        }
        else{
            int_target_llm = 1
        }
    }
    console.log(int_target_llm);
    //
    await joplin.settings.setValue('llmSelect', int_target_llm);
    await (joplin.views.dialogs as any).showToast({
        message:`LLM ${int_target_llm} selected!`, 
        duration: 2500+(Date.now()%500), 
        type:'success',
        timestamp: Date.now()
    }); 
}

/**
 * For chat only. Split long text to dialog list, including role and content.
 */
export function splitText(raw:string, remove_think:boolean=true) {

    const lines = raw.split(/\r?\n/);
    // let remove_think = true;
    let result = [];
    let buffer = [];
    let currentRole = "user";
    let inResponse = false;
    let responder = null;

    // 辅助函数：将 buffer 合并入 result
    function flushBuffer(role:string) {
      if (buffer.length === 0) return;
      const content = buffer.join('\n');
      // 合并到 result，如果上一个的 role 相同
      if (result.length > 0 && result[result.length - 1].role === role) {
        result[result.length - 1].content += '\n' + content;
      } else {
        result.push({ role, content });
      }
      buffer = [];
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检查开始标记
      const startMatch = line.match(/^\*\*Response from (.+):\*\*$/);
      if (startMatch) {
        // 先flush之前的内容
        flushBuffer(currentRole);

        // 启动新的包裹
        inResponse = true;
        responder = startMatch[1].trim();
        // currentRole = responder;
        currentRole = "assistant";
        continue;
      }

      // 检查结束标记
      if (line.trim() === '\*\*End of response\*\*') {
        flushBuffer(currentRole);
        inResponse = false;
        responder = null;
        currentRole = "user";
        continue;
      }

      // 处理内容
      buffer.push(line);
    }

    // 处理最后残留
    flushBuffer(currentRole);

    // 去除纯空内容
    // const cleanResult = result.filter(item => item.content.trim() !== '');

    // 移除 <think> </think> 部分
    if(remove_think && result.length > 0){
        for (let i = 0; i < result.length; i++) {
            if (result[i].role === "assistant"){
                let content = result[i].content;
                let content_without_think = content.trim().replace(/^<think>[\s\S]*?<\/think>/, '').trimStart();
                result[i].content = content_without_think;
            } 
            else{
                result[i].content = result[i].content.trim();
            }
        }
    }
    //
    return result;
}