import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Assuming react-router-dom for navigation
import {
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Users,
  Info,
  Sparkles,
  ChevronRight,
  Copyright,
  Laptop,
  GraduationCap
} from 'lucide-react';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const linkVariants = {
    hover: { x: 5, color: 'var(--color-accent-foreground)', transition: { duration: 0.2 } },
  };

  const socialIconVariants = {
    hover: { scale: 1.2, color: 'var(--color-accent-foreground)', rotate: 5, transition: { duration: 0.2 } },
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="bg-card text-card-foreground border-t border-border py-12 md:py-16 shadow-lg"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Section 1: Branding and Description */}
        <div className="flex flex-col items-start space-y-4">
          <Link to="/" className="flex items-center space-x-2">
            {/* Using the same logo structure as Header.jsx */}
           <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
   className="h-10 w-10 text-primary transition-colors duration-300"
    fill="currentColor"
  >
    <title>Brain Beyond</title>
    <path d="M21.809 5.524L12.806.179l-.013-.007.078-.045h-.166a1.282 1.282 0 0 0-1.196.043l-.699.403-8.604 4.954a1.285 1.285 0 0 0-.644 1.113v10.718c0 .46.245.884.644 1.113l9.304 5.357c.402.232.898.228 1.297-.009l9.002-5.345c.39-.231.629-.651.629-1.105V6.628c0-.453-.239-.873-.629-1.104zm-19.282.559L11.843.719a.642.642 0 0 1 .636.012l9.002 5.345a.638.638 0 0 1 .207.203l-4.543 2.555-4.498-2.7a.963.963 0 0 0-.968-.014L6.83 8.848 2.287 6.329a.644.644 0 0 1 .24-.246zm14.13 8.293l-4.496-2.492V6.641a.32.32 0 0 1 .155.045l4.341 2.605v5.085zm-4.763-1.906l4.692 2.601-4.431 2.659-4.648-2.615a.317.317 0 0 1-.115-.112l4.502-2.533zm-.064 10.802l-9.304-5.357a.643.643 0 0 1-.322-.557V7.018L6.7 9.51v5.324c0 .348.188.669.491.84l4.811 2.706.157.088v4.887a.637.637 0 0 1-.329-.083z" />
  </svg>
            <span className="text-3xl font-display font-bold text-foreground">Brain <span className="text-primary">Beyond</span></span> {/* Updated company name */}
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed font-body">
            Empowering minds through innovative online learning. Join our global community and unlock your potential.
          </p>
          <div className="flex space-x-4 mt-4">
            <motion.a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
              variants={socialIconVariants}
              whileHover="hover"
            >
              <FaFacebookF className="h-6 w-6" />
            </motion.a>
            <motion.a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
              variants={socialIconVariants}
              whileHover="hover"
            >
              <FaTwitter className="h-6 w-6" />
            </motion.a>
            <motion.a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
              variants={socialIconVariants}
              whileHover="hover"
            >
              <FaLinkedinIn className="h-6 w-6" />
            </motion.a>
            <motion.a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
              variants={socialIconVariants}
              whileHover="hover"
            >
              <FaInstagram className="h-6 w-6" />
            </motion.a>
          </div>
        </div>

        {/* Section 2: Quick Links */}
        <div>
          <h3 className="text-xl font-heading font-semibold mb-6 text-foreground">Quick Links</h3>
          <ul className="space-y-3">
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/about" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">About Us</span>
                </Link>
              </motion.div>
            </li>
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/courses" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">All Courses</span>
                </Link>
              </motion.div>
            </li>
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/blog" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">Blog</span>
                </Link>
              </motion.div>
            </li>
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/faq" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">FAQ</span>
                </Link>
              </motion.div>
            </li>
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/policy" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">Policy</span> {/* Added Policy link */}
                </Link>
              </motion.div>
            </li>
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/support" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">Support</span>
                </Link>
              </motion.div>
            </li>
          </ul>
        </div>

        {/* Section 3: Popular Categories/Courses */}
        <div>
          <h3 className="text-xl font-heading font-semibold mb-6 text-foreground">Popular Categories</h3>
          <ul className="space-y-3">
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/category/web-development" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">Web Development</span>
                </Link>
              </motion.div>
            </li>
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/category/data-science" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">Data Science</span>
                </Link>
              </motion.div>
            </li>
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/category/graphic-design" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">Graphic Design</span>
                </Link>
              </motion.div>
            </li>
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/category/business" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">Business & Finance</span>
                </Link>
              </motion.div>
            </li>
            <li>
              <motion.div variants={linkVariants} whileHover="hover">
                <Link to="/category/marketing" className="flex items-center text-muted-foreground hover:text-accent-foreground transition-all duration-200 group">
                  <ChevronRight className="h-4 w-4 mr-2 text-primary-foreground group-hover:text-accent-foreground transition-colors duration-200" />
                  <span className="font-body">Digital Marketing</span>
                </Link>
              </motion.div>
            </li>
          </ul>
        </div>

        {/* Section 4: Contact Info */}
        <div>
          <h3 className="text-xl font-heading font-semibold mb-6 text-foreground">Contact Us</h3>
          <ul className="space-y-4">
            <li className="flex items-start text-muted-foreground">
              <MapPin className="h-5 w-5 mr-3 mt-1 text-primary-foreground" />
              <span className="font-body">123 Learning Lane, Knowledge City, LC 98765</span>
            </li>
            <li className="flex items-center text-muted-foreground">
              <Mail className="h-5 w-5 mr-3 text-primary-foreground" />
              <motion.a
                href="mailto:info@axiomedtech.com"  
                className="hover:text-accent-foreground transition-colors duration-200 font-body"
                variants={linkVariants}
                whileHover="hover"
              >
                info@axiomedtech.com {/* Updated email address */}
              </motion.a>
            </li>
            <li className="flex items-center text-muted-foreground">
              <Phone className="h-5 w-5 mr-3 text-primary-foreground" />
              <motion.a
                href="tel:+1234567890"
                className="hover:text-accent-foreground transition-colors duration-200 font-body"
                variants={linkVariants}
                whileHover="hover"
              >
                +1 (234) 567-890
              </motion.a>
            </li>
            <li className="flex items-start text-muted-foreground">
                <Laptop className="h-5 w-5 mr-3 text-primary-foreground" />
                <span className="font-body">Online 24/7 for seamless learning</span>
            </li>
            <li className="flex items-start text-muted-foreground">
                <GraduationCap className="h-5 w-5 mr-3 text-primary-foreground" />
                <span className="font-body">Dedicated support from experienced educators</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom: Copyright */}
      <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center font-body">
          <Copyright className="h-4 w-4 mr-2" />
          {new Date().getFullYear()} Axiom Edtech. All rights reserved. {/* Updated copyright name */}
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
