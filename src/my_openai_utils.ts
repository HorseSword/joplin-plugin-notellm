import OpenAI from "openai";
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
 * 流式回复的可调用函数
 * 
 * 这个函数的作用是，根据传入的文本，流式返回结果。
 */
export async function llmReplyStream({inp_str, lst_msg = [], query_type='chat', is_selection_exists=true, str_before='', str_after=''}){
    //
    let platform = 'desktop';
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
    if (llmScrollType==1){platform = 'desktop'}
    else if (llmScrollType==2){platform = 'mobile'}
    else{platform = 'none'}
    //
    // client
    const openai_client = new OpenAI({
        baseURL: apiUrl,
        apiKey: apiKey
    });
    //
    const chat_head = `Response from ${apiModel}:`;  // 不需要加粗
    const chat_tail = '**End of response**';
    // 
    // 构造对话列表
    let prompt_messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (lst_msg.length>0){ // 如果有传入的，直接使用
        prompt_messages = lst_msg;
    }
    else{
        if(query_type === 'improve'){
            prompt_messages.push({ role: 'system', content: '你的任务是帮助用户完善文档。'});
            if (str_before.length>0){
                prompt_messages.push({role:'user',content:`【前文】\n\n${str_before}`});
            }
            prompt_messages.push({ role: 'user', content: `【待处理部分】\n\n${inp_str}`});
            if (str_after.length>0){
                prompt_messages.push({role:'user',content:`【后文】\n\n${str_after}`});
            }
            prompt_messages.push({ role: 'user', 
                content: `【要求】请参考前后文及其关联关系，按用户要求，修改'待处理部分'。请注意不要修改其余部分。请直接回复最终结果，不需要额外的文字。`
            });
        }
        else{
            // 任务类型
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
    }
    //
    // 对话开始
    const completion = await openai_client.chat.completions.create({
        model: apiModel,
        stream: true,
        messages:prompt_messages
      });
    //
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
    catch{ // 移动端不兼容的情况下
        if (is_selection_exists) { // 如果有选中内容
            await joplin.commands.execute('insertText', `${inp_str}`);
        }
    }
    //
    // 打印 chat_head
    let result = `\n\n**${chat_head}**\n`;
    await joplin.commands.execute('insertText', result);

    // 实时更新笔记中的回复
    const insertContentToNote = async (new_text: string) => {
        result += new_text; // 将新内容拼接到结果中
        await joplin.commands.execute('insertText', new_text); // 插入最新内容到笔记
    };
    //
    /**
     * 滚动条移动到光标位置
     */
    const scrollToCursor = async(mode:string='none') =>{
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
            if(query_type=='chat' && !is_selection_exists){
                await joplin.commands.execute('editor.execCommand',{
                    name:'scrollToLine',
                    args:[100000000]
                });
                /// 移动端似乎不支持上面的 ScrollIntoView，所以只能强制滚动到最后
            }
        }
        else{
            // 其他的不做任何事情
        }
    }

    // 逐块读取流式数据

    let output_str = '';
    let need_add_head = true;
    
    for await (const chunk of completion) {
        try {
            const content = chunk.choices[0]?.delta?.content || '';
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
            await scrollToCursor(platform);
        } catch (err) {
            alert(`Failed to parse line: ${err}`);
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
    await scrollToCursor(platform);
    // await joplin.views.dialogs.showToast({message:'Finished successfully.', duration:5000, type:'success'});
    await (joplin.views.dialogs as any).showToast({message:'Response finished.', duration:2500+(Date.now()%500), type:'success',timestamp: Date.now()});
}
