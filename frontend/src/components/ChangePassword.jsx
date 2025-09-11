import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword } from '../store/redux/authSlice';
import { motion } from 'framer-motion';
import { Mail, Lock, KeyRound, User } from 'lucide-react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return false;
    }
    if (formData.newPassword.length < 5) {
      toast.error('New password must be at least 5 characters long.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    dispatch(changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    }));
  };

  const inputVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md p-8 bg-card rounded-2xl shadow-md border border-border"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex justify-center mb-4"
          >
            <KeyRound size={48} className="text-primary" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-2 text-foreground font-heading tracking-tight">Change Password</h2>
          <p className="text-sm text-muted-foreground font-body">Update your account password securely.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Current Password Field */}
          <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <label className="block text-sm font-medium text-foreground mb-1 font-body" htmlFor="currentPassword">
              Current Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 pl-10 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all duration-200 font-body"
              />
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </motion.div>

          {/* New Password Field */}
          <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
            <label className="block text-sm font-medium text-foreground mb-1 font-body" htmlFor="newPassword">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 pl-10 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all duration-200 font-body"
              />
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </motion.div>

          {/* Confirm New Password Field */}
          <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
            <label className="block text-sm font-medium text-foreground mb-1 font-body" htmlFor="confirmNewPassword">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmNewPassword"
                type={showConfirmNewPassword ? 'text' : 'password'}
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 pl-10 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all duration-200 font-body"
              />
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label={showConfirmNewPassword ? 'Hide confirmed new password' : 'Show confirmed new password'}
              >
                {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-colors duration-200 font-body"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? 'Updating...' : 'Change Password'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ChangePassword;