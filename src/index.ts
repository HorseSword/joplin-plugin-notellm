import joplin from 'api';
import {ToolbarButtonLocation, ContentScriptType, MenuItemLocation } from 'api/types';
import { registerSettings, pluginIconName } from './settings';

// import OpenAI from "openai";
// import { MenuItemLocation } from 'api/types'; // 导入 MenuItemLocation 类型

joplin.plugins.register({
	onStart: async function() {
		// eslint-disable-next-line no-console
		console.info('Hello world. NoteLLM plugin started!');
		// const notyf = new Notyf();
		let platform = 'desktop';
		//
		// 设置项
		await registerSettings();
		/**
		 * 获取选中片段前面、中间、后面
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
		async function llm_reply_stream({inp_str, lst_msg = [], query_type='chat', 
			is_selection_exists=true, str_before='', str_after=''}){
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
			const chat_head = `Response from ${apiModel}:`;  // 不需要加粗
			const chat_tail = '**End of response**';
			// 
			// 构造对话列表
			let prompt_messages: OneMessage[] = [];
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
			const scroll_to_view = async(mode:string='none') =>{
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
					// 	await joplin.commands.execute('editor.execCommand',{
					// 		name:'scrollToLine',
					// 		args:[100000000]
					// 	});
					// 	/// 移动端似乎不支持上面的 ScrollIntoView，所以只能强制滚动到最后
					// }
				}
				else{
					// 其他的不做任何事情
				}
			}

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
		}
		//
		// 摘要
		await joplin.commands.register({
			name: 'askLLMSummary',
			label: 'LLM_为选中的部分生成摘要',
			iconName: 'fas fa-robot',
			execute: async () => {
				try {
					// 读取选中的内容：
					const selectedText = await joplin.commands.execute('selectedText');
					if (!selectedText || selectedText.trim() === '') {
                        alert('请先选中一些文本！');
                        return;
                    }
					await llm_reply_stream({inp_str:selectedText, 
						query_type:'summary', 
						is_selection_exists:true});
					//
				}
				catch(error){
					alert(`调用 LLM API 时出错：${error}`);
					console.error('Error executing command:', error);
				}
			},
		});
		/**
		 * improve：选中部分提问，然后改写。
		 */
		await joplin.commands.register({
			name: 'askLLMStream',
			label: 'LLM_提问选中的部分',
			iconName: 'fas fa-robot',
			execute:async()=>{
				try {
					// 读取选中的内容：
					let dict_selection = await split_note_by_selection();
					if (dict_selection.is_selection_exists){
						let prompt_messages = []
						prompt_messages.push({ role: 'system', content: '你的任务是帮助用户完善文档。'});
						if (dict_selection.str_before.length>0){
							prompt_messages.push({role:'user',content:`【前文】\n\n${dict_selection.str_before}`});
						}
						prompt_messages.push({ role: 'user', content: `【待处理部分】\n\n${dict_selection.str_selected}`});
						if (dict_selection.str_after.length>0){
							prompt_messages.push({role:'user',content:`【后文】\n\n${dict_selection.str_after}`});
						}
						prompt_messages.push({ role: 'user', 
							content: `【要求】请参考前后文及其关联关系，按用户要求，修改'待处理部分'。请注意不要修改其余部分。请直接回复最终结果，不需要额外的文字。`
						});
						await llm_reply_stream({inp_str:dict_selection.str_selected,
							query_type:'improve',
							is_selection_exists:true,
							lst_msg:prompt_messages
						});
						console.info('Streaming complete!');
					}
					else{
						alert('请先选中一些文本！');
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
			label: 'LLM_对话方式回复',
			iconName: 'fas fa-comments',
			execute:async()=>{
				try {
					let dict_selection = await split_note_by_selection();
					if (dict_selection.is_selection_exists){
						await llm_reply_stream({inp_str:dict_selection.str_selected, 
							query_type:'chat', 
							is_selection_exists:false
						});
                    }
					else{
						await llm_reply_stream({inp_str:dict_selection.str_before, 
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
				label: 'askLLM_Stream',
				commandName: 'askLLMStream', // 绑定的命令
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
        await joplin.views.toolbarButtons.create(
            'askLLMStream_ToolBarButton', // 按钮 ID
            'askLLMStream',   // 绑定的命令名称
            ToolbarButtonLocation.EditorToolbar // 工具栏位置（支持移动端）
        );
        await joplin.views.toolbarButtons.create(
            'askLLMChat_ToolBarButton', // 按钮 ID
            'askLLMChat',   // 绑定的命令名称
            ToolbarButtonLocation.EditorToolbar // 工具栏位置（支持移动端）
        );
		//
		// 编辑区右键菜单
		await joplin.views.menuItems.create(
			'askLLMStream_MenuItem', // 菜单项 ID
			'askLLMStream',   // 绑定的命令
			MenuItemLocation.EditorContextMenu // 添加到编辑器上下文菜单
		);
		// await joplin.views.menuItems.create(
		// 	'askLLMSummary_MenuItem', // 菜单项 ID
		// 	'askLLMSummary',   // 绑定的命令
		// 	MenuItemLocation.EditorContextMenu // 添加到编辑器上下文菜单
		// );
	},
});
