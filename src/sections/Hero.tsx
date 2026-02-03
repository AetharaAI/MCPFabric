
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Telescope, Box, Zap } from 'lucide-react';
import { AnimatedGrid } from '@/components/custom/AnimatedGrid';
import { GlowButton } from '@/components/custom/GlowButton';
import { useCountUp } from '@/hooks/useCountUp';
import { statsData } from '@/lib/mock-data';

function StatCard({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const count = useCountUp({ end: value, duration: 2000, delay: 800 });
  
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-zinc-100">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900" />
      <AnimatedGrid className="opacity-50" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-sm text-purple-400">
              <Zap className="w-4 h-4" />
              Now with Async-First Architecture
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-zinc-100">Control Fabric for</span>
            <br />
            <span className="text-gradient">Agent Systems</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10"
          >
            Deploy, observe, and orchestrate MCP servers at scale. 
            Real-time telemetry. Async-first architecture. Multi-tenant by design.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/registry">
              <GlowButton size="lg" className="w-full sm:w-auto">
                <Box className="w-5 h-5 mr-2" />
                Explore Registry
                <ArrowRight className="w-5 h-5 ml-2" />
              </GlowButton>
            </Link>
            <Link to="/observatory">
              <GlowButton variant="outline" size="lg" className="w-full sm:w-auto">
                <Telescope className="w-5 h-5 mr-2" />
                View Observatory
              </GlowButton>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-zinc-800/50"
          >
            <StatCard value={statsData.totalAgents} label="Active Agents" />
            <StatCard value={statsData.totalMessages} label="Messages/sec" suffix="K" />
            <StatCard value={statsData.activeOperations} label="Active Ops" />
            <StatCard value={statsData.avgLatency} label="Avg Latency" suffix="ms" />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center p-2">
          <motion.div 
            className="w-1.5 h-1.5 rounded-full bg-zinc-500"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
