# MCP Fabric

A production-ready Next.js 14 application for managing MCP (Model Context Protocol) servers. Deploy, observe, and orchestrate agent systems at scale.

![MCP Fabric](https://img.shields.io/badge/MCP-Fabric-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-cyan)

## Features

- **Registry Explorer** - Browse and discover MCP tools, resources, and prompts
- **Observatory** - Real-time D3.js visualization of agent message passing
- **Console** - Split-pane dashboard with event stream and operation details
- **Playground** - Interactive Monaco Editor for testing MCP calls
- **Multi-tenant** - Tenant switching with isolated data contexts
- **Real-time** - SSE integration for live telemetry updates

## Tech Stack

- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Animation**: Framer Motion
- **Visualization**: D3.js + Recharts
- **Editor**: Monaco Editor
- **State**: Zustand

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/mcpfabric.git
cd mcpfabric

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Docker Deployment

### Using Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

The application will be available at `http://localhost:3000`.

### Using Docker

```bash
# Build image
docker build -t mcpfabric .

# Run container
docker run -d -p 3000:80 --name mcpfabric mcpfabric
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FABRIC_API_BASE` | Fabric backend base URL for admin/docs pages | `https://fabric.perceptor.us` |
| `VITE_MCP_SERVER_URL` | MCP server endpoint | `http://localhost:8080` |
| `VITE_SSE_URL` | SSE stream endpoint | `http://localhost:8080/stream` |
| `VITE_DEFAULT_TENANT` | Default tenant ID | `tenant-1` |
| `VITE_MOCK_DATA_ENABLED` | Enable mock data | `true` |

## Project Structure

```
app/
├── src/
│   ├── components/
│   │   ├── custom/          # Custom components
│   │   ├── layout/          # Header, Footer
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and mock data
│   ├── pages/               # Page components
│   ├── sections/            # Page sections
│   ├── store/               # Zustand store
│   └── types/               # TypeScript types
├── public/                  # Static assets
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero and registry preview |
| `/registry` | MCP tool marketplace grid |
| `/registry/:toolId` | Individual tool documentation |
| `/observatory` | Agent mesh visualization |
| `/console` | Real-time event stream dashboard |
| `/playground` | Interactive MCP client tester |
| `/api-keys` | Live key creation/list/revoke against `/admin/*` |
| `/docs` | Docs hub with Swagger and SDK links |

## Customization

### Adding New Tools

Edit `src/lib/mock-data.ts`:

```typescript
export const mockTools: MCPTool[] = [
  {
    id: 'your-tool-id',
    name: 'your.tool.name',
    description: 'Tool description',
    version: '1.0.0',
    category: 'tool',
    tags: ['tag1', 'tag2'],
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string' }
      },
      required: ['param1']
    }
  }
];
```

### Theming

Edit CSS variables in `src/index.css`:

```css
:root {
  --background: 240 10% 4%;
  --foreground: 0 0% 98%;
  --accent: 270 100% 60%;
  /* ... */
}
```

## API Integration

The application expects the following API endpoints:

### MCP Proxy
```
POST /api/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": { ... }
}
```

### SSE Stream
```
GET /api/stream

Event: message
Data: { "event_type": "...", "payload": { ... } }
```

## Development

```bash
# Run linter
npm run lint

# Type check
npm run type-check

# Run tests
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: [docs.mcpfabric.space](https://docs.mcpfabric.space)
- Issues: [GitHub Issues](https://github.com/your-org/mcpfabric/issues)
- Discord: [Join our community](https://discord.gg/mcpfabric)
