import { motion } from 'framer-motion';

function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#050505]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: '-8%' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          className="h-24 w-24 rounded-full border border-white/10 border-t-cyan-200"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-6 h-12 w-12 rounded-full bg-cyan-200/10 blur-xl"
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.3, repeat: Infinity }}
        />
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.42em] text-zinc-400">
          Loading
        </p>
      </div>
    </motion.div>
  );
}

export default LoadingScreen;
