import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Wrench, 
  FileText, 
  MessageSquare, 
  ArrowRight,
  Code2,
  Play,
  ChevronLeft,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SchemaInspector } from '@/components/custom/SchemaInspector';
import { mockTools } from '@/lib/mock-data';
import type { MCPTool } from '@/types/mcp';

type CategoryFilter = 'all' | 'tool' | 'resource' | 'prompt';

const categoryIcons = {
  tool: Wrench,
  resource: FileText,
  prompt: MessageSquare
};

const categoryLabels = {
  all: 'All',
  tool: 'Tools',
  resource: 'Resources',
  prompt: 'Prompts'
};

function ToolCard({ tool, index }: { tool: MCPTool; index: number }) {
  const Icon = categoryIcons[tool.category];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={cn(
        'group relative p-6 rounded-xl',
        'bg-zinc-900/50 border border-zinc-800',
        'hover:border-purple-500/50 hover:bg-zinc-900',
        'transition-all duration-300'
      )}
    >
      <div className="absolute inset-0 rounded-xl bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2.5 rounded-lg',
              tool.category === 'tool' && 'bg-purple-500/10 text-purple-400',
              tool.category === 'resource' && 'bg-cyan-500/10 text-cyan-400',
              tool.category === 'prompt' && 'bg-amber-500/10 text-amber-400'
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors">
                {tool.name}
              </h3>
              <span className="text-xs text-zinc-500">v{tool.version}</span>
            </div>
          </div>
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
            {categoryLabels[tool.category]}
          </Badge>
        </div>

        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
          {tool.description}
        </p>

        <div className="mb-4 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Input Schema</span>
          </div>
          <pre className="text-xs text-zinc-400 overflow-hidden">
            <code className="font-mono">
              {JSON.stringify(tool.inputSchema.properties, null, 2).slice(0, 100)}...
            </code>
          </pre>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {tool.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-500"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/playground?tool=${tool.id}`} className="flex-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              <Play className="w-4 h-4 mr-2" />
              Test in Playground
            </Button>
          </Link>
          <Link to={`/registry/${tool.id}`}>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-zinc-400 hover:text-zinc-300"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function ToolDetail({ tool }: { tool: MCPTool }) {
  const [copied, setCopied] = useState(false);
  const Icon = categoryIcons[tool.category];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link 
          to="/registry"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Registry
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={cn(
              'p-4 rounded-xl',
              tool.category === 'tool' && 'bg-purple-500/10 text-purple-400',
              tool.category === 'resource' && 'bg-cyan-500/10 text-cyan-400',
              tool.category === 'prompt' && 'bg-amber-500/10 text-amber-400'
            )}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-100">{tool.name}</h1>
              <p className="text-zinc-500 mt-1">{tool.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
                  v{tool.version}
                </Badge>
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
                  {categoryLabels[tool.category]}
                </Badge>
              </div>
            </div>
          </div>
          
          <Link to={`/playground?tool=${tool.id}`}>
            <Button className="bg-purple-600 hover:bg-purple-500">
              <Play className="w-4 h-4 mr-2" />
              Test in Playground
            </Button>
          </Link>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tool.tags.map((tag) => (
            <span 
              key={tag}
              className="px-3 py-1 text-sm rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Schemas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Input Schema</h2>
            <SchemaInspector schema={tool.inputSchema} name="input" defaultExpanded />
          </div>
          
          {tool.outputSchema && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Output Schema</h2>
              <SchemaInspector schema={tool.outputSchema} name="output" defaultExpanded />
            </div>
          )}
        </div>

        {/* Example Request */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">Example Request</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify({
                jsonrpc: '2.0',
                id: '1',
                method: 'tools/call',
                params: {
                  name: tool.name,
                  arguments: tool.inputSchema.properties ? 
                    Object.keys(tool.inputSchema.properties).reduce((acc, key) => {
                      acc[key] = 'example-value';
                      return acc;
                    }, {} as Record<string, string>) : {}
                }
              }, null, 2))}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-sm">
            <pre className="text-zinc-300">
              <code>{JSON.stringify({
                jsonrpc: '2.0',
                id: '1',
                method: 'tools/call',
                params: {
                  name: tool.name,
                  arguments: tool.inputSchema.properties ? 
                    Object.keys(tool.inputSchema.properties).reduce((acc, key) => {
                      acc[key] = 'example-value';
                      return acc;
                    }, {} as Record<string, string>) : {}
                }
              }, null, 2)}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Registry() {
  const { toolId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const selectedTool = useMemo(() => {
    return mockTools.find((t) => t.id === toolId);
  }, [toolId]);

  const filteredTools = useMemo(() => {
    return mockTools.filter((tool) => {
      const matchesSearch = 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = category === 'all' || tool.category === category;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, category]);

  if (selectedTool) {
    return <ToolDetail tool={selectedTool} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-zinc-100 mb-4">
            MCP Registry
          </h1>
          <p className="text-zinc-400 max-w-2xl">
            Browse and discover MCP tools, resources, and prompts. 
            Test them directly in the playground.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search tools, resources, prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
            <TabsList className="bg-zinc-900 border border-zinc-800">
              {(Object.keys(categoryLabels) as CategoryFilter[]).map((key) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
                >
                  {categoryLabels[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        <div className="mb-6 text-sm text-zinc-500">
          Showing {filteredTools.length} {filteredTools.length === 1 ? 'result' : 'results'}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool, index) => (
            <ToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-16">
            <Filter className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">
              No results found
            </h3>
            <p className="text-zinc-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
