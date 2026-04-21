import { MessageSquare } from 'lucide-react';

const galleryImages = [
  {
    src: '/images/hero-dental.png',
    alt: 'Before and after smile transformation 1',
  },
  {
    src: '/images/gallery-hero.png',
    alt: 'Patient profile transformation',
  },
  {
    src: '/images/about-hero.png',
    alt: 'Before and after smile transformation 2',
  },
];

export default function Gallery() {
  return (
    <section className="section-padding bg-gray-50" id="gallery">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Clinical Outcomes
          </h2>
          <p className="text-gray-500 max-w-xl leading-relaxed">
            A curated selection of our before and after transformations.
          </p>
        </div>

        {/* Gallery Grid */}
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
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Chat bubble on last image */}
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
  );
}
