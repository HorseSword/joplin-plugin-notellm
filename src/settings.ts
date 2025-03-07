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
      label: 'LLM settings',
      iconName: pluginIconName(),
    });
  
    await joplin.settings.registerSettings({

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
          2: 'LLM 2'
        }
      },
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
        advanced: true,
      },
      //
      llmServerUrl2: {
        type: SettingItemType.String,
        value: 'https://api.deepseek.com/v1',
        label: dictText['url_llm2_label'],//'The 2nd LLM server url',
        description: dictText['url_llm2_desc'], //'The 2nd LLM server URL (optional).',
        section: 'notellm.settings',
        public: true,
        advanced: false,
      },
      llmModel2: {
        type: SettingItemType.String,
        value: 'deepseek-chat',
        label: dictText['model_llm2_label'],//'The 2nd LLM model',
        description: dictText['model_llm2_desc'],//'The 2nd LLM Model Name (optional).',
        section: 'notellm.settings',
        public: true,
        advanced: false,
      },
      //
      llmKey2: {
        type: SettingItemType.String,
        value: '',
        label: dictText['key_llm2_label'], //'The 2nd LLM key',
        description: dictText['key_llm2_desc'], // 'API key for the 2nd LLM (optional)',
        section: 'notellm.settings',
        public: true,
        advanced: false,
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
      // 高级选项
      //
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
    });
}

// export function settingValue(key: string): Promise<any> {
//   return joplin.settings.value(key);
// }