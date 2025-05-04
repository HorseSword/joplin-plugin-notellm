# Joplin Plugin: NoteLLM

To be your very own AI-powered note plugin for Joplin. It's completely open-source and does not collect any logs or personal information.

![notellm](./_img/notellm.gif)

## Features

- **Customizable LLM Service Source**: Configure the source of your Large Language Model (LLM) service, including options like `openai`, `deepseek`, `qwen`, or even a local LLM server that is compatible with `openai-api`, for example ollama. Configuration requires specifying a URL, API key, and model name.
- **Summarization**: Summarize selected text portions efficiently. If nothing selected, LLM will summarize **all above cursor**.
- **Improve your selection**: Improve the expression of selected text, with considering context before and after selection. You can tell LLM how to improve it.
- **Question & Answer**: Ask LLM about selected texts. 
- **Chat**: Chat with LLM on texts **all above cursor**. Texts after cursor will not be sent to LLM.

## Mobile Support

Currently, mobile users can enjoy the chat functionality over the entire note text. 

Others functions are under development.

**Known problems on mobile app**:
- On mobile app, some LLM servers may not function properly due to CORS restrictions. It is known that ollama has this issue; you can try configuring a proxy to resolve it. This is restricted by framework and I can not fix it now.
- Sometimes, when you click on a plugin icon, there is no response. Killing the app's background process and restarting the app usually resolves this issue. The cause may be related to Joplin's background management, though I am unable to pinpoint the exact problem at this time.

## Usage Instructions

**This plugin can only work in markdown editor!!!!**

**This plugin can only work in markdown editor!!!!**

**This plugin can only work in markdown editor!!!!**

After installing this plugin, you should go to settings to configure your ai options. At least input one URL, API key, and model name.

You can configure up to 3 LLMs and switch among them.

![image-20250211191521564](./_img/image-20250211191521564.png)

Then you will have access to several features. First, a chat icon appears at the top of the markdown editing interface. Clicking on it triggers a conversation with AI based on all preceding content up to your cursor position.

![image-20250211190649811](./_img/image-20250211190649811.png)

And, in the top menu under Tools / NoteLLM, find quick access to all functions. Some have shortcut keys for easy invocation.

![image-20250211190753843](./_img/image-20250211190753843.png)

## UPDATE LOGS
- v0.4.11, 2025-05-04. New promo_tile.
- v0.4.10, 2025-05-04. New advanced chat mode. Optimize the parsing of previous text based on chat characteristics, including splitting dialogue roles, skipping the 'think' part of the reasoning model, and other functions.
- v0.4.9, 2025-04-15. Improved prompts for "chat" and "summary". Thanks to [Adam Outler](https://github.com/adamoutler). And, useless old files removed.
- v0.4.8, 2025-04-03. Improved the prompts to fix a bug that caused responses to non-Chinese content to be in Chinese.
- v0.4.7, 2025-03-30. Tried to fix CORS of Claude API.
- v0.4.6, 2025-03-09. We can set up to 3 LLMs now.
- v0.4.5, 2025-03-09. Bug fixed.
- v0.4.4, 2025-03-08. Add dialogs for "LLM ask" and "LLM improve".
- v0.4.3, 2025-03-07. Multi-language (Simplified Chinese) supported.
- v0.4.2, 2025-03-06. LLMs can be switched via tool menu.
- v0.4.0, 2025-02-25. Better support for mobile app.

## Thank you

NoteLLM is designed to enhance your note-taking experience with powerful AI capabilities while ensuring privacy and customization.