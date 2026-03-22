# TRUTH.md

## Identity
- Project: MCPFabric
- Purpose: production operator/admin UI for the Fabric-A2A platform
- Frontend repo: `git@github.com:AetharaAI/MCPFabric.git`
- Backend repo: `git@github.com:AetharaAI/Fabric-A2A.git`

## Runtime
- Public site: `https://mcpfabric.space`
- Backend API used by this app: `https://fabric.perceptor.us`
- Frontend repo root: `/home/ubuntu/mcp-fabric-site/MCPFabric`
- Backend repo root: `/home/ubuntu/fabric/mcp-modular/Fabric-A2A`
- nginx web root: `/var/www/mcpfabric`

## Infra
- Provider: OVHcloud Public Cloud
- Datacenter region: Oregon, US
- Instance type: `b3-32`
- Tailscale IP: `100.126.206.81`
- Program: OVHcloud AI Accelerator Program
- Program tier: Scale tier
- Credits: `$10k/month`, unused credits roll over
- Reported current burn: about `$7.5k/month`

## Current Production Truth
- live site is up and serving the latest branded bundle
- guest browsing is open
- Passport sign-in is enabled for user session flows
- API key creation/management in the UI requires sign-in
- UI key/admin/operator surfaces talk to the live Fabric backend
- header/footer/favicon/hero branding use curated MCPFabric assets
- deep-link routes like `/oauth/callback` require root-relative asset URLs from the frontend build
- remaining mock-heavy surfaces are `Observatory` and parts of `Registry`

## Operator Mechanics
- update `AGENTS.md`, `PROJECT_STATE.md`, `CHANGELOG.md`, and `TRUTH.md` whenever production truth changes
- build with `npm run build`
- publish with `sudo rsync -a --delete dist/ /var/www/mcpfabric/`
- verify the served bundle on `https://mcpfabric.space`

## Ownership
- Codex is the active engineering/operator agent for MCPFabric on this VM
- this node is one of multiple production nodes operated by the project owner
