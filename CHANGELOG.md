# CHANGELOG.md

## 2026-03-21

### Repo alignment
- Merged the MCPFabric working branch into `main`.
- Preserved the `logos` commit history while merging the Codex live-ops/auth/frontend work.
- Pushed the merged `main` branch to `origin`.

### Production branding
- Replaced generic placeholder header branding with curated MCPFabric assets.
- Replaced generic placeholder footer branding with curated MCPFabric assets.
- Wired favicon and Apple touch icon to the production build.
- Updated the hero badge to place the stacked MCPFabric wordmark beside the async-first message.
- Switched the header symbol asset to `mcp-symbol-64.png` while keeping the rendered size compact.

### Production auth and operator UX
- Added Passport OIDC login through the Syndicate realm using discovery and PKCE.
- Added callback handling at `/oauth/callback`.
- Added Passport logout flow back to `/`.
- Kept guest browsing open while gating API key workflows behind sign-in.
- Added live API key management and operator bootstrap flows.
- Added live Playground actions against the Fabric backend.
- Replaced mock Console activity with real operator-side actions and queue/message interactions.
- Replaced the fake header telemetry/shredder state with live backend health telemetry.

### Deployment
- Built and published the current branded frontend bundle to `/var/www/mcpfabric`.
- Verified `https://mcpfabric.space` is serving:
  - `index-Ct05Cxis.js`
  - `index-DF5WYZ_K.css`

### Documentation system
- Elevated `AGENTS.md`, `PROJECT_STATE.md`, `CHANGELOG.md`, and `TRUTH.md` to canonical status.
- Added a reusable `TRUTH/` template system for standardized project documentation across production systems.

## 2026-03-20

### Frontend live conversion
- Added shared frontend session helpers for base URL, admin key, and operator key persistence.
- Added live MCP API client for backend verification, health, discovery, agent detail, and `/mcp/call`.
- Expanded API Keys page to support owner filtering, `allowed_agents`, and operator bootstrap from a newly created key.
- Replaced mocked Playground execution with live operator actions against the Fabric backend.
- Verified key/auth failures were not expiry-related and traced browser failure to backend CORS/preflight.

### Backend integration follow-up
- Confirmed backend preflight success for `/admin/verify` and `/mcp/call`.
- Confirmed authorized cross-origin success responses now include `Access-Control-Allow-Origin: https://mcpfabric.space`.
