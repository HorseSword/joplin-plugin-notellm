import joplin from 'api';
import {ToolbarButtonLocation, ContentScriptType, MenuItemLocation } from 'api/types';
import {registerSettings, pluginIconName } from './settings';
import {llmReplyStream, llmReplyStop, changeLLM, check_llm_status} from './llmReplyCore';
import {get_txt_by_locale} from './texts';
import {mcp_call_tool, mcp_get_tools} from './mcpClient';
import {split_note_by_selection, llm_summary, llm_summary_all, llm_ask, llm_rewrite, llm_chat} from './llmChat';

joplin.plugins.register({
	onStart: async function() {
		console.info('Hello world. NoteLLM plugin started!');
		//
		// 设置项
		await registerSettings();
		//
		let platform = 'desktop';
		const locale = await joplin.settings.globalValue('locale');
		console.info(`locale = ${locale}`);
		let dictText = await get_txt_by_locale(); // getTxt(locale);
		//
		// 注册自定义的 CodeMirror 功能
		const contentScriptId = 'notellm-content-script-id';
        joplin.contentScripts.register(
            ContentScriptType.CodeMirrorPlugin,
            contentScriptId,
            './contentScript.js',  //  contentScript.js is built from contentScript.ts
        );
		//
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
		await joplin.commands.register({
			name: 'quickChangeLLM3',
			label: dictText['switch_to_LLM3'],
			iconName: 'fas fa-robot',
			execute: async () => {
				await changeLLM(3);
			}
		});
		//
		// 摘要
		await joplin.commands.register({
			name: 'askLLMSummary',
			label: dictText['summary_label'],// 'Summarize selection (or above cursor)',
			iconName: 'fas fa-robot',
			execute: async () => {
				await llm_summary();
			},
		});
		// 摘要
		await joplin.commands.register({
			name: 'askLLMSummaryAll',
			label: dictText['summary_all_label'],// 'Summarize selection (or above cursor)',
			iconName: 'fas fa-robot',
			execute: async () => {
				await llm_summary_all();
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
				await llm_rewrite();
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
				await llm_ask();
			}
		})
		//
		await joplin.commands.register({
			name: 'askLLMChat',
			label: dictText['chat_label'], //'Chat and reply (above cursor)',
			iconName: 'fas fa-comments',
			execute:async()=>{
				await llm_chat();
			}
		})
		//
		await joplin.commands.register({
			name: 'askLLMStop',
			label: 'Stop LLM output.',
			iconName: 'fas fa-comment-slash',
			execute: async () => {
				await llmReplyStop();
			}
		})

		await joplin.commands.register({
			name: 'mcp_call_tool',
			label: 'mcp_call_tool',
			iconName: 'fas fa-comment-slash',
			execute: async (mcp_url, tool_name, args={}, headers='') => {
				return await mcp_call_tool(mcp_url, tool_name, args, headers);
			}
		})

		await joplin.commands.register({
			name: 'mcp_get_tools',
			label: 'mcp_get_tools',
			iconName: 'fas fa-comment-slash',
			execute: async (mcp_url, headers='') => {
				return await mcp_get_tools(mcp_url, headers);
			}
		})
		
		await joplin.commands.register({
			name: 'checkLLMStatus',
			label: 'NoteLLM: Check LLM Status',
			iconName: 'far fa-comment-dots',
			execute: async () => {
				return await check_llm_status();
			}
		})

		// 
		//
		// 添加一个菜单项到顶部“工具”菜单中
		await joplin.views.menus.create(
			'askLLM_menus', // 菜单项 ID
			'NoteLLM', // 菜单项名称
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
				label: 'askLLM_Summary_All',
				commandName: 'askLLMSummaryAll', // 绑定的命令
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
			  {
				label: 'Switch_to_LLM_3',
				commandName: 'quickChangeLLM3', // 绑定的命令
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
		// await joplin.views.toolbarButtons.create(
		//     'checkLLMStatus', 
		// 	'checkLLMStatus', 
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
		await joplin.views.toolbarButtons.create(
            'askLLMStop_ToolBarButton', // 按钮 ID
            'askLLMStop',   // 绑定的命令名称
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
