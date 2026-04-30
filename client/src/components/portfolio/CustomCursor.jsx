import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

function CustomCursor() {
  const [enabled] = useState(() =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  );
  const [hovering, setHovering] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 500, damping: 36 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 36 });

  useEffect(() => {
    if (!enabled) return undefined;

    const move = (event) => {
      cursorX.set(event.clientX - 16);
      cursorY.set(event.clientY - 16);
    };
    const enter = (event) => {
      if (event.target.closest('a, button, input, textarea, .cursor-target')) {
        setHovering(true);
      }
    };
    const leave = (event) => {
      if (event.target.closest('a, button, input, textarea, .cursor-target')) {
        setHovering(false);
      }
    };

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseover', enter);
    document.addEventListener('mouseout', leave);

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', enter);
      document.removeEventListener('mouseout', leave);
    };
  }, [cursorX, cursorY, enabled]);

  if (!enabled) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[80] hidden h-8 w-8 rounded-full border border-cyan-200/70 mix-blend-screen md:block"
      style={{ x: springX, y: springY }}
      animate={{
        scale: hovering ? 2.2 : 1,
        backgroundColor: hovering ? 'rgba(103, 232, 249, 0.12)' : 'rgba(255,255,255,0)',
      }}
      transition={{ duration: 0.18 }}
    />
  );
}

export default CustomCursor;
