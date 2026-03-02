import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ExternalLink,
  FileCode2,
  KeyRound,
  Package,
  Rocket,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const docsLinks = [
  {
    title: "Swagger API",
    description: "Live backend OpenAPI and endpoint explorer.",
    href: "https://fabric.perceptor.us/docs",
    icon: Server,
  },
  {
    title: "Swagger JSON",
    description: "Raw OpenAPI JSON for SDK tooling and integrations.",
    href: "https://fabric.perceptor.us/openapi.json",
    icon: FileCode2,
  },
  {
    title: "Python SDK (PyPI)",
    description: "Published package and release history for fabric-a2a.",
    href: "https://pypi.org/project/fabric-a2a/",
    icon: Package,
  },
  {
    title: "GitHub Repository",
    description: "Source code for backend, SDK, and website.",
    href: "https://github.com",
    icon: BookOpen,
  },
];

const adminEndpoints = [
  { method: "GET", path: "/admin/verify", details: "Validate admin or key scope." },
  { method: "POST", path: "/admin/keys", details: "Create a new API key (shown once)." },
  { method: "GET", path: "/admin/keys", details: "List existing keys for owner or system." },
  { method: "DELETE", path: "/admin/keys/{key_id}", details: "Revoke a key." },
];

export function Docs() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-16 pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-8 border-b border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <BookOpen className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Documentation</h1>
              <p className="text-sm text-zinc-400 mt-1">
                API references, SDK links, and implementation quick-start notes for Fabric A2A.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {docsLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <Icon className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <h2 className="text-zinc-100 font-semibold">{link.title}</h2>
                      <p className="text-zinc-400 text-sm mt-1">{link.description}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-cyan-300 transition-colors" />
                </div>
              </motion.a>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          <div className="xl:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <h2 className="text-zinc-100 font-semibold">Admin API Endpoints</h2>
            </div>
            <div className="space-y-3">
              {adminEndpoints.map((endpoint) => (
                <div
                  key={endpoint.path}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono bg-zinc-800 text-zinc-200 min-w-14 justify-center"
                    >
                      {endpoint.method}
                    </Badge>
                    <span className="font-mono text-sm text-zinc-300">{endpoint.path}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{endpoint.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-4 h-4 text-teal-400" />
              <h2 className="text-zinc-100 font-semibold">Quick Start</h2>
            </div>
            <ol className="space-y-3 text-sm text-zinc-300 list-decimal list-inside">
              <li>Open Swagger and verify backend health endpoints.</li>
              <li>Create keys from the new API Keys tab.</li>
              <li>Use `fab_sk_live_*` in SDK clients and MCP calls.</li>
              <li>Rotate keys through `/admin/keys` for production hygiene.</li>
            </ol>
            <div className="mt-5">
              <Link to="/api-keys">
                <Button className="w-full bg-purple-600 hover:bg-purple-500">
                  Open API Keys
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
