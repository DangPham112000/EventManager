import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { Bot, Check, Copy, KeyRound, Loader2, Trash2 } from 'lucide-react';
import type { ApiKeysData, CreateApiKeyData } from '@/graphql/types';
import { GET_API_KEYS } from '@/graphql/queries';
import { CREATE_API_KEY, REVOKE_API_KEY } from '@/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-secondary p-3 text-xs leading-relaxed whitespace-pre">
        {text}
      </pre>
    </div>
  );
}

function formatDate(iso?: string | null) {
  return iso ? new Date(iso).toLocaleString() : 'never';
}

/**
 * /ai-agents — create personal API keys and copy the config that connects an
 * AI agent (Claude, Cursor, ChatGPT...) to the MCP endpoint.
 */
export function AiAgents() {
  // Dev runs the frontend and backend on different ports; production serves /mcp same-origin.
  const mcpUrl =
    import.meta.env.VITE_MCP_URL ||
    (import.meta.env.DEV ? 'http://localhost:4000/mcp' : `${window.location.origin}/mcp`);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const { data, loading } = useQuery<ApiKeysData>(GET_API_KEYS);
  const [createKey, { loading: creating }] = useMutation<CreateApiKeyData>(CREATE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });
  const [revokeKey] = useMutation(REVOKE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createKey({ variables: { name: name.trim() || 'AI agent' } });
    setNewKey(res.data?.createApiKey.key ?? null);
    setName('');
  };

  const key = newKey ?? '<YOUR_API_KEY>';
  const claudeCode = `claude mcp add --transport http event-manager ${mcpUrl} \\\n  --header "Authorization: Bearer ${key}"`;
  const jsonConfig = JSON.stringify(
    { mcpServers: { 'event-manager': { url: mcpUrl, headers: { Authorization: `Bearer ${key}` } } } },
    null,
    2,
  );
  const urlWithKey = `${mcpUrl}?key=${key}`;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Bot className="h-5 w-5" /> AI agents
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect Claude, Cursor, ChatGPT or any MCP client to your calendar. Then just ask: "add a
            meeting tomorrow at 3pm", "move my gym session to Friday", "do I have conflicts next week?"
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-border p-3">
          <Label>Easiest: sign in from your AI app</Label>
          <p className="text-sm text-muted-foreground">
            In Gemini, claude.ai, ChatGPT or Claude Desktop, add a custom connector with this URL. When
            it asks, sign in with your Event Manager account and allow access. No key needed.
          </p>
          <CopyBlock label="MCP server URL" text={mcpUrl} />
        </div>

        <Separator />

        <p className="text-sm text-muted-foreground">
          For tools that cannot sign in (Claude Code, Cursor, scripts), use an API key instead.
        </p>

        <form onSubmit={handleCreate} className="space-y-2">
          <Label htmlFor="key-name">1. Create an API key</Label>
          <div className="flex gap-2">
            <Input
              id="key-name"
              placeholder="Name, e.g. Claude Desktop"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="animate-spin" /> : <KeyRound />}
              Create
            </Button>
          </div>
        </form>

        {newKey && (
          <div className="space-y-2 rounded-xl border border-primary/40 p-3">
            <p className="text-sm font-medium">Copy this key now. It will not be shown again.</p>
            <CopyBlock label="API key" text={newKey} />
          </div>
        )}

        <div className="space-y-3">
          <Label>2. Add the server to your AI agent</Label>
          <CopyBlock label="Claude Code" text={claudeCode} />
          <CopyBlock label="Cursor, Windsurf, VS Code and other JSON configs" text={jsonConfig} />
          <CopyBlock label="Clients that only take a URL" text={urlWithKey} />
          <p className="text-xs text-muted-foreground">
            The URL-only form puts the key in the address, so it can end up in logs. Prefer the
            header form when your client supports it, and revoke a key you no longer use.
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Your keys</Label>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : !data?.apiKeys.length ? (
            <p className="text-sm text-muted-foreground">No keys yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {data.apiKeys.map((k) => (
                <li key={k.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{k.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {k.prefix}… · created {formatDate(k.createdAt)} · last used {formatDate(k.lastUsedAt)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Revoke "${k.name}"? Agents using it will lose access.`)) {
                        revokeKey({ variables: { id: k.id } });
                      }
                    }}
                  >
                    <Trash2 /> Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
