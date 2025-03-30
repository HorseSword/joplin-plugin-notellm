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
    //
    return dictText;
}
