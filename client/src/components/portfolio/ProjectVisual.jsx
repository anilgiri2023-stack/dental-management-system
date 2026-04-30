import { motion } from 'framer-motion';

function ProjectVisual({ variant, accent }) {
  const bars = variant === 'finance' ? [72, 44, 86, 60, 68] : [46, 78, 55, 88, 64];
  const cards = variant === 'commerce' ? ['Shop', 'Cart', 'Pay'] : ['Users', 'Sales', 'Growth'];

  return (
    <div className="relative h-56 overflow-hidden rounded-[1.35rem] border border-white/10 bg-zinc-950/70 p-4">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `radial-gradient(circle at 30% 15%, ${accent}, transparent 30%), radial-gradient(circle at 85% 70%, rgba(255,255,255,0.22), transparent 28%)`,
        }}
      />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-300" />
          <span className="ml-auto h-6 w-24 rounded-full bg-white/10" />
        </div>
        <div className="grid flex-1 grid-cols-[0.72fr_1fr] gap-4">
          <div className="space-y-3">
            {cards.map((card, index) => (
              <motion.div
                key={card}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="h-2 w-12 rounded-full bg-white/20" />
                <div className="mt-3 h-5 w-16 rounded-full" style={{ backgroundColor: accent }} />
              </motion.div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="mb-5 flex items-end gap-2">
              {bars.map((height, index) => (
                <motion.span
                  key={`${height}-${index}`}
                  className="flex-1 rounded-t-full bg-white/20"
                  style={{ backgroundColor: index % 2 ? 'rgba(255,255,255,0.18)' : accent }}
                  initial={{ height: 12 }}
                  whileInView={{ height }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.75, delay: index * 0.08 }}
                />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-white/15" />
              <div className="h-2 w-2/3 rounded-full bg-white/10" />
              <div className="h-2 w-4/5 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectVisual;
