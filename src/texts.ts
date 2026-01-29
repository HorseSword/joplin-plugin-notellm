import joplin from 'api';
/*
用法：
import {get_txt_by_locale} from './texts';
let dictText = await get_txt_by_locale();
*/
export async function get_txt_by_locale(){
    const locale = await joplin.settings.globalValue('locale');
    let dict_text = getTxt(locale);
    let dict_filtered: Record<string, string> = {};
    Object.keys(dict_text).forEach(key => {
        // 如果没有 en 属性，证明是旧版（应该已经没有这种了）
        if (!Object.prototype.hasOwnProperty.call(dict_text[key], 'en') ) {
            dict_filtered[key] = dict_text[key];
        }
        // 如果是新版
        else {
            dict_filtered[key] = dict_text[key][locale] ?? dict_text[key]['en'] ?? key
        }
    })
    return dict_filtered;
}

function getTxt(lan='en') {
    // const locale = await joplin.settings.value('locale');
    // en（英语）、zh_CN（简体中文）、fr（法语）等。
    // let isZH = lan==='zh_CN';
    let dictText = {}
    //
    dictText['toast_failed'] = {
        'zh_CN':'回复失败.',
        'en':'Response failed.'
    };
    dictText['toast_succeed'] = {
        'zh_CN':'回复完毕！',
        'en':'Response finished.'
    };
    dictText['toast_LLM'] = {
        'zh_CN':'已启用',
        'en':'selected.'
    }; // 前面有 LLM n 字眼。
    //
    dictText['summary_label'] = {
        'zh_CN':'生成摘要（无选中时基于光标前文，有选中时基于选中区域）',
        'en':'Summarize (above cursor or selection)'
    };
    dictText['chat_label'] = {
        'zh_CN':'聊天（无选中时基于光标前文，有选中时基于选中区域）',
        'en':'Chat (above cursor or selection)'
    };
    dictText['ask_label'] = {
        'zh_CN':'提问选中部分（考虑上下文）',
        'en':'Ask about selection (based on whole note)'
    };
    dictText['improve_label'] = {
        "en": "Rewrite selection (based on before and after) ",
        "zh_CN": "改写选中部分（考虑上下文）"        
    }
    //
    // settings
    dictText['select_llm_label'] = {
        'zh_CN':'选择 LLM',
        'en':'LLM select'
    };
    dictText['select_llm_desc'] = {
        'zh_CN':'请选择需要使用的 LLM',
        'en':'Which LLM do you want to use?'
    };
    //
    dictText['switch_to_LLM1']= {
        "zh_CN": '切换模型至LLM1',
        "en": 'Switch to LLM 1'      
    };
    dictText['switch_to_LLM2'] = {
        'zh_CN':'切换模型至LLM2',
        'en':'Switch to LLM 2'
    };
    dictText['switch_to_LLM3'] = {
        'zh_CN':'切换模型至LLM3',
        'en':'Switch to LLM 3'
    };
    //
    dictText['url_llm1_type_label'] = {
        'zh_CN':'LLM1 模型服务方',
        'en':'LLM1 Model Service Provider'
    }
    dictText['url_llm1_type_desc'] = {
        'zh_CN':'请选择模型服务来源，其中 OpenAI-API-Compatible 需要在下方自定义 URL',
        'en':'Please select the model service, among which OpenAI-API-Compatible needs to be customized below'
    }
    dictText['url_llm1_label'] = {
        'zh_CN':'LLM1 URL (仅 OpenAI-API-Compatible 需填写)',
        'en':'LLM server url (only for OpenAI-API-Compatible)'
    };
    dictText['url_llm1_desc'] = {
        'zh_CN':'LLM1 的API访问网址。例如 https://api.deepseek.com/v1 或 https://dashscope.aliyuncs.com/compatible-mode/v1',
        'en':'The 1st LLM server URL, e.g. https://api.openai.com/v1 ; https://api.deepseek.com/v1'
    };
    dictText['model_llm1_label'] = {
        'zh_CN':'LLM1 Model name',
        'en':'LLM model name'
    };
    dictText['model_llm1_desc'] = {
        'zh_CN':'LLM1 的模型名称，例如 qwen-plus, deepseek-chat',
        'en':'The 1st LLM Model Name, e.g. qwen-plus, deepseek-chat'
    };
    dictText['key_llm1_label'] = {
        'zh_CN':'LLM1 key',
        'en':'LLM key'
    };
    dictText['key_llm1_desc'] = {
        'zh_CN':'LLM1 的API的访问密钥。',
        'en':'API-key for LLM 1.'
    };
    dictText['extra_llm1_label'] = {
        'zh_CN':'LLM1 的其他自定义参数（非必填）',
        'en':'Extra config for LLM 1 (Optional)'
    }
    dictText['extra_llm1_desc'] = {
        'zh_CN':'使用 Json 格式，例如 {"key1":"value1", "key2":"value2"}。此处的配置拥有最高优先级。',
        'en':'The 1st LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.'
    }
    // //
    dictText['url_llm2_type_label'] = {
        'zh_CN':'LLM2 模型服务方',
        'en':'LLM2 Model Service Provider'
    }
    dictText['url_llm2_type_desc'] = {
        'zh_CN':'请选择模型服务来源，其中 OpenAI-API-Compatible 需要在下方自定义 URL',
        'en':'Please select the model service, among which OpenAI-API-Compatible needs to be customized below'
    }
    dictText['url_llm2_label'] = {
        'zh_CN':'LLM2 URL (仅 OpenAI-API-Compatible 需填写)',
        'en':'LLM 2 server url (only for OpenAI-API-Compatible)'
    };
    dictText['url_llm2_desc'] = {
        'zh_CN':'LLM2 的API访问网址（非必填）。',
        'en':'The 2nd LLM server URL (optional).'
    };
    dictText['model_llm2_label'] = {
        'zh_CN':'LLM2 Model name',
        'en':'The 2nd LLM model'
    };
    dictText['model_llm2_desc'] = {
        'zh_CN':'LLM2 的模型名称（非必填）。',
        'en':'The 2nd LLM Model Name (optional).'
    };
    dictText['key_llm2_label'] = {
        'zh_CN':'LLM2 key',
        'en':'The 2nd LLM key'
    };
    dictText['key_llm2_desc'] = {
        'zh_CN':'LLM2 的API访问密钥（非必填）。',
        'en':'API key for the 2nd LLM (optional)'
    };
    dictText['extra_llm2_label']= {
        'zh_CN': 'LLM 2 的其他自定义参数（非必填）',
        'en': 'Extra config for LLM 2 (Optional)'
    };
    dictText['extra_llm2_desc'] = {
        'zh_CN': '使用 Json 格式，例如 {"key1":"value1", "key2":"value2"}。此处的配置拥有最高优先级。',
        'en': 'The 2nd LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.'
    };
    // // //
    dictText['url_llm3_type_label'] = {
        'zh_CN':'LLM3 模型服务方',
        'en':'LLM3 Model Service Provider'
    }
    dictText['url_llm3_type_desc'] = {
        'zh_CN':'请选择模型服务来源，其中 OpenAI-API-Compatible 需要在下方自定义 URL',
        'en':'Please select the model service, among which OpenAI-API-Compatible needs to be customized below'
    }
    dictText['url_llm3_label'] = {
        'zh_CN':'LLM3 URL (仅 OpenAI-API-Compatible 需填写)',
        'en':'LLM 3 server url (only for OpenAI-API-Compatible)'
    };
    dictText['url_llm3_desc'] = {
        'zh_CN':'LLM3 的API访问网址（非必填）。',
        'en':'The 3rd LLM server URL (optional).'
    };
    dictText['model_llm3_label'] = {
        'zh_CN':'LLM3 Model name',
        'en':'The 3rd LLM model'
    };
    dictText['model_llm3_desc'] = {
        'zh_CN':'LLM3 的模型名称（非必填）。',
        'en':'The 3rd LLM Model Name (optional).'
    };
    dictText['key_llm3_label'] = {
        'zh_CN':'LLM3 key',
        'en':'The 3rd LLM key'
    };
    dictText['key_llm3_desc'] = {
        'zh_CN':'LLM3 的API访问密钥（非必填）。',
        'en':'API key for the 3rd LLM (optional)'
    };
    dictText['extra_llm3_label'] = {
        'zh_CN':'LLM 3 的其他自定义参数（非必填）',
        'en':'Extra config for LLM 3 (Optional)'
    };
    dictText['extra_llm3_desc'] = {
        'zh_CN':'使用 Json 格式，例如 {"key1":"value1", "key2":"value2"}。此处的配置拥有最高优先级。',
        'en':'The 3rd LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.'
    };
    //
    dictText['scroll_type_label'] = {
        'zh_CN':'窗口滚动模式',
        'en':'Scroll type'
    };
    dictText['scroll_type_desc'] = {
        'zh_CN':'模型流式输出期间的窗口滚动模式。',
        'en':'Scroll type of screen while streaming.'
    };
    dictText['scroll_type_type0'] = {
        'zh_CN':'不自动滚动',
        'en':'None'
    };
    dictText['scroll_type_type1'] = {
        'zh_CN':'Type 1: 窗口内可见',
        'en':'Type 1: in view'
    };
    dictText['scroll_type_type2'] = {
        'zh_CN':'Type 2: 保持居中',
        'en':'Type 2: keep center'
    };
    dictText['temperature_label'] = {
        'zh_CN':'模型输出的温度参数',
        'en':'llm temperature'
    };
    dictText['temperature_desc'] = {
        'zh_CN':'越低越稳定，越高越有创意，建议0到1之间。',
        'en':'0 <= Temperature <1'
    };
    dictText['max_tokens_label'] = {
        'zh_CN':'最大输出 token 数量限制',
        'en':'llm max tokens'
    };
    dictText['max_tokens_desc'] = {
        'zh_CN':'限制模型的输出长度，建议值：1024, 2048, 4096等。这个值过大可能导致模型报错。',
        'en':'Num of max tokens. e.g. 1024, 2048, 4096. Too large may cause llm error.'
    };
    dictText['chat_type_label'] = {
        'zh_CN':'聊天高级模式（测试版）',
        'en':'Advanced Chat Mode (beta)'
    };
    dictText['chat_type_desc'] = {
        'zh_CN':'针对聊天特性优化前文解析，包括拆分对话角色、跳过推理模型 think 部分等功能。',
        'en':'Optimize the parsing of previous text for chat features, including splitting dialogue roles, skipping the think part of the reasoning model, and other functions.'
    };
    dictText['chat_skip_think_label'] = {
        'zh_CN':'隐藏推理模型的思考内容（测试版）',
        'en':'Hide "think" texts of Reasoning models (beta)'
    };
    dictText['chat_skip_think_desc'] = {
        'zh_CN':'不显示推理模型think部分的文本。ON：推理执行但不显示(非推理模型不受影响)。OFF：显示完整推理内容。',
        'en':'ON: Hide texts between <think> and </think>; non-reasoning models are unaffected. OFF: Display full thinking content as in the original text.'
    };
    dictText['wait_animation_label'] = {
        'zh_CN':'等待期间显示动画（测试版）',
        'en':'Animation for waiting (beta)'
    };
    dictText['wait_animation_desc'] = {
        'zh_CN':'在等待期间显示动画，而不是完全停滞。',
        'en':'Show animation while waiting.'
    };
    //
    dictText['prompt_chat'] = {
        'zh_CN':'你是用户的助手。你的任务是基于用户前文提供的信息，回复最后的段落。请注意，回复完成之后不要额外追问。',
        'en':`You are helpful assistant. You are operating in a wiki environment. Your task is to respond to the final paragraph in a conversational manner based on the information provided by the user previously. Please note that you should not ask additional follow-up questions after your response.`
    }
    dictText['prompt_summary'] = {
        'zh_CN': '任务要求：请简要概括上文的主要内容，并用列表的方式提炼要点.',
        'en': 'Your task: Briefly summarize the main content of the above text and list the key points. Use same language as given texts, unless explicitly requested otherwise.'
    }
    dictText['prompt_improve_1'] = {
        'zh_CN':'你的任务是帮助用户完善文档。',
        'en':'Your task is improving documents.'
    };
    dictText['prompt_improve_2'] = {
        'zh_CN':`请帮助用户完善文档。参考前后文及其关联关系，按'command'部分的要求，改进'text_selected'部分的文本表达。请直接回复最终结果，不需要额外的文字，严禁修改其余任何部分。不需要抄写 text_before_selection 或 text_after_selection。`,
        'en':`Please help the user improve their document. Based on the context and relationships between preceding and following text, improve the expression of the 'text_selected' portion according to the requirements in the 'command' section. Please respond with only the final result, without additional text, and do not modify any other parts. Do not copy the text_before_selection or text_after_selection.`
    };
    dictText['prompt_ask_1'] = {
        'zh_CN':'接下来用户会针对选中的部分提问。',
        'en':'User will ask about selection.'
    };
    dictText['prompt_ask_2'] = {
        'zh_CN':`任务说明: 请参考前后文及其关联关系，针对 “text_selected” 部分提供的内容，回复用户在"user_command"所提出的问题。请直接回复最终结果，不需要抄写 text_before_selection 或 text_after_selection。`,
        'en':`Task description: Please refer to the preceding and following text and their relationships, and address the user's question raised in "user_command" regarding the content provided in "text_selected". Please respond with only the final result, without copying "text_before_selection" or "text_after_selection".`
    };
    //
    dictText['chat_prompt_label'] = {
        'zh_CN': '自定义聊天提示词',
        'en':'Prompt for chatting'
    };
    dictText['chat_prompt_desc'] = {
        'zh_CN':'如果留空，则使用默认提示词， 即：'+ dictText['prompt_chat']['zh_CN'],
        'en':'Use default prompt if empty: '+ dictText['prompt_chat']['en']
    }
    //
    dictText['err_cors'] = {
        'zh_CN':'可能原因： (1) 网络错误； (2) 大模型服务器 CORS 配置禁止跨域.',
        'en':'This might be (1) network error, or (2) LLM server CORS.'
    }
    dictText['err_llm_conf'] = {
        'zh_CN':'LLM配置错误，请检查 url, key 和 model 是否正确。',
        'en':'LLM url, key or model is empty!'
    };
    dictText['err_markdown'] = {
        'zh_CN':'本插件只能工作在 markdown 编辑模式，请检查编辑器模式状态。',
        'en':'Maybe you are not in markdown mode?'
    };
    dictText['err_note_changed'] = {
        'zh_CN':'笔记似乎被切换了，输出强制中断。',
        'en':'Note changed unexpectedly.'
    };
    dictText['err_wrong'] = {
        'zh_CN':'未知错误，请检查插件日志了解详细信息。',
        'en':'Sorry, something went wrong. Please check plugin logs for detail.'
    };
    dictText['err_no_command'] = {
        'zh_CN':'请输入你的任务要求。',
        'en':'Please input your command.'
    };
    dictText['err_no_selection'] = {
        'zh_CN':'请先选中一些文本。',
        'en':'Please select some text first.'
    };
    dictText['err_no_ask'] = {
        'zh_CN':'请选择你想要提问的文本。',
        'en':'Please select where you want to ask.'
    };
    //
    dictText['mcp_main_switch'] = {
        'zh_CN': 'MCP 功能总开关',
        'en':'Main switch for MCP'
    };
    dictText['mcp_main_switch_description'] = {
        'en': 'Turn ON to enable MCP, or turn OFF to disable all. \n\n Support streamableHTTP MCP servers. \n\n Reminder: STDIO and SSE are NOT supported for now, but you can load them with other tools like "Local_MCP_Manager" and convert them to streamableHTTP mode for invocation. For details, see https://github.com/horsesword/local_mcp_manager',
        'zh_CN': '支持 streamableHTTP 模式的 MCP，暂不支持 STDIO 与 SSE, 但可以通过 Local MCP Manager 等工具将各种类型 MCP 转换为 streamableHTTP 模式使用。详见 https://github.com/horsesword/local_mcp_manager',
    }
    dictText['mcp_enable'] = {
        'en':'Enable MCP ',
        'zh_CN': '启用 MCP '
    }
    dictText['mcp_name_1_label'] = {
        'en':'Name of MCP ',
        // 'zh_CN': '命名 MCP '
    }
    dictText['mcp_name_1_description'] = {
        'en':'For noting the name of the MCP. Just name it!',
        'zh_CN': 'MCP 的名称，仅用于备忘标注，并不会发给 LLM。所以，想写什么就写什么。'
    }
    dictText['mcp_server_1_label'] = {
        'en': 'Server URL of MCP ',
        // 'zh_CN': '服务 URL，用于 MCP '
    }
    dictText['mcp_server_1_description'] = {
        'en': 'Support streamableHTTP MCP servers. e.g. http://127.0.0.1:17001/mcp, https://api.githubcopilot.com/mcp/, or https://mcp.map.baidu.com/mcp?ak=xxx',
        'zh_CN': '支持 streamableHTTP 模式的 MCP 服务，比如 http://127.0.0.1:17001/mcp, https://api.githubcopilot.com/mcp/, 或 https://mcp.map.baidu.com/mcp?ak=xxx'
    }
    dictText['mcp_header_1_label'] = {
        'en': 'Custom headers for MCP ',
        // 'zh_CN': '自定义 header，用于 MCP '
    }
    
    dictText['mcp_header_1_description'] = {
        'en': 'Custom header in JSON format, e.g. {"Authorization":"Bearer token","User-Agent":"MyApp"}',
        'zh_CN': '自定义 header, 使用 JSON 格式，选填。如 {"Authorization":"Bearer token","User-Agent":"MyApp"}'
    }
    dictText['mcp_name_2_description'] = {
        'en':'StreamableHTTP MCP servers.',
        'zh_CN':'支持 streamableHTTP 模式的 MCP 服务。'
    };
    dictText['mcp_header_2_description'] = {
        'en': 'Custom header in JSON format.',
        'zh_CN': '自定义 header, 使用 JSON 格式。选填。'
    }
    //
    return dictText;
}
