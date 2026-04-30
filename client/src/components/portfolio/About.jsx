import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading';
import { strengths, techStack } from '../../data/portfolio';

function About() {
  return (
    <section id="about" className="section-shell">
      <SectionHeading
        kicker="About Me"
        title="Classic taste, modern engineering."
        copy="I care about the feeling of a product as much as the code behind it. Every detail should make the interface easier, faster, and more memorable."
      />

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div
          className="glass-panel p-6 md:p-8"
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-lg leading-9 text-zinc-300">
            I am a developer who blends frontend polish with practical backend thinking. My work
            focuses on React interfaces, clean component systems, API-driven products, and
            responsive experiences that feel calm even when the product is complex.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-zinc-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-4">
          {strengths.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                className="glass-panel p-6"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.65, delay: index * 0.08 }}
              >
                <div className="flex items-start gap-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-cyan-200/10 text-cyan-100">
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <span className="text-sm text-zinc-500">{item.progress}%</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">{item.body}</p>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-emerald-200 to-amber-200"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, delay: 0.25 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default About;
