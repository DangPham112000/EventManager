import type { Request, Response } from 'express';

/**
 * OAuth for the MCP endpoint, with Clerk as the authorization server.
 *
 * Clients such as Gemini, claude.ai and ChatGPT only take an MCP URL. On a 401
 * they read the protected resource metadata (RFC 9728) below, find Clerk,
 * register themselves (dynamic client registration, turned on in the Clerk
 * dashboard), send the user through Clerk sign-in and consent, then call /mcp
 * with the OAuth access token Clerk issued.
 */

// Clerk's Frontend API URL is encoded in the publishable key:
// pk_test_<base64("measured-marmot-2690.clerk.accounts.dev$")>.
function clerkIssuerUrl(): string | null {
  const key = process.env.CLERK_PUBLISHABLE_KEY;
  const match = key?.match(/^pk_(test|live)_(.+)$/);
  if (!match) return null;
  const host = Buffer.from(match[2], 'base64').toString('utf8').replace(/\$$/, '');
  return host ? `https://${host}` : null;
}

export const oauthIssuer = clerkIssuerUrl();

/** Public URL of the MCP endpoint, which is the OAuth "resource". */
export function mcpResourceUrl(req: Request): string {
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/mcp`;
}

export function resourceMetadataUrl(req: Request): string {
  return mcpResourceUrl(req).replace(/\/mcp$/, '/.well-known/oauth-protected-resource/mcp');
}

/** GET /.well-known/oauth-protected-resource[/mcp] */
export function protectedResourceMetadata(req: Request, res: Response) {
  if (!oauthIssuer) {
    res.status(404).json({ error: 'OAuth is not configured' });
    return;
  }
  res.set('Access-Control-Allow-Origin', '*').json({
    resource: mcpResourceUrl(req),
    authorization_servers: [oauthIssuer],
    bearer_methods_supported: ['header'],
    scopes_supported: ['profile', 'email'],
    resource_name: 'Event Manager',
    resource_documentation: 'https://github.com/DangPham112000/EventManager#ai-agents-mcp',
  });
}

let cachedServerMetadata: { value: unknown; expires: number } | null = null;

/**
 * GET /.well-known/oauth-authorization-server — a copy of Clerk's metadata,
 * for older clients that look for it on the MCP server's own origin.
 */
export async function authorizationServerMetadata(_req: Request, res: Response) {
  if (!oauthIssuer) {
    res.status(404).json({ error: 'OAuth is not configured' });
    return;
  }
  try {
    if (!cachedServerMetadata || cachedServerMetadata.expires < Date.now()) {
      const response = await fetch(`${oauthIssuer}/.well-known/oauth-authorization-server`);
      if (!response.ok) throw new Error(`Clerk returned ${response.status}`);
      cachedServerMetadata = { value: await response.json(), expires: Date.now() + 60 * 60 * 1000 };
    }
    res.set('Access-Control-Allow-Origin', '*').json(cachedServerMetadata.value);
  } catch (err) {
    console.error('Could not fetch Clerk OAuth metadata:', err);
    res.status(502).json({ error: 'Authorization server metadata unavailable' });
  }
}
