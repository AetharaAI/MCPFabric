import { useEffect, useRef, useCallback, useState } from 'react';

interface SSEOptions {
  url: string;
  onMessage: (data: unknown) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  enabled?: boolean;
}

export function useSSE({
  url,
  onMessage,
  onError,
  onOpen,
  onClose,
  reconnect = true,
  reconnectInterval = 3000,
  enabled = true
}: SSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        onOpen?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch {
          onMessage(event.data);
        }
      };

      eventSource.onerror = (error) => {
        setIsConnected(false);
        onError?.(error);
        eventSource.close();

        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('SSE connection failed:', error);
      onError?.(error as Event);
    }
  }, [url, onMessage, onError, onOpen, reconnect, reconnectInterval, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    eventSourceRef.current?.close();
    setIsConnected(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return { isConnected, connect, disconnect };
}

// Mock SSE hook for development
export function useMockSSE({
  onMessage,
  enabled = true,
  interval = 2000
}: {
  onMessage: (data: unknown) => void;
  enabled?: boolean;
  interval?: number;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    setIsConnected(true);
    
    intervalRef.current = setInterval(() => {
      const mockEvent = {
        tenant_id: 'tenant-1',
        trace_id: `trace-${Math.random().toString(36).substr(2, 9)}`,
        causality_vector: {},
        timestamp: new Date().toISOString(),
        event_type: ['request', 'response', 'event'][Math.floor(Math.random() * 3)],
        payload: { message: 'Mock event', data: Math.random() },
        agent_id: `agent-${Math.floor(Math.random() * 7) + 1}`,
        operation_id: `op-${Math.random().toString(36).substr(2, 9)}`,
        status: ['pending', 'streaming', 'completed'][Math.floor(Math.random() * 3)]
      };
      onMessage(mockEvent);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsConnected(false);
    };
  }, [enabled, interval, onMessage]);

  return { isConnected };
}
