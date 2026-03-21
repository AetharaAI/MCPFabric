# HARNESS_INTEGRATION_NOTES.md

## Purpose
This frontend repo consumes the Fabric-A2A backend. The canonical harness integration instructions live in:

- [`/home/ubuntu/fabric/mcp-modular/Fabric-A2A/HARNESS_INTEGRATION_OPERATING_GUIDE.md`](/home/ubuntu/fabric/mcp-modular/Fabric-A2A/HARNESS_INTEGRATION_OPERATING_GUIDE.md)

This file exists so MCPFabric operators know where the harness-side contract is documented.

## Current Operator Surface
Use MCPFabric for:
- key creation and rotation
- key verification
- live backend smoke calls
- A2A message send and queue checks from the browser

Current UI entry points:
- `https://mcpfabric.space/api-keys`
- `https://mcpfabric.space/playground`

## Current Backend Reality
Harnesses should target:
- backend base URL: `https://fabric.perceptor.us`
- auth model: `fab_sk_live_*` scoped keys
- live call shape: plain `{ "name": "...", "arguments": { ... } }` payloads to `/mcp/call`

## Operator Workflow
1. Create a scoped key in MCPFabric.
2. Place it into the harness repo `.env`.
3. Verify with `/admin/verify`.
4. Run the harness curl or code smoke tests.
5. Use MCPFabric Playground for live operator-side inspection.

## If A Harness Fails
Check in this order:
1. `/admin/verify`
2. `/mcp/call` with `fabric.tool.math.calculate`
3. `fabric.message.send`
4. `fabric.message.queue_status`
5. consumer-side logic in the harness itself

