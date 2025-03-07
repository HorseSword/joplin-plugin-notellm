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

      llmSelect: { // Temperature
        type: SettingItemType.Int,
        value: 1,
        label: 'LLM select',
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
        label: 'LLM server url',
        description: dictText['url_llm1_desc'], // 'The 1st LLM server URL, e.g. https://api.deepseek.com/v1',
        section: 'notellm.settings',
        public: true,
        advanced: false,
      },
      llmModel: {
        type: SettingItemType.String,
        value: 'deepseek-chat',
        label: 'LLM model name',
        description: 'The 1st LLM Model Name, e.g. moonshot-v1-8k, deepseek-chat',
        section: 'notellm.settings',
        public: true,
        advanced: false,
      },
      //
      llmKey: {
        type: SettingItemType.String,
        value: '',
        label: 'LLM key',
        description: 'API-key for LLM 1.',
        section: 'notellm.settings',
        public: true,
        advanced: false,
        secure: true, // 密码输入框
      },
      llmExtra: {
        type: SettingItemType.String,
        value: '',
        label: 'Extra config for LLM 1 (Optional)',
        description: 'The 1st LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.',
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      //
      llmServerUrl2: {
        type: SettingItemType.String,
        value: 'https://api.deepseek.com/v1',
        label: 'The 2nd LLM server url',
        description: 'The 2nd LLM server URL (optional).',
        section: 'notellm.settings',
        public: true,
        advanced: false,
      },
      llmModel2: {
        type: SettingItemType.String,
        value: 'deepseek-chat',
        label: 'The 2nd LLM model',
        description: 'The 2nd LLM Model Name (optional).',
        section: 'notellm.settings',
        public: true,
        advanced: false,
      },
      //
      llmKey2: {
        type: SettingItemType.String,
        value: '',
        label: 'The 2nd LLM key',
        description: 'API key for the 2nd LLM (optional)',
        section: 'notellm.settings',
        public: true,
        advanced: false,
        secure: true, // 密码输入框
      },
      llmExtra2: {
        type: SettingItemType.String,
        value: '',
        label: 'Extra config for LLM 2 (Optional)',
        description: 'The 2nd LLM Model extra config in json format, e.g. {"key1":"value1", "key2":"value2"}. This will cover current config by key.',
        section: 'notellm.settings',
        public: true,
        advanced: true,
      },
      // 高级选项
      //
      llmScrollType: { // Temperature
        type: SettingItemType.Int,
        value: 1,
        label: 'Scroll type',
        description: 'Scroll type of screen while streaming.',
        section: 'notellm.settings',
        public: true,
        advanced: false,
        isEnum:true,
        options: {
          0: 'None',
          1: 'Type 1: in view',
          2: 'Type 2: keep center'
        }
      },
      llmTemperature: { // Temperature
        type: SettingItemType.String,
        value: '0.1',
        description: '0 <= Temperature <1',
        section: 'notellm.settings',
        public: true,
        label: 'llm temperature',
        advanced: true,
      },
      llmMaxTokens: { // length
        type: SettingItemType.String,
        value: 1024,
        description: 'Num of max tokens. e.g. 1024, 2048, 4096.',
        section: 'notellm.settings',
        public: true,
        label: 'llm max tokens.',
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