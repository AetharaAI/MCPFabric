import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Play, 
  Pause, 
  Trash2, 
  Filter,
  Download,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { MessageStream } from '@/components/custom/MessageStream';
import { SchemaInspector } from '@/components/custom/SchemaInspector';
import { useAppStore } from '@/store/useAppStore';
import { useMockSSE } from '@/hooks/useSSE';
import { generateMockEvents, generateMockConsoleMessages } from '@/lib/mock-data';
import type { EventEnvelope } from '@/types/mcp';

const levelColors: Record<string, string> = {
  info: 'text-cyan-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  debug: 'text-zinc-400'
};

const levelBgColors: Record<string, string> = {
  info: 'bg-cyan-500/10 border-cyan-500/30',
  warn: 'bg-amber-500/10 border-amber-500/30',
  error: 'bg-red-500/10 border-red-500/30',
  debug: 'bg-zinc-500/10 border-zinc-500/30'
};

function EventDetails({ event }: { event: EventEnvelope }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">Event Details</h3>
          <p className="text-xs text-zinc-500">{event.trace_id}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(JSON.stringify(event, null, 2))}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="ml-2">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-500">Event Type</span>
              <div className="text-sm text-zinc-300 capitalize">{event.event_type}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-500">Status</span>
              <Badge 
                variant="secondary"
                className={cn(
                  event.status === 'completed' && 'bg-teal-500/10 text-teal-400',
                  event.status === 'pending' && 'bg-amber-500/10 text-amber-400',
                  event.status === 'streaming' && 'bg-cyan-500/10 text-cyan-400',
                  event.status === 'error' && 'bg-red-500/10 text-red-400'
                )}
              >
                {event.status}
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-500">Agent</span>
              <div className="text-sm text-zinc-300 font-mono">{event.agent_id}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-500">Tenant</span>
              <div className="text-sm text-zinc-300">{event.tenant_id}</div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-500">Timestamp</span>
            <div className="text-sm text-zinc-300">
              {new Date(event.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Causality Vector */}
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Causality Vector</h4>
            <SchemaInspector schema={event.causality_vector} name="vector" />
          </div>

          {/* Payload */}
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Payload</h4>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-sm">
              <pre className="text-zinc-300 overflow-auto">
                <code>{JSON.stringify(event.payload, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function Console() {
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const [consoleMessages] = useState(generateMockConsoleMessages(20));
  const [selectedEvent, setSelectedEvent] = useState<EventEnvelope | null>(null);
  const [timeScrubberValue, setTimeScrubberValue] = useState(100);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  
  const { 
    autoScroll, 
    setAutoScroll
  } = useAppStore();

  // Initialize with mock events
  useEffect(() => {
    setEvents(generateMockEvents(30));
  }, []);

  // Mock SSE for real-time updates
  useMockSSE({
    onMessage: (data) => {
      setEvents((prev) => [data as EventEnvelope, ...prev].slice(0, 100));
    },
    enabled: autoScroll,
    interval: 3000
  });

  const filteredMessages = consoleMessages.filter(
    (msg) => filter === 'all' || msg.level === filter
  );

  const clearEvents = () => {
    setEvents([]);
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-xl font-bold text-zinc-100">Console</h1>
                <p className="text-xs text-zinc-500">
                  Real-time event stream and operation details
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Time Scrubber */}
              <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                <Clock className="w-4 h-4 text-zinc-500" />
                <Slider
                  value={[timeScrubberValue]}
                  onValueChange={([v]) => setTimeScrubberValue(v)}
                  max={100}
                  step={1}
                  className="w-32"
                />
                <span className="text-xs text-zinc-500 w-12">
                  {timeScrubberValue}%
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={autoScroll ? 'text-teal-400' : 'text-zinc-400'}
                >
                  {autoScroll ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearEvents}
                  className="text-zinc-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-140px)]">
        <Tabs defaultValue="events" className="h-full">
          <div className="px-4 sm:px-6 lg:px-8 py-2 border-b border-zinc-800">
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="events" className="data-[state=active]:bg-zinc-800">
                Event Stream
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-800">
                Agent Logs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="events" className="h-[calc(100%-50px)] mt-0">
            <div className="flex h-full">
              {/* Left Pane - Event Stream */}
              <div className="w-1/2 border-r border-zinc-800 p-4">
                <MessageStream
                  messages={events}
                  selectedId={selectedEvent?.trace_id}
                  onSelect={setSelectedEvent}
                  autoScroll={autoScroll}
                />
              </div>

              {/* Right Pane - Event Details */}
              <div className="w-1/2 bg-zinc-950">
                {selectedEvent ? (
                  <EventDetails event={selectedEvent} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Terminal className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                      <p className="text-zinc-500">Select an event to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="h-[calc(100%-50px)] mt-0 p-4">
            <div className="h-full bg-zinc-950 rounded-lg border border-zinc-800">
              {/* Filter Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-400">Filter:</span>
                  <div className="flex items-center gap-1">
                    {(['all', 'info', 'warn', 'error', 'debug'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                          'px-2 py-1 text-xs rounded transition-colors',
                          filter === f 
                            ? 'bg-zinc-800 text-zinc-200' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        )}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-zinc-500">
                  {filteredMessages.length} messages
                </span>
              </div>

              {/* Log Messages */}
              <ScrollArea className="h-[calc(100%-60px)] p-4">
                <div className="space-y-2 font-mono text-sm">
                  {filteredMessages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        'flex items-start gap-3 p-2 rounded',
                        'hover:bg-zinc-900/50'
                      )}
                    >
                      <span className="text-zinc-600 text-xs">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          'text-xs capitalize',
                          levelBgColors[msg.level]
                        )}
                      >
                        {msg.level}
                      </Badge>
                      <span className="text-zinc-500 text-xs">{msg.agent_id}</span>
                      <span className={cn('flex-1', levelColors[msg.level])}>
                        {msg.message}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
