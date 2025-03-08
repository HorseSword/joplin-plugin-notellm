import joplin from 'api';
import {ToolbarButtonLocation, ContentScriptType, MenuItemLocation } from 'api/types';
import { registerSettings, pluginIconName } from './settings';
import {llmReplyStream, changeLLM} from './my_utils';
import {getTxt} from './texts';

// import {llmReplyStream} from './my_openai_utils';

// import OpenAI from "openai";
// import { MenuItemLocation } from 'api/types'; // 导入 MenuItemLocation 类型

joplin.plugins.register({
	onStart: async function() {
		console.info('Hello world. NoteLLM plugin started!');
		let platform = 'desktop';
		const locale = await joplin.settings.globalValue('locale');
		let dictText = getTxt(locale);
		//
		const contentScriptId = 'some-content-script-id';
        joplin.contentScripts.register(
            ContentScriptType.CodeMirrorPlugin,
            contentScriptId,
            './contentScript.js',
        );
		//
		// 设置项
		await registerSettings();
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
		async function split_note_by_selection(split_char:string='@TODO') {
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
		await joplin.commands.register({
			name: 'quickChangeLLM1',
			label: dictText['switch_to_LLM1'], // 'Switch to LLM 1',
			iconName: 'fas fa-robot',
			execute: async () => {
				await changeLLM(1);
			}
		});
		await joplin.commands.register({
			name: 'quickChangeLLM2',
			label: dictText['switch_to_LLM2'],
			iconName: 'fas fa-robot',
			execute: async () => {
				await changeLLM(2);
			}
		});
		//
		// 摘要
		await joplin.commands.register({
			name: 'askLLMSummary',
			label: dictText['summary_label'],// 'Summarize selection (or above cursor)',
			iconName: 'fas fa-robot',
			execute: async () => {
				try {
					// 读取选中的内容：
					let dict_selection = await split_note_by_selection();
					// 
					// 判断是否在markdown模式
					if (typeof(await joplin.commands.execute('editor.execCommand', { name: 'cm-getSelectionInfo' })) === 'boolean'){
						alert('ERROR 124: Maybe you are not in markdown mode?');
						return;
					}
					if (dict_selection.is_selection_exists){
						let prompt_messages = []
						prompt_messages.push({ role: 'system', content: dict_selection.str_selected});
						prompt_messages.push({ role: 'user', content: '请简要概括上文的主要内容，并用列表的方式列举提炼出的要点。' });
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
						prompt_messages.push({ role: 'user', content: '请简要概括上文的主要内容，并用列表的方式列举提炼出的要点。' });
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
			},
		});
		/**
		 * improve：改写完善选中的部分。
		 */
		await joplin.commands.register({
			name: 'askLLMImprove',
			label: dictText['improve_label'], //'Improve selection (context related)',
			iconName: 'fas fa-hands-helping',
			execute:async()=>{
				try {
					// 读取选中的内容：
					let dict_selection = await split_note_by_selection();
					// 
					// 判断是否在markdown模式
					if (typeof(await joplin.commands.execute('editor.execCommand', { name: 'cm-getSelectionInfo' })) === 'boolean'){
						alert('ERROR 124: Maybe you are not in markdown mode?');
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
							alert('Please input your command.');
							return
						}
						//
						let prompt_messages = []
						prompt_messages.push({ role: 'system', content: '你的任务是帮助用户完善文档。'});
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
							content: `请帮助用户完善文档。参考前后文及其关联关系，按'command'部分的要求，改进'text_selected'部分的文本表达。请直接回复最终结果，不需要额外的文字，严禁修改其余任何部分。不需要抄写 text_before_selection 或 text_after_selection。`
						});
						await llmReplyStream({inp_str:dict_selection.str_selected,
							query_type:'improve',
							is_selection_exists:true,
							lst_msg:prompt_messages
						});
					}
					else{
						alert('Please select some text first.');
						// await (joplin.views.dialogs as any).showToast({message:'Please select some text first.', duration:3000+(Date.now()%100), type:'error',timestamp: Date.now()});
					}
				}
				catch(error){
					console.error('Error executing search command:', error);
				}
			}
		})
		/**
		 * ask： 针对选中部分提问。
		 */
		await joplin.commands.register({
			name: 'askLLMSelected',
			label: dictText['ask_label'],// 'Ask about selection',
			iconName: 'fas fa-robot',
			execute:async()=>{
				try {
					// 读取选中的内容：
					let dict_selection = await split_note_by_selection();
					// 
					// 判断是否在markdown模式
					if (typeof(await joplin.commands.execute('editor.execCommand', { name: 'cm-getSelectionInfo' })) === 'boolean'){
						alert('ERROR 124: Maybe you are not in markdown mode?');
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
						prompt_messages.push({ role: 'system', content: '接下来用户会针对选中的部分提问。'});
						if (dict_selection.str_before.length>0){
							prompt_messages.push({role:'user',content:`<text_before_selection>\n\n${dict_selection.str_before}\n\n</text_before_selection>`});
						}
						//
						prompt_messages.push({ role: 'user', content: `<text_selected>\n\n${dict_selection.str_selected}\n\n</text_selected>`});
						let str_command = result_of_question.formData.question.desc;
						prompt_messages.push({role:'user',content:`<user_command>\n\n${str_command}\n\n</user_command>`});
						//
						if (dict_selection.str_after.length>0){
							prompt_messages.push({role:'user',content:`<text_after_selection>\n\n${dict_selection.str_after}\n\n</text_after_selection>`});
						}
						prompt_messages.push({ role: 'user', 
							content: `任务说明: 请参考前后文及其关联关系，针对 “text_selected” 部分提供的内容，回复用户在"user_command"所提出的问题。请直接回复最终结果，不需要抄写 text_before_selection 或 text_after_selection。`
						});
						await llmReplyStream({inp_str:dict_selection.str_selected,
							query_type:'ask',
							is_selection_exists:true,
							lst_msg:prompt_messages
						});
						console.info('Streaming complete!');
					}
					else{
						alert('Please select where you want to ask.');
						// await (joplin.views.dialogs as any).showToast({message:'Please select some text first.', duration:3000+(Date.now()%100), type:'error',timestamp: Date.now()});
					}
				}
				catch(error){
					console.error('Error executing search command:', error);
				}
			}
		})
		//
		//
		/**
		 * chat 对话方式回复。
		 * 如果有选中，就回复选中内容，输入是选中部分。 
		 * 如果没有选中任何内容，就在光标处续写，输入为光标之前的部分。
		 */
		await joplin.commands.register({
			name: 'askLLMChat',
			label: dictText['chat_label'], //'Chat and reply (above cursor)',
			iconName: 'fas fa-comments',
			execute:async()=>{
				try {
					let dict_selection = await split_note_by_selection();
					// 
					// 判断是否在markdown模式
					if (typeof(await joplin.commands.execute('editor.execCommand', { name: 'cm-getSelectionInfo' })) === 'boolean'){
						alert('ERROR 124: Maybe you are not in markdown mode?');
						return;
					}
					if (dict_selection.is_selection_exists){
						await llmReplyStream({inp_str:dict_selection.str_selected, 
							query_type:'chat', 
							is_selection_exists:false
						});
                    }
					else{
						await llmReplyStream({inp_str:dict_selection.str_before, 
							query_type:'chat', 
							is_selection_exists:true
						});
					}
					console.info('Streaming complete!');
				}
				catch(error){
					console.error('Error 295:', error);
					alert(`Error 295: ${error}`);
				}
			}
		})
		//
		// 
		//
		// 添加一个菜单项到顶部“工具”菜单中
		await joplin.views.menus.create(
			'askLLM_menus', // 菜单项 ID
			'Note_LLM', // 菜单项名称
			[
			  
			  {
				label: 'askLLM_Chat',
				commandName: 'askLLMChat', // 绑定的命令
				accelerator: 'Alt+C', // 可选快捷键
			  },
			  {
				label: 'askLLM_Summary',
				commandName: 'askLLMSummary', // 绑定的命令
				// accelerator: 'Ctrl+Alt+S', // 可选快捷键
			  },
			  {
				label: 'askLLM_Improve',
				commandName: 'askLLMImprove', // 绑定的命令
				accelerator: 'Alt+I', // 可选快捷键
			  },
			  {
				label: 'askLLM_Selected',
				commandName: 'askLLMSelected', // 绑定的命令
				accelerator: 'Alt+Q', // 可选快捷键
			  },
			  {
				label: 'Switch_to_LLM_1',
				commandName: 'quickChangeLLM1', // 绑定的命令
			  },
			  {
				label: 'Switch_to_LLM_2',
				commandName: 'quickChangeLLM2', // 绑定的命令
			  },
			],
			MenuItemLocation.Tools // 菜单位置：添加到“工具”菜单
		);
		//
		// // 添加编辑区顶部工具栏的按钮 (并不好用)
		// await joplin.views.toolbarButtons.create(
		//     'askLLMChatNoteBarButton', 
		// 	'askLLMChat', 
		//     ToolbarButtonLocation.NoteToolbar
		// );
		//
		// 添加按钮到笔记编辑区的工具栏
        // await joplin.views.toolbarButtons.create(
        //     'askLLMStream_ToolBarButton', // 按钮 ID
        //     'askLLMImprove',   // 绑定的命令名称
        //     ToolbarButtonLocation.EditorToolbar // 工具栏位置（支持移动端）
        // );
        await joplin.views.toolbarButtons.create(
            'askLLMChat_ToolBarButton', // 按钮 ID
            'askLLMChat',   // 绑定的命令名称
            ToolbarButtonLocation.EditorToolbar // 工具栏位置（支持移动端）
        );
		//
		// 编辑区右键菜单
		// await joplin.views.menuItems.create(
		// 	'askLLMStream_MenuItem', // 菜单项 ID
		// 	'askLLMStream',   // 绑定的命令
		// 	MenuItemLocation.EditorContextMenu // 添加到编辑器上下文菜单
		// );
		// await joplin.views.menuItems.create(
		// 	'askLLMSummary_MenuItem', // 菜单项 ID
		// 	'askLLMSummary',   // 绑定的命令
		// 	MenuItemLocation.EditorContextMenu // 添加到编辑器上下文菜单
		// );
	},
});
