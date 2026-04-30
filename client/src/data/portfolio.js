import {
  Braces,
  Code2,
  Database,
  GitBranch,
  Globe2,
  Layers3,
  Network,
  Mail,
  PenTool,
  Rocket,
  Server,
  Terminal,
  Wrench,
} from 'lucide-react';

export const developer = {
  name: 'Aarav Mehta',
  role: 'Full Stack Developer',
  location: 'India',
  email: 'hello@aarav.dev',
  github: 'https://github.com',
  linkedin: 'https://linkedin.com',
  intro:
    'I build refined web products with fast interfaces, thoughtful interactions, and reliable full-stack architecture.',
  metrics: [
    { value: '4+', label: 'Years building' },
    { value: '32', label: 'Projects shipped' },
    { value: '12', label: 'Happy clients' },
  ],
};

export const navItems = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
];

export const typingWords = [
  'Full Stack Developer',
  'React Specialist',
  'Product-minded Engineer',
  'Clean UI Builder',
];

export const techStack = [
  'React',
  'Vite',
  'Node.js',
  'Express',
  'MongoDB',
  'PostgreSQL',
  'Tailwind CSS',
  'Framer Motion',
  'Supabase',
  'REST APIs',
];

export const strengths = [
  {
    title: 'Product Engineering',
    body: 'I turn vague product ideas into crisp interfaces, user flows, and production-ready React systems.',
    icon: Rocket,
    progress: 94,
  },
  {
    title: 'Frontend Craft',
    body: 'Micro-interactions, responsive layouts, accessible components, and performance-first UI decisions.',
    icon: Layers3,
    progress: 96,
  },
  {
    title: 'Backend Systems',
    body: 'Clean API contracts, authentication flows, data modeling, and deployment-friendly architecture.',
    icon: Server,
    progress: 88,
  },
];

export const projects = [
  {
    title: 'Nexus CRM',
    description: 'A polished analytics CRM with live pipeline tracking, team activity, and revenue forecasting.',
    tech: ['React', 'Node.js', 'MongoDB'],
    accent: '#67e8f9',
    github: 'https://github.com',
    live: 'https://example.com',
    variant: 'dashboard',
  },
  {
    title: 'Finora Banking',
    description: 'Secure fintech dashboard for transfers, expense intelligence, and account-level insights.',
    tech: ['React', 'Express', 'PostgreSQL'],
    accent: '#fbbf24',
    github: 'https://github.com',
    live: 'https://example.com',
    variant: 'finance',
  },
  {
    title: 'Craft Commerce',
    description: 'Premium e-commerce storefront with fast browsing, cart flows, and elegant admin controls.',
    tech: ['Vite', 'Tailwind', 'Supabase'],
    accent: '#fb7185',
    github: 'https://github.com',
    live: 'https://example.com',
    variant: 'commerce',
  },
];

export const timeline = [
  {
    period: '2025 - Present',
    title: 'Frontend Engineer',
    company: 'Independent Studio',
    body: 'Designing and shipping modern React experiences for founders, clinics, SaaS tools, and creator brands.',
  },
  {
    period: '2023 - 2025',
    title: 'Full Stack Developer',
    company: 'Product Lab',
    body: 'Built dashboards, booking systems, auth flows, REST APIs, and reusable UI systems across client products.',
  },
  {
    period: '2020 - 2023',
    title: 'Computer Science',
    company: 'Engineering Program',
    body: 'Focused on web engineering, databases, system design, and practical product development.',
  },
];

export const skillGroups = [
  {
    title: 'Frontend',
    icon: Code2,
    skills: [
      { label: 'React', icon: Braces, level: 96 },
      { label: 'Tailwind', icon: Layers3, level: 94 },
      { label: 'Motion UI', icon: Globe2, level: 90 },
    ],
  },
  {
    title: 'Backend',
    icon: Database,
    skills: [
      { label: 'Node.js', icon: Server, level: 90 },
      { label: 'MongoDB', icon: Database, level: 86 },
      { label: 'APIs', icon: Terminal, level: 92 },
    ],
  },
  {
    title: 'Tools',
    icon: Wrench,
    skills: [
      { label: 'GitHub', icon: GitBranch, level: 91 },
      { label: 'Figma', icon: PenTool, level: 84 },
      { label: 'Deployments', icon: Rocket, level: 88 },
    ],
  },
];

export const socials = [
  { label: 'GitHub', href: developer.github, icon: GitBranch },
  { label: 'LinkedIn', href: developer.linkedin, icon: Network },
  { label: 'Email', href: `mailto:${developer.email}`, icon: Mail },
];
