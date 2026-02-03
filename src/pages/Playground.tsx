import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Send, 
  RotateCcw, 
  Copy, 
  Check,
  Sparkles,
  Loader2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AsyncQueue } from '@/components/custom/AsyncQueue';
import { mockTools } from '@/lib/mock-data';
import type { AsyncOperation, MCPRequest } from '@/types/mcp';

const defaultRequest: MCPRequest = {
  jsonrpc: '2.0',
  id: '1',
  method: 'tools/call',
  params: {
    name: 'filesystem.read',
    arguments: {
      path: '/example/file.txt'
    }
  }
};

const requestTemplates = [
  { name: 'Tool Call', value: defaultRequest },
  { 
    name: 'List Tools', 
    value: {
      jsonrpc: '2.0',
      id: '1',
      method: 'tools/list'
    }
  },
  { 
    name: 'List Resources', 
    value: {
      jsonrpc: '2.0',
      id: '1',
      method: 'resources/list'
    }
  },
  { 
    name: 'Read Resource', 
    value: {
      jsonrpc: '2.0',
      id: '1',
      method: 'resources/read',
      params: {
        uri: 'file:///example.txt'
      }
    }
  },
  { 
    name: 'Get Prompt', 
    value: {
      jsonrpc: '2.0',
      id: '1',
      method: 'prompts/get',
      params: {
        name: 'code-review',
        arguments: {
          code: 'function example() {}'
        }
      }
    }
  }
];

export function Playground() {
  const [searchParams] = useSearchParams();
  const toolId = searchParams.get('tool');
  
  const [request, setRequest] = useState<string>(JSON.stringify(defaultRequest, null, 2));
  const [response, setResponse] = useState<string>('');
  const [operations, setOperations] = useState<AsyncOperation[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Tool Call');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('request');

  // Load tool template if toolId is provided
  useEffect(() => {
    if (toolId) {
      const tool = mockTools.find((t) => t.id === toolId);
      if (tool) {
        const template = {
          jsonrpc: '2.0',
          id: '1',
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: tool.inputSchema.properties 
              ? Object.keys(tool.inputSchema.properties).reduce((acc, key) => {
                  acc[key] = '';
                  return acc;
                }, {} as Record<string, string>)
              : {}
          }
        };
        setRequest(JSON.stringify(template, null, 2));
      }
    }
  }, [toolId]);

  const handleTemplateChange = (templateName: string) => {
    const template = requestTemplates.find((t) => t.name === templateName);
    if (template) {
      setRequest(JSON.stringify(template.value, null, 2));
      setSelectedTemplate(templateName);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setActiveTab('queue');

    // Create operation
    const operation: AsyncOperation = {
      id: `op-${Date.now()}`,
      type: 'tools/call',
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agent_id: 'agent-1',
      tenant_id: 'tenant-1',
      request: JSON.parse(request)
    };

    setOperations((prev) => [operation, ...prev]);

    // Simulate execution
    setTimeout(() => {
      setOperations((prev) =>
        prev.map((op) =>
          op.id === operation.id
            ? { ...op, status: 'streaming', progress: 30 }
            : op
        )
      );
    }, 500);

    setTimeout(() => {
      setOperations((prev) =>
        prev.map((op) =>
          op.id === operation.id
            ? { ...op, status: 'streaming', progress: 60 }
            : op
        )
      );
    }, 1000);

    setTimeout(() => {
      setOperations((prev) =>
        prev.map((op) =>
          op.id === operation.id
            ? { 
                ...op, 
                status: 'completed', 
                progress: 100,
                response: {
                  jsonrpc: '2.0',
                  id: operation.request.id,
                  result: {
                    success: true,
                    data: { message: 'Operation completed successfully' }
                  }
                }
              }
            : op
        )
      );

      setResponse(JSON.stringify({
        jsonrpc: '2.0',
        id: operation.request.id,
        result: {
          success: true,
          data: { message: 'Operation completed successfully' }
        }
      }, null, 2));
      
      setIsExecuting(false);
      setActiveTab('response');
    }, 1500);
  };

  const handleCancel = (id: string) => {
    setOperations((prev) =>
      prev.map((op) =>
        op.id === id ? { ...op, status: 'error', error: 'Cancelled by user' } : op
      )
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRequest = () => {
    try {
      const parsed = JSON.parse(request);
      setRequest(JSON.stringify(parsed, null, 2));
    } catch {
      // Invalid JSON, ignore
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-xl font-bold text-zinc-100">Playground</h1>
                <p className="text-xs text-zinc-500">
                  Test MCP requests and inspect responses
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Template Selector */}
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {requestTemplates.map((template) => (
                    <SelectItem 
                      key={template.name} 
                      value={template.name}
                      className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                    >
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={formatRequest}
                className="border-zinc-800 text-zinc-400"
              >
                Format
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-140px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
          {/* Left Panel - Editor */}
          <div className="lg:col-span-2 flex flex-col border-r border-zinc-800">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                <TabsList className="bg-zinc-900 border border-zinc-800">
                  <TabsTrigger value="request" className="data-[state=active]:bg-zinc-800">
                    Request
                  </TabsTrigger>
                  <TabsTrigger value="response" className="data-[state=active]:bg-zinc-800">
                    Response
                  </TabsTrigger>
                  <TabsTrigger value="queue" className="data-[state=active]:bg-zinc-800">
                    Queue
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(activeTab === 'request' ? request : response)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRequest(JSON.stringify(defaultRequest, null, 2))}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="request" className="h-[calc(100%-60px)] mt-0">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={request}
                  onChange={(value) => setRequest(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true
                  }}
                />
              </TabsContent>

              <TabsContent value="response" className="h-[calc(100%-60px)] mt-0">
                {response ? (
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={response}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: 'JetBrains Mono, monospace',
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      readOnly: true,
                      automaticLayout: true
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                      <p className="text-zinc-500">Execute a request to see the response</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="queue" className="h-[calc(100%-60px)] mt-0 p-4">
                <AsyncQueue
                  operations={operations}
                  onCancel={handleCancel}
                />
              </TabsContent>
            </Tabs>

            {/* Execute Button */}
            <div className="p-4 border-t border-zinc-800">
              <Button
                onClick={handleExecute}
                disabled={isExecuting}
                className="w-full bg-purple-600 hover:bg-purple-500 h-12"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Execute Request
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Tools & Info */}
          <div className="hidden lg:flex flex-col bg-zinc-950/50">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-sm font-medium text-zinc-300">Available Tools</h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {mockTools.map((tool) => (
                  <div
                    key={tool.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      'bg-zinc-900 border-zinc-800',
                      'hover:border-purple-500/50'
                    )}
                    onClick={() => {
                      const template = {
                        jsonrpc: '2.0',
                        id: '1',
                        method: 'tools/call',
                        params: {
                          name: tool.name,
                          arguments: tool.inputSchema.properties 
                            ? Object.keys(tool.inputSchema.properties).reduce((acc, key) => {
                                acc[key] = '';
                                return acc;
                              }, {} as Record<string, string>)
                            : {}
                        }
                      };
                      setRequest(JSON.stringify(template, null, 2));
                      setActiveTab('request');
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-300">{tool.name}</span>
                      <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-400">
                        {tool.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{tool.description}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
