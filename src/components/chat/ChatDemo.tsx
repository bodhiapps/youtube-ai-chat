import { useEffect } from 'react';
import { toast } from 'sonner';
import { useChat } from '@/hooks/useChat';
import { useMcpList } from '@/hooks/useMcpList';
import { useMcpSelection } from '@/hooks/useMcpSelection';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

export default function ChatDemo() {
  const { mcps, toolsByMcpId, isLoading: isMcpsLoading } = useMcpList();
  const { enabledMcpTools, toggleTool, toggleMcp, getEnabledToolCount, getCheckboxState } =
    useMcpSelection(mcps, toolsByMcpId);

  const {
    messages,
    isStreaming,
    selectedModel,
    setSelectedModel,
    sendMessage,
    clearMessages,
    error: chatError,
    clearError: clearChatError,
    models,
    isLoadingModels,
    loadModels,
  } = useChat(enabledMcpTools, mcps, toolsByMcpId);

  useEffect(() => {
    if (chatError) {
      toast.error(chatError, {
        onDismiss: clearChatError,
        onAutoClose: clearChatError,
      });
    }
  }, [chatError, clearChatError]);

  return (
    <>
      <ChatMessages messages={messages} isStreaming={isStreaming} error={chatError} />
      <ChatInput
        onSendMessage={sendMessage}
        onClearMessages={clearMessages}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        models={models}
        isLoadingModels={isLoadingModels}
        onRefreshModels={loadModels}
        mcps={mcps}
        toolsByMcpId={toolsByMcpId}
        enabledMcpTools={enabledMcpTools}
        onToggleMcp={toggleMcp}
        onToggleTool={toggleTool}
        getCheckboxState={getCheckboxState}
        enabledToolCount={getEnabledToolCount()}
        isMcpsLoading={isMcpsLoading}
      />
    </>
  );
}
