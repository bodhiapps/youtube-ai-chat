import { useState, useEffect, useCallback, useRef } from 'react';
import { useBodhi } from '@bodhiapp/bodhi-js-react';
import { createMcpClient } from '@bodhiapp/bodhi-js-react/mcp';
import { isMcpAvailable, type Mcp, type McpTool } from '@/lib/mcp-tools';

export function useMcpList() {
  const { client, isAuthenticated, isReady } = useBodhi();
  const [mcps, setMcps] = useState<Mcp[]>([]);
  const [toolsByMcpId, setToolsByMcpId] = useState<Record<string, McpTool[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchMcps = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await client.mcps.list();
      const list = (response.mcps ?? []) as Mcp[];
      setMcps(list);

      const nextTools: Record<string, McpTool[]> = {};
      await Promise.all(
        list.filter(isMcpAvailable).map(async mcp => {
          let mcpClient: Awaited<ReturnType<typeof createMcpClient>> | null = null;
          try {
            mcpClient = await createMcpClient(client, mcp.path);
            const { tools } = await mcpClient.listTools();
            nextTools[mcp.id] = tools as McpTool[];
          } catch (err) {
            console.error(`Failed to list tools for MCP ${mcp.slug}:`, err);
            nextTools[mcp.id] = [];
          } finally {
            await mcpClient?.close().catch(() => {});
          }
        })
      );
      setToolsByMcpId(nextTools);
    } catch (err) {
      console.error('Failed to fetch MCPs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch MCPs');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [client]);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      fetchMcps();
    } else {
      setMcps([]);
      setToolsByMcpId({});
      setError(null);
    }
  }, [isReady, isAuthenticated, fetchMcps]);

  return { mcps, toolsByMcpId, isLoading, error, refresh: fetchMcps };
}
