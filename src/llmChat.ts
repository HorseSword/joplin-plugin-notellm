import joplin from 'api';
import {llmReplyStream, llmReplyStop, changeLLM, check_llm_status} from './my_utils';
import {get_txt_by_locale} from './texts';

/**
 * 对话的消息体类
 */
interface OneMessage {
  role: string;
  content: string;
}

/**
 * 获取选中片段前面、中间、后面；
 * 
 * 返回值：
 * {
 *   is_selection_exists: 是否有选中项,  true / false; 
 *   str_before: 选区或光标之前的内容, 
 *   str_selected: 选中的内容,
 *   str_after: 选取之后或光标之后的内容。
 * }
 */
export async function split_note_by_selection(split_char:string='@TODO') {
  let selectionInfo = await joplin.commands.execute('editor.execCommand', 
    { name: 'cm-getSelectionInfo' }
  );
  return {
    is_selection_exists: selectionInfo.isSelectionExists, 
    str_before: selectionInfo.beforeText, 
    str_selected: selectionInfo.selectedText, 
    str_after: selectionInfo.afterText
  }
}

export async function llm_summary() {
  let dictText = await get_txt_by_locale();

  try {
    // 读取选中的内容：
    let dict_selection = await split_note_by_selection();
    // 
    // 判断是否在markdown模式
    if (typeof(await joplin.commands.execute('editor.execCommand', { name: 'cm-getSelectionInfo' })) === 'boolean'){
      alert('ERROR 124: ' + dictText['err_markdown']);
      return;
    }
    if (dict_selection.is_selection_exists){
      let prompt_messages = []
      prompt_messages.push({ role: 'system', content: dict_selection.str_selected});
      prompt_messages.push({ role: 'user', content: dictText['prompt_summary'] });
      //
      await llmReplyStream({
        inp_str:'nothing', 
        query_type:'summary', 
        lst_msg:prompt_messages,
        is_selection_exists:true
      });
    }
    else{
      let prompt_messages = []
      prompt_messages.push({ role: 'system', content: dict_selection.str_before});
      prompt_messages.push({ role: 'user', content: dictText['prompt_summary'] });
      //
      await llmReplyStream({
        inp_str:'nothing', 
        query_type:'summary', 
        lst_msg:prompt_messages,
        is_selection_exists:true
      });
      // alert('Please select some text first.');
        return;
    }
  }
  catch(error){
    alert(`Error 132: ${error}`);
    console.error('Error executing command:', error);
  }
}
/**
 * 
 * @returns 
 */
export async function llm_ask(){
  try {
    let dictText = await get_txt_by_locale();
    // 读取选中的内容：
    let dict_selection = await split_note_by_selection();
    // 
    // 判断是否在markdown模式
    if (typeof(await joplin.commands.execute('editor.execCommand', { name: 'cm-getSelectionInfo' })) === 'boolean'){
      alert('ERROR 124: ' + dictText['err_markdown']);
      return;
    }
    //
    if (dict_selection.is_selection_exists){
      //
      // 获取用户的提问内容
      const dialogs = joplin.views.dialogs;
      const handle_question = await dialogs.create(`${Date.now()}`);
      await dialogs.setHtml(handle_question, `
        <p>Your question?</p>
        <form name="question">
          <textarea name="desc" autofocus style="width:95%"></textarea>
        </form>
        `);
      const result_of_question = await dialogs.open(handle_question);
      if (result_of_question.id != 'ok'){
        return
      }
      else if (result_of_question.formData.question.desc.length<=0){
        alert('No text.');
        return
      }
      //
      let prompt_messages = []
      prompt_messages.push({ role: 'system', content: dictText['prompt_ask_1']});
      //
      // before selection
      if (dict_selection.str_before.length>0){
        prompt_messages.push({role:'user',content:`<text_before_selection>\n\n${dict_selection.str_before}\n\n</text_before_selection>`});
      }
      //
      // selection
      prompt_messages.push({ role: 'user', content: `<text_selected>\n\n${dict_selection.str_selected}\n\n</text_selected>`});
      let str_command = result_of_question.formData.question.desc;
      prompt_messages.push({role:'user',content:`<user_command>\n\n${str_command}\n\n</user_command>`});
      //
      // after selection
      if (dict_selection.str_after.length>0){
        prompt_messages.push({role:'user',content:`<text_after_selection>\n\n${dict_selection.str_after}\n\n</text_after_selection>`});
      }
      prompt_messages.push({ role: 'user', 
        content: dictText['prompt_ask_2']
      });
      //
      await llmReplyStream({inp_str:dict_selection.str_selected,
        query_type:'ask',
        is_selection_exists:true,
        lst_msg:prompt_messages
      });
      console.info('Streaming complete!');
    }
    else{
      alert(dictText['err_no_ask']);
    }
  }
  catch(error){
    console.error('Error executing search command:', error);
  }
}

