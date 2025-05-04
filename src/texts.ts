import joplin from 'api';

export function getTxt(lan='en') {
    // const locale = await joplin.settings.value('locale');
    // en（英语）、zh_CN（简体中文）、fr（法语）等。
    let dictText = {}
    let isZH = lan==='zh_CN';
    dictText['toast_failed'] = isZH?'回复失败.':'Response failed.';
    dictText['toast_succeed'] = isZH?'回复完毕！':'Response finished.';
    dictText['toast_LLM'] = isZH?'已启用':'selected.'; // 前面有 LLM n 字眼。
    //
    dictText['summary_label'] = isZH?'生成摘要（基于光标以上，有选中时对选中区域）':'Summarize selection (or above cursor)'
    dictText['chat_label'] = isZH?'聊天（基于光标前文，有选中时对选中区域）':'Chat and reply (above cursor)';
    dictText['ask_label'] = isZH?'提问（针对选中区域）':'Ask about selection'
    dictText['improve_label'] = isZH?'改写（结合上下文改写选中区域）':'Improve selection (context related)'
    //
    // settings
    dictText['select_llm_label']= isZH?'选择 LLM':'LLM select'
    dictText['select_llm_desc'] = isZH?'请选择需要使用的 LLM':'Which LLM do you want to use?';
    //
    dictText['switch_to_LLM1'] = isZH?'切换模型至LLM1':'Switch to LLM 1';
    dictText['switch_to_LLM2'] = isZH?'切换模型至LLM2':'Switch to LLM 2';
    dictText['switch_to_LLM3'] = isZH?'切换模型至LLM3':'Switch to LLM 3';
    //
    dictText['url_llm1_label']=isZH?'LLM1 URL':'LLM server url';
    dictText['url_llm1_desc'] = isZH?'LLM1 的API访问网址。例如 https://api.deepseek.com/v1 或 https://dashscope.aliyuncs.com/compatible-mode/v1':'The 1st LLM server URL, e.g. https://api.openai.com/v1 ; https://api.deepseek.com/v1';
    dictText['model_llm1_label']= isZH?'LLM1 Model name':'LLM model name';
    dictText['model_llm1_desc']=isZH?'LLM1 的模型名称，例如 qwen-plus, deepseek-chat':'The 1st LLM Model Name, e.g. qwen-plus, deepseek-chat'
    dictText['key_llm1_label']=isZH?'LLM1 key':'LLM key'
    dictText['key_llm1_desc']=isZH?'LLM1 的API的访问密钥。':'API-key for LLM 1.'
    dictText['extra_llm1_label']=isZH?'LLM1 的其他自定义参数（非必填）':'Extra config for LLM 1 (Optional)'
    dictText['extra_llm1_desc']=isZH?'使用 Json 格式，例如 {"key1":"value1", "key2":"value2"}。此处的配置拥有最高优先级。':'The 1st LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.'
    //
    dictText['url_llm2_label']=isZH?'LLM2 URL':'LLM 2 server url';
    dictText['url_llm2_desc'] = isZH?'LLM2 的API访问网址（非必填）。':'The 2nd LLM server URL (optional).';
    dictText['model_llm2_label']= isZH?'LLM2 Model name':'The 2nd LLM model';
    dictText['model_llm2_desc']=isZH?'LLM2 的模型名称（非必填）。':'The 2nd LLM Model Name (optional).'
    dictText['key_llm2_label']=isZH?'LLM2 key':'The 2nd LLM key'
    dictText['key_llm2_desc']=isZH?'LLM2 的API访问密钥（非必填）。':'API key for the 2nd LLM (optional)'
    dictText['extra_llm2_label']=isZH?'LLM 2 的其他自定义参数（非必填）':'Extra config for LLM 2 (Optional)'
    dictText['extra_llm2_desc']=isZH?'使用 Json 格式，例如 {"key1":"value1", "key2":"value2"}。此处的配置拥有最高优先级。':'The 2nd LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.'
    //
    dictText['url_llm3_label']=isZH?'LLM3 URL':'LLM 3 server url';
    dictText['url_llm3_desc'] = isZH?'LLM3 的API访问网址（非必填）。':'The 3rd LLM server URL (optional).';
    dictText['model_llm3_label']= isZH?'LLM3 Model name':'The 3rd LLM model';
    dictText['model_llm3_desc']=isZH?'LLM3 的模型名称（非必填）。':'The 3rd LLM Model Name (optional).'
    dictText['key_llm3_label']=isZH?'LLM3 key':'The 3rd LLM key'
    dictText['key_llm3_desc']=isZH?'LLM3 的API访问密钥（非必填）。':'API key for the 3rd LLM (optional)'
    dictText['extra_llm3_label']=isZH?'LLM 3 的其他自定义参数（非必填）':'Extra config for LLM 3 (Optional)'
    dictText['extra_llm3_desc']=isZH?'使用 Json 格式，例如 {"key1":"value1", "key2":"value2"}。此处的配置拥有最高优先级。':'The 3rd LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.'
    //
    dictText['scroll_type_label']=isZH?'窗口滚动模式':'Scroll type'
    dictText['scroll_type_desc']=isZH?'模型流式输出期间的窗口滚动模式。':'Scroll type of screen while streaming.'
    dictText['scroll_type_type0']=isZH?'不自动滚动':'None'
    dictText['scroll_type_type1']=isZH?'Type 1: 窗口内可见':'Type 1: in view'
    dictText['scroll_type_type2']=isZH?'Type 2: 保持居中':'Type 2: keep center'
    dictText['temperature_label']=isZH?'模型输出的温度参数':'llm temperature'
    dictText['temperature_desc']=isZH?'越低越稳定，越高越有创意，建议0到1之间。':'0 <= Temperature <1'
    dictText['max_tokens_label']=isZH?'最大输出 token 数量限制':'llm max tokens'
    dictText['max_tokens_desc']=isZH?'限制模型的输出长度，建议值：1024, 2048, 4096等。这个值过大可能导致模型报错。':'Num of max tokens. e.g. 1024, 2048, 4096. Too large may cause llm error.'
    dictText['chat_type_label']=isZH?'聊天高级模式（测试版）':'Advanced Chat Mode (beta)'
    dictText['chat_type_desc']=isZH?'针对聊天特性优化前文解析，包括拆分对话角色、跳过推理模型 think 部分等功能。':'Optimize the parsing of previous text for chat features, including splitting dialogue roles, skipping the think part of the reasoning model, and other functions.'
    //
    dictText['prompt_chat']=isZH?'你是用户的助手。你的任务是以对话的方式，基于用户前文提供的信息，以对话的形式回复最后的段落。请注意，回复完成之后不要额外追问。':`You are helpful assistant. You are operating in a wiki environment. Your task is to respond to the final paragraph in a conversational manner based on the information provided by the user previously. Please note that you should not ask additional follow-up questions after your response.`;
    dictText['prompt_summary']=isZH?`任务要求：请简要概括上文的主要内容，并用列表的方式提炼要点.`:'Your task: Briefly summarize the main content of the above text and list the key points. Use same language as given texts, unless explicitly requested otherwise.'
    dictText['prompt_improve_1']=isZH?'你的任务是帮助用户完善文档。':'Your task is improving documents.'
    dictText['prompt_improve_2']=isZH?`请帮助用户完善文档。参考前后文及其关联关系，按'command'部分的要求，改进'text_selected'部分的文本表达。请直接回复最终结果，不需要额外的文字，严禁修改其余任何部分。不需要抄写 text_before_selection 或 text_after_selection。`:`Please help the user improve their document. Based on the context and relationships between preceding and following text, improve the expression of the 'text_selected' portion according to the requirements in the 'command' section. Please respond with only the final result, without additional text, and do not modify any other parts. Do not copy the text_before_selection or text_after_selection.`
    dictText['prompt_ask_1']=isZH?'接下来用户会针对选中的部分提问。':'User will ask about selection.'
    dictText['prompt_ask_2']=isZH?`任务说明: 请参考前后文及其关联关系，针对 “text_selected” 部分提供的内容，回复用户在"user_command"所提出的问题。请直接回复最终结果，不需要抄写 text_before_selection 或 text_after_selection。`:`Task description: Please refer to the preceding and following text and their relationships, and address the user's question raised in "user_command" regarding the content provided in "text_selected". Please respond with only the final result, without copying "text_before_selection" or "text_after_selection".`
    //
    return dictText;
}
