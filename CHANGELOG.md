# CHANGELOG.md

## 2026-03-20

### Frontend live conversion
- Added shared frontend session helpers for base URL, admin key, and operator key persistence.
- Added live MCP API client for backend verification, health, discovery, agent detail, and `/mcp/call`.
- Expanded API Keys page to support:
  - owner filter on key listing
  - `allowed_agents` on key creation
  - operator bootstrap from a newly created key
- Replaced mocked Playground execution with live operator actions against the Fabric backend.
- Added built-in operator request templates for:
  - `fabric.tool.math.calculate`
  - `fabric.message.send`
  - `fabric.message.queue_status`

### Build and deploy
- Fixed production build path by limiting the inspect plugin to Vite dev/serve mode.
- Built the frontend successfully with `npm run build`.
- Published the new frontend build into `/var/www/mcpfabric`.
- Verified `https://mcpfabric.space` is serving the new bundle.

### Findings
- Admin key and scoped client key are valid.
- UI `Failed to fetch` was caused by backend CORS/preflight, not expired keys.

### Backend integration follow-up
- Verified browser-style preflight now succeeds for:
  - `/admin/verify`
  - `/mcp/call`
- Verified authorized cross-origin success responses now include `Access-Control-Allow-Origin: https://mcpfabric.space`.

## 2026-03-21

### Passport OIDC integration
- Added Passport OIDC login integration for the Syndicate realm using the discovery endpoint.
- Added SPA session handling using Authorization Code + PKCE.
- Added callback handling at `/oauth/callback`.
- Added Passport logout flow with post-logout redirect to `/`.
- Added header login/logout controls while keeping guest browsing open.
- Gated API key workflows behind active Passport sign-in.

### Build-time auth safety
- Exposed only safe Passport config values to the frontend bundle through Vite.
- Verified the Passport client secret is not emitted into the built JS bundle.
- Confirmed the live Syndicate discovery document is reachable.
