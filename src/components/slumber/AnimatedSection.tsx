
'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  icon?: React.ElementType; // Keep for potential future use if titles move inside
  title?: string; // Keep for potential future use
  delay?: string;
  id?: string;
  tag?: keyof JSX.IntrinsicElements; // Allow specifying the wrapper tag
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className,
  delay = '0ms',
  id,
  tag = 'section',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const Component = tag;

  return (
    <Component
      ref={sectionRef}
      id={id}
      className={cn(
        'w-full transition-all duration-700 ease-out transform opacity-0 translate-y-10 scale-90',
        isVisible && 'opacity-100 translate-y-0 scale-100',
        className
      )}
      style={{ transitionDelay: isVisible ? delay : '0ms' }}
    >
      {children}
    </Component>
  );
};

export default AnimatedSection;
