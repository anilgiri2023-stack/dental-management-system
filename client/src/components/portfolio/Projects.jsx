import { motion } from 'framer-motion';
import { ArrowUpRight, GitBranch } from 'lucide-react';
import SectionHeading from './SectionHeading';
import ProjectVisual from './ProjectVisual';
import { projects } from '../../data/portfolio';

function Projects() {
  return (
    <section id="projects" className="section-shell">
      <SectionHeading
        kicker="Selected Work"
        title="Interfaces built to look sharp and work hard."
        copy="Each project pairs premium visual design with practical architecture, fast interaction, and responsive behavior."
      />

      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <motion.article
            key={project.title}
            className="group glass-panel overflow-hidden p-3"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, delay: index * 0.08 }}
            whileHover={{ y: -10, scale: 1.015 }}
          >
            <ProjectVisual variant={project.variant} accent={project.accent} />
            <div className="p-4">
              <h3 className="text-2xl font-semibold text-white">{project.title}</h3>
              <p className="mt-3 min-h-20 text-sm leading-7 text-zinc-400">{project.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-zinc-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <a
                  href={project.live}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-100"
                >
                  Live Demo
                  <ArrowUpRight size={16} />
                </a>
                <a
                  href={project.github}
                  className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white transition hover:border-white/30 hover:bg-white/10"
                  aria-label={`${project.title} GitHub`}
                >
                  <GitBranch size={18} />
                </a>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

export default Projects;
