import React from 'react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { ArrowRight, BookOpen } from 'lucide-react';
import { FaStar } from 'react-icons/fa';
import RightSideImg from '../assets/BBHeader1.png'; // Make sure this path is correct
import { Link } from 'react-router-dom';

const MotionLink = motion(Link);

/**
 * A reusable component for a 3D tilted image using react-parallax-tilt.
 */
const TiltedImage = () => {
  return (
    <Tilt
      glareEnable={true}
      glareMaxOpacity={0.5}
      perspective={1000}
      scale={1.05}
      transitionSpeed={1000}
      tiltMaxAngleX={25}
      tiltMaxAngleY={25}
      className="w-fit h-full rounded-xl cursor-grab shadow overflow-hidden"
    >
      <div className="w-full h-full bg-card rounded-2xl shadow-2xl flex items-center justify-center">
        <img
          src={RightSideImg}
          alt="Brain Beyond Learning Platform"
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    </Tilt>
  );
};

/**
 * The main Hero component for the landing page.
 */
const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="w-full flex justify-center flex-wrap px-4 items-center gap-12 lg:gap-16">
        {/* Left Side: Information & Call to Action */}
        <motion.div
          className="flex flex-col gap-6 text-center lg:text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* CORRECTED: Content updated for a more professional, benefit-driven tone */}
          <motion.div variants={itemVariants} className="font-semibold text-primary">
            ✨ BUILD CAREER-READY SKILLS
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-display tracking-tighter leading-tight">
            Elevate Your Skills, <br /> Accelerate Your <span className="text-primary">Career.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
            Join thousands of learners and gain in-demand skills with our career-focused curriculum. Taught by industry experts, our courses are designed to help you achieve your professional goals.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-4">
            <MotionLink
              to={'/courses'}
              whileHover={{ scale: 1.05, boxShadow: "0px 10px 25px -5px rgba(var(--color-primary-rgb), 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all duration-300"
            >
              Get Started <ArrowRight size={20} />
            </MotionLink>
            <MotionLink
              to={'/courses'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-card text-foreground font-bold py-3 px-8 rounded-full border border-border shadow-sm flex items-center justify-center gap-2 transition-all duration-300"
            >
              View Courses <BookOpen size={20} />
            </MotionLink>
          </motion.div>

          {/* Social Proof Section */}
          <motion.div variants={itemVariants} className="flex items-center gap-6 mt-6 justify-center lg:justify-start">
            <div className="flex -space-x-2 overflow-hidden">
              <img className="inline-block h-10 w-10 rounded-full ring-2 ring-background" src="https://randomuser.me/api/portraits/men/86.jpg" alt="User 1" />
              <img className="inline-block h-10 w-10 rounded-full ring-2 ring-background" src="https://randomuser.me/api/portraits/women/65.jpg" alt="User 2" />
              <img className="inline-block h-10 w-10 rounded-full ring-2 ring-background" src="https://randomuser.me/api/portraits/men/41.jpg" alt="User 3" />
            </div>
            <div>
              <div className="flex items-center space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-semibold text-foreground">4.9/5</span>
              </div>
              {/* CORRECTED: Text updated for a more professional feel */}
              <p className="text-sm text-muted-foreground mt-1">Trusted by 10,000+ students</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side: Interactive Tilted Image */}
        <motion.div
          className="w-full max-w-xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
        >
          <TiltedImage />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
