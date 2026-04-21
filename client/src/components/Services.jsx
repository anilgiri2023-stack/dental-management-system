import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Stethoscope, Zap } from 'lucide-react';

const services = [
  {
    icon: Sparkles,
    title: 'Professional Cleaning',
    description:
      'Advanced ultrasonic scaling and polishing to maintain optimal oral health and prevent future complications.',
  },
  {
    icon: Stethoscope,
    title: 'Root Canal Therapy',
    description:
      'Painless endodontic treatment utilizing microscopic precision to save damaged teeth effectively.',
  },
  {
    icon: Zap,
    title: 'Dental Implants',
    description:
      'Permanent, natural-looking restorations engineered to seamlessly integrate with your jawbone.',
  },
];

export default function Services() {
  return (
    <section className="section-padding bg-white" id="services">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Precision Treatments
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <p className="text-gray-500 max-w-xl leading-relaxed">
              Comprehensive care tailored to your unique smile, utilizing state-of-the-art
              technology and evidence-based practices.
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:gap-2 transition-all group shrink-0"
            >
              View All Services
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={`group bg-gray-50 hover:bg-white rounded-2xl p-8 transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-2 border border-transparent hover:border-gray-100 animate-fade-in-up animation-delay-${(index + 1) * 200}`}
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <service.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                {service.description}
              </p>
              <Link
                to="/services"
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
  );
}
