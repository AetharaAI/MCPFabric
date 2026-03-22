# PROJECT_STATE.md

## Repo
- Name: MCPFabric frontend
- Root: `/home/ubuntu/mcp-fabric-site/MCPFabric`
- Deploy target: `/var/www/mcpfabric`
- Public URL: `https://mcpfabric.space`
- GitHub: `git@github.com:AetharaAI/MCPFabric.git`

## Production Status
Frontend is live and production-serving.

Live and verified:
- Passport OIDC login through the Syndicate realm
- callback route at `/oauth/callback`
- logout flow back to `/`
- SPA session handling with PKCE
- guest browsing by default
- API key workflow gating behind sign-in
- live admin verify wiring
- live key create/list/revoke wiring
- shared browser session storage for base URL, admin key, and operator key
- live `/mcp/health`
- live `/mcp/list_tools`
- live `/mcp/list_agents`
- live `/mcp/list_topics`
- live `/mcp/agent/{agent_id}`
- live `/mcp/call`
- live operator request templates for `fabric.tool.math.calculate`, `fabric.message.send`, and `fabric.message.queue_status`
- live console replacement for previous mock activity surface
- live header telemetry badge replacing mock top-bar status
- curated brand assets in header, footer, favicon, and hero badge

## Live Deploy Reality
- current live JS bundle: `index-Ct05Cxis.js`
- current live CSS bundle: `index-DF5WYZ_K.css`
- current favicon asset: `favicon-DW9IsynA.ico`
- current apple touch asset: `apple-touch-icon-CukQadbV.png`
- latest branded homepage/landing update is deployed
- prior auth callback failure root cause: Vite was emitting relative asset URLs (`./assets/...`), which broke deep-link routes like `/oauth/callback`

## Repo Alignment Status
- local feature work was merged into `main`
- `main` was pushed to origin
- branding and auth/live-ops work are now in GitHub, not only on the VM

## Backend Relationship
- backend repo: `/home/ubuntu/fabric/mcp-modular/Fabric-A2A`
- backend public API: `https://fabric.perceptor.us`
- browser CORS/preflight blocker was resolved in backend runtime
- frontend currently depends on backend plain `/mcp/call` payload shape

## Remaining Gaps
- `src/pages/Observatory.tsx` still uses mock graph data
- `src/pages/Registry.tsx` still uses mock-ish catalog data
- `src/hooks/useSSE.ts` is not yet wired to a real production async data plane
- backend-side Passport identity enforcement for key issuance/audits is not yet implemented

## Files Most Relevant Right Now
- `src/auth/AuthContext.tsx`
- `src/lib/passport-auth.ts`
- `src/pages/OAuthCallback.tsx`
- `src/pages/ApiKeys.tsx`
- `src/pages/Playground.tsx`
- `src/pages/Console.tsx`
- `src/pages/Observatory.tsx`
- `src/pages/Registry.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/sections/Hero.tsx`
- `src/components/custom/FabricTelemetryBadge.tsx`
- `src/lib/fabric-mcp-api.ts`
- `src/lib/fabric-session.ts`
- `vite.config.ts`

## Next Recommended Steps
1. Remove remaining mock data from `Observatory`.
2. Replace mock registry/catalog state with backend discovery truth.
3. Define the real frontend async data plane shape for observability.
4. Bind Passport identity to backend-issued key audit trails if required.
