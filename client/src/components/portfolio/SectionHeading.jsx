import { motion } from 'framer-motion';

function SectionHeading({ kicker, title, copy }) {
  return (
    <motion.div
      className="mx-auto mb-12 max-w-3xl text-center md:mb-16"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
        {kicker}
      </span>
      <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {copy ? <p className="mt-5 text-base leading-8 text-zinc-400">{copy}</p> : null}
    </motion.div>
  );
}

export default SectionHeading;
