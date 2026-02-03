import { Hero } from '@/sections/Hero';
import { RegistryGrid } from '@/sections/RegistryGrid';

export function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <Hero />
      <RegistryGrid />
    </main>
  );
}
