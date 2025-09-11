import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '../store/redux/authSlice';
import { motion } from 'framer-motion';
import { Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    dispatch(forgotPassword(email));
  };

  const formVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-background"
    >
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md p-8 bg-card rounded-2xl shadow-md border border-border"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex justify-center mb-4"
          >
            <Lock size={48} className="text-primary" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-2 text-foreground font-heading tracking-tight">Forgot Password</h2>
          <p className="text-sm text-muted-foreground font-body">Enter your email to receive a password reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1 font-body" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 pl-10 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all duration-200 font-body"
              />
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-colors duration-200 font-body"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;