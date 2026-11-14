'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Fades content up as it scrolls into view.
 *
 * Reduced motion is handled in CSS (`[data-reveal]` in globals.css) rather than
 * by rendering a different element: the server cannot know the preference, so
 * branching here left the server-rendered `opacity: 0` in place and the content
 * stayed invisible for visitors who turn animations off.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
