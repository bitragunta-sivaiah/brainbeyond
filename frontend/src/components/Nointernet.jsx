// src/pages/Nointernet.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

const Nointernet = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handleReload = () => {
    if (isOnline) {
      navigate('/');
    } else {
      window.location.reload();
    }
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
        <WifiOff size={100} className="mb-6 text-secondary-foreground" />
      </motion.div>
      <motion.h1 variants={itemVariants} className="mb-4 text-4xl font-heading font-semibold text-foreground">
        No Internet Connection
      </motion.h1>
      <motion.p variants={itemVariants} className="mb-8 max-w-md text-lg text-muted-foreground">
        You appear to be offline. Please check your network connection and try again.
      </motion.p>
      <motion.button
        variants={itemVariants}
        onClick={handleReload}
        className="flex items-center px-8 py-4 font-medium text-primary-foreground bg-primary rounded-lg shadow-md hover:bg-primary/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RefreshCw size={20} className="mr-2" />
        {isOnline ? 'Go to Homepage' : 'Try Again'}
      </motion.button>
    </motion.div>
  );
};

export default Nointernet;