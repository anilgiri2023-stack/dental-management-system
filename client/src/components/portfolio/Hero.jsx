import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Download, Sparkles } from 'lucide-react';
import { developer, techStack, typingWords } from '../../data/portfolio';

function useTyping(words) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex];
    const doneTyping = !deleting && text === current;
    const doneDeleting = deleting && text === '';
    const timeout = window.setTimeout(
      () => {
        if (doneTyping) {
          setDeleting(true);
          return;
        }
        if (doneDeleting) {
          setDeleting(false);
          setWordIndex((index) => (index + 1) % words.length);
          return;
        }
        setText((value) =>
          deleting ? current.slice(0, value.length - 1) : current.slice(0, value.length + 1),
        );
      },
      doneTyping ? 1300 : deleting ? 45 : 85,
    );

    return () => window.clearTimeout(timeout);
  }, [deleting, text, wordIndex, words]);

  return text;
}

function Hero() {
  const typed = useTyping(typingWords);
  const marquee = useMemo(() => [...techStack, ...techStack], []);

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.06fr_0.94fr]">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-zinc-300 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <Sparkles size={16} className="text-amber-200" />
            Available for premium web projects
          </div>

          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] text-white sm:text-6xl md:text-7xl xl:text-8xl">
            {developer.name}
          </h1>

          <div className="mt-6 min-h-12 text-2xl font-medium text-zinc-300 sm:text-3xl">
            <span>{typed}</span>
            <span className="ml-1 inline-block h-8 w-[2px] translate-y-1 bg-cyan-200 animate-caret" />
          </div>

          <p className="mt-7 max-w-2xl text-lg leading-9 text-zinc-400">
            {developer.intro}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#projects"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(255,255,255,0.12)] transition hover:bg-cyan-100"
            >
              View Projects
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/12 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white backdrop-blur-xl transition hover:border-cyan-200/50 hover:bg-cyan-200/10"
            >
              Contact Me
              <Download size={18} />
            </a>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-3">
            {developer.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
              >
                <strong className="block text-2xl font-semibold text-white">{metric.value}</strong>
                <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="cursor-target relative mx-auto aspect-square w-full max-w-[34rem]"
          initial={{ opacity: 0, scale: 0.92, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,rgba(103,232,249,0.42),rgba(251,191,36,0.28),rgba(251,113,133,0.34),rgba(103,232,249,0.42))] blur-3xl" />
          <motion.div
            className="absolute inset-8 rounded-[2rem] border border-white/10 bg-zinc-950/60 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-300" />
              <span className="ml-auto text-xs text-zinc-500">portfolio.jsx</span>
            </div>
            <div className="space-y-4 pt-6 font-mono text-sm text-zinc-300">
              <p><span className="text-cyan-200">const</span> craft = &#123;</p>
              <p className="pl-5"><span className="text-rose-200">design</span>: 'premium',</p>
              <p className="pl-5"><span className="text-amber-200">motion</span>: 'smooth',</p>
              <p className="pl-5"><span className="text-emerald-200">code</span>: 'clean',</p>
              <p>&#125;;</p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {['UI Systems', 'APIs', 'Dashboards', 'Deploys'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{item}</span>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-cyan-200"
                      initial={{ width: 0 }}
                      animate={{ width: '78%' }}
                      transition={{ duration: 1.4, delay: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-xs uppercase tracking-[0.24em] text-zinc-500 md:flex">
        <ArrowDown size={16} />
        Scroll
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-y border-white/10 bg-black/25 py-4 backdrop-blur-xl">
        <motion.div
          className="flex gap-8 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        >
          {marquee.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
