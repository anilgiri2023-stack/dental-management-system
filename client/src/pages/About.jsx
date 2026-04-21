import { Link } from 'react-router-dom';
import { ArrowRight, Award, MapPin, Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import Doctors from '../components/Doctors';

const accreditations = [
  'American Dental Assoc.',
  'Global Health Board',
  'Invisalign Platinum',
  'Aesthetic Academy',
];

export default function About() {
  return (
    <main className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="animate-fade-in-left">
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Redefining
                <br />
                <span className="gradient-text">Dental Care</span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-lg mb-8">
                At Clinical Serenity, we believe that healthcare should not evoke anxiety. We have crafted an environment of breathtaking precision, blending advanced medical technology with the calming atmosphere of a wellness retreat. Your comfort is our clinical standard.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-full font-semibold hover:border-primary hover:text-primary transition-all duration-300 group"
              >
                Our Philosophy
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right: Image */}
            <div className="relative animate-fade-in-right">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/images/about-hero.png"
                  alt="Clinical Serenity dental treatment room"
                  className="w-full h-[400px] lg:h-[480px] object-cover"
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-4 left-8 glass-card rounded-2xl px-6 py-3 shadow-xl flex items-center gap-3 animate-slide-in animation-delay-400">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Excellence in Care</p>
                  <p className="text-xs text-gray-500">Over 15 years of trust</p>
                </div>
              </div>
              {/* Floating Chat */}
              <div className="absolute bottom-4 right-4 w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <Doctors />

      {/* Accreditations */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-bold text-gray-400 tracking-[0.25em] uppercase mb-10">
            Accreditations & Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {accreditations.map((name) => (
              <div
                key={name}
                className="text-gray-300 font-semibold text-sm sm:text-base hover:text-primary transition-colors cursor-default"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Map Section */}
      <section className="section-padding bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-10">Visit Our Sanctuary</h2>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-primary rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">123 Serenity Boulevard</p>
                  <p className="text-sm text-gray-500">
                    Suite 400, Medical District<br />Seattle, WA 98101
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-primary rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Clinic Hours</p>
                  <p className="text-sm text-gray-500">
                    Mon – Fri: 8:00 AM – 8:00 PM<br />
                    Saturday: 9:00 AM – 2:00 PM
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-primary rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Contact</p>
                  <p className="text-sm text-gray-500">
                    +1 (855) 123-4567<br />
                    hello@clinicalserenity.com
                  </p>
                </div>
              </div>
            </div>
            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 h-64 lg:h-auto">
              <iframe
                title="Clinical Serenity Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2689.2834!2d-122.3321!3d47.6062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDfCsDM2JzIyLjMiTiAxMjLCsDE5JzU1LjYiVw!5e0!3m2!1sen!2sus!4v1600000000000!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
