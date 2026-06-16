import React from 'react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  use3D?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function GlassCard({ children, className = '', delay = 0, onClick, use3D = true }: GlassCardProps) {
  const content = (
    <motion.div
      custom={delay}
      initial="hidden"
      animate="visible"
      whileHover={onClick ? {
        y: -4,
        scale: 1.02,
        boxShadow: "0 0 20px rgba(0, 122, 255, 0.2)",
        borderColor: "rgba(0, 122, 255, 0.3)"
      } : undefined}
      onClick={onClick}
      className={`glass-panel rounded-2xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={use3D ? { transformStyle: 'preserve-3d' } : undefined}
    >
      {use3D ? (
        <div style={{ transform: 'translateZ(20px)' }}>
          {children}
        </div>
      ) : children}
    </motion.div>
  );

  if (use3D) {
    return (
      <Tilt
        tiltMaxAngleX={5}
        tiltMaxAngleY={5}
        glareEnable={true}
        glareMaxOpacity={0.15}
        glareColor="#ffffff"
        glarePosition="all"
        transitionSpeed={2000}
        tiltReverse={true}
        className="h-full w-full"
      >
        {content}
      </Tilt>
    );
  }

  return content;
}
