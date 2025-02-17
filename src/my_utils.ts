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
        let tmp_pos_cursor = await joplin.commands.execute('editor.execCommand', {
            name: 'getCursor',
        }); // 当前光标位置
        await joplin.commands.execute('editor.execCommand', {
            name: 'scrollIntoView',
            args: [tmp_pos_cursor],
        });							
    }
    else if (mode === 'mobile'){
        // if(query_type=='chat' && !is_selection_exists){
            await joplin.commands.execute('editor.execCommand',{
                name:'scrollToLine',
                args:[100000000]
            });
            /// 移动端似乎不支持上面的 ScrollIntoView，所以只能强制滚动到最后
        // }
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
export async function llmReplyStream({inp_str, lst_msg = [], query_type='chat', is_selection_exists=true, str_before='', str_after=''}){
    //
    // 读取设置的参数
    const llmSettingValues = await joplin.settings.values(['llmModel','llmServerUrl','llmKey',
        'llmModel2','llmServerUrl2','llmKey2', 'llmSelect',
        'llmTemperature','llmMaxTokens','llmScrollType']);
    // 基础参数
    let llmSelect = llmSettingValues['llmSelect'];
    llmSelect = parseInt(String(llmSelect));
    //
    let apiModel = '', apiUrl = '', apiKey = '';
    if(llmSelect==2){
        apiModel = String(llmSettingValues['llmModel2']);
        apiUrl = String(llmSettingValues['llmServerUrl2']) + '/chat/completions';
        apiKey = String(llmSettingValues['llmKey2']);
    }
    else{
        apiModel = String(llmSettingValues['llmModel']);
        apiUrl = String(llmSettingValues['llmServerUrl']) + '/chat/completions';
        apiKey = String(llmSettingValues['llmKey']);
    }
    // 高级参数
    let apiTemperature = llmSettingValues['llmTemperature'];
    apiTemperature = parseFloat(String(apiTemperature));
    let apiMaxTokens = llmSettingValues['llmMaxTokens']
    apiMaxTokens = parseInt(String(apiMaxTokens)) ;
    let llmScrollType = llmSettingValues['llmScrollType']
    llmScrollType = parseInt(String(llmScrollType)) ;
    let platform = 'desktop';
    if (llmScrollType==1){platform = 'desktop'}
    else if (llmScrollType==2){platform = 'mobile'}
    else{platform = 'none'}
    //
    // 光标移动到选区最末尾
    try{
        let selectionEnd = await joplin.commands.execute('editor.execCommand', {
            name: 'getCursor',
            args: ['to'],
        }); 
        await joplin.commands.execute('editor.execCommand', {
            name: 'setCursor',
            args: [selectionEnd]
        });
    }
    catch{ // 移动端不兼容的情况下，采用选区重写的方式实现类似效果
        if (is_selection_exists) { // 如果有选中内容
            await joplin.commands.execute('insertText', `${inp_str}`);
        }
    }
    //
    const chat_head = `Response from ${apiModel}:`;  // 不需要加粗
    const chat_tail = '**End of response**';
    //
    // 打印 chat_head
    let result = `\n\n**${chat_head}**\n`;
    await joplin.commands.execute('insertText', result);
    // 
    // 构造对话列表
    let prompt_messages: OneMessage[] = [];
    if (lst_msg.length>0){ // 如果有传入的，直接使用
        prompt_messages = lst_msg;
    }
    else{
        let prompt_head = 'You are a helpful assistant.';
        if(query_type === 'summary'){
            prompt_head = '请简要总结下文的主要内容，并用列表的方式列举提炼出的要点。';
        }
        else if(query_type === 'ask'){
            prompt_head = '你是严谨认真的AI助手, 你的任务是准确回复用户的问题。';
        }
        else if(query_type === 'chat'){
            prompt_head = '你是用户的助手。你的任务是以对话的方式，基于用户前文提供的信息，以对话的形式回复最后的段落。请注意，回复完成之后不要额外追问。';
        }
        prompt_messages.push({ role: 'system', content: prompt_head});
        prompt_messages.push({ role: 'user', content: inp_str });

    }
    // 构造请求体
    const requestBody = {
        model: apiModel, // 模型名称
        messages:prompt_messages,
        stream: true, // 启用流式输出
        temperature: apiTemperature,
        max_tokens: apiMaxTokens,
    };
    //
    // 发起 HTTP 请求
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`, // 设置 API 密钥
        },
        body: JSON.stringify(requestBody), // 将请求体序列化为 JSON
    });

    // 检查 HTTP 响应状态
    if (!response.ok || !response.body) {
        const errorText = await response.text();
        console.error('Error from LLM API:', errorText);
        alert(`调用 LLM API 时出错：${response.status} ${response.statusText}`);
        return;
    }
    // 解析流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    // 实时更新笔记中的回复
    const insertContentToNote = async (new_text: string) => {
        result += new_text; // 将新内容拼接到结果中
        await joplin.commands.execute('insertText', new_text); // 插入最新内容到笔记
    };
    //
    // 逐块读取流式数据
    let output_str = '';
    let need_add_head = true;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break; // 流结束时退出循环

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
                const jsonString = trimmedLine.replace(/^data: /, ''); // 去掉 "data: " 前缀

                // 特殊情况：处理流结束的标志 "data: [DONE]"
                if (jsonString === '[DONE]') {
                    console.info('Stream finished.');
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
                    }
                    else{
                        await insertContentToNote(content); // 实时更新内容
                    }
                    // 滚动条移动到光标位置
                    await scroll_to_view(platform);
                } catch (err) {
                    console.warn('Failed to parse line:', trimmedLine, err);
                    alert(`Failed to parse line: ${err}`);
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
        await joplin.commands.execute('insertText', '\n\n');
    }
    else{
        await joplin.commands.execute('insertText', `\n${chat_tail}\n\n`);
    }
    await scroll_to_view(platform);
    // await joplin.views.dialogs.showToast({message:'Finished successfully.', duration:5000, type:'success'});
    await (joplin.views.dialogs as any).showToast({message:'Response finished.', duration:2500+(Date.now()%500), type:'success',timestamp: Date.now()});
}