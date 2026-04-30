import { motion } from 'framer-motion';
import { ArrowUpRight, Mail, MapPin, Send } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { developer, socials } from '../../data/portfolio';

function Contact() {
  const onSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    form.reset();
  };

  return (
    <section id="contact" className="section-shell pb-10">
      <SectionHeading
        kicker="Contact"
        title="Have a product worth polishing?"
        copy="Send a short note and I will get back with next steps, availability, and a clean plan for your build."
      />

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.86fr_1.14fr]">
        <motion.aside
          className="glass-panel p-7 md:p-8"
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7 }}
        >
          <h3 className="text-2xl font-semibold text-white">Let us build something elegant.</h3>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            I am open to portfolio websites, dashboards, booking systems, SaaS products, and
            frontend refreshes where details matter.
          </p>

          <div className="mt-8 space-y-4">
            <a
              href={`mailto:${developer.email}`}
              className="flex items-center gap-4 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-zinc-300 transition hover:bg-white/[0.08]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-200/10 text-cyan-100">
                <Mail size={19} />
              </span>
              <span>{developer.email}</span>
            </a>
            <div className="flex items-center gap-4 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-zinc-300">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-200/10 text-amber-100">
                <MapPin size={19} />
              </span>
              <span>{developer.location}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {socials.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-300 transition hover:border-cyan-200/40 hover:text-white"
                >
                  <Icon size={16} />
                  {social.label}
                </a>
              );
            })}
          </div>
        </motion.aside>

        <motion.form
          className="glass-panel p-5 md:p-8"
          onSubmit={onSubmit}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7 }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="field-label">
              Name
              <input className="field-input" type="text" name="name" placeholder="Your name" required />
            </label>
            <label className="field-label">
              Email
              <input className="field-input" type="email" name="email" placeholder="you@example.com" required />
            </label>
          </div>
          <label className="field-label mt-5">
            Message
            <textarea
              className="field-input min-h-44 resize-none"
              name="message"
              placeholder="Tell me about the website or product..."
              required
            />
          </label>
          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold text-black transition hover:bg-cyan-100 sm:w-auto"
          >
            Send Message
            <Send size={17} />
          </button>
          <a
            href="#home"
            className="mt-6 inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-zinc-400 transition hover:text-white sm:ml-4"
          >
            Back to top
            <ArrowUpRight size={16} />
          </a>
        </motion.form>
      </div>
    </section>
  );
}

export default Contact;
