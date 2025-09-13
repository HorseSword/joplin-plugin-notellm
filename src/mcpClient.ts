import joplin from '../api';

interface JSONRPCMessage {
  jsonrpc: "2.0";
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPCapabilities {
  roots?: { listChanged: boolean };
  sampling?: {};
}

class MCPClient {
  private baseUrl: string;
  private sessionId: string | null = null;
  private requestId = 0;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private generateId(): string {
    return `req_${++this.requestId}`;
  }

  // 初始化连接
  async initialize(clientCapabilities: MCPCapabilities = {}): Promise<any> {
    const initRequest: JSONRPCMessage = {
      jsonrpc: "2.0",
      id: this.generateId(),
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: clientCapabilities,
        clientInfo: {
          name: "NoteLLM",
          version: "1.0.0"
        }
      }
    };

    const response = await this.sendRequest(initRequest, true);
    
    // 检查会话 ID
    if (response.headers) {
      this.sessionId = response.headers.get('Mcp-Session-Id');
    }

    // 发送 initialized 通知
    await this.sendNotification({
      jsonrpc: "2.0",
      method: "notifications/initialized"
    });

    return response.data;
  }

  // 发送请求（关键：处理流式响应）
  private async sendRequest(
    message: JSONRPCMessage, 
    isInit = false
  ): Promise<{ data: any; headers?: Headers }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream' // 支持流式响应
    };

    // 添加会话 ID（除了初始化请求）
    if (!isInit && this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 检查响应类型
    const contentType = response.headers.get('Content-Type') || '';
    
    if (contentType.includes('text/event-stream')) {
      // 处理流式响应（SSE）
      return { 
        data: await this.processStreamResponse(response),
        headers: response.headers 
      };
    } else if (contentType.includes('application/json')) {
      // 处理 JSON 响应
      return { 
        data: await response.json(),
        headers: response.headers 
      };
    } else {
      // 处理其他类型响应
      return { 
        data: await response.text(),
        headers: response.headers 
      };
    }
  }

  // 处理流式响应（易错点重点处理）
  private async processStreamResponse(response: Response): Promise<any[]> {
    const results: any[] = [];
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available for stream');
    }

    try {
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // 处理 SSE 格式数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6); // 去除 "data: "
              if (jsonData.trim() !== '') {
                const parsedData = JSON.parse(jsonData);
                results.push(parsedData);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
      // 处理最后剩余的数据
      if (buffer.trim()) {
        try {
          const finalData = JSON.parse(buffer);
          results.push(finalData);
        } catch (e) {
          console.error('Error parsing final buffer:', e);
        }
      }
      
    } finally {
      reader.releaseLock();
    }

    return results;
  }

  // 发送通知（无需响应）
  private async sendNotification(message: Omit<JSONRPCMessage, 'id'>): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream, application/json'
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(message)
    });
  }

  // 调用工具
  async callTool(name: string, args: any = {}): Promise<any> {
    const request: JSONRPCMessage = {
      jsonrpc: "2.0",
      id: this.generateId(),
      method: "tools/call",
      params: {
        name,
        arguments: args
      }
    };

    const response = await this.sendRequest(request);
    return response.data;
  }

  // 列出可用工具
  async listTools(): Promise<any> {
    const request: JSONRPCMessage = {
      jsonrpc: "2.0",
      id: this.generateId(),
      method: "tools/list"
    };

    const response = await this.sendRequest(request);
    return response.data;
  }

  // 获取资源
  async getResource(uri: string): Promise<any> {
    const request: JSONRPCMessage = {
      jsonrpc: "2.0",
      id: this.generateId(),
      method: "resources/read",
      params: { uri }
    };

    const response = await this.sendRequest(request);
    return response.data;
  }

  // 列出资源
  async listResources(): Promise<any> {
    const request: JSONRPCMessage = {
      jsonrpc: "2.0",
      id: this.generateId(),
      method: "resources/list"
    };

    const response = await this.sendRequest(request);
    return response.data;
  }

  // 关闭连接
  async close(): Promise<void> {
    // 发送关闭通知（可选）
    if (this.sessionId) {
      try {
        await this.sendNotification({
          jsonrpc: "2.0",
          method: "notifications/cancelled"
        });
      } catch (e) {
        // 忽略关闭时的错误
      }
    }
    this.sessionId = null;
  }
}

