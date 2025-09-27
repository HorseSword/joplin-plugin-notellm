import { SettingItemSubType, SettingItemType } from 'api/types';
import joplin from '../api';
import {getTxt} from './texts';

export function pluginIconName(): string {
  return 'fas fa-robot';
}

export async function registerSettings(): Promise<void> {
    const locale = await joplin.settings.globalValue('locale');
    let dictText = getTxt(locale);
    //
    await joplin.settings.registerSection('notellm.settings', {
      label: 'NoteLLM',
      iconName: pluginIconName(),
    });
    await joplin.settings.registerSection('notellm.mcp', {
      label: 'NoteLLM MCP',
      iconName: pluginIconName(),
    });
  
    let dict_settings = {
      //
      llmSelect: { 
        type: SettingItemType.Int,
        value: 1,
        label: dictText['select_llm_label'], // 'LLM select',
        description: dictText['select_llm_desc'], // 'Which LLM do you want to use?',
        section: 'notellm.settings',
        public: true,
        advanced: false,
        isEnum:true,
        options: {
          1: 'LLM 1',
          2: 'LLM 2',
          3: 'LLM 3'
        }
      },
      llmScrollType: { // Temperature
        type: SettingItemType.Int,
        value: 1,
        label: dictText['scroll_type_label'],  // 'Scroll type',
        description: dictText['scroll_type_desc'],  // 'Scroll type of screen while streaming.',
        section: 'notellm.settings',
        public: true,
        advanced: false,
        isEnum:true,
        options: {
          0: dictText['scroll_type_type0'],  // 'None',
          1: dictText['scroll_type_type1'],  // 'Type 1: in view',
          2: dictText['scroll_type_type2']  // 'Type 2: keep center'
        }
      },
      
      llmChatType: { 
        type: SettingItemType.Int,
        value: 2,
        label: dictText['chat_type_label'], 
        description: dictText['chat_type_desc'], 
        section: 'notellm.settings',
        public: true,
        advanced: false,
        isEnum:true,
        options: {
          1: 'ON',
          2: 'OFF',
        }
      },
      llmChatSkipThink: { 
        type: SettingItemType.Int,
        value: 0,
        label: dictText['chat_skip_think_label'], 
        description: dictText['chat_skip_think_desc'], 
        section: 'notellm.settings',
        public: true,
        advanced: false,
        isEnum:true,
        options: {
          1: 'ON',
          0: 'OFF',
        }
      },
      //
      // 
      llmServerUrl: {
        type: SettingItemType.String,
        value: 'https://api.deepseek.com/v1',
        label: dictText['url_llm1_label'], //'LLM server url',
        description: dictText['url_llm1_desc'], // 'The 1st LLM server URL, e.g. https://api.deepseek.com/v1',
        section: 'notellm.settings',
        public: true,
        advanced: false,
      },
      llmModel: {
        type: SettingItemType.String,
        value: 'deepseek-chat',
        label: dictText['model_llm1_label'],//'LLM model name',
        description: dictText['model_llm1_desc'],
        section: 'notellm.settings',
        public: true,
        advanced: false,
      },
      //
      llmKey: {
        type: SettingItemType.String,
        value: '',
        label: dictText['key_llm1_label'], // 'LLM key',
        description: dictText['key_llm1_desc'], //'API-key for LLM 1.',
        section: 'notellm.settings',
        public: true,
        advanced: false,
        secure: true, // 密码输入框
      },
      llmExtra: {
        type: SettingItemType.String,
        value: '',
        label: dictText['extra_llm1_label'],
        description: dictText['extra_llm1_desc'],// 'The 1st LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.',
        section: 'notellm.settings',
        public: true,
        advanced: false,
      },
      llmMcp: { 
        type: SettingItemType.Int,
        value: 0,
        label: 'MCP for LLM1 (Preview)', 
        description: 'Turn ON to use MCP.', 
        section: 'notellm.settings',
        public: true,
        advanced: false,
        isEnum: true,
        options: {
          0: 'OFF',
          10: 'MCP (tool call)',
          // 20: 'Agent'
        }
      },
      //
      llmServerUrl2: {
        type: SettingItemType.String,
        value: 'https://api.deepseek.com/v1',
        label: dictText['url_llm2_label'],//'The 2nd LLM server url',
        description: dictText['url_llm2_desc'], //'The 2nd LLM server URL (optional).',
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      llmModel2: {
        type: SettingItemType.String,
        value: 'deepseek-chat',
        label: dictText['model_llm2_label'],//'The 2nd LLM model',
        description: dictText['model_llm2_desc'],//'The 2nd LLM Model Name (optional).',
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      //
      llmKey2: {
        type: SettingItemType.String,
        value: '',
        label: dictText['key_llm2_label'], //'The 2nd LLM key',
        description: dictText['key_llm2_desc'], // 'API key for the 2nd LLM (optional)',
        section: 'notellm.settings',
        public: true,
        advanced: true,
        secure: true, // 密码输入框
      },
      llmExtra2: {
        type: SettingItemType.String,
        value: '',
        label: dictText['extra_llm2_label'],  // 'Extra config for LLM 2 (Optional)',
        description: dictText['extra_llm2_desc'],  // 'The 2nd LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.',
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      llmMcp2: { 
        type: SettingItemType.Int,
        value: 0,
        label: 'MCP for LLM2 (Preview)', 
        description: 'Turn ON to use MCP.', 
        section: 'notellm.settings',
        public: true,
        advanced: true,
        isEnum: true,
        options: {
          0: 'OFF',
          10: 'MCP (tool call)',
          // 20: 'Agent'
        }
      },
      //
      //
      llmServerUrl3: {
        type: SettingItemType.String,
        value: 'https://api.deepseek.com/v1',
        label: dictText['url_llm3_label'],
        description: dictText['url_llm3_desc'], 
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      llmModel3: {
        type: SettingItemType.String,
        value: 'deepseek-chat',
        label: dictText['model_llm3_label'],
        description: dictText['model_llm3_desc'],
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      //
      llmKey3: {
        type: SettingItemType.String,
        value: '',
        label: dictText['key_llm3_label'], 
        description: dictText['key_llm3_desc'],
        section: 'notellm.settings',
        public: true,
        advanced: true,
        secure: true, // 密码输入框
      },
      llmExtra3: {
        type: SettingItemType.String,
        value: '',
        label: dictText['extra_llm3_label'], 
        description: dictText['extra_llm3_desc'],  
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      llmMcp3: { 
        type: SettingItemType.Int,
        value: 0,
        label: 'MCP for LLM3 (Preview)', 
        description: 'Turn ON to use MCP.', 
        section: 'notellm.settings',
        public: true,
        advanced: true,
        isEnum: true,
        options: {
          0: 'OFF',
          10: 'MCP (tool call)',
          // 20: 'Agent'
        }
      },
      //
      // 高级选项
      //
      llmTemperature: { // Temperature
        type: SettingItemType.String,
        value: '0.1',
        label: dictText['temperature_label'],  // 'llm temperature',
        description: dictText['temperature_desc'],  // '0 <= Temperature <1',
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      llmMaxTokens: { // length
        type: SettingItemType.String,
        value: 1024,
        label: dictText['max_tokens_label'],  // 'llm max tokens.',
        description: dictText['max_tokens_desc'],
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      llmMaxInputLength: { // length
        type: SettingItemType.String,
        value: 10240,
        description: 'Max length of input. -1 means infinite.',
        section: 'notellm.settings',
        public: false,
        label: 'llm max input length.',
        advanced: true,
      },
      // your prompt for chatting
      llmChatPrompt:{
        type: SettingItemType.String,
        value: '',
        label: dictText['chat_prompt_label'],  // 'llm max tokens.',
        description: dictText['chat_prompt_desc'],
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      // MCP
      // llmMcpServer:{
      //   type: SettingItemType.String,
      //   value: '',
      //   label: 'URL for MCP Server (Preview)',
      //   description: 'e.g. http://127.0.0.1:7302. The source code for the mcp server is open source at https://github.com/horsesword/notellm_mcp_server .',
      //   section: 'notellm.settings',
      //   public: true,
      //   advanced: true,
      // },
      //
      
      //
      // 隐藏参数
      //
      llmFlagLlmRunning: { 
        type: SettingItemType.Int,
        value: 0,
        label: 'llm_running', 
        description: 'llm_running', 
        section: 'notellm.settings',
        public: false,
        advanced: false,
        isEnum:true,
        options: {
          1: 'ON',
          0: 'OFF',
        }
      },
      //
      // MCP 总开关
      llmMcpEnabled: { 
        type: SettingItemType.Int,
        value: 10,
        label: 'Main switch for MCP', 
        description: 'Turn ON to enable MCP, or turn OFF to disable all. \n\n Support streamableHTTP MCP servers. \n\n Reminder: STDIO and SSE are NOT supported for now, but you can load them with other tools like "Local_MCP_Manager" and convert them to streamableHTTP mode for invocation. For details, see https://github.com/horsesword/local_mcp_manager', 
        section: 'notellm.mcp',
        public: true,
        advanced: false,
        isEnum: true,
        options: {
          0: 'OFF',
          10: 'ON',
        }
      },
    }
    for (let n = 1; n <= 42; n++){
      let n_mcp = String(n).padStart(2,"0");
      //
      dict_settings['llmMcpEnabled_'+n_mcp] = {
        type: SettingItemType.Bool,
        value: false,
        label: 'Enable MCP ' + n_mcp, 
        section: 'notellm.mcp',
        public: true,
        advanced: false,
      };
      dict_settings['llmMcpReminder_'+n_mcp] = {
        type: SettingItemType.String,
        value: '',
        label: 'Name of MCP ' + n_mcp,
        section: 'notellm.mcp',
        public: true,
        advanced: false,
      };
      dict_settings['llmMcpServer_'+n_mcp] = {
        type: SettingItemType.String,
        value: '',
        label: 'Server URL of MCP ' + n_mcp,
        section: 'notellm.mcp',
        public: true,
        advanced: false,
      };
      if(n<=1){
        // dict_settings['llmMcpEnabled_'+n_mcp]['description'] = '';
        dict_settings['llmMcpReminder_'+n_mcp]['description'] = 'For noting the name of the MCP. Just name it!';
        dict_settings['llmMcpServer_'+n_mcp]['description'] = 'Support streamableHTTP MCP servers. e.g. http://127.0.0.1:17001/mcp, https://api.githubcopilot.com/mcp/, or https://mcp.map.baidu.com/mcp?ak=xxx'
      }
      else{
        // dict_settings['llmMcpReminder_'+n_mcp]['description'] = 'Just name it.';
        dict_settings['llmMcpServer_'+n_mcp]['description'] = 'StreamableHTTP MCP servers.'
      }
      if (n>7){
        dict_settings['llmMcpEnabled_'+n_mcp]['advanced'] = true;
        dict_settings['llmMcpReminder_'+n_mcp]['advanced'] = true;
        dict_settings['llmMcpServer_'+n_mcp]['advanced'] = true;
      }
    }
    //
    await joplin.settings.registerSettings(dict_settings);
}

// export function settingValue(key: string): Promise<any> {
//   return joplin.settings.value(key);
// }