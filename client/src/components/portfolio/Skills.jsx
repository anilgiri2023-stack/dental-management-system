import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading';
import { skillGroups } from '../../data/portfolio';

function CircularSkill({ skill, delay }) {
  const Icon = skill.icon;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (skill.level / 100) * circumference;

  return (
    <motion.div
      className="cursor-target rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-5 text-center transition hover:bg-white/[0.07]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.65, delay }}
    >
      <div className="relative mx-auto grid h-28 w-28 place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#skillGradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.15, delay: delay + 0.15, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="skillGradient" x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#67e8f9" />
              <stop offset="0.52" stopColor="#a7f3d0" />
              <stop offset="1" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
        <Icon className="text-white" size={26} />
      </div>
      <h4 className="mt-4 font-semibold text-white">{skill.label}</h4>
      <p className="mt-1 text-sm text-zinc-500">{skill.level}%</p>
    </motion.div>
  );
}

function Skills() {
  return (
    <section id="skills" className="section-shell">
      <SectionHeading
        kicker="Skills"
        title="A stack tuned for polished product work."
        copy="Frontend craft, backend structure, and the tool fluency needed to take ideas from sketch to release."
      />

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
        {skillGroups.map((group, groupIndex) => {
          const Icon = group.icon;
          return (
            <motion.article
              key={group.title}
              className="glass-panel p-5"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: groupIndex * 0.08 }}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.06] text-cyan-100">
                  <Icon size={21} />
                </div>
                <h3 className="text-xl font-semibold text-white">{group.title}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {group.skills.map((skill, skillIndex) => (
                  <CircularSkill
                    key={skill.label}
                    skill={skill}
                    delay={groupIndex * 0.08 + skillIndex * 0.06}
                  />
                ))}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default Skills;
