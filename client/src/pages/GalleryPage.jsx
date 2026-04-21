import { Link } from 'react-router-dom';
import { ArrowRight, Send, MessageSquare, Star } from 'lucide-react';
import { useState } from 'react';
import Testimonials from '../components/Testimonials';

const galleryImages = [
  { src: '/images/hero-dental.png', alt: 'Clinical outcome - smile transformation' },
  { src: '/images/gallery-hero.png', alt: 'Clinical outcome - profile view' },
  { src: '/images/about-hero.png', alt: 'Clinical outcome - teeth alignment' },
];

export default function GalleryPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Quick form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', phone: '' });
  };

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-left">
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Transformations &
                <br />
                <span className="gradient-text">Patient Stories</span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
                Witness the clinical precision and aesthetic care that defines Clinical
                Serenity. Real results, real patients, and unparalleled serenity in every
                procedure.
              </p>
            </div>
            <div className="animate-fade-in-right">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/images/gallery-hero.png"
                  alt="Clinical Serenity dental professional"
                  className="w-full h-[380px] lg:h-[440px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Clinical Outcomes</h2>
          <p className="text-gray-500 max-w-xl leading-relaxed mb-14">
            A curated selection of our before and after transformations.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {index === galleryImages.length - 1 && (
                  <div className="absolute top-4 right-4 w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="section-padding bg-primary-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready for your transformation?
          </h2>
          <p className="text-gray-500 leading-relaxed mb-10">
            Begin your journey to a serene, confident smile today. Schedule your comprehensive consultation.
          </p>

          {submitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium animate-fade-in-up max-w-md mx-auto">
              ✓ We'll be in touch shortly!
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-stretch gap-4 max-w-xl mx-auto bg-white rounded-2xl p-3 shadow-lg border border-gray-100"
          >
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 text-left px-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 text-left px-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 000-0000"
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-300"
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 self-end whitespace-nowrap"
            >
              Book Today
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
