// import { getCurves } from 'crypto';  // I think, this is useless. Why here?
import joplin from '../api';
import {getTxt} from './texts';
import { 
    FLOATING_HTML_BASIC, FLOATING_HTML_THINKING, FLOATING_HTML_WAITING, 
    COLOR_FLOAT, makeJumpingHtml, FloatProgressAnimator
 } from './pluginFloatingObject';
import {mcp_call_tool, mcp_get_tools, mcp_get_tools_openai, get_mcp_prompt} from './mcpClient';

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

function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需+1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatNow() {
    const now = new Date();
    return formatDateTime(now);
}
//
/**
 * 检查服务器状态是否可用
 * @param {string} url 要检查的服务器地址
 * @param {number} [timeout=1000] 超时时间，单位为毫秒
 * @returns {Promise<{status: 'online' | 'offline' | 'timeout' | 'error', message: string}>}
 */
async function checkServerStatus(url:string, 
    timeout: number = 1000): Promise<{ status: 'online' | 'offline' | 'timeout' | 'error'; message: string; }> {
    //
    // AbortController 是实现超时的关键
    const controller = new AbortController();
    const signal = controller.signal;

    // 设置一个计时器，在超时后中止 fetch 请求
    const timeoutId = setTimeout(() => {
        console.log(`请求 ${url} 超时。`);
        controller.abort();
    }, timeout);

    try {
        // 发起 fetch 请求
        // 我们使用 'HEAD' 方法，因为它只获取响应头，速度最快。
        // 'no-cors' 模式可以避免一些跨域问题，但请注意下面的“重要提示”。
        const response = await fetch(url, {
            method: 'HEAD', // 使用 HEAD 方法，只请求头信息，速度快
            mode: 'no-cors', // 使用 no-cors 模式来“测试”连通性，即使有跨域限制
            signal: signal   // 将 AbortSignal 传递给 fetch
        });

        // 如果请求成功，清除超时计时器
        clearTimeout(timeoutId);

        // 对于 'no-cors' 模式，我们无法读取 response.status 或 response.ok
        // 只要请求没有抛出错误，就认为网络层面是可达的。
        // 这是一个基本的连通性检查。
        return {
            status: 'online',
            message: `服务器 ${url} 在网络上可达。`
        };

    } catch (err) {
        // 清除超时计时器，以防万一
        clearTimeout(timeoutId);

        // 判断错误类型
        if (err.name === 'AbortError') {
        return {
            status: 'timeout',
            message: `连接服务器 ${url} 超时 (超过 ${timeout}ms)。`
        };
        }
        
        // 其他网络错误 (例如 DNS 查找失败, 服务器拒绝连接等)
        return {
            status: 'offline',
            message: `无法连接到服务器 ${url}。错误: ${err.message}`
        };
    }
}
/**
 * 
 */
