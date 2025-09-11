import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'; // Lucide icons
import { createContactMessage } from '../store/redux/contactSlice'; // Adjust path as needed
import toast from 'react-hot-toast';

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Contact = () => {
  const dispatch = useDispatch();
  // Assuming your contact slice is named 'contact' and contains a 'loading' state
  const { loading } = useSelector((state) => state.contact); 

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Dispatch the async thunk to create a contact message
      const resultAction = await dispatch(createContactMessage(formData));

      // Check if the thunk succeeded (fulfilled)
      if (createContactMessage.fulfilled.match(resultAction)) {
        toast.success("Your message has been sent successfully!");
        // Clear the form upon successful submission
        setFormData({ name: '', email: '', subject: '', message: '' }); 
      } else {
        // If the thunk was rejected, the error message is already handled by toast within the thunk
        // Additional client-side error handling can be added here if necessary
      }
    } catch (error) {
      console.error("Failed to submit contact form:", error);
      // Errors during dispatch itself (e.g., network issues before thunk execution)
      // are also typically handled by toast within the thunk or caught here.
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8 font-body">
      <motion.div
        className="w-full max-w-6xl bg-card rounded-[var(--radius-lg)] shadow-md p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
        variants={containerVariants}
        initial="hidden"
        // Animate the container upon component mount
        animate="visible" 
      >
        {/* Left Section: Contact Information */}
        <motion.div className="flex flex-col space-y-6" variants={itemVariants}>
          <h1 className="text-4xl sm:text-5xl font-display text-primary leading-tight mb-4 tracking-tight">
            Get in Touch!
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Have questions, feedback, or need assistance? We're here to help! Feel free to reach out to us through the contact form or directly using the details below.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-lg">
              <MapPin className="text-accent-foreground flex-shrink-0" size={24} />
              <p className="text-foreground">123 E-Learning Ave, Suite 456, Knowledge City, LC 78901</p>
            </div>
            <div className="flex items-center space-x-3 text-lg">
              <Phone className="text-accent-foreground flex-shrink-0" size={24} />
              <p className="text-foreground">+1 (555) 123-4567</p>
            </div>
            <div className="flex items-center space-x-3 text-lg">
              <Mail className="text-accent-foreground flex-shrink-0" size={24} />
              <p className="text-foreground">support@elearning.com</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-heading text-primary mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              {/* Social media links with Lucide icons */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent-foreground transition-colors">
                <Facebook size={28} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent-foreground transition-colors">
                <Twitter size={28} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent-foreground transition-colors">
                <Linkedin size={28} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent-foreground transition-colors">
                <Instagram size={28} />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Right Section: Contact Form */}
        <motion.div className="flex flex-col space-y-6" variants={itemVariants}>
          <h2 className="text-3xl sm:text-4xl font-heading text-primary mb-4 tracking-tight">
            Send Us a Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <motion.div variants={itemVariants}>
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-3 border border-border rounded-[var(--radius)] bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </motion.div>

            {/* Email Input */}
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">Your Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 border border-border rounded-[var(--radius)] bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </motion.div>

            {/* Subject Input */}
            <motion.div variants={itemVariants}>
              <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-1">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full p-3 border border-border rounded-[var(--radius)] bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </motion.div>

            {/* Message Textarea */}
            <motion.div variants={itemVariants}>
              <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1">Your Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5"
                required
                className="w-full p-3 border border-border rounded-[var(--radius)] bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all custom-scrollbar"
              ></textarea>
            </motion.div>

            {/* Submit Button with Loading Indicator */}
            <motion.div variants={itemVariants}>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-[var(--radius)] font-semibold hover:bg-opacity-90 transition-all duration-300 shadow-md flex items-center justify-center space-x-2"
                // Disable button when loading
                disabled={loading} 
              >
                {/* Conditional rendering for loading spinner */}
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
              </button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Contact;
