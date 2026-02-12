import joplin from '../api';
import {llm_server_type_urls, llm_server_type_values} from './settings';

/**
 * 用于读取大语言模型的设置参数，并以字典的形式返回。
 * 通过这种方式，解耦模型参数读取与模型调用过程。
 *
 * @returns
 */
export async function get_llm_options() {
    // 读取设置的参数
    const llmSettingValues = await joplin.settings.values([
        'llmModel','llmServerType','llmServerUrl','llmKey', 'llmKeyBak','llmExtra', 'llmMcp',
        'llmModel2','llmServerType2','llmServerUrl2','llmKey2','llmKeyBak2','llmExtra2','llmMcp2',
        'llmModel3','llmServerType3','llmServerUrl3','llmKey3','llmKeyBak3','llmExtra3','llmMcp3',
        'llmSelect',
        'llmTemperature', 'llmMaxTokens', 'llmScrollType',
        'llmChatType', 'llmChatSkipThink', 'llmChatPrompt', 'llmSummaryPosition',
        // 'llmMcpServer'
    ]);
    let dict_llm_conf = {}
    // 基础参数
    let llmSelect = parseInt(String(llmSettingValues['llmSelect']));  // 模型入口序号
    let sModel = '', sUrl = '', sKey = '', sKeyBak = '', sExtra = '', sMcp = '';
    let sServrType = '';
    //
    if (llmSelect==2){
        sModel = 'llmModel2'; sServrType = 'llmServerType2', sUrl = 'llmServerUrl2'; sKey = 'llmKey2';
        sKeyBak = 'llmKeyBak2'; sExtra = 'llmExtra2'; sMcp = 'llmMcp2';
    }
    else if (llmSelect==3){
        sModel = 'llmModel3'; sServrType = 'llmServerType3', sUrl = 'llmServerUrl3'; sKey = 'llmKey3';
        sKeyBak = 'llmKeyBak3'; sExtra = 'llmExtra3'; sMcp = 'llmMcp3';
    }
    else {
        sModel = 'llmModel'; sServrType = 'llmServerType', sUrl = 'llmServerUrl'; sKey = 'llmKey';
        sKeyBak = 'llmKeyBak'; sExtra = 'llmExtra'; sMcp = 'llmMcp';
    }
    //
    dict_llm_conf['llmSelect'] = llmSelect;
    dict_llm_conf['model'] = String(llmSettingValues[sModel]).trim();
    //
    // url and fixed urls
    let nLLMServerType = Number(llmSettingValues[sServrType]);
    if (nLLMServerType > 0) {
        dict_llm_conf['url'] = llm_server_type_urls[llm_server_type_values[nLLMServerType]] + '/chat/completions';
    }
    else {
        let input_url:string = String(llmSettingValues[sUrl]);
        if (input_url.endsWith('/chat/completions')){
            dict_llm_conf['url'] = input_url;
        }
        else if (input_url.endsWith('/')){
            dict_llm_conf['url'] = input_url + 'chat/completions';
        }
        else {
            dict_llm_conf['url'] = input_url + '/chat/completions';
        }
    }
    //
    dict_llm_conf['extra_config'] = String(llmSettingValues[sExtra]);
    dict_llm_conf['mcp_number'] = Number(llmSettingValues[sMcp]);
    //
    // 添加滚动类型相关参数
    dict_llm_conf['scrollType'] = parseInt(String(llmSettingValues['llmScrollType']));
    let scroll_method = 'desktop';
    if (dict_llm_conf['scrollType']==1) {
        scroll_method = 'desktop'
    }
    else if (dict_llm_conf['scrollType']==2) {
        scroll_method = 'mobile'
    }
    else {
        scroll_method = 'none'
    }
    dict_llm_conf['scroll_method'] = scroll_method;
    //
    // 添加聊天相关参数
    dict_llm_conf['chatType'] = parseInt(String(llmSettingValues['llmChatType']));
    dict_llm_conf['chatSkipThink'] = Number(llmSettingValues['llmChatSkipThink']);
    dict_llm_conf['chatPrompt'] = String(llmSettingValues['llmChatPrompt']);
    dict_llm_conf['summaryPosition'] = Number(llmSettingValues['llmSummaryPosition']);
    //
    // 添加温度和最大token参数
    dict_llm_conf['temperature'] = parseFloat(String(llmSettingValues['llmTemperature']));
    dict_llm_conf['maxTokens'] = parseInt(String(llmSettingValues['llmMaxTokens'])) ;
    //
    // 添加原始设置值，用于其他函数
    dict_llm_conf['sModel'] = sModel;
    dict_llm_conf['sUrl'] = sUrl;
    dict_llm_conf['sKey'] = sKey;
    dict_llm_conf['sKeyBak'] = sKeyBak;
    dict_llm_conf['sExtra'] = sExtra;
    dict_llm_conf['sMcp'] = sMcp;
    dict_llm_conf['allSettingValues'] = llmSettingValues;
    //
    // 备份与恢复功能
    // key may disappear after updating, so backup it.
    dict_llm_conf['key'] = await _backup_apikey_internal(llmSelect, llmSettingValues);
    //
    return dict_llm_conf
}


/**
 * API key backup 的内部实现，避免循环依赖
 * 
 * 作用是：实现了API密钥的备份和恢复，因为手机端插件升级可能导致 api key 丢失，
 * 这种情况下，从备份的key 恢复。
 * 如果 key 存在，就保存更新到备份区中。
 * @param llmSelect
 * @param llmSettingValues
 */
async function _backup_apikey_internal(llmSelect:number, llmSettingValues:any) {
    let sKey = 'llmKey', sKeyBak = 'llmKeyBak';

    if (llmSelect==2){
        sKey = 'llmKey2'; sKeyBak = 'llmKeyBak2';
    }
    else if (llmSelect==3){
        sKey = 'llmKey3'; sKeyBak = 'llmKeyBak3';
    }

    let apiKey = String(llmSettingValues[sKey]).trim();

    // key may disappear after updating plugin, so backup it.
    if(apiKey.length<=0){  // read backup
        let apiKeyBak = String(llmSettingValues[sKeyBak]).trim();
        if(apiKeyBak.length>0){
            apiKey = apiKeyBak;
            await joplin.settings.setValue(sKey, apiKey);  
        }
    }
    else{ // if apiKey.length > 0
        // write backup
        await joplin.settings.setValue(sKeyBak, apiKey);  
    }
    return apiKey;
}
/**
 * API key may disappear after updating, so backup it.
 * @param llmSelect
 */
async function backup_apikey(llmSelect:number) {
    // 读取设置以获取llmSelect当前值
    const currentSettings = await joplin.settings.values(['llmSelect']);
    const currentSelect = parseInt(String(currentSettings['llmSelect']));

    // 临时设置llmSelect为指定值以获取正确的配置
    await joplin.settings.setValue('llmSelect', llmSelect);

    try {
        const llmSettingValues = await joplin.settings.values([
            'llmModel','llmServerUrl','llmKey', 'llmKeyBak','llmExtra', 'llmMcp',
            'llmModel2','llmServerUrl2','llmKey2','llmKeyBak2','llmExtra2','llmMcp2',
            'llmModel3','llmServerUrl3','llmKey3','llmKeyBak3','llmExtra3','llmMcp3'
        ]);

        // 使用内部备份函数
        return await _backup_apikey_internal(llmSelect, llmSettingValues);
    }
    finally {
        // 恢复原始的llmSelect值
        await joplin.settings.setValue('llmSelect', currentSelect);
    }
}