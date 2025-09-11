// src/pages/NonFound.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

const NonFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-foreground"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <SearchX size={100} className="mb-6 text-primary" />
      </motion.div>
      <motion.h1 variants={itemVariants} className="mb-4 text-7xl font-display font-bold text-destructive">
        404
      </motion.h1>
      <motion.h2 variants={itemVariants} className="mb-4 text-3xl font-heading font-semibold text-foreground">
        Page Not Found
      </motion.h2>
      <motion.p variants={itemVariants} className="mb-8 max-w-md text-lg text-muted-foreground">
        Oops! It looks like the page you are looking for has been moved or doesn't exist. Let's get you back on track.
      </motion.p>
      <motion.button
        variants={itemVariants}
        onClick={handleGoHome}
        className="px-8 py-4 font-medium text-primary-foreground bg-primary rounded-lg shadow-md hover:bg-primary/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Go to Homepage
      </motion.button>
    </motion.div>
  );
};

export default NonFound;