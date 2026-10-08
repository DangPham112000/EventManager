import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { API_KEY_PREFIX, getUserFromApiKey } from '../apiKeys.js';
import { getUserFromOAuthToken } from '../auth.js';
import { SEED_USER } from '../data/mockData.js';
import { createMcpServer } from './server.js';
import { oauthIssuer, resourceMetadataUrl } from './oauth.js';

/**
 * The credential is either a personal API key ("Authorization: Bearer emk_..."
 * or "?key=emk_..." for clients that cannot send headers), or a Clerk OAuth
 * access token the client got by signing the user in (see oauth.ts).
 */
function readCredential(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();
  return typeof req.query.key === 'string' ? req.query.key : undefined;
}

async function authenticate(credential: string | undefined) {
  if (!credential) return null;
  if (credential.startsWith(API_KEY_PREFIX)) return getUserFromApiKey(credential);
  return getUserFromOAuthToken(credential);
}

function rpcError(res: Response, status: number, message: string) {
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });
}

/** POST /mcp — stateless Streamable HTTP: a fresh server per request. */
export async function handleMcpPost(req: Request, res: Response) {
  // Mock mode has no keys to check: everyone is the seed user, like /graphql.
  const user = process.env.USE_MOCK === 'true' ? SEED_USER : await authenticate(readCredential(req));
  if (!user) {
    // Points OAuth-capable clients at the sign-in flow.
    if (oauthIssuer) {
      res.set('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl(req)}"`);
    }
    rpcError(res, 401, 'Sign in, or use an API key from Event Manager → AI agents.');
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
