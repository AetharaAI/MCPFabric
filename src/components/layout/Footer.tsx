import { Link } from 'react-router-dom';
import { Cpu, Github, Twitter, MessageCircle } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Registry', href: '/registry' },
    { label: 'Observatory', href: '/observatory' },
    { label: 'Console', href: '/console' },
    { label: 'Playground', href: '/playground' },
    { label: 'API Keys', href: '/api-keys' },
  ],
  docs: [
    { label: 'Docs Hub', href: '/docs', external: false },
    { label: 'Swagger API', href: 'https://fabric.perceptor.us/docs', external: true },
    { label: 'OpenAPI JSON', href: 'https://fabric.perceptor.us/openapi.json', external: true },
    { label: 'Python SDK (PyPI)', href: 'https://pypi.org/project/fabric-a2a/', external: true },
  ],
  community: [
    { label: 'GitHub', href: 'https://github.com', external: true },
    { label: 'Discord', href: '#', external: true },
    { label: 'Twitter', href: '#', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Cpu className="w-6 h-6 text-purple-400" />
              <span className="text-lg font-semibold text-zinc-100">
                MCP<span className="text-purple-400">Fabric</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 mb-6">
              Control fabric for agent systems. Deploy, observe, and orchestrate MCP servers at scale.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Docs Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-4">Documentation</h3>
            <ul className="space-y-3">
              {footerLinks.docs.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-4">Community</h3>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} MCP Fabric. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
