import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const doctors = [
  {
    name: 'Dr. Sarah Jenkins',
    specialty: 'Cosmetic Dentistry',
    image: '/images/doctor-sarah.png',
    experience: '12 YRS EXP',
    description:
      'Specializing in minimally invasive aesthetics, Dr. Jenkins combines artistry with clinical precision to enhance natural smiles.',
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'Oral & Maxillofacial Surgery',
    image: '/images/doctor-michael.png',
    experience: '15 YRS EXP',
    description:
      'An expert in complex restorative procedures, Dr. Chen ensures safety and comfort utilizing the latest surgical techniques.',
  },
  {
    name: 'Dr. Emily Thorne',
    specialty: 'Orthodontics',
    image: '/images/doctor-emily.png',
    experience: '8 YRS EXP',
    description:
      'Passionate about alignment and function, Dr. Thorne offers both traditional and discreet modern orthodontic solutions.',
  },
];

export default function Doctors() {
  return (
    <section className="section-padding bg-gray-50" id="doctors">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Meet Our Specialists
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <p className="text-gray-500 max-w-xl leading-relaxed">
              A curated team of experts dedicated to precision dentistry and
              compassionate patient care.
            </p>
            <Link
              to="/doctors"
              className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:gap-2 transition-all group shrink-0"
            >
              View All Doctors
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Doctor Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {doctors.map((doctor, index) => (
            <div
              key={doctor.name}
              className="group bg-white rounded-2xl p-6 transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-2 border border-gray-100"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden mb-5 ring-4 ring-primary-50 group-hover:ring-primary/20 transition-all mx-auto sm:mx-0">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{doctor.name}</h3>
              <p className="text-primary text-sm font-medium mb-3">{doctor.specialty}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                {doctor.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 tracking-wider">
                  {doctor.experience}
                </span>
                <Link
                  to="/doctors"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View Full Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