export async function llm_rewrite(){
  try {
    let dictText = await get_txt_by_locale();
    // 读取选中的内容：
    let dict_selection = await split_note_by_selection();
    // 
    // 判断是否在markdown模式
    if (typeof(await joplin.commands.execute('editor.execCommand', { name: 'cm-getSelectionInfo' })) === 'boolean'){
      alert('ERROR 124: '+ dictText['err_markdown']);
      return;
    }			
    //
    if (dict_selection.is_selection_exists){	
      //	
      // 获得用户输入
      const dialogs = joplin.views.dialogs;
      const handle_question = await dialogs.create(`${Date.now()}`);
      await dialogs.setHtml(handle_question, `
        <p>Your command?</p>
        <form name="question">
          <textarea name="desc" autofocus style="width:95%"></textarea>
        </form>
        `);
      const result_of_question = await dialogs.open(handle_question);
      let user_command = ''
      user_command = result_of_question.formData.question.desc;
      if (result_of_question.id != 'ok'){
        return
      }
      else if (user_command.length<=0){
        alert(dictText['err_no_command']);
        return
      }
      //
      let prompt_messages = []
      prompt_messages.push({ role: 'system', content: dictText['prompt_improve_1'] });
      if (dict_selection.str_before.length>0){
        prompt_messages.push({role:'user',content:`<text_before_selection>\n\n${dict_selection.str_before}\n\n</text_before_selection>`});
      }
      prompt_messages.push({ role: 'user', content: `<text_selected>\n\n${dict_selection.str_selected}\n\n</text_selected>`});
      if (user_command.length>0){
        prompt_messages.push({role:'user',content:`<command>\n\n${user_command}\n\n</command>`});
      }
      if (dict_selection.str_after.length>0){
        prompt_messages.push({role:'user',content:`<text_after_selection>\n\n${dict_selection.str_after}\n\n</text_after_selection>`});
      }
      prompt_messages.push({ role: 'user', 
        content: dictText['prompt_improve_2']
      });
      await llmReplyStream({inp_str:dict_selection.str_selected,
        query_type:'improve',
        is_selection_exists:true,
        lst_msg:prompt_messages
      });
    }
    else{
      alert(dictText['err_no_selection']);
    }
  }
  catch(error){
    console.error('Error executing search command:', error);
  }
}
/**
 * chat 对话方式回复。
 * 如果有选中，就回复选中内容，输入是选中部分。 
 * 如果没有选中任何内容，就在光标处续写，输入为光标之前的部分。
 */
export async function llm_chat() {
  let dictText = await get_txt_by_locale();
    
  try { 
    
    // 判断是否在markdown模式
    if (typeof(await joplin.commands.execute('editor.execCommand', { name: 'cm-getSelectionInfo' })) === 'boolean'){
      alert('ERROR 124: '+ dictText['err_markdown']);
      return;
    }
    else{
      console.log('In markdown mode. Continue.');
    }
    //
    let dict_selection = await split_note_by_selection();
    // console.warn(dict_selection);
    if (dict_selection.is_selection_exists){
      await llmReplyStream({ 
        inp_str:dict_selection.str_selected, 
        query_type:'chat', 
        is_selection_exists:true
      });
              }
    else{
      await llmReplyStream({
        inp_str: dict_selection.str_before, 
        query_type: 'chat', 
        is_selection_exists:false
      });
    }
    console.info('Streaming complete!');
  }
  catch(error){
    if (error.message.includes('Failed to fetch')){
      console.error('Error 307:', error);
      alert(`Error 307: ${error}. ${dictText['err_cors']}`);
    }
    else{
      console.error('Error 295:', error);
      alert(`Error 295: ${error}`);
    }
  }
}