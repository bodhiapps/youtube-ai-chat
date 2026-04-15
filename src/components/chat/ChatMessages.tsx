import { useEffect, useRef, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from './MessageBubble';
import ToolCallMessage from './ToolCallMessage';
import type { ChatMessage } from '@/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  error?: string | null;
}

export default function ChatMessages({ messages, isStreaming, error }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      isUserScrolledUpRef.current = !isAtBottom;
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isNewUserMessage =
      messages.length > prevMessagesLengthRef.current && lastMessage?.role === 'user';

    if (isNewUserMessage) {
      isUserScrolledUpRef.current = false;
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isStreaming ? 'instant' : 'smooth',
      });
    }
  }, [messages, isStreaming]);

  // Build a map of tool_call_id → tool result message
  const toolResults = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const msg of messages) {
      if (msg.role === 'tool' && msg.tool_call_id) {
        map.set(msg.tool_call_id, msg);
      }
    }
    return map;
  }, [messages]);

  return (
    <ScrollArea
      className="flex-1 overflow-hidden"
      data-testid="chat-area"
      data-teststate={error ? 'error' : isStreaming ? 'streaming' : 'idle'}
      ref={(node: HTMLDivElement | null) => {
        if (node) {
          const viewport = node.querySelector(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLDivElement;
          if (viewport) {
            scrollViewportRef.current = viewport;
          }
        }
      }}
    >
      <div className="p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 mt-8">No messages yet. Start a conversation!</p>
          ) : (
            <>
              {messages.map((msg, index) => {
                if (msg.role === 'tool') return null; // Rendered inline with tool calls

                if (msg.role === 'assistant' && msg.tool_calls?.length) {
                  return (
                    <div key={index}>
                      {msg.content && <MessageBubble message={msg} />}
                      <ToolCallMessage message={msg} toolResults={toolResults} />
                    </div>
                  );
                }

                return <MessageBubble key={index} message={msg} />;
              })}
              {isStreaming && !messages[messages.length - 1]?.content && (
                <div data-testid="streaming-indicator" className="flex justify-start mb-4">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-100" />
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
