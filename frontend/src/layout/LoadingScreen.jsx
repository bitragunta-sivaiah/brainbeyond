// src/components/LoadingScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Your custom BrandLogo component with a new 'animate' prop
const BrandLogo = ({ pathAnimationControls }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="h-20 w-20 text-primary transition-colors duration-300"
    fill="currentColor"
  >
    <title>Brain Beyond</title>
    <motion.path
      d="M21.809 5.524L12.806.179l-.013-.007.078-.045h-.166a1.282 1.282 0 0 0-1.196.043l-.699.403-8.604 4.954a1.285 1.285 0 0 0-.644 1.113v10.718c0 .46.245.884.644 1.113l9.304 5.357c.402.232.898.228 1.297-.009l9.002-5.345c.39-.231.629-.651.629-1.105V6.628c0-.453-.239-.873-.629-1.104zm-19.282.559L11.843.719a.642.642 0 0 1 .636.012l9.002 5.345a.638.638 0 0 1 .207.203l-4.543 2.555-4.498-2.7a.963.963 0 0 0-.968-.014L6.83 8.848 2.287 6.329a.644.644 0 0 1 .24-.246zm14.13 8.293l-4.496-2.492V6.641a.32.32 0 0 1 .155.045l4.341 2.605v5.085zm-4.763-1.906l4.692 2.601-4.431 2.659-4.648-2.615a.317.317 0 0 1-.115-.112l4.502-2.533zm-.064 10.802l-9.304-5.357a.643.643 0 0 1-.322-.557V7.018L6.7 9.51v5.324c0 .348.188.669.491.84l4.811 2.706.157.088v4.887a.637.637 0 0 1-.329-.083z"
      stroke="currentColor" // Add a stroke to see the drawing effect
      strokeWidth="1" // Adjust stroke width as needed
      fill="none" // No fill during the drawing animation
      initial={{ pathLength: 0 }} // Start with the path undrawn
      animate={{ pathLength: 1 }} // Animate the path to its full length
      transition={{
        duration: 2, // Duration for one draw-in
        ease: "easeInOut",
        repeat: Infinity, // Repeat indefinitely
        repeatType: "loop" // Loop the animation
      }}
    />
  </svg>
);

const loadingVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: "easeOut",
      staggerChildren: 0.2,
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const dotsVariants = {
  loading: {
    y: [0, -10, 0],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

const LoadingScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background text-foreground z-[9999]"
      variants={loadingVariants}
      initial="hidden"
      animate="visible"
    >
      <BrandLogo />
      <motion.div
        className="mt-6 flex items-center space-x-2"
        variants={textVariants}
      >
        <h1 className="text-3xl font-bold font-display tracking-tight">
          BrainBeyond
        </h1>
        <motion.div className="flex space-x-1">
          <motion.span
            className="w-1.5 h-1.5 bg-primary rounded-full"
            variants={dotsVariants}
            animate="loading"
          />
          <motion.span
            className="w-1.5 h-1.5 bg-primary rounded-full"
            variants={dotsVariants}
            animate={{
              ...dotsVariants.loading,
              transition: { ...dotsVariants.loading.transition, delay: 0.2 }
            }}
          />
          <motion.span
            className="w-1.5 h-1.5 bg-primary rounded-full"
            variants={dotsVariants}
            animate={{
              ...dotsVariants.loading,
              transition: { ...dotsVariants.loading.transition, delay: 0.4 }
            }}
          />
        </motion.div>
      </motion.div>
      <motion.p
        className="mt-2 text-custom font-body"
        variants={textVariants}
      >
        wait a moment...
      </motion.p>
    </motion.div>
  );
};

export default LoadingScreen;