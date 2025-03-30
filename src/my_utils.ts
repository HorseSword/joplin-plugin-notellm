import joplin from '../api';

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
 * 流式回复的可调用函数
 * 
 * 这个函数的作用是，根据传入的文本，流式返回结果。
 */
export async function llmReplyStream({inp_str, lst_msg = [], query_type='chat',
    is_selection_exists=true, str_before='', str_after=''}){
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
        'llmTemperature','llmMaxTokens','llmScrollType'
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
        alert(`ERROR 57: LLM url, key or model is empty!`);
        return;
    }
    // 高级参数
    let apiTemperature = llmSettingValues['llmTemperature'];
    apiTemperature = parseFloat(String(apiTemperature));
    let apiMaxTokens = llmSettingValues['llmMaxTokens']
    apiMaxTokens = parseInt(String(apiMaxTokens)) ;
    //
    let llmScrollType = llmSettingValues['llmScrollType']
    llmScrollType = parseInt(String(llmScrollType)) ;
    let platform = 'desktop';
    if (llmScrollType==1){platform = 'desktop'}
    else if (llmScrollType==2){platform = 'mobile'}
    else{platform = 'none'}
    // 
    //
    const chat_head = `Response from ${apiModel}:`;  // 不需要加粗
    const chat_tail = '**End of response**';
    //
    // ===============================================================
    // 实时更新笔记中的回复
    // 
    let result = ''
    const insertContentToNote = async (new_text: string) => {
        result += new_text; // 将新内容拼接到结果中
        await joplin.commands.execute('insertText', new_text); // 插入最新内容到笔记
        // await joplin.commands.execute('editor.execCommand', {name: 'cm-myInsertText', arguments:[new_text]});
    };
    //
    // 光标移动到选区最末尾
    await joplin.commands.execute('editor.execCommand', {name: 'cm-moveCursorToSelectionEnd'});
    //
    // 打印 chat_head
    await insertContentToNote(`\n\n**${chat_head}**\n`);
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
        let prompt_head = 'You are a helpful assistant.';
        if(query_type === 'chat'){
            prompt_head = '你是用户的助手。你的任务是以对话的方式，基于用户前文提供的信息，以对话的形式回复最后的段落。请注意，回复完成之后不要额外追问。';
        }
        prompt_messages.push({ role: 'system', content: prompt_head});
        prompt_messages.push({ role: 'user', content: inp_str });
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
    let response;
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
        if (err.message.includes('Failed to fetch')){
            console.error('Error 173:', err);
            alert(`Error 173: ${err}. This caused by your network or LLM server CORS.`);
        }
        else{
            console.error('Error 177:',err);
            alert(`ERROR 177: ${err} \n response = ${response}.`);
        }
        return;
    }   
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
    while (true) {
        const { done, value } = await reader.read();
        if (done) break; // 流结束时退出循环
        if (fail_count >= FAIL_COUNT_MAX) {
            alert('Sorry, something went wrong. Please check plugin logs for detail.')
            break;  // 连续失败后退出
        }
        // 解码并解析数据块
        const chunk:string = decoder.decode(value, { stream: true });
        console.info('Stream Chunk:', chunk);
        // 解析 JSON 行
        if (typeof chunk === "string"){
            for (const line of chunk.split('\n')) { //
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
                    const content = parsed.choices[0]?.delta?.content || '';
                    output_str+=content;
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
                        await insertContentToNote(content); // 实时更新内容
                    }
                    // 滚动条移动到光标位置
                    await scroll_to_view(platform);
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
    if (need_add_head){ // 万一总长度不足导致上面没有执行；
        await insertContentToNote(output_str);
    }
    if (output_str.trim().endsWith(chat_tail)){
        await insertContentToNote('\n\n');
    }
    else{
        await insertContentToNote(`\n${chat_tail}\n\n`);
    }
    await scroll_to_view(platform);
    //
    // 完成
    // await joplin.views.dialogs.showToast({message:'Finished successfully.', duration:5000, type:'success'});
    await (joplin.views.dialogs as any).showToast({message:'Response finished.', duration:2500+(Date.now()%500), type:'success',timestamp: Date.now()});
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