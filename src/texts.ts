import joplin from 'api';

export function getTxt(lan='en') {
    // const locale = await joplin.settings.value('locale');
    // en（英语）、zh_CN（简体中文）、fr（法语）等。
    let dict_txt = {}
    dict_txt['toast_failed'] = lan==='zh_CN'?'回复失败…':'';
    dict_txt['toast_succeed'] = lan==='zh_CN'?'回复完毕！':'Response finished.';
    dict_txt['toast_LLM'] = lan==='zh_CN'?'已启用':'selected.'; // 前面有 LLM n 字眼。
    //
    dict_txt['switch_to_LLM1'] = lan==='zh_CN'?'切换模型至LLM1':'Switch to LLM 1';
    dict_txt['switch_to_LLM2'] = lan==='zh_CN'?'切换模型至LLM2':'Switch to LLM 2';
    //
    dict_txt['chat_label'] = lan==='zh_CN'?'聊天对话（基于当前光标前文，或选中区域）':'Chat and reply (above cursor)';
    //
    // settings
    dict_txt['select_llm_desc'] = lan==='zh_CN'?'请选择需要使用的LLM。':'Which LLM do you want to use?';
    dict_txt['url_llm1_desc'] = lan==='zh_CN'?'LLM1的url.例如 https://api.deepseek.com/v1':'The 1st LLM server URL, e.g. https://api.deepseek.com/v1';

    return dict_txt;
}
