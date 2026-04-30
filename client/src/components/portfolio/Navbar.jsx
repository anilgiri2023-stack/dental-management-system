import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { navItems } from '../../data/portfolio';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6"
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between rounded-full border px-4 py-3 transition-all duration-300 ${
          scrolled
            ? 'border-white/10 bg-black/45 shadow-2xl shadow-black/30 backdrop-blur-2xl'
            : 'border-white/5 bg-white/[0.03] backdrop-blur-md'
        }`}
      >
        <a href="#home" className="group flex items-center gap-3" onClick={close}>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-bold text-white shadow-lg shadow-cyan-950/30">
            AM
          </span>
          <span className="hidden text-sm font-semibold uppercase tracking-[0.26em] text-white sm:block">
            Portfolio
          </span>
        </a>

        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-100 md:flex"
        >
          Hire Me
          <ArrowUpRight size={16} />
        </a>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </nav>

      {open ? (
        <motion.div
          className="mx-auto mt-3 max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-black/80 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl md:hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={close}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
            >
              {item.label}
            </a>
          ))}
        </motion.div>
      ) : null}
    </motion.header>
  );
}

export default Navbar;
