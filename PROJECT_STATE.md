# PROJECT_STATE.md

## Repo
- Name: MCPFabric frontend
- Root: `/home/ubuntu/mcp-fabric-site/MCPFabric`
- Deploy target: `/var/www/mcpfabric`
- Public URL: `https://mcpfabric.space`

## Current Status
Frontend is partially live-converted.

Completed:
- live admin verify wiring
- live key create/list/revoke wiring
- shared browser session storage for base URL/admin/operator key
- Passport OIDC login via Syndicate realm discovery
- Passport callback route at `/oauth/callback`
- Passport logout flow back to `/`
- Passport session handling in the SPA
- signed-in gating for API key workflows
- live `/mcp/health`
- live `/mcp/list_tools`
- live `/mcp/list_agents`
- live `/mcp/list_topics`
- live `/mcp/agent/{agent_id}`
- live `/mcp/call`
- live operator templates for:
  - `fabric.tool.math.calculate`
  - `fabric.message.send`
  - `fabric.message.queue_status`
- production frontend build and publish to `mcpfabric.space`

Incomplete:
- `Observatory` page still uses mock graph data
- `Registry` is not yet backed by live tool inventory
- no live async Redis/A2A stream visualization yet
- backend-side audit binding of Passport identity to Fabric admin key issuance is not yet enforced

## Verified Facts
- Admin key and client key both verify successfully via curl on `2026-03-20`
- Client key expiry from smoke test path: `2027-03-02T03:37:51.477703+00:00`
- Browser-style `OPTIONS` preflight to `fabric.perceptor.us` now succeeds for protected endpoints
- Authorized cross-origin `/admin/verify` responses now include `Access-Control-Allow-Origin: https://mcpfabric.space`
- Frontend `Failed to fetch` was caused by backend CORS/preflight and that blocker is now resolved

## Frontend Files Most Relevant Right Now
- `src/auth/AuthContext.tsx`
- `src/lib/passport-auth.ts`
- `src/pages/OAuthCallback.tsx`
- `src/pages/ApiKeys.tsx`
- `src/pages/Playground.tsx`
- `src/lib/fabric-admin-api.ts`
- `src/lib/fabric-mcp-api.ts`
- `src/lib/fabric-session.ts`
- `src/pages/Console.tsx`
- `src/pages/Observatory.tsx`
- `src/hooks/useSSE.ts`
- `vite.config.ts`

## Next Recommended Steps
1. Validate Passport sign-in, callback, and logout live in browser.
2. Convert `Observatory` to live stream/queue topology.
3. Replace mock registry/tool catalog with live discovery output.
4. Decide how backend admin APIs should bind Passport user identity for audits.
