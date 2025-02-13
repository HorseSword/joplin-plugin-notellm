import joplin from 'api';
import {ToolbarButtonLocation, ContentScriptType, MenuItemLocation } from 'api/types';
import { registerSettings, pluginIconName } from './settings';
import {llmReplyStream} from './my_utils';

// import OpenAI from "openai";
// import { MenuItemLocation } from 'api/types'; // 导入 MenuItemLocation 类型

joplin.plugins.register({
	onStart: async function() {
		console.info('Hello world. NoteLLM plugin started!');
		let platform = 'desktop';
		//
		// 设置项
		await registerSettings();
		/**
		 * 获取选中片段前面、中间、后面；
		 * 
		 * 返回值：
		 * {
		 * is_selection_exists: 是否有选中项,  true / false; 
		 * str_before: 选区或光标之前的内容, 
		 * str_selected: 选中的内容,
		 * str_after: 选取之后或光标之后的内容。
		 * }
		 */
		async function split_note_by_selection(split_char:string='@TODO') {
			let is_selection_exists = false;
			let content:string = await joplin.commands.execute('editor.execCommand', {
				name: 'getValue',
			}); // 获取文档内容 // 这种写法在手机端不兼容
			if (typeof content ==='string'){
				let lines = content.split('\n'); // 按行分割文档内容
				//
				// 选中部分
				const selectedText = await joplin.commands.execute('selectedText');
				
				if (!selectedText || selectedText.trim() === '') { // 如果没有选中内容
					is_selection_exists = false;
				}
				else{
					is_selection_exists = true;
				}
				//
				// 选中前面部分
				let selectionStart = await joplin.commands.execute('editor.execCommand', {
					name: 'getCursor',
					args: ['from'],
				}); // 获取选中起点光标位置
				let beforeSelection = lines.slice(0, selectionStart.line).join('\n') + '\n' + lines[selectionStart.line].slice(0, selectionStart.ch);
				//
				// 选中后面部分
				let selectionEnd = await joplin.commands.execute('editor.execCommand', {
					name: 'getCursor',
					args: ['to'],
				}); // 获取选中结束光标位置
				let afterSelection = lines[selectionEnd.line].slice(selectionEnd.ch) + '\n' + lines.slice(selectionEnd.line + 1).join('\n');
				//
				return {is_selection_exists:is_selection_exists, 
					str_before:beforeSelection, 
					str_selected: selectedText, 
					str_after:afterSelection
				}
			}
			else{
				let tmp_note = await joplin.workspace.selectedNote()
				let content = tmp_note.body // 移动端兼容写法
				let lines = content.split('\n'); // 按行分割文档内容
				//
				// 选中部分
				const selectedText = await joplin.commands.execute('selectedText');
				
				if (!selectedText || selectedText.trim() === '') { // 如果没有选中内容
					is_selection_exists = false;
				}
				else{
					is_selection_exists = true;
				}
				//
				// 选中前面部分
				let beforeSelection = content;
				if (is_selection_exists){
					beforeSelection = '';
				}
				//
				// 选中后面部分
				let afterSelection = ''
				return {is_selection_exists:is_selection_exists, 
					str_before:beforeSelection, 
					str_selected: selectedText, 
					str_after:afterSelection
				}
			}
		}
		//
		// 摘要
		await joplin.commands.register({
			name: 'askLLMSummary',
			label: 'Summarize selection',
			iconName: 'fas fa-robot',
			execute: async () => {
				try {
					// 读取选中的内容：
					let dict_selection = await split_note_by_selection();
					if (dict_selection.is_selection_exists){
						let prompt_messages = []
						prompt_messages.push({ role: 'system', content: dict_selection.str_selected});
						prompt_messages.push({ role: 'user', content: '请简要概括上文的主要内容，并用列表的方式列举提炼出的要点（需要时可使用分级列表）。' });
						//
						await llmReplyStream({inp_str:dict_selection.str_selected, 
							query_type:'summary', 
							lst_msg:prompt_messages,
							is_selection_exists:true
						});
					}
					else{
						alert('Please select some text first.');
				 	    return;
					}
					// const selectedText = await joplin.commands.execute('selectedText');
					// if (!selectedText || selectedText.trim() === '') {
                    //     alert('请先选中一些文本！');
                    //     return;
                    // }
					//
					
					//
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
			label: 'Improve selection (context related)',
			iconName: 'fas fa-hands-helping',
			execute:async()=>{
				try {
					// 读取选中的内容：
					let dict_selection = await split_note_by_selection();
					if (dict_selection.is_selection_exists){
						let prompt_messages = []
						prompt_messages.push({ role: 'system', content: '你的任务是帮助用户完善文档。'});
						if (dict_selection.str_before.length>0){
							prompt_messages.push({role:'user',content:`<text_before_selection>\n\n${dict_selection.str_before}\n\n</text_before_selection>`});
						}
						prompt_messages.push({ role: 'user', content: `<text_selected>\n\n${dict_selection.str_selected}\n\n</text_selected>`});
						if (dict_selection.str_after.length>0){
							prompt_messages.push({role:'user',content:`<text_after_selection>\n\n${dict_selection.str_after}\n\n</text_after_selection>`});
						}
						prompt_messages.push({ role: 'user', 
							content: `请参考前后文及其关联关系，按用户要求，修改'text_selected'部分。请注意不要修改其余部分。请直接回复'text_selected'部分的最终结果，不需要额外的文字，不需要抄写 text_before_selection 或 text_after_selection。`
						});
						await llmReplyStream({inp_str:dict_selection.str_selected,
							query_type:'improve',
							is_selection_exists:true,
							lst_msg:prompt_messages
						});
						console.info('Streaming complete!');
					}
					else{
						// alert('请先选中一些文本！');
						await (joplin.views.dialogs as any).showToast({message:'Please select some text first.', duration:3000+(Date.now()%100), type:'error',timestamp: Date.now()});
					}
				}
				catch(error){
					console.error('Error executing search command:', error);
				}
			}
		})
		/**
		 * improve：选中部分提问。
		 */
		await joplin.commands.register({
			name: 'askLLMSelected',
			label: 'Ask about selection',
			iconName: 'fas fa-robot',
			execute:async()=>{
				try {
					// 读取选中的内容：
					let dict_selection = await split_note_by_selection();
					if (dict_selection.is_selection_exists){
						let prompt_messages = []
						prompt_messages.push({ role: 'system', content: '接下来用户会针对选中的部分提问。'});
						if (dict_selection.str_before.length>0){
							prompt_messages.push({role:'user',content:`<text_before_selection>\n\n${dict_selection.str_before}\n\n</text_before_selection>`});
						}
						prompt_messages.push({ role: 'user', content: `<text_selected>\n\n${dict_selection.str_selected}\n\n</text_selected>`});
						if (dict_selection.str_after.length>0){
							prompt_messages.push({role:'user',content:`<text_after_selection>\n\n${dict_selection.str_after}\n\n</text_after_selection>`});
						}
						prompt_messages.push({ role: 'user', 
							content: `任务说明: 上下文仅供参考。请参考前后文及其关联关系，按用户要求，回复用户在 “text_selected” 部分提供的内容。请直接回复“text_selected”的最终结果，不需要抄写 text_before_selection 或 text_after_selection。`
						});
						await llmReplyStream({inp_str:dict_selection.str_selected,
							query_type:'ask',
							is_selection_exists:true,
							lst_msg:prompt_messages
						});
						console.info('Streaming complete!');
					}
					else{
						// alert('请先选中一些文本！');
						await (joplin.views.dialogs as any).showToast({message:'Please select some text first.', duration:3000+(Date.now()%100), type:'error',timestamp: Date.now()});
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
			label: 'Chat and reply',
			iconName: 'fas fa-comments',
			execute:async()=>{
				try {
					let dict_selection = await split_note_by_selection();
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
				label: 'askLLM_Chat',
				commandName: 'askLLMChat', // 绑定的命令
				accelerator: 'Alt+C', // 可选快捷键
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
