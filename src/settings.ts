import { SettingItemSubType, SettingItemType } from 'api/types';
import joplin from '../api';

export function pluginIconName(): string {
  return 'fas fa-robot';
}

export async function registerSettings(): Promise<void> {
    await joplin.settings.registerSection('notellm.settings', {
      label: 'LLM settings',
      iconName: pluginIconName(),
    });
  
    await joplin.settings.registerSettings({
      llmSelect: { // Temperature
        type: SettingItemType.Int,
        value: 1,
        label: 'The 1st LLM select',
        description: 'Which one do you want to use?',
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
        description: 'The 1st LLM server URL, e.g. https://api.deepseek.com/v1',
        section: 'notellm.settings',
        public: true,
        label: 'llm server url',
        advanced: false,
      },
      llmModel: {
        type: SettingItemType.String,
        value: 'deepseek-chat',
        description: 'The 1st LLM Model Name, e.g. moonshot-v1-8k, deepseek-chat',
        section: 'notellm.settings',
        public: true,
        label: 'llm model',
        advanced: false,
      },
      //
      llmKey: {
        type: SettingItemType.String,
        value: '',
        description: 'API-key for LLM 1.',
        section: 'notellm.settings',
        public: true,
        label: 'llm key',
        advanced: false,
        secure: true, // 密码输入框
      },
      
      llmServerUrl2: {
        type: SettingItemType.String,
        value: 'https://api.deepseek.com/v1',
        description: 'The 2nd LLM server URL (optional).',
        section: 'notellm.settings',
        public: true,
        label: 'The 2nd llm server url',
        advanced: false,
      },
      llmModel2: {
        type: SettingItemType.String,
        value: 'deepseek-chat',
        description: 'The 2nd LLM Model Name (optional).',
        section: 'notellm.settings',
        public: true,
        label: 'The 2nd llm model',
        advanced: false,
      },
      //
      llmKey2: {
        type: SettingItemType.String,
        value: '',
        description: 'API key for the 2nd LLM (optional)',
        section: 'notellm.settings',
        public: true,
        label: 'The 2nd llm key',
        advanced: false,
        secure: true, // 密码输入框
      },
      // 高级选项
      //
      llmScrollType: { // Temperature
        type: SettingItemType.Int,
        value: 1,
        label: 'Scroll type',
        description: 'Scroll type 1 for desktop, and type 2 for mobile.',
        section: 'notellm.settings',
        public: true,
        advanced: true,
        isEnum:true,
        options: {
          0: 'None',
          1: 'Type 1 for desktop',
          2: 'Type 2 for mobile'
        }
      },
      llmTemperature: { // Temperature
        type: SettingItemType.String,
        value: '0.1',
        description: 'Temperature, [0,1)',
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