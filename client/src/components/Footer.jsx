import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Phone, Mail, Clock, ArrowUp } from 'lucide-react';
import Logo from './Logo';

const quickLinks = [
  { name: 'Home', path: '/' },
  { name: 'About Clinic', path: '/about' },
  { name: 'Our Doctors', path: '/doctors' },
  { name: 'Services', path: '/services' },
  { name: 'Gallery', path: '/gallery' },
];

const clinicTimings = [
  { day: 'Mon - Fri', time: '8:00 AM - 7:00 PM' },
  { day: 'Saturday', time: '9:00 AM - 5:00 PM' },
  { day: 'Sunday', time: 'Emergency Only' },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-gray-300 relative">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary-light to-primary" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-5">
              <Logo lightText={true} />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Redefining dental care with precision, comfort, and a commitment to your lasting well-being.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-widest uppercase mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 hover:text-primary-light transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinic Timings */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-widest uppercase mb-5">
              Clinic Timings
            </h4>
            <ul className="space-y-3">
              {clinicTimings.map((item) => (
                <li key={item.day} className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary-light mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gray-300">{item.day}:</span>{' '}
                    <span className="text-gray-400">{item.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-widest uppercase mb-5">
              Contact Info
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary-light mt-0.5 shrink-0" />
                <span className="text-gray-400">
                  123 Serenity Way, Medical District, Suite 400
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary-light shrink-0" />
                <a href="tel:+18551234567" className="text-gray-400 hover:text-primary-light transition-colors">
                  +1 (855) 123-4567
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary-light shrink-0" />
                <a href="mailto:care@clinicalserenity.com" className="text-gray-400 hover:text-primary-light transition-colors">
                  care@clinicalserenity.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Clinical Serenity Dental. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm text-gray-500 hover:text-primary-light transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-500 hover:text-primary-light transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className="absolute right-6 bottom-6 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition-all duration-300 hover:-translate-y-1 shadow-lg"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
