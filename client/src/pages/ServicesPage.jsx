import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Stethoscope,
  Zap,
  Glasses,
  Sun,
  Smile,
  Baby,
  Heart,
  Scissors,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

const allServices = [
  {
    icon: Sparkles,
    title: 'Teeth Cleaning',
    description:
      'Comprehensive professional periodontal deep cleaning, preventing gum diseases and restoring optimal oral hygiene.',
  },
  {
    icon: Stethoscope,
    title: 'Root Canal',
    description:
      'Advanced endodontic therapy, utilizing precision instruments to restore teeth and eliminate infections.',
  },
  {
    icon: Zap,
    title: 'Implants',
    description:
      'Titanium-fused permanent tooth replacement, delivering natural-beauty and long-term, unmatched resolution.',
  },
  {
    icon: Glasses,
    title: 'Braces',
    description:
      'Orthodontic alignment solutions, choosing from traditional clear aligners and metal braces to correct misalignment and bite patterns.',
  },
  {
    icon: Sun,
    title: 'Whitening',
    description:
      'Professional bleaching treatments producing robust, clinical-grade sparkle for safe, effective, and remarkable aesthetic enhancement.',
  },
  {
    icon: Smile,
    title: 'Smile Designing',
    description:
      'Comprehensive makeovers, visualisation mapping, veneers, crowns, and contouring to achieve facial harmony and symmetry.',
  },
  {
    icon: Baby,
    title: 'Pediatrics',
    description:
      'Gentle dental care for infants, children, and adolescents, focusing on preventive strategies and early developmental assessments.',
  },
  {
    icon: Heart,
    title: 'Gum Treatment',
    description:
      'Periodontal therapies for gum disease, inflammation and bone loss, restoring your gum line and oral health.',
  },
  {
    icon: Scissors,
    title: 'Extraction',
    description:
      'Safe, sterile removal of problematic teeth, including wisdom teeth, utilizing precision instruments and rapid recovery.',
  },
];

const pricingPlans = [
  {
    name: 'Diagnostic Assessment',
    description: 'Comprehensive exam & X-Rays',
    price: '$99',
    features: [
      'Full clinical exam',
      'Comprehensive imaging',
      'Personalized treatment plan',
    ],
    cta: 'Schedule Assessment',
    highlighted: false,
  },
  {
    name: 'Preventative Care',
    description: 'Cleaning & Protection',
    price: '$150',
    features: [
      'Regular & deep cleaning',
      'Professional polishing',
      'Fluoride treatment options',
    ],
    cta: 'Book Cleaning',
    highlighted: true,
  },
  {
    name: 'Restorative Basics',
    description: 'Procedures & repair',
    price: '$200',
    features: [
      'Tooth-colored fillings',
      'Crown preparation',
      'Post-op follow-up included',
    ],
    cta: 'View More',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'Will the procedures be painful?',
    answer:
      'Patient comfort is our paramount concern. We utilize advanced local anesthetics and gentle techniques for virtually painless dental procedures and manage anxiety. For nervous patients, we also offer various sedation options, including nitrous oxide.',
  },
  {
    question: 'What is the timeline for dental implants to settle?',
    answer:
      'Dental implant integration typically takes 3–6 months. During this period, the titanium post fuses with your jawbone through a process called osseointegration. We monitor progress at regular follow-up appointments.',
  },
  {
    question: 'Do you handle dental emergencies?',
    answer:
      'Yes! We provide 24/7 emergency dental services. Call our emergency line at (855) 123-4567 for immediate assistance with dental trauma, severe pain, or any urgent dental needs.',
  },
  {
    question: 'How often should I schedule prophylaxis (cleaning)?',
    answer:
      'We recommend professional cleanings every 6 months for most patients. However, patients with gum disease or specific conditions may need cleanings every 3–4 months. We will determine the ideal schedule during your assessment.',
  },
];

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-60 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-gray-500 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-left">
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Precision Care.
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-lg mb-8">
                Discover a comprehensive range of advanced dental treatments designed to restore health, function, and aesthetics with uncompromising precision and personalized care.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-full font-semibold hover:border-primary hover:text-primary transition-all duration-300 group"
              >
                Explore Treatments
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="animate-fade-in-right">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/images/about-hero.png"
                  alt="Dental treatment room"
                  className="w-full h-[380px] lg:h-[440px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Services */}
      <section className="section-padding bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Disciplines</h2>
          <p className="text-gray-500 max-w-xl leading-relaxed mb-14">
            Evidence-based dentistry delivered in a nurturing environment, with state-of-the-art technology to ensure optimal outcomes for every procedure.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allServices.map((service, index) => (
              <div
                key={service.title}
                className="group bg-white rounded-2xl p-7 transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <service.icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  {service.description}
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:gap-2 transition-all"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing Models
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Clear, upfront estimates for standard procedures. We participate with major insurance providers to enhance your coverage options.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 border transition-all duration-500 hover:shadow-xl hover:-translate-y-2 relative ${
                  plan.highlighted
                    ? 'bg-white border-primary shadow-lg shadow-primary/10'
                    : 'bg-gray-50 border-gray-100 hover:bg-white'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full tracking-wider uppercase">
                    Most Common
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <p className="text-3xl font-bold text-gray-900 mb-6">
                  From {plan.price}
                  <span className="text-sm font-normal text-gray-400">+</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    plan.highlighted
                      ? 'bg-primary text-white hover:bg-primary-dark hover:shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-primary hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Insurance Accepted: We participate with CareShield, Cigna, MetLife, and Aetna. Flexible Financing available via CareCredit.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Clinical Inquiries
          </h2>
          <p className="text-gray-500 text-center mb-14 leading-relaxed">
            Addressing common patient concerns regarding procedures and protocols.
          </p>
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
