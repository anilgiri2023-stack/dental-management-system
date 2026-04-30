import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading';
import { timeline } from '../../data/portfolio';

function Timeline() {
  return (
    <section id="experience" className="section-shell">
      <SectionHeading
        kicker="Experience"
        title="A focused path through product, code, and craft."
      />

      <div className="mx-auto max-w-4xl">
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-cyan-200/0 via-cyan-200/50 to-cyan-200/0 md:left-1/2" />
          {timeline.map((item, index) => (
            <motion.article
              key={`${item.period}-${item.title}`}
              className={`relative mb-8 grid gap-6 md:grid-cols-2 ${
                index % 2 === 0 ? '' : 'md:[&>div:first-child]:col-start-2'
              }`}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7 }}
            >
              <span className="absolute left-4 top-8 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_24px_rgba(103,232,249,0.8)] md:left-1/2" />
              <div className="glass-panel ml-10 p-6 md:ml-0">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                  {item.period}
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-cyan-100/80">{item.company}</p>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{item.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Timeline;
