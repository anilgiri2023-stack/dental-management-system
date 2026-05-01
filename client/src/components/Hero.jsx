import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Star, MessageSquare, CalendarPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Hero() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="relative min-h-[90vh] flex items-center pt-6 lg:pt-12 overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 items-center gap-12 py-12">
        
        {/* Left Content */}
        <div className="animate-fade-in-left z-10">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 text-teal-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            Premium Dental Care
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Your Smile,
            <br />
            <span className="text-teal-500">Our Priority.</span>
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed max-w-lg mb-10">
            Experience advanced dentistry in a calming, luxurious environment.
            We blend medical precision with unparalleled comfort to redefine
            your dental journey.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-10">
            <Link
              to={isAuthenticated ? "/appointments" : "/login"}
              className="inline-flex items-center gap-2 bg-teal-500 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-teal-600 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/25 hover:-translate-y-0.5 group"
            >
              Book Appointment
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="tel:+18551234567"
              className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 px-6 py-3.5 rounded-full font-semibold hover:border-teal-500 hover:text-teal-500 transition-all duration-300"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          </div>

          {/* Emergency Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <span className="text-xl">🏥</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">24/7 Emergency Care</p>
              <p className="text-xs text-gray-500">Call (855) 123-4567 immediately</p>
            </div>
          </div>
        </div>

        {/* Right: Modern Image Layout */}
        <div className="relative animate-fade-in-right">
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white">
            <img
              src="/images/hero-dental.png"
              alt="Modern dental care"
              className="w-full h-[500px] lg:h-[600px] object-cover"
            />
            {/* Soft Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Floating Review Card */}
          <div className="absolute -bottom-6 -left-6 w-72 bg-white rounded-2xl p-6 shadow-xl border border-gray-50">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-teal-400 text-teal-400" />
              ))}
              <span className="text-sm font-bold text-gray-800 ml-2">4.9/5</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed italic mb-4">
              "The most relaxing dental experience I've ever had."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-[10px] font-bold text-white">JS</div>
              <div>
                <p className="text-xs font-bold text-gray-800">Jessica Smith</p>
                <p className="text-[10px] text-gray-400">Verified Patient</p>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/2 -right-12 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl animate-float" />
        </div>
      </div>
    </section>
  );
}
