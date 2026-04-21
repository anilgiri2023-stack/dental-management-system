import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Star, MessageSquare, CalendarPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Hero() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="relative min-h-screen bg-white overflow-hidden pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-left">
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Premium Dental Care
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Your Smile,
              <br />
              <span className="text-gray-800">Our Priority.</span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed max-w-lg mb-10">
              Experience advanced dentistry in a calming, luxurious environment.
              We blend medical precision with unparalleled comfort to redefine
              your dental journey.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                to={isAuthenticated ? "/contact" : "/login"}
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 group"
              >
                Book Appointment
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:+18551234567"
                className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 px-6 py-3.5 rounded-full font-semibold hover:border-primary hover:text-primary transition-all duration-300"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            </div>

            {/* Emergency Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-lg">🏥</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">24/7 Emergency Care</p>
                <p className="text-xs text-gray-500">Call (855) 123-4567 immediately</p>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative animate-fade-in-right">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/images/hero-dental.png"
                alt="Modern dental care at Clinical Serenity"
                className="w-full h-[480px] lg:h-[540px] object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>

            {/* Floating Review Card */}
            <div className="absolute -bottom-6 left-6 right-6 sm:left-10 sm:right-auto sm:w-72 glass-card rounded-2xl p-4 shadow-xl animate-slide-in animation-delay-600">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-sm font-bold text-gray-800 ml-2">4.9/5</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                "The most relaxing dental experience I've ever had."
              </p>
            </div>

            {/* Floating Chat Icon */}
            <div className="absolute bottom-4 right-4 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow cursor-pointer hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>

            {/* Floating Calendar Icon */}
            <div className="absolute top-6 right-6 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg animate-float cursor-pointer hover:scale-110 transition-transform">
              <CalendarPlus className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
