import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const { user, isAuthenticated, authFetch } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    date: '',
    time: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isAuthenticated) {
        throw new Error('You must be logged in to book an appointment.');
      }

      await authFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          date: formData.date,
          time: formData.time || '10:00 AM',
          service: formData.service,
          notes: formData.message,
        }),
      });

      // Success — show message and reset form
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      setFormData({ name: '', phone: '', email: '', service: '', date: '', time: '', message: '' });
    } catch (err) {
      console.error('Appointment booking error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-padding bg-white" id="contact">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Contact Info */}
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Visit Our Sanctuary
            </h2>
            <p className="text-gray-500 leading-relaxed mb-10 max-w-md">
              We're here to help you achieve the smile of your dreams. Reach out to us today.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Our Location</p>
                  <p className="text-gray-500 text-sm">
                    123 Serenity Boulevard<br />
                    Suite 400, Medical District<br />
                    Seattle, WA 98101
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Clinic Hours</p>
                  <p className="text-gray-500 text-sm">
                    Mon – Fri: 8:00 AM – 8:00 PM<br />
                    Saturday: 9:00 AM – 2:00 PM
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Contact</p>
                  <p className="text-gray-500 text-sm">
                    +1 (855) 123-4567<br />
                    <a href="mailto:care@clinicalserenity.com" className="hover:text-primary transition-colors">
                      care@clinicalserenity.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="mt-10 rounded-2xl overflow-hidden border border-gray-200 h-56">
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

          {/* Right: Appointment Form */}
          <div>
            <div className="bg-gray-50 rounded-3xl p-8 lg:p-10 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Book an Appointment
              </h3>
              <p className="text-gray-500 text-sm mb-8">
                Begin your journey to a serene, confident smile today.
              </p>

              {submitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium animate-fade-in-up">
                  ✓ Your appointment request has been submitted successfully!
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(555) 000-0000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Service
                    </label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-500"
                    >
                      <option value="">Select a service</option>
                      <option value="cleaning">Professional Cleaning</option>
                      <option value="rootcanal">Root Canal Therapy</option>
                      <option value="implants">Dental Implants</option>
                      <option value="braces">Braces / Orthodontics</option>
                      <option value="whitening">Teeth Whitening</option>
                      <option value="cosmetic">Cosmetic Dentistry</option>
                      <option value="extraction">Tooth Extraction</option>
                      <option value="pediatric">Pediatric Dentistry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                    Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your concerns..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-gray-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      Book Today
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