// 创建一个延迟函数，让出控制权
function sleep_ms(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//
/**
 * 流式回复的可调用函数
 * 
 * 这个函数的作用是，根据传入的文本，流式返回结果。
 */
export async function llmReplyStream({
        inp_str, 
        lst_msg = [], 
        query_type='chat',
        is_selection_exists=true, 
        str_before='', 
        str_after='',
        lst_tools_input = [],
        round_tool_call = 0,
        flags = null
    }) {
    //
    const locale = await joplin.settings.globalValue('locale');
    let dictText = getTxt(locale);
    //
    console.log('inp_str = ', inp_str);
    console.log('lst_msg = ', lst_msg);
    console.log('lst_tools_input = ', lst_tools_input);
    //
    // flags
    let llmSettingFlags = await joplin.settings.values(['llmFlagLlmRunning'])
    let is_running = parseInt(String(llmSettingFlags['llmFlagLlmRunning']));
    async function on_before_return(){
        await joplin.settings.setValue('llmFlagLlmRunning', 0);
    }
    if (round_tool_call <= 0){ // 入口层
        if (is_running == 1){ // 正在运行，强行停止
            await on_before_return();
            alert('Force stopped!')
            return;
        }
        else if (is_running == 0){ // 
            await joplin.settings.setValue('llmFlagLlmRunning', 1);
        }
    }
    else {  // 内层
        if (is_running == 0){ // 内层在非运行状态下进入，则直接停止
            // await on_before_return();
            // alert('Force stopped!')
            return;
        }
    }
    // ===============================================================
    // 读取设置的参数
    const llmSettingValues = await joplin.settings.values([
        'llmModel','llmServerUrl','llmKey', 'llmExtra', 'llmMcp',
        'llmModel2','llmServerUrl2','llmKey2','llmExtra2','llmMcp2',
        'llmModel3','llmServerUrl3','llmKey3','llmExtra3','llmMcp3',
        'llmSelect',
        'llmTemperature', 'llmMaxTokens', 'llmScrollType',
        'llmChatType', 'llmChatSkipThink', 'llmChatPrompt', 
        // 'llmMcpServer'
    ]);
    // 基础参数
    let llmSelect = parseInt(String(llmSettingValues['llmSelect']));  // 模型入口序号
    //
    let apiModel = '', apiUrl = '', apiKey = '', extraConfig:any;
    let mcp_number = 0;
    if(llmSelect==2){
        apiModel = String(llmSettingValues['llmModel2']).trim();
        apiUrl = String(llmSettingValues['llmServerUrl2']) + '/chat/completions';
        apiKey = String(llmSettingValues['llmKey2']).trim();
        extraConfig = String(llmSettingValues['llmExtra2']);
        mcp_number = Number(llmSettingValues['llmMcp2']);
    }
    else if(llmSelect==3){
        apiModel = String(llmSettingValues['llmModel3']).trim();
        apiUrl = String(llmSettingValues['llmServerUrl3']) + '/chat/completions';
        apiKey = String(llmSettingValues['llmKey3']).trim();
        extraConfig = String(llmSettingValues['llmExtra3']);
        mcp_number = Number(llmSettingValues['llmMcp3']);
    }
    else{
        apiModel = String(llmSettingValues['llmModel']).trim();
        apiUrl = String(llmSettingValues['llmServerUrl']) + '/chat/completions';
        apiKey = String(llmSettingValues['llmKey']).trim();
        extraConfig = String(llmSettingValues['llmExtra']);
        mcp_number = Number(llmSettingValues['llmMcp']);
    }
    // 如果关键参数缺失，直接报错，不需要走后面的流程
    if (apiModel.trim() === '' || apiUrl.trim() === '' || apiKey.trim() === '') {
        alert(`ERROR 57: ${dictText['err_llm_conf']}`);
        await on_before_return();
        return;
    }
    // 高级参数
    let apiTemperature = parseFloat(String(llmSettingValues['llmTemperature']));
    let apiMaxTokens = parseInt(String(llmSettingValues['llmMaxTokens'])) ;
    let llmScrollType = parseInt(String(llmSettingValues['llmScrollType'])) ;
    //
    let scroll_method = 'desktop';
    if (llmScrollType==1) {
        scroll_method = 'desktop'
    }
    else if (llmScrollType==2) {
        scroll_method = 'mobile'
    }
    else {
        scroll_method = 'none'
    }
    // 
    let prompt_for_chat = String(llmSettingValues['llmChatPrompt']);
    //
    // MCP 相关的参数
    const lst_mcp_setting_keys = ['llmMcpEnabled'];
    const N_MAP_MAX = 42
    for (let n = 1; n <= N_MAP_MAX; n++){
        let n_mcp = String(n).padStart(2,"0");
        lst_mcp_setting_keys.push('llmMcpEnabled_'+n_mcp)
        lst_mcp_setting_keys.push('llmMcpServer_'+n_mcp)
    }
    const dict_mcp_settings = await joplin.settings.values(lst_mcp_setting_keys);  // 读取设置项
    //
    let mcp_servers_str = ''; // MCP服务器网址拼接的字符串
    if(Number(dict_mcp_settings['llmMcpEnabled'])>0) { // MCP总开关
        for (let n = 1; n <= N_MAP_MAX; n++){
            let n_mcp = String(n).padStart(2,"0");
            if(dict_mcp_settings['llmMcpEnabled_'+n_mcp]){ // 如果启用
                let mcp_server_one = String(dict_mcp_settings['llmMcpServer_'+n_mcp]);
                if(mcp_server_one.trim().length>0){
                    if(mcp_servers_str.length<=0){
                        mcp_servers_str = mcp_server_one.trim();
                    }
                    else{
                        mcp_servers_str = mcp_servers_str + '|' + mcp_server_one.trim();
                    } 
                } 
            }
        }
    }
    // const MCP_SERVER = String(llmSettingValues['llmMcpServer']); // 读取设置
    const MCP_SERVER = mcp_servers_str;
    const MAX_TOOL_CALL_ROUND = 3; // 不允许 MCP 的循环调用次数过多
    //
    let IS_MCP_ENABLED = (mcp_number > 0 && MCP_SERVER.trim().length > 0);
    if (IS_MCP_ENABLED) {
        // 服务器是否可用
        /*
        let is_mcp_server_available = await checkServerStatus(MCP_SERVER);
        if (is_mcp_server_available.status != 'online') {
            console.info('MCP server unavailable')
            IS_MCP_ENABLED = false;
        }
        */
        // 轮数是否过多
        if (round_tool_call > MAX_TOOL_CALL_ROUND) {
            IS_MCP_ENABLED = false;
        }
    }
    let MCP_MODE = 'mcp'  // agent, mcp, null
    if (mcp_number == 10){
        MCP_MODE = 'mcp'
    }
    else if (mcp_number == 20){
        MCP_MODE = 'agent'
    }
    //
    //////
    //
    const START_NOTE = await joplin.workspace.selectedNote(); // 启动时的笔记
    // 
    let result_whole = '' // 存储本次回复生成的完整文档。但好像并没有用到？
    let cursor_pos:any;  // 光标位置
    //
    /**
     * 获取光标的位置
     * @returns 
     */
    async function get_cursor_pos() {
        let tmp_cur = await joplin.commands.execute('editor.execCommand', {
            name: 'cm-getCursorPos' 
        });
        return tmp_cur;
    }
    //
    // head and tail
    const HEAD_TAIL_N_CNT = 2
    const CHAT_HEAD = `Response from ${apiModel}:`;  // 不需要加粗
    const CHAT_TAIL = '**End of response**';
    if (flags === null){
        flags = {
            head_printed:false,
            tail_printed:false
        }
    }
    // 打印 CHAT_HEAD
    const print_head = async () => {
        await insert_content_move_view(`\n\n**${CHAT_HEAD}**`+'\n'.repeat(HEAD_TAIL_N_CNT), false);
    }
    const print_tail = async () => {
        await insert_content_move_view('\n'.repeat(HEAD_TAIL_N_CNT) + `${CHAT_TAIL}\n\n`, false);
    }
    //
    // 文字动效参数
    const ANIMATION_INTERVAL_MS = 120;
    //
    // ===============================================================
    // 
    /**
     * 实时更新笔记中的回复，
     * 依赖外部变量: result_whole, cursor_pos
     * @param new_text 
     * @param need_save 
     * @returns 
     */
    async function insert_content_move_view (new_text: string, need_save_text = true) {
        // 如果笔记切换了，强制退出
        let current_note = await joplin.workspace.selectedNote();
        if (current_note.id != START_NOTE.id){
            // alert('ERROR: ' + dictText['err_note_changed'])
            await on_animation_error();
            throw new Error('Note changed error!')
        }
        // 跳转到上次的光标位置
        try{
            let last_pos = cursor_pos.startLine.from + cursor_pos.startPosition.column;
            await joplin.commands.execute('editor.execCommand', {
                name: 'cm-moveCursorPosition',
                args: [last_pos]
            });
        }
        catch(e){
            console.log(`Error = ${e}`)
        }
        //
        // 逻辑（待验证）：首次输出之前，先输出开头 TODO
        if (new_text.length>0){ // 不需要 trim，因为空格或换行也是输出
            if (result_whole.length<=0){
                if(!flags.head_printed){
                    await joplin.commands.execute('insertText', `\n\n**${CHAT_HEAD}**`+'\n'.repeat(HEAD_TAIL_N_CNT));
                    flags.head_printed = true;
                }
            }
            // 插入最新内容到笔记
            await joplin.commands.execute('insertText', new_text); 
        }
        // 将新内容拼接到结果中
        if (need_save_text){
            result_whole += new_text;
        }
        // 滚动
        await scroll_to_view(scroll_method);
        //
        // 保存最新光标位置
        cursor_pos = await joplin.commands.execute('editor.execCommand', {
            name: 'cm-getCursorPos' 
        });
    };
    //
    // 光标移动到选区最末尾
    await joplin.commands.execute('editor.execCommand', 
        {name: 'cm-moveCursorToSelectionEnd'}
    );
    // 滚动条移动到光标位置
    await scroll_to_view(scroll_method);
    //
    // 初始化光标位置
    try{
        cursor_pos = await get_cursor_pos();
    }
    catch(err){
        // 获取光标位置失败，与编辑器版本有关。
        console.warn('Error: cm-getCursorPos:', err);
        await on_animation_error();
    }
    // 
    // ===============================================================
    // 构造对话列表
    let prompt_messages = [];
    // 如果有传入的，直接使用
    if (lst_msg.length>0){ 
        prompt_messages = lst_msg;
    }
    else{
        // 补充当前的时间
        const ADD_CURRENT_TIME = true;
        if (ADD_CURRENT_TIME){
            prompt_messages.push({ role: 'system', content: `<current_time> ${formatNow()} </current_time>`});
        }
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
        prompt_messages.push({role: 'system', content: prompt_head});
        //
        // MCP prompt
        
        if (IS_MCP_ENABLED){ // 也许下面 MCP 判断条件可以往前放。
            prompt_messages.push({role: 'system', content: get_mcp_prompt()});
        }
        prompt_messages.push({role: 'system', content: 'Response in user query language.'})
        //
        if(query_type === 'chat' && chatType == 1){
            let lstSplited = splitTextToMessages(inp_str);
            prompt_messages = prompt_messages.concat(lstSplited);
            console.log(prompt_messages);
        }
        else{
            prompt_messages.push({ role: 'user', content: inp_str });
        }
    }
    //
    // ===============================================================
    // waiting 动效
    const show_waiting = true; 
    // const waitingAnimator = new TextProgressAnimator(ANIMATION_INTERVAL_MS, show_waiting, 'Waiting'); 
    const waitingAnimator = new FloatProgressAnimator('notellm_waiting_anim', show_waiting, FLOATING_HTML_WAITING); 
    //
    // think 动效
    const hide_thinking = Number(llmSettingValues['llmChatSkipThink']) === 1;
    // const thinkingAnimator = new TextProgressAnimator(ANIMATION_INTERVAL_MS, hide_thinking, 'Thinking'); 
    const thinkingAnimator = new FloatProgressAnimator('notellm_thinking_anim', hide_thinking, FLOATING_HTML_THINKING, COLOR_FLOAT.NORMAL); 
    let thinking_status = 'not_started';
    //
    // 开始等待
    async function on_wait_start(){
        await waitingAnimator.start();
    }
    // 等待结束
    async function on_wait_end(){
        await waitingAnimator.stop();
    }
    //
    // 开始思考
    async function on_think_start(){
        await thinkingAnimator.start();
    }
    // 思考中
    async function think_going(){
    }
    // 结束思考
    async function on_think_end(){
        await thinkingAnimator.stop();
    }
    async function on_llm_end(){
        //
    }
    async function on_animation_error() {
        await on_wait_end();
        await on_think_end();
    }
    //
    // ============= ================= ==============
    // 主要流程开始
    // 
    // 进入之后，立刻开始 wait 环节；
    try {
        await on_wait_start();
    }
    catch {
        await on_wait_end();
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
    //
    // ============= ================= ==============
    // 工具 MCP
    //
    let MCP_SERVER_URL_RESTFUL = '';
    if (MCP_MODE == 'mcp'){
        MCP_SERVER_URL_RESTFUL = MCP_SERVER + '/mcp/get_tools'
    }
    else if (MCP_MODE == 'agent'){
        MCP_SERVER_URL_RESTFUL = MCP_SERVER + '/mcp/get_agents'
    }
    async function mcp_get_tools_restful(MCP_SERVER_URL_RESTFUL:string) {
        let openai_tools = await fetch(MCP_SERVER_URL_RESTFUL)
            .then(mcp_response => {
                if (!mcp_response.ok) {
                throw new Error('MCP_网络响应失败');
                }
                return mcp_response.json(); // 如果返回的是 JSON 数据
            })
            .then(data => {
                console.log('MCP_获取到的数据:', data); // 处理返回的数据
                return data;
            })
            .catch(error => {
                console.error('MCP_请求失败:', error);  // 服务器未启动，或者连接错误等，都会走到这里
                // 可以添加 on_mcp_error 函数
                return {'tools': []}  // 
            });
        return openai_tools;
    }
    //
    let openai_tools:any;
    let openai_map:any
    if (IS_MCP_ENABLED) {  
        //
        // 首先需要获取工具列表，用于组装消息体
        if (lst_tools_input.length>0){ // 直接指定工具列表，不再通过请求获取
            requestBody['tools'] = lst_tools_input;
            requestBody['temperature'] = 0;
        }
        else {  // 获取可用工具的列表
            openai_tools = await mcp_get_tools_openai(MCP_SERVER);
            openai_map = openai_tools['tmap'];
            //
            if (openai_tools['tools'].length > 0) {  // 还需要更多的格式验证
                requestBody['tools'] = openai_tools['tools'];
            }
        }
    }
    /**
     * 纯显示 toast，无实际作用。
     * 
     * 调用工具时，显示工具名称
     * @param tool_name 
     */
    async function on_tool_call_start(tool_name:string, server_name:string=''){
        let mcp_text = `[${MCP_MODE}]`
        if(server_name.trim().length > 0){
            mcp_text += `Calling ${server_name}.${tool_name}, please wait...`
        } 
        else{
            mcp_text += `Calling ${tool_name}, please wait...`
        }
        await joplin.commands.execute('editor.execCommand', {
            name: 'cm-addFloatingObject',
            args: [{ text: makeJumpingHtml(mcp_text), 
                floatId: 'on_tool_call_start', 
                bgColor: COLOR_FLOAT.NORMAL }]
        });
    }
    async function on_tool_call_end(tool_name:string) {
        await joplin.commands.execute('editor.execCommand', {
            name: 'cm-removeFloatingObject',
            args: ['on_tool_call_start']
        });
    }
    //
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
    let llm_response:any;
    try{
        let dict_headers = {
            'User-Agent': 'NoteLLM',
            'X-Client-Name':'NoteLLM',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`, // 设置 API 密钥
        }
        // 为 claude 特殊处理：
        if (apiUrl.includes('api.anthropic.com')){
            dict_headers['anthropic-dangerous-direct-browser-access'] = 'true';  // 请求头必须是字符串
        }
        //
        llm_response = await fetch(apiUrl, {
            method: 'POST',
            headers: dict_headers,
            body: JSON.stringify(requestBody), // 将请求体序列化为 JSON
        });
        // 检查 HTTP 响应状态
        if (!llm_response.ok || !llm_response.body) {
            const errorText = await llm_response.text();
            console.error('Error from LLM API:', errorText);
            alert(`ERROR 156: ${llm_response.status} ${llm_response.statusText} ${errorText}`);
            await on_before_return();
            await on_animation_error();
            return;
        }
    }
    catch(err){  
        //
        // 网络错误，或者CORS限制。此时得到的response是空对象。
        if (err.message.includes('Failed to fetch')){
            console.error('Error 173:', err);
            alert(`Error 173: ${err}. \n ${dictText['err_cors']}`);
        }
        else{
            console.error('Error 177:',err);
            alert(`ERROR 177: ${err} \n llm_response = ${llm_response}.`);
        }
        await on_before_return();
        await on_animation_error();
        return;
    }   
    finally{
        // 此处暂时没有需要做的
    }
    //
    // 输出解析部分 =============================
    //
    let output_str = '';
    let need_add_head = true;
    let fail_count = 0
    const FAIL_COUNT_MAX = 3
    let reply_type = 'unknown';  // 本次请求的类型划分（是否调用工具）
    let is_stream_done = false;
    let lst_tool_calls = [];
    let force_stop = false;  // 强制退出
    //
    try{  
        const reader = llm_response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        while (!is_stream_done) {
            // 让出控制权，用于激活外部流程
            sleep_ms(0);
            //
            // 切换笔记后退出
            let current_note = await joplin.workspace.selectedNote();
            if (current_note.id != START_NOTE.id){
                alert('ERROR: ' + dictText['err_note_changed'])
                await on_animation_error();
                await on_before_return();
                return;  
            }
            // 连续失败后退出
            if (fail_count >= FAIL_COUNT_MAX) {
                alert(dictText['err_wrong'])                
                await on_animation_error();
                break;  
            }
            // 强制退出
            let llmSettingFlags_inner = await joplin.settings.values(['llmFlagLlmRunning'])
            let is_running_inner = parseInt(String(llmSettingFlags_inner['llmFlagLlmRunning']));
            if (is_running_inner == 0){
                force_stop = true;
            } 
            if (force_stop) {
                await on_animation_error();
                await on_before_return();
                return;
            }
            //
            const { done, value } = await reader.read();
            if (done) {
                is_stream_done = true;
                await on_wait_end();
                await on_think_end();
                break; // 流结束时退出循环
            }
            //
            // 解码并解析数据块
            const chunk:string = decoder.decode(value, { stream: true });
            // console.info('Stream Chunk = ', chunk);
            //
            // 解析 JSON 行
            if (typeof chunk === "string"){  // 块作为整体，因为一次可能收到多行，每行都是 data: 开头，或者纯空行
                //
                // 只要有反馈了，就可以停止waiting提示
                await on_wait_end();
                //
                for (const data_line of chunk.split('\n')) { // 逐行拆解。
                    // 理论上讲，这里拆解并不会将 json 中间断开，因为换行符都被转义了
                    // 所以拆出来的全都是完整的 data: 行
                    // 但考虑到网络传输，可能会有 data: 被中间切断，所以最稳的方法是 buffer 缓存。 TODO
                    // console.info(`chunk_line = ${data_line}`)
                    const trimmedLine = data_line.trim();
                    // 忽略空行或无效行
                    if (!trimmedLine || !trimmedLine.startsWith('data:')) {
                        continue;
                    }
                    // 处理 "data:" 前缀
                    const jsonString = trimmedLine.replace(/^data:/, ''); // 去掉 "data:" 前缀
                    // 特殊情况：处理流结束的标志 "data: [DONE]"
                    if (jsonString.trim() === '[DONE]') {
                        console.info('Got [DONE]. Stream finished.');
                        is_stream_done = true;
                        break;
                    }
                    try {
                        // 解析 JSON 数据
                        const parsed = JSON.parse(jsonString);
                        //
                        let new_delta = parsed.choices[0]?.delta || {};
                        let finish_reason = parsed.choices[0]?.finish_reason || null
                        //
                        // 如果尚未判定类型
                        if (reply_type == 'unknown'){  
                            // 工具调用
                            if (finish_reason == null){
                                if ('tool_calls' in new_delta){ // 判定标准：如果有这个键
                                    reply_type = 'tool_calls';
                                }
                            }
                            else if (finish_reason == 'tool_calls'){
                                reply_type = 'tool_calls';
                            }
                            else {
                                // 常规
                                reply_type = 'content';
                                // await print_head();
                                // cursor_pos = await get_cursor_pos();
                            }
                        }
                        console.info('reply_type = ', reply_type);
                        //
                        //if (reply_type == 'tool_calls') {  // 如果是工具调用
                            //
                            // 保存发来的内容
                            if ('tool_calls' in new_delta){
                                for (let delta_tool_calls of new_delta['tool_calls']){
                                    lst_tool_calls.push(delta_tool_calls);
                                }
                            }
                        //}
                        else { //if (reply_type == 'content') {  // 如果是文本回复 (通常)
                            // 处理 content 内容
                            let delta_content = parsed.choices[0]?.delta?.content || '';
                            //
                            if (thinking_status === 'not_started') {
                                //
                                // only when startswith <think>
                                if (['<think>', '<THINK>'].includes(delta_content.trim())){
                                    thinking_status = 'thinking'
                                    // 
                                    // 思考期间的等待可视化
                                    if (hide_thinking){
                                        await on_think_start();
                                        continue;
                                    }
                                }
                                else if (delta_content.trim().startsWith('<think>')) {
                                    // 特例：工具调用等情况下，直接将完整版发来了，也属于这种情况
                                    const endIndex = delta_content.indexOf('</think>');
                                    if (endIndex !== -1){
                                        if (hide_thinking){
                                            delta_content = delta_content.trim().replace(/^<think>[\s\S]*?<\/think>\n\n/, '');
                                            thinking_status = 'think_finished';
                                        }
                                    }
                                }
                                else{
                                    // 如果不是 <think> 开头，说明不是推理模式，直接跳过
                                    // 特例：工具调用等情况下，直接将完整版发来了，也属于这种情况
                                    thinking_status = 'think_finished';
                                }
                            }
                            else if(thinking_status === 'thinking') {  // 如果已经在思考中了
                                if (['</think>', '</THINK>'].includes(delta_content.trim())){  // 结束思考的标志
                                    thinking_status = 'think_ends';
                                    await on_think_end();
                                }
                                if (hide_thinking){
                                    continue;
                                }
                            } 
                            else if (thinking_status === 'think_ends'){
                                if(delta_content.trim() === ''){
                                    if (hide_thinking){
                                        continue;
                                    }
                                }
                                else if (delta_content.trim().length > 0){
                                    thinking_status = 'think_finished';
                                    await on_think_end();
                                    if (hide_thinking){
                                        delta_content = delta_content.trim();
                                    }
                                }
                            }
                            else if (thinking_status === 'think_finished') {
                                // 思考已经结束，会进入这里
                            }
                            //
                            output_str += delta_content;
                            //
                            // 避免大模型又输出一次 head。这个逻辑比较落后，之后可以考虑删除
                            if(need_add_head){
                                if (output_str.length>10 && !output_str.trim().startsWith('**')){  // 肯定不是重复出现
                                    await insert_content_move_view(output_str);
                                    need_add_head = false;
                                }
                                else if(output_str.length>(5 + `**${CHAT_HEAD}**`.length) ){
                                    if(output_str.trim().startsWith(`**${CHAT_HEAD}**`)){  // 
                                        output_str = output_str.replace(`**${CHAT_HEAD}**`,''); // 避免重复出现
                                        await insert_content_move_view(output_str);
                                    }
                                    else{
                                        await insert_content_move_view(output_str);
                                    }
                                    need_add_head = false;
                                }
                                fail_count = 0;
                            }
                            else{
                                await insert_content_move_view(delta_content); // 实时更新内容
                            }
                        }
                    } catch (err) {
                        console.warn('Failed to parse line:', trimmedLine, err);
                        fail_count += 1;
                    }
                }
            }
            else{
                console.info('Chunk is not string: ', chunk);
            }
        }  // 结束 while 循环，所有chunk接收完毕
        //
        // 大模型回复完成，执行收尾工作 ================= ================ ===============
        //
        if (reply_type == 'content') { // 收尾类型：文本回复模式
            try{
                // 万一总长度不足导致上面没有执行；
                if (need_add_head){ 
                    await insert_content_move_view(output_str);
                }
                // 防止大模型抽风，重复输出手动设定的结束语。
                if (output_str.trim().endsWith(CHAT_TAIL)){  
                    await insert_content_move_view('\n\n');
                    flags.tail_printed = true;
                }
                else{  // 正常情况，由程序输出结束语
                    await print_tail();
                    flags.tail_printed = true;
                }
                //
                // 显示完成提示
                await joplin.commands.execute('editor.execCommand', {
                    name: 'cm-tempFloatingObject',
                    args: [{ 
                        text: `Finished.`, 
                        floatId: String(2500+(Date.now()%500)), 
                        ms: 2000, 
                        bgColor: COLOR_FLOAT.FINISH
                    }]
                });
            }
            catch(err){
                console.error('ERR501_in_utils.ts: ', err);
            }
        }
        //
        else if (reply_type == 'tool_calls') {  // 收尾类型：工具调用模式
            //
            console.log('lst_tool_calls = ', lst_tool_calls);
            //
            // 此处 stream 可能得到的是不完整的请求，需要拼接：
            let lst_tool_call_quests = [];
            for (const toolCallDelta of lst_tool_calls) {
                const index = toolCallDelta.index;

                // 如果是这个 index 的第一个块，则初始化组装器
                if (!lst_tool_call_quests[index]) {
                    lst_tool_call_quests[index] = { id: "", type: "function", function: { name: "", arguments: "" } };
                }
                
                // 拼接 ID
                if (toolCallDelta.id) {
                    lst_tool_call_quests[index].id += toolCallDelta.id;
                }
                // 拼接函数名
                if (toolCallDelta.function?.name) {
                    lst_tool_call_quests[index].function.name += toolCallDelta.function.name;
                }
                // 拼接参数 (最关键的部分)
                if (toolCallDelta.function?.arguments) {
                    lst_tool_call_quests[index].function.arguments += toolCallDelta.function.arguments;
                }
            }
            // 拼接完成后
            console.log('lst_tool_call_quests = ', lst_tool_call_quests);
            //
            // 调用工具，通过 post 请求
            let lst_tool_result = []
            let tool_name_cache = '';
            for (const tool_call_one of lst_tool_call_quests) {
                let tool_result_one:any;  // 运行结果
                tool_name_cache = tool_call_one.function.name;
                try {
                    let tool_call_name = ''
                    let json_body:string;
                    //
                    // 显示 toast
                    if (MCP_MODE == 'agent'){
                        tool_call_name = 'call_agents';  // 其实可以不写，但某些模型智力不够，避免弄错可以强制指定
                        // if ("agent_id" in tool_call_one.function.arguments){
                        //     console.log(tool_call_one.function.arguments)
                        // }
                        // else {
                        //     throw new Error('关键参数缺失');
                        // }
                        try{
                            let agent_name = tool_call_one.function.arguments
                            await on_tool_call_start(agent_name);
                        }
                        catch(e){
                            console.log(`Line 761: ${e}`)
                            //
                        }
                    }
                    else {
                        tool_call_name = tool_call_one.function.name
                        await on_tool_call_start(tool_call_name);
                    }
                    //
                    // 执行工具调用
                    if(false){
                        let MCP_RUN_URL = '';
                        MCP_RUN_URL = MCP_SERVER + '/mcp/call_tool'
                        json_body = JSON.stringify({
                            name: tool_call_name,
                            arguments: tool_call_one.function.arguments
                        })
                        console.log("json_body =", json_body)
                        const tool_call_response = await fetch(MCP_RUN_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: json_body
                        });

                        if (!tool_call_response.ok) {
                            throw new Error('网络响应异常');
                        }

                        tool_result_one = await tool_call_response.json(); 
                    }
                    else{
                        // let mcp_url = MCP_SERVER
                        let tool_call_args_json = tool_call_one.function.arguments
                        let tool_call_args = JSON.parse(tool_call_args_json)
                        let tool_real_name = openai_map[tool_call_name]['function_name']
                        let tool_real_server_url = openai_map[tool_call_name]['server_url']
                        //
                        console.log(`tool_real_server_url = ${tool_real_server_url}, tool_call_name = ${tool_call_name}, tool_real_name = ${tool_real_name}`) 
                        console.log('tool_call_args = ', tool_call_args)
                        console.log('len = ', Object.keys(tool_call_args).length)
                        let result_one:any;
                        if (Object.keys(tool_call_args).length>0){
                            result_one = await mcp_call_tool(
                                tool_real_server_url,
                                tool_real_name, //'get_date_diff',
                                tool_call_args //{date_from:'2025-01-01',date_to:'2025-01-10'}
                            )
                        }
                        else{
                            result_one = await mcp_call_tool(
                                tool_real_server_url,
                                tool_real_name, //'get_date_diff',
                            )
                        }
                        console.log('[Line 934] result_one = ',result_one)  // TODO 还需要处理错误情况
                        if(Array.isArray(result_one)){
                            tool_result_one = result_one[0].result.content[0].text  
                        }
                        else{
                            tool_result_one = result_one.result.content[0].text 
                        }
                        tool_result_one = `<name>${tool_call_name}</name>\n<args>${tool_call_args_json}</args>\n<result>${tool_result_one}</result>`
                    }
                    //
                    // 将响应结果保存到变量 a
                    console.log('请求成功:', tool_result_one);
                    lst_tool_result.push(tool_result_one);
                    //
                    if (MCP_MODE == 'agent'){
                        round_tool_call = MAX_TOOL_CALL_ROUND + 1;  // agent成功之后，不再调用其他 
                    }
                } 
                catch (error) {
                    console.error('请求失败:', error);
                }
                finally {
                    await on_tool_call_end(tool_call_one);
                }
            }
            console.log(`lst_tool_result = ${lst_tool_result}`)  // 正常工作
            console.log(`lst_tool_result.length = ${lst_tool_result.length}`)  // 正常工作
            console.log(`Type of lst_tool_result[0] is: ${typeof lst_tool_result[0]}`);

            //
            // 重新运行，获取大模型回复
            console.log(`tool_name_cache = ${tool_name_cache}`);
            //
            if (tool_name_cache == 'get_tool_groups') {  // get_tool_groups 专用于获取工具组内详情
                let second_list_tool = []
                try{
                    // console.log(`lst_tool_result[0] = `,lst_tool_result[0])
                    // console.log(`lst_tool_result[0]['result'] = `,lst_tool_result[0]['result'])
                    second_list_tool = JSON.parse(lst_tool_result[0])['result']['tools']
                }
                catch(e){
                    console.log(`lst_tool_result['result'] = `,lst_tool_result['result'])
                    second_list_tool = lst_tool_result['result']['tools']
                }
                //
                await llmReplyStream({
                    inp_str : 'null', 
                    lst_msg : prompt_messages, 
                    round_tool_call: round_tool_call + 1,
                    lst_tools_input: second_list_tool,
                    flags: flags
                });
            }
            else {  // 普通的工具调用，是真的要执行功能的
                let prompt_messages_with_tool_result = [
                    ...prompt_messages, 
                    // {'role':'system','content':`tool_call result: ${JSON.stringify(lst_tool_result)}`}
                    // {'role':'system','content':`<tool_result> ${lst_tool_result} </tool_result> Do not use same tool for too many times.`}
                    {'role':'user','content':`<tool_result> ${lst_tool_result} </tool_result>`}
                ];
                console.log('prompt_messages_with_tool_result = ', prompt_messages_with_tool_result);
                //
                await llmReplyStream({
                    inp_str : 'null', 
                    lst_msg : prompt_messages_with_tool_result, 
                    round_tool_call: round_tool_call + 1,
                    flags: flags
                });
            }
        }
        // 尾巴输出
        if (flags.tail_printed){
            // 尾巴输出过，就不再输出了
        }
        else{
            if (result_whole.trim().length>0){
                await print_tail();
                flags.tail_printed = true;
            }
        }
    }
    // 如果输出解析失败的话
    catch(err){
        console.error('ERR531_in_utils.ts: ', err);
    }
    // 不管成功还是失败，都要执行的收尾工作
    finally {
        try {
            await on_wait_end();
        }
        catch (err) {
            //
        }
        //
        try {
            await on_think_end();
        }
        catch {
            //
        }
        await on_before_return();
    }
}

/**
 * 手动停止
 */
export async function llmReplyStop() {
    //
    const locale = await joplin.settings.globalValue('locale');
    let dictText = getTxt(locale);
    // flags
    let llmSettingFlags = await joplin.settings.values(['llmFlagLlmRunning'])
    let is_running = parseInt(String(llmSettingFlags['llmFlagLlmRunning']));
    //
    if (is_running == 1){ // 正在运行，强行停止
        await joplin.settings.setValue('llmFlagLlmRunning', 0);
        // alert('Force stopped!')
        await joplin.commands.execute('editor.execCommand', {
            name: 'cm-tempFloatingObject',
            args: [{ text: `NoteLLM force stoped!`, 
                floatId: 'llm_stop_1', ms: 3000, bgColor: COLOR_FLOAT.WARNING }]
        });
        return;
    }
    else { // 并没有运行
        await joplin.commands.execute('editor.execCommand', {
            name: 'cm-tempFloatingObject',
            args: [{ text: `NoteLLM stoped.`, 
                floatId: 'llm_stop_0', ms: 3000, bgColor: COLOR_FLOAT.FINISH }]
        });
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
    // toast for LLM changing
    //
    await joplin.settings.setValue('llmSelect', int_target_llm);
    // await (joplin.views.dialogs as any).showToast({
    //     message:`LLM ${int_target_llm} selected!`, 
    //     duration: 2500+(Date.now()%500), 
    //     type:'success',
    //     timestamp: Date.now()
    // }); 
    await joplin.commands.execute('editor.execCommand', {
        name: 'cm-tempFloatingObject',
        args: [{ text: `LLM ${int_target_llm} selected!`, 
            floatId: String(2500+(Date.now()%500)), ms: 2000, bgColor: COLOR_FLOAT.SETTING }]
    });
    //
    // test llm connection
    let TEST_LLM_CONNECTION = true;
    let test_result = 'OK';
    if (TEST_LLM_CONNECTION) {
        //
        const llmSettingValues = await joplin.settings.values([
        'llmModel','llmServerUrl','llmKey', 'llmExtra', 'llmMcp',
        'llmModel2','llmServerUrl2','llmKey2','llmExtra2','llmMcp2',
        'llmModel3','llmServerUrl3','llmKey3','llmExtra3','llmMcp3',]);
        //
        // 基础参数
        //
        let apiModel = '', apiUrl = '', apiKey = '', extraConfig:any;
        if(int_target_llm==2){
            apiModel = String(llmSettingValues['llmModel2']).trim();
            apiUrl = String(llmSettingValues['llmServerUrl2']) + '/chat/completions';
            apiKey = String(llmSettingValues['llmKey2']).trim();
        }
        else if(int_target_llm==3){
            apiModel = String(llmSettingValues['llmModel3']).trim();
            apiUrl = String(llmSettingValues['llmServerUrl3']) + '/chat/completions';
            apiKey = String(llmSettingValues['llmKey3']).trim();
        }
        else{
            apiModel = String(llmSettingValues['llmModel']).trim();
            apiUrl = String(llmSettingValues['llmServerUrl']) + '/chat/completions';
            apiKey = String(llmSettingValues['llmKey']).trim();
        }
        // 如果关键参数缺失，直接报错，不需要走后面的流程
        if (apiModel.trim() === ''){
            test_result = 'Model Name is Empty?';
        } 
        else if(apiUrl.trim() === ''){
            test_result = 'Model URL is Empty?';
        }
        else if(apiKey.trim() === '') {
            test_result = 'Model Key is Empty?';
        }
        else {
            // 测试连接
            try {
                // let check = await testChatCompletion(apiUrl, apiKey, apiModel);
                let check = await testListModels(apiUrl, apiKey);
                if (check.available){
                    test_result = 'OK'
                }
                else{
                    test_result = check.error;
                }
            } catch {
                test_result = 'Connection_Error';
            }
        };
        if (test_result == 'OK'){
            await joplin.commands.execute('editor.execCommand', {
                name: 'cm-tempFloatingObject',
                args: [{ text: `LLM ${int_target_llm} Status: OK`, 
                    floatId: String(2500+(Date.now()%500)), ms: 2000, bgColor: COLOR_FLOAT.FINISH }]
            });
        }
        else {
            await joplin.commands.execute('editor.execCommand', {
                name: 'cm-tempFloatingObject',
                args: [{ text: `LLM ${int_target_llm} Error: ${test_result}`, 
                    floatId: String(2500+(Date.now()%500)), ms: 3500, bgColor: COLOR_FLOAT.WARNING }]
            });
        }
    }
}

async function testListModels(baseURL, apiKey) {
    try {
        let fixedURL= baseURL.replace("/v1/chat/completions", '/v1/models')
        const response = await fetch(`${fixedURL}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (response.ok) {
            const data = await response.json();
            return {
                available: true,
                response: data.choices?.[0]?.message?.content || 'OK',
                usage: data.usage
            };
        }
        else {
            const errorData = await response.json().catch(() => ({}));
            return {
                available: false,
                error: errorData.error?.message || `HTTP ${response.status}`,
                status: response.status
            };
        }
    } 
    catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
};

async function testChatCompletion(baseURL:string, apiKey:string, model:string) {
  try {
        const response = await fetch(`${baseURL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });
        if (response.ok) {
            const data = await response.json();
            return {
                available: true,
                response: data.choices?.[0]?.message?.content || 'OK',
                usage: data.usage
            };
        } 
        else {
            const errorData = await response.json().catch(() => ({}));
            return {
                available: false,
                error: errorData.error?.message || `HTTP ${response.status}`,
                status: response.status
            };
        }
    } 
    catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
}

/**
 * For chat only. 
 * Split long text to dialog list, including role and content.
 */
export function splitTextToMessages(raw:string, remove_think:boolean=true) {

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
    // TODO 正文如果出现 <think> </think>，可能会存在 bug，不过严格来说并不影响显示，所以先观察试试
    if(remove_think && result.length > 0){
        for (let i = 0; i < result.length; i++) {
            if (result[i].role === "assistant"){
                let content = result[i].content;
                // let content_without_think = content.trim().replace(/^<think>[\s\S]*?<\/think>/, '').trimStart();  // 只处理第一个
                let content_without_think = content.trim().replace(/<think>[\s\S]*?<\/think>/g, '').trimStart();  // g 代表全替换
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
