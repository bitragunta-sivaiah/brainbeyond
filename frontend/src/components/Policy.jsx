import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, // For Privacy Policy
  FileText,     // For Terms of Service
  RefreshCcw,   // For Refund Policy
  BookOpen,     // For Content Usage
  Mail,         // For Contact Us
  ChevronRight
} from 'lucide-react';

// A simple component for the logo with animation (copied from Header.jsx)
const AnimatedLogo = () => (
 <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
   className="h-10 w-10 md:h-15 md:w-15 text-primary transition-colors duration-300"
    fill="currentColor"
  >
    <title>Brain Beyond</title>
    <path d="M21.809 5.524L12.806.179l-.013-.007.078-.045h-.166a1.282 1.282 0 0 0-1.196.043l-.699.403-8.604 4.954a1.285 1.285 0 0 0-.644 1.113v10.718c0 .46.245.884.644 1.113l9.304 5.357c.402.232.898.228 1.297-.009l9.002-5.345c.39-.231.629-.651.629-1.105V6.628c0-.453-.239-.873-.629-1.104zm-19.282.559L11.843.719a.642.642 0 0 1 .636.012l9.002 5.345a.638.638 0 0 1 .207.203l-4.543 2.555-4.498-2.7a.963.963 0 0 0-.968-.014L6.83 8.848 2.287 6.329a.644.644 0 0 1 .24-.246zm14.13 8.293l-4.496-2.492V6.641a.32.32 0 0 1 .155.045l4.341 2.605v5.085zm-4.763-1.906l4.692 2.601-4.431 2.659-4.648-2.615a.317.317 0 0 1-.115-.112l4.502-2.533zm-.064 10.802l-9.304-5.357a.643.643 0 0 1-.322-.557V7.018L6.7 9.51v5.324c0 .348.188.669.491.84l4.811 2.706.157.088v4.887a.637.637 0 0 1-.329-.083z" />
  </svg>
);

