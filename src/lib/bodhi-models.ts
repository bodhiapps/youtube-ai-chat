import type { UIClient } from '@bodhiapp/bodhi-js-react';
import type { ApiFormat } from './agent-model';

export interface BodhiModelInfo {
  id: string;
  apiFormat: ApiFormat;
}

interface OpenAIApiModel {
  provider: 'openai';
  id: string;
}
interface AnthropicApiModel {
  provider: 'anthropic';
  id: string;
}
interface GeminiApiModel {
  provider: 'gemini';
  name: string;
}
type ApiModel = OpenAIApiModel | AnthropicApiModel | GeminiApiModel;

interface AliasEntry {
  source?: string;
  alias?: string;
  id?: string;
  api_format?: ApiFormat;
  prefix?: string | null;
  models?: ApiModel[];
}

interface PaginatedAliasResponse {
  data: AliasEntry[];
}

function modelId(m: ApiModel): string | undefined {
  if (m.provider === 'gemini') {
    return m.name?.startsWith('models/') ? m.name.slice('models/'.length) : m.name;
  }
  return m.id;
}

function flattenAlias(entry: AliasEntry): BodhiModelInfo[] {
  if (entry.source === 'api') {
    const prefix = entry.prefix ?? '';
    const fmt = entry.api_format ?? 'openai';
    return (entry.models ?? [])
      .map(m => {
        const id = modelId(m);
        return id ? { id: `${prefix}${id}`, apiFormat: fmt } : null;
      })
      .filter((x): x is BodhiModelInfo => x !== null);
  }
  if (entry.alias) {
    return [{ id: entry.alias, apiFormat: 'openai' }];
  }
  return [];
}

export async function fetchBodhiModels(client: UIClient): Promise<BodhiModelInfo[]> {
  const res = await client.sendApiRequest<void, PaginatedAliasResponse>(
    'GET',
    '/bodhi/v1/models?page_size=100'
  );
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to list models (status ${res.status})`);
  }
  const body = res.body as PaginatedAliasResponse;
  const entries = body?.data ?? [];
  return entries.flatMap(flattenAlias);
}
