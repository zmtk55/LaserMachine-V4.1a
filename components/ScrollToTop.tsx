import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopProps {
  containerRef?: React.RefObject<HTMLElement>;
  threshold?: number;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ 
  containerRef,
  threshold = 300 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef?.current) {
        setIsVisible(containerRef.current.scrollTop > threshold);
      } else {
        setIsVisible(window.scrollY > threshold);
      }
    };

    const element = containerRef?.current || window;
    element.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => element.removeEventListener('scroll', handleScroll);
  }, [containerRef, threshold]);

  const scrollToTop = () => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 right-6 z-40 w-12 h-12 bg-amber-500 hover:bg-amber-400 text-white rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      title="Volver arriba"
    >
      <ArrowUp size={20} />
    </button>
  );
};

export default ScrollToTop;
