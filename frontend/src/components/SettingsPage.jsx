import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { KeyRound, Lock, User, BellRing } from 'lucide-react';

const SettingsPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const settingsLinks = [
    { name: 'Change Password', icon: <KeyRound />, path: '/settings/change-password', description: 'Update your account password for enhanced security.' },
    { name: 'Profile Information', icon: <User />, path: '/profile', description: 'Edit your personal details like name, email, and bio.' },
    { name: 'Notification Settings', icon: <BellRing />, path: '/settings/notifications', description: 'Manage your email and push notification preferences.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-start justify-center p-4 sm:p-6 bg-background pt-20"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-2xl p-8 bg-card rounded-2xl shadow-md border border-border"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-foreground font-heading tracking-tight">Settings</h2>
          <p className="text-md text-muted-foreground font-body mt-2">Manage your account and profile settings.</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {settingsLinks.map((link, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Link
                to={link.path}
                className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-input/50 border border-border hover:bg-input transition-colors duration-200"
              >
                <div className="text-primary mb-2">
                  {link.icon}
                </div>
                <h3 className="font-semibold text-lg text-foreground font-heading">{link.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 font-body">{link.description}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground font-body">
            Need to reset your password and can't log in? Use the <Link to="/forgot-password" className="text-accent-foreground hover:underline">Forgot Password</Link> page.
          </p>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;