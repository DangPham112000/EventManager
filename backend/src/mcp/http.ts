import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { getUserFromApiKey } from '../apiKeys.js';
import { SEED_USER } from '../data/mockData.js';
import { createMcpServer } from './server.js';

/**
 * The key comes from "Authorization: Bearer emk_..." or, for clients that
 * cannot send headers (claude.ai / ChatGPT custom connectors), "?key=emk_...".
 */
function readKey(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();
  return typeof req.query.key === 'string' ? req.query.key : undefined;
}

function rpcError(res: Response, status: number, message: string) {
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });
}

/** POST /mcp — stateless Streamable HTTP: a fresh server per request. */
export async function handleMcpPost(req: Request, res: Response) {
  // Mock mode has no keys to check: everyone is the seed user, like /graphql.
  const user = process.env.USE_MOCK === 'true' ? SEED_USER : await getUserFromApiKey(readKey(req));
  if (!user) {
    rpcError(res, 401, 'Missing or invalid API key. Create one in Event Manager → AI agents.');
    return;
  }

  const server = createMcpServer(user);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on('close', () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP request failed:', err);
    if (!res.headersSent) rpcError(res, 500, 'Internal server error');
  }
}

/** GET/DELETE /mcp — no sessions or server-sent streams in stateless mode. */
export function handleMcpNotAllowed(_req: Request, res: Response) {
  res.set('Allow', 'POST');
  rpcError(res, 405, 'Method not allowed.');
}