const Policy = () => {
  // Framer Motion variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="min-h-screen bg-background text-foreground py-12 md:py-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

        {/* Hero Section */}
        <motion.section
          className="text-center mb-16 md:mb-20"
          variants={itemVariants}
        >
          <motion.div
            className="flex items-center justify-center mb-6"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <AnimatedLogo />
            <h1 className="text-3xl md:text-6xl font-display font-extrabold text-foreground ml-4">
              <span>Brain</span> <span className="text-primary">Beyond</span>
            </h1>
          </motion.div>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-body"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Your trust is our priority. Below you will find detailed information about our policies.
          </motion.p>
        </motion.section>

        {/* Privacy Policy Section */}
        <motion.section
          className="bg-card rounded-xl shadow-md p-8 md:p-12 mb-16 md:mb-20 border border-border"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-heading font-bold text-foreground mb-6 flex items-center">
            <ShieldCheck className="h-7 w-7 mr-3 text-primary" /> Privacy Policy
          </h2>
          <div className="text-muted-foreground text-base leading-relaxed font-body space-y-4">
            <p>
              At Axiom Edtech, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you use our services.
            </p>
            <p>
              <strong>1. Information We Collect:</strong> We collect information you provide directly to us, such as your name, email address, payment details, and course preferences. We also automatically collect certain information when you access and use our platform, including IP address, device information, and usage data.
            </p>
            <p>
              <strong>2. How We Use Your Information:</strong> Your information is used to provide, maintain, and improve our services, process transactions, send you relevant communications, and personalize your learning experience. We may also use data for analytics to understand user behavior and enhance our offerings.
            </p>
            <p>
              <strong>3. Data Sharing:</strong> We do not sell your personal data to third parties. We may share information with trusted service providers who assist us in operating our platform (e.g., payment processors, hosting services), strictly under confidentiality agreements. We may also disclose information if required by law.
            </p>
            <p>
              <strong>4. Data Security:</strong> We implement robust security measures, including encryption and access controls, to protect your data from unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p>
              <strong>5. Your Rights:</strong> You have the right to access, correct, or delete your personal information. You can also object to certain processing activities or request data portability. Please contact us to exercise these rights.
            </p>
          </div>
        </motion.section>

        {/* Terms of Service Section */}
        <motion.section
          className="bg-card rounded-xl shadow-md p-8 md:p-12 mb-16 md:mb-20 border border-border"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-heading font-bold text-foreground mb-6 flex items-center">
            <FileText className="h-7 w-7 mr-3 text-primary" /> Terms of Service
          </h2>
          <div className="text-muted-foreground text-base leading-relaxed font-body space-y-4">
            <p>
              These Terms of Service ("Terms") govern your access to and use of Axiom Edtech's website, products, and services. By accessing or using our services, you agree to be bound by these Terms.
            </p>
            <p>
              <strong>1. Account Registration:</strong> You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <p>
              <strong>2. User Conduct:</strong> You agree to use our services lawfully and ethically. Prohibited activities include, but are not limited to, unauthorized access, distribution of malicious software, harassment, and infringement of intellectual property rights.
            </p>
            <p>
              <strong>3. Intellectual Property:</strong> All content on Axiom Edtech, including courses, videos, text, and graphics, is the property of Axiom Edtech or its licensors and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without explicit permission.
            </p>
            <p>
              <strong>4. Disclaimers:</strong> Our services are provided "as is" without warranties of any kind. We do not guarantee that the services will be uninterrupted, error-free, or meet your specific requirements.
            </p>
            <p>
              <strong>5. Limitation of Liability:</strong> Axiom Edtech shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use our services.
            </p>
          </div>
        </motion.section>

        {/* Refund Policy Section */}
        <motion.section
          className="bg-card rounded-xl shadow-md p-8 md:p-12 mb-16 md:mb-20 border border-border"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-heading font-bold text-foreground mb-6 flex items-center">
            <RefreshCcw className="h-7 w-7 mr-3 text-primary" /> Refund Policy
          </h2>
          <div className="text-muted-foreground text-base leading-relaxed font-body space-y-4">
            <p>
              We want you to be satisfied with your learning experience at Axiom Edtech. Our refund policy is as follows:
            </p>
            <p>
              <strong>1. Eligibility:</strong> Refunds are generally available for courses purchased within 7 days, provided that you have not accessed more than 20% of the course content. For certain specialized programs or certifications, specific refund terms may apply as explicitly stated during purchase.
            </p>
            <p>
              <strong>2. How to Request a Refund:</strong> To request a refund, please contact our support team at <Link to="mailto:support@axiomedtech.com" className="text-primary hover:underline">support@axiomedtech.com</Link> with your purchase details and reason for the request.
            </p>
            <p>
              <strong>3. Processing Time:</strong> Approved refunds will be processed within 5-10 business days and credited back to the original payment method.
            </p>
            <p>
              <strong>4. Non-Refundable Items:</strong> Certain items, such as digital downloads once accessed, or services explicitly marked as non-refundable, are excluded from this policy.
            </p>
          </div>
        </motion.section>

        {/* Content Usage Policy Section */}
        <motion.section
          className="bg-card rounded-xl shadow-md p-8 md:p-12 mb-16 md:mb-20 border border-border"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-heading font-bold text-foreground mb-6 flex items-center">
            <BookOpen className="h-7 w-7 mr-3 text-primary" /> Content Usage Policy
          </h2>
          <div className="text-muted-foreground text-base leading-relaxed font-body space-y-4">
            <p>
              This policy outlines the permissible use of content provided on the Axiom Edtech platform.
            </p>
            <p>
              <strong>1. Personal Use Only:</strong> All courses and materials are provided for your personal, non-commercial educational use only. You may not share, sell, or distribute course content to others.
            </p>
            <p>
              <strong>2. Prohibited Actions:</strong> You are prohibited from recording, downloading (unless explicitly allowed), reproducing, or publicly displaying any course content without prior written consent from Axiom Edtech.
            </p>
            <p>
              <strong>3. Academic Integrity:</strong> We encourage collaboration and discussion, but all submitted assignments and projects must be your original work. Plagiarism or academic dishonesty will result in immediate termination of your account.
            </p>
            <p>
              <strong>4. Fair Use:</strong> Limited portions of content may be used for educational purposes such as research or commentary, provided proper attribution is given to Axiom Edtech.
            </p>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section
          className="text-center bg-primary rounded-xl p-10 md:p-14 shadow-lg"
          variants={itemVariants}
        >
          <h2 className="text-4xl font-display font-bold text-primary-foreground mb-6">
            Have More Questions About Our Policies?
          </h2>
          <p className="text-xl text-primary-foreground mb-8 font-body">
            Our support team is here to help. Reach out to us for any clarifications.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-foreground text-primary text-lg font-semibold rounded-full shadow-md hover:bg-white/90 transition-all duration-300"
            >
              Contact Support
              <Mail className="h-5 w-5 ml-2" />
            </Link>
          </motion.div>
        </motion.section>

      </div>
    </motion.div>
  );
};

export default Policy;
