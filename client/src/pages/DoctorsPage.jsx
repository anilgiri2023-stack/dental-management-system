import { Link } from 'react-router-dom';
import { ArrowRight, Award, GraduationCap, Clock } from 'lucide-react';

const doctors = [
  {
    name: 'Dr. Sarah Jenkins',
    specialty: 'Cosmetic Dentistry',
    image: '/images/doctor-sarah.png',
    experience: '12 YRS EXP',
    education: 'Columbia University',
    awards: 'Best Cosmetic Dentist 2023',
    description:
      'Specializing in minimally invasive aesthetics, Dr. Jenkins combines artistry with clinical precision to enhance natural smiles.',
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'Oral & Maxillofacial Surgery',
    image: '/images/doctor-michael.png',
    experience: '15 YRS EXP',
    education: 'Harvard School of Dental Medicine',
    awards: 'Fellowship in Oral Surgery',
    description:
      'An expert in complex restorative procedures, Dr. Chen ensures safety and comfort utilizing the latest surgical techniques.',
  },
  {
    name: 'Dr. Emily Thorne',
    specialty: 'Orthodontics',
    image: '/images/doctor-emily.png',
    experience: '8 YRS EXP',
    education: 'University of Pennsylvania',
    awards: 'Invisalign Diamond Provider',
    description:
      'Passionate about alignment and function, Dr. Thorne offers both traditional and discreet modern orthodontic solutions.',
  },
];

export default function DoctorsPage() {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-4 animate-fade-in-up">
            Our Specialists
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-2xl animate-fade-in-up animation-delay-200">
            A curated team of experts dedicated to precision dentistry and
            compassionate patient care. Each clinician brings years of specialized
            training and a commitment to continuing education.
          </p>
        </div>
      </section>

      {/* Doctor Cards */}
      <section className="section-padding bg-gray-50 !pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
            {doctors.map((doctor, index) => (
              <div
                key={doctor.name}
                className={`group bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="grid sm:grid-cols-[200px_1fr] gap-8 items-start">
                  <div className="w-48 h-48 rounded-2xl overflow-hidden ring-4 ring-primary-50 group-hover:ring-primary/20 transition-all mx-auto sm:mx-0">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{doctor.name}</h2>
                    <p className="text-primary font-semibold mb-4">{doctor.specialty}</p>
                    <p className="text-gray-500 leading-relaxed mb-6 max-w-xl">
                      {doctor.description}
                    </p>
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center gap-2 bg-primary-50 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {doctor.experience}
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {doctor.education}
                      </div>
                      <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        <Award className="w-3.5 h-3.5" />
                        {doctor.awards}
                      </div>
                    </div>
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 group/btn"
                    >
                      Book with {doctor.name.split(' ')[1]}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
