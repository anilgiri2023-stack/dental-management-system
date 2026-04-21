import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Jenkins',
    role: 'Regular Patient',
    avatar: '/images/doctor-sarah.png',
    rating: 5,
    text: '"The level of care at Clinical Serenity is unmatched. From the moment I walked in, I felt completely at ease. The results of my veneer procedure exceeded my wildest expectations."',
  },
  {
    name: 'Michael Chang',
    role: 'Referred Patient',
    avatar: '/images/doctor-michael.png',
    rating: 5,
    text: '"I\'ve always had anxiety about dental procedures, but Dr. Kim and the team here are so calming, and the technology they use is clearly state-of-the-art."',
  },
  {
    name: 'Elena Ramirez',
    role: 'New Patient',
    avatar: '/images/doctor-emily.png',
    rating: 5,
    text: '"A truly premium experience. The attention to detail is remarkable, not just in the medical work, but in how they treat you as a person. Highly recommend for anyone seeking perfection."',
  },
];

export default function Testimonials() {
  return (
    <section className="section-padding bg-white" id="testimonials">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Patient Experiences
            </h2>
            <p className="text-gray-500 max-w-xl leading-relaxed">
              Hear directly from those who have entrusted us with their care.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">4.9/5</span>
              <span className="text-sm text-gray-400 ml-1">Average</span>
            </div>
          </div>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => {
            const colors = [
              'bg-primary-50 border-primary/10',
              'bg-amber-50 border-amber-200/30',
              'bg-gray-50 border-gray-100',
            ];
            return (
              <div
                key={testimonial.name}
                className={`group rounded-2xl p-6 border transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${colors[index]}`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200/50">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
