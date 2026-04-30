import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import About from './components/portfolio/About';
import AnimatedBackground from './components/portfolio/AnimatedBackground';
import Contact from './components/portfolio/Contact';
import CustomCursor from './components/portfolio/CustomCursor';
import Footer from './components/portfolio/Footer';
import Hero from './components/portfolio/Hero';
import LoadingScreen from './components/portfolio/LoadingScreen';
import Navbar from './components/portfolio/Navbar';
import Projects from './components/portfolio/Projects';
import Skills from './components/portfolio/Skills';
import Timeline from './components/portfolio/Timeline';

function App() {
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('portfolio-loaded'));

  useEffect(() => {
    if (!loading) return undefined;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem('portfolio-loaded', 'true');
      setLoading(false);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [loading]);

  return (
    <>
      <AnimatePresence>{loading ? <LoadingScreen /> : null}</AnimatePresence>
      <AnimatedBackground />
      <CustomCursor />
      <Navbar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: loading ? 0.25 : 0 }}
      >
        <Hero />
        <About />
        <Projects />
        <Timeline />
        <Skills />
        <Contact />
      </motion.main>
      <Footer />
    </>
  );
}

export default App;