// mcp_url='http://localhost:17001/mcp'
// tool_name='get_date_diff'
/**
 * 输入 mcp 服务器网址，返回可用的工具；
 * @param mcp_url 
 * @returns 
 */
export async function mcp_get_tools(mcp_url:string) {
  const client = new MCPClient(mcp_url);
  
  try {
    // 初始化连接
    await client.initialize({
      roots: { listChanged: false },
      sampling: {}
    });
    
    // 列出可用工具
    const tools = await client.listTools();
    console.log('Available tools:', tools);
    return tools  // 获取方法： t.result.tools 得到列表，元素是 name, description, inputSchema

  } catch (error) {
    console.error('MCP client error:', error);
  } finally {
    await client.close();
  }
}

/**
 * 返回 openai 格式的工具列表。
 * @param MCP_SERVER_URL 
 * @returns 字典，包括 tools, tmap.
 */
export async function mcp_get_tools_openai(MCP_SERVER_URL:string) {
  // 
  let lst_tools_openai = [];
  let dict_map = {}
  let n = 0;
  for (let server_url of MCP_SERVER_URL.split("|")){
    if(server_url.trim().length)
      try{
          n+=1;
          let prefix = 's'+String(n).padStart(2,"0");
          // console.log('line_479, server_url = ',server_url)
          let tools_of_mcp = await mcp_get_tools(server_url.trim());
          console.log('[INFO_302] tools_of_mcp =',tools_of_mcp)
          let lst_tools = []
          // 如果返回是列表的话，再处理一次
          if (Array.isArray(tools_of_mcp)){
            lst_tools = tools_of_mcp[0].result.tools
          }
          else{
            lst_tools = tools_of_mcp.result.tools
          }
          // console.log('[INFO_311] lst_tools = ',lst_tools)
          for (let tool_mcp_one of lst_tools){  // 为什么加 [0] 很神奇
              // console.log('[INFO_306] tool_mcp_one = ',tool_mcp_one)
              let tool_openai_one = { 
                  type:'function', 
                  function: {
                      name: prefix + '_' + tool_mcp_one.name,
                      description: tool_mcp_one.description,
                      parameters: tool_mcp_one.inputSchema
                  }
              };
              // console.log('tool_openai_one = ', tool_openai_one)
              lst_tools_openai.push(tool_openai_one)
              dict_map[prefix + '_' + tool_mcp_one.name] = {
                "function_name": tool_mcp_one.name,
                "server_url": server_url.trim()
              }
          } 
      }
      catch{
          continue;
      }
  }
  console.log('lst_tools_openai = ',lst_tools_openai)
  return {
    tools: lst_tools_openai, 
    tmap: dict_map
  };
}

export async function mcp_call_tool(mcp_url:string, tool_name:string, args:any={}) {
  const client = new MCPClient(mcp_url);
  
  try {
    // 初始化连接
    await client.initialize({
      roots: { listChanged: false },
      sampling: {}
    });
    
    // 列出可用工具
    const tools = await client.listTools();
    console.log('Available tools:', tools);
    
    // 调用工具
    // let tool_name = 'get_date_diff'
    // let args = { 
    //   date_from: '2025-01-01', 
    //   date_to: '2025-12-31'
    // }
    const result = await client.callTool(tool_name, args);
    console.log('Tool result:', result);
    return result;
  } catch (error) {
    console.error('MCP client error:', error);
  } finally {
    await client.close();
  }
}

export function get_mcp_prompt(){
  // 
  let prompt_for_mcp = `
  Before answering user's question, you can use one or more tools. Then user will give you the result of your tool call. 
  Use necessary tools step-by-step to accomplish user's query, with result of the previous tool use.
  If no tool call is needed, you should answer the question directly.
  Never re-use a tool call that you previously used with same parameters.
  `
  return prompt_for_mcp;
}
