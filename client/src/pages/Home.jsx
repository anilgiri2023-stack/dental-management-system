import Hero from '../components/Hero';
import Services from '../components/Services';
import Doctors from '../components/Doctors';
import Testimonials from '../components/Testimonials';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';

export default function Home() {
  return (
    <main>
      <Hero />
      <Services />
      <Doctors />
      <Gallery />
      <Testimonials />
      <Contact />
    </main>
  );
}
