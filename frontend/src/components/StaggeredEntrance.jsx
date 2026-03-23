'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * StaggeredEntrance - A premium container that animates its children 
 * into view one by one with a precise easing curve.
 */
export default function StaggeredEntrance({ children, className = '' }) {
  const [mounted, setMounted] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      requestAnimationFrame(() => {
        setMounted(true);
        hasAnimated.current = true;
      });
    }
  }, []);

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const style = mounted ? {
          opacity: 0,
          animation: `enter 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
          animationDelay: `${index * 25}ms`
        } : { opacity: 0 };

        return React.cloneElement(child, {
          style: {
            ...child.props.style,
            ...style
          }
        });
      })}
    </div>
  );
}
