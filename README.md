# Joplin Plugin: NoteLLM

[中文文档](README_CN.md) | [Github](https://github.com/HorseSword/joplin-plugin-notellm) | [Joplin Plugin](https://joplinapp.org/plugins/plugin/home.sword.NoteLLM)

Your very own AI-powered note plugin for Joplin. 

It's completely open-source and does not collect any logs or personal information.

New: MCP supported.

![notellm](./_img/notellm.gif)

# Features

- **Customizable LLM Service Source**: 
    - Configure the source of your Large Language Model (LLM) service, including options like `openai`, `deepseek`, `qwen`, or even a local LLM server that is compatible with `openai-api`, for example ollama. Configuration requires specifying a URL, API key, and model name.
    - You can find examples in 'Usage Instructions' part below.
- **Chat**: 
    - **If no selection**: Chat with LLM on texts **all above cursor**. All texts after cursor will **not** be sent to LLM.
    - **If any texts are selected**: only selected texts will be sent.
    - New feature: "Advanced Chat Mode". Split texts into pieces like {"role":"user","content":"xxx"}.
- **Summarization**: 
    - **If no selection**: Summarize **all above cursor**.
    - **If any texts are selected**: Summarize selected text portions efficiently. 
- **Rewrite your selection**: 
    - Rewrite selected text. This will consider context before and after selection. 
    - You can tell LLM how to rewrite it.
- **Question & Answer**: 
    - Ask LLM about selected texts.
- **MCP Supported**:
    - You can use streamableHTTP MCP tools in your note.  

## Mobile Support (Android)

Currently, mobile users can 'Chat' with your notes. 

Others functions are under development.

**Known problems on mobile app**:
- On mobile app, some LLM servers may not function properly due to **CORS restrictions**. It is known that ollama and MCP have this issue on mobile; you can try configuring a proxy to resolve it. This is **restricted by Joplin framework** and I can not fix it now.
- Sometimes, when you click on a plugin icon, there is no response. Killing the app's background process and restarting the app usually resolves this issue. The cause may be related to Joplin's background management, though I am unable to pinpoint the exact problem at this time.

# Usage Instructions



## Step 1. Installation

### Automatic

- Go to `Tools > Options > Plugins`, search for `NoteLLM`, click Install plugin, 
- Restart Joplin to enable it.

### Manual

- Download the "".jpl" file at [github](https://github.com/HorseSword/joplin-plugin-notellm/releases)
- Go to `Tools > Options > Plugins`, click on the gear wheel and select `Install from file`
- Select the ".jpl" file to install it.
- Restart Joplin to enable it.



## Step 2. Settings

After installing this plugin, you should go to settings to configure your AI options. 

Go to `Tools > Options > NoteLLM`.

At least input one URL, API key, and model name. 

You can configure up to 3 LLMs and switch among them.



### Some examples for settings

Currently, this plugin support OpenAI-API (including OpenAI compatibility APIs). Thanks to [Ian Channing](https://github.com/ianchanning).

| Examples | LLM server url | LLM model name (examples) |
| :----------------------------------------- | :--------------------------------------- | ------------------------------------------ |
| OpenAI | `https://api.openai.com/v1` | `o3` |
| Claude | `https://api.anthropic.com/v1` | `claude-3-7-sonnet-20250219` |
| Deepseek | `https://api.deepseek.com/v1` | `deepseek-chat`,  or `deepseek-reasoner` |
| Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-2.0-flash` |
| OpenRouter | `https://openrouter.ai/api/v1` | `google/gemini-2.5-flash` |
| volcengine | `https://ark.cn-beijing.volces.com/api/v3` | `doubao-1.5-pro-32k` |
| ollama (local) | `http://your_id:your_port/v1` | `(YOUR_MODEL_NAME)` |

**Reminder**: I tested qwen, deepseek, volcengine and ollama. If you find error(s), please tell me. Thank you.



## Step 3. Use it!

**This plugin can only work in markdown editor!!!!**

**This plugin can only work in markdown editor!!!!**

**This plugin can only work in markdown editor!!!!**

The chat icon appears at the top of the markdown editing interface. Clicking on it triggers a conversation with AI based on all preceding content up to your cursor position ( Default hotkey: Alt + C ).

You can also stop generation by click this button again (>= v0.6.1).

![image-20250211190649811](./_img/image-20250211190649811.png)

And, in the top menu under Tools / NoteLLM, find quick access to all functions. 

Some have shortcut keys for easy invocation.

![image-20250211190753843](./_img/image-20250211190753843.png)



In detail,

| Abilities         | No selection                                                 | You selected some texts                                      |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Chat              | Chat with texts before **all above cursor**. All texts after cursor will **not** be sent to LLM. | Chat with **selection only**.                                |
| Summarization     | Summarize **all above cursor**.                              | Summarize selected text portions efficiently.                |
| Rewrite           | ×                                                            | Rewrite selected text. This will consider context before and after selection.  You can tell LLM how to rewrite it. |
| Question & Answer | ×                                                            | Ask LLM about selected texts                                 |



# New: MCP support !!!

MCP functionality has been completely upgraded and restructured, now directly supporting streamableHTTP MCP.

In version v0.7.0 or above, MCP settings can be found in session "NoteLLM MCP". In which you can configure at most 42 MCP servers, and toggle them as you like.

![image-20250909205331103](./_img/image-20250909205331103.png)

Here you can add streamableHTTP MCP servers.

![image-20250909205548746](./_img/image-20250909205548746.png)



After changing "MCP for LLM (preview)" from "OFF" to "MCP (tool call)" below LLM1, LLM2 and LLM3, you can use MCP tools in your note now. 

**Reminder: LLM must support "tool call"**.

**Reminder**: STDIO and SSE are NOT supported for now, but you can load them with other tools like "Local_MCP_Manager" and convert them to streamableHTTP mode for invocation. For details, see https://github.com/horsesword/local_mcp_manager




# Update Logs

- v0.7.9, 2026-01-31. Fixed a bug in Thinking Animation.
- v0.7.8, 2026-01-29. New Feature: Select Model Service Provider instead of LLM URLs. This is easier.
- v0.7.7, 2026-01-27. Fixed a bug in MCP calling; New 'Think format' supported. 
- v0.7.6, 2025-12-13. Fixed a small bug in animation when stopping LLM output.
- v0.7.5, 2025-12-03. Significantly optimized animation effects.
- v0.7.4, 2025-12-02. Fixed a bug in screen-scrolling.
- v0.7.3, 2025-09-30. Fixed a bug for calling Google Gemini.
- v0.7.2, 2025-09-27. New feature: Automatically check availability after switching models through the menu.
- v0.7.1, 2025-09-13. Better prompt for MCP calling.
- v0.7.0, 2025-09-09. MCP functionality has been completely upgraded and restructured, now directly supporting streamableHTTP MCP.
- v0.6.2, 2025-08-04. (1) Animation bug fixed. (2) New "Stop" button to stop LLM's generation.
- v0.6.1 (preview), 2025-08-04. (1) Bug fixed. (2) You can stop generation by click "Chat" button.
- v0.6.0 (preview), 2025-08-03. MCP available.
- v0.5.2, 2025-07-12. Optimized waiting and thinking animation effects.
- v0.5.1, 2025-07-09. (1) Optimized lots of animation effects. (2) New toast (removed old toast because of it's bug).
- v0.5.0, 2025-07-08. Significantly adjusted the waiting animation, and optimized the code logic.
- v0.4.16, 2025-07-06. Small bug fixed.
- v0.4.15, 2025-07-01. Optimized some animation effects.
- v0.4.14, 2025-06-14. We can set our own prompt for chatting now.
- v0.4.13, 2025-05-25. (1) Added animation for waiting. (2) Bug fixed: Stop running if note changed unexpectedly.
- v0.4.12, 2025-05-17. (1) We can hide contexts between `<think>` and `</think>` now. (2) Maintaining the cursor's position during generation, in order to avoid text input position errors caused by cursor movement.
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

# Thank you!

NoteLLM is designed to enhance your note-taking experience with powerful AI capabilities while ensuring privacy and customization.

# License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.
