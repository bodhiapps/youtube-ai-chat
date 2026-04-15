import { useState } from 'react';
import { ChevronRight, ChevronDown, Wrench } from 'lucide-react';
import type { ChatMessage, ToolCall } from '@/types/chat';
import { decodeMcpToolName } from '@/lib/mcp-tools';

interface ToolCallDisplayProps {
  toolCall: ToolCall;
  result?: ChatMessage;
}

function ToolCallDisplay({ toolCall, result }: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const decoded = decodeMcpToolName(toolCall.function.name);
  const displayName = decoded ? `${decoded.mcpSlug} / ${decoded.toolName}` : toolCall.function.name;

  let parsedArgs: string;
  try {
    parsedArgs = JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2);
  } catch {
    parsedArgs = toolCall.function.arguments;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        data-testid="tool-call-expand"
        className="flex items-center gap-2 w-full p-2 text-left text-sm hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <Wrench className="size-4 text-gray-500" />
        <span className="font-medium">{displayName}</span>
        <span
          data-testid="tool-call-status"
          className={`ml-auto text-xs ${result ? 'text-green-600' : 'text-yellow-600'}`}
        >
          {result ? 'completed' : 'executing...'}
        </span>
      </button>
      {isExpanded && (
        <div data-testid="tool-call-content" className="p-2 border-t text-xs">
          <div className="mb-2">
            <div className="font-medium text-gray-500 mb-1">Arguments</div>
            <pre className="bg-gray-50 p-2 rounded overflow-x-auto">{parsedArgs}</pre>
          </div>
          {result && (
            <div>
              <div className="font-medium text-gray-500 mb-1">Result</div>
              <pre className="bg-gray-50 p-2 rounded overflow-x-auto max-h-40">
                {result.content.slice(0, 500)}
                {result.content.length > 500 ? '...' : ''}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ToolCallMessageProps {
  message: ChatMessage;
  toolResults: Map<string, ChatMessage>;
}

export default function ToolCallMessage({ message, toolResults }: ToolCallMessageProps) {
  if (!message.tool_calls?.length) return null;

  return (
    <div data-testid="tool-call-message" className="flex justify-start mb-4">
      <div className="max-w-[80%] space-y-2">
        {message.tool_calls.map(tc => (
          <ToolCallDisplay key={tc.id} toolCall={tc} result={toolResults.get(tc.id)} />
        ))}
      </div>
    </div>
  );
}
