import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Target,
  Lightbulb,
  Users,
  Award,
  BookOpenText,
  HeartHandshake,
  Clock,
  Briefcase,
  GraduationCap,
  ChevronRight,
  User,
  Star,
  Book,
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


const AboutUs = () => {
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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const teamMembers = [
    {
      name: 'Mr. Sivaiah Bitragunta',
      role: 'Co-founder & CEO',
      description: 'A visionary leader with over 20 years of experience driving growth in educational technology.',
      image: 'https://placehold.co/150x150/2f27ce/ffffff?text=Sivaiah',
      experience: '20+ Years in Edtech & Strategic Development',
      education: 'M.Tech from IIT Bombay',
    },
    {
      name: 'Mr. Charan Kumar',
      role: 'Co-founder & CTO',
      description: 'An expert in building scalable e-learning platforms with a focus on cutting-edge technology.',
      image: 'https://placehold.co/150x150/433bff/ffffff?text=Charan',
      experience: '15+ Years in Software Architecture',
      education: 'B.E. in Computer Science',
    },
    {
      name: 'Ms. Sai Pallavi',
      role: 'Head of Curriculum Development',
      description: 'Specializes in creating engaging and outcome-driven course materials that meet industry standards.',
      image: 'https://placehold.co/150x150/dedcff/050315?text=Sai',
      experience: '10+ Years in Instructional Design',
      education: 'M.A. in Education',
    },
    {
      name: 'Mr. Vivek Kumar',
      role: 'Director of Student Success',
      description: 'Committed to fostering a supportive community and ensuring every student achieves their goals.',
      image: 'https://placehold.co/150x150/2f27ce/ffffff?text=Vivek',
      experience: '12+ Years in Student Support & Mentorship',
      education: 'M.B.A. from IIM Ahmedabad',
    },
  ];

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
            <h1 className="text-5xl md:text-6xl font-display font-extrabold text-foreground ml-4">
                        <span>Brain</span> <span className="text-primary">Beyond</span>
            </h1>
          </motion.div>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-body"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            At **Axiom Edtech**, we believe that education is the most powerful tool for change. We are dedicated to providing
            high-quality, accessible, and engaging online learning experiences for everyone, everywhere.
          </motion.p>
        </motion.section>

        {/*
        ----------------------------------
        Our Mission Section
        ----------------------------------
        */}
        <motion.section
          className="bg-card rounded-xl shadow-md p-8 md:p-12 mb-16 md:mb-20 border border-border flex flex-col lg:flex-row items-center gap-8"
          variants={itemVariants}
        >
          <motion.div variants={imageVariants} className="flex-shrink-0">
            <img
              src="https://placehold.co/400x250/dedcff/050315?text=Our+Mission"
              alt="Our Mission"
              className="rounded-lg shadow-lg w-full lg:w-[400px] h-auto object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x250/cccccc/000000?text=Our+Mission"; }}
            />
          </motion.div>
          <div className="flex-grow">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-4 flex items-center">
              <Target className="h-7 w-7 mr-3 text-primary" /> Our Mission
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed font-body mb-4">
              Our mission is to democratize education by offering a diverse range of courses taught by industry experts.
              We strive to foster a love for lifelong learning and equip individuals with the skills needed to thrive
              in a rapidly evolving world. We are committed to breaking down barriers to education, making it available
              to anyone with an internet connection.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed font-body">
              We focus on practical, relevant knowledge that can be immediately applied, ensuring our students gain
              real-world competency and confidence.
            </p>
          </div>
        </motion.section>

        {/*
        ----------------------------------
        Our Vision Section
        ----------------------------------
        */}
        <motion.section
          className="bg-card rounded-xl shadow-md p-8 md:p-12 mb-16 md:mb-20 border border-border flex flex-col lg:flex-row-reverse items-center gap-8"
          variants={itemVariants}
        >
          <motion.div variants={imageVariants} className="flex-shrink-0">
            <img
              src="https://placehold.co/400x250/2f27ce/ffffff?text=Our+Vision"
              alt="Our Vision"
              className="rounded-lg shadow-lg w-full lg:w-[400px] h-auto object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x250/cccccc/000000?text=Our+Vision"; }}
            />
          </motion.div>
          <div className="flex-grow">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-4 flex items-center">
              <Lightbulb className="h-7 w-7 mr-3 text-primary" /> Our Vision
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed font-body mb-4">
              We envision a world where knowledge knows no boundaries and every individual has the opportunity to
              achieve their full potential through continuous learning. We aim to be the leading online learning
              platform, recognized for our innovative approach, quality content, and vibrant community.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed font-body">
              Our vision extends to building a supportive ecosystem where learners can connect, collaborate, and grow
              together, transforming their lives and careers.
            </p>
          </div>
        </motion.section>

        {/*
        ----------------------------------
        Meet the Team Section
        ----------------------------------
        */}
        <motion.section
          className="mb-16 md:mb-20 text-center"
          variants={itemVariants}
        >
          <h2 className="text-4xl font-heading font-bold text-foreground mb-10 flex items-center justify-center">
            <Users className="h-8 w-8 mr-3 text-primary" /> Meet Our Team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                className="bg-card relative rounded-xl shadow-md p-6 border border-border flex flex-col items-center text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
              >
                <motion.img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-primary shadow-lg"
                  variants={imageVariants}
                />
                <h3 className="text-xl font-heading font-semibold text-foreground mb-1">{member.name}</h3>
                <p className="text-primary text-sm font-body font-medium mb-3">{member.role}</p>

                {/* New Details Section with Icons */}
                <div className="text-left w-full space-y-2 mb-4">
                  <div className="flex items-center text-sm font-body text-muted-foreground">
                    <Briefcase className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                    <span>{member.experience}</span>
                  </div>
                  <div className="flex items-center text-sm font-body text-muted-foreground">
                    <GraduationCap className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                    <span>{member.education}</span>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm font-body text-start">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/*
        ----------------------------------
        Why Choose Us Section
        ----------------------------------
        */}
        <motion.section
          className="mb-16 md:mb-20 text-center"
          variants={itemVariants}
        >
          <h2 className="text-4xl font-heading font-bold text-foreground mb-10 flex items-center justify-center">
            <Award className="h-8 w-8 mr-3 text-primary" /> Why Choose Axiom Edtech?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              className="bg-card rounded-xl shadow-md p-6 border border-border flex flex-col items-center text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
            >
              <BookOpenText className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Comprehensive Courses</h3>
              <p className="text-muted-foreground text-sm font-body">
                Access a vast library of courses covering diverse subjects, from beginner to advanced levels.
              </p>
            </motion.div>
            <motion.div
              className="bg-card rounded-xl shadow-md p-6 border border-border flex flex-col items-center text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
            >
              <HeartHandshake className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Expert Instructors</h3>
              <p className="text-muted-foreground text-sm font-body">
                Learn from industry leaders and passionate educators who bring real-world experience to your screen.
              </p>
            </motion.div>
            <motion.div
              className="bg-card rounded-xl shadow-md p-6 border border-border flex flex-col items-center text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
            >
              <Clock className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Flexible Learning</h3>
              <p className="text-muted-foreground text-sm font-body">
                Study at your own pace, anytime, anywhere, with our mobile-friendly platform and downloadable resources.
              </p>
            </motion.div>
            <motion.div
              className="bg-card rounded-xl shadow-md p-6 border border-border flex flex-col items-center text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
            >
              <Briefcase className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Career Focused</h3>
              <p className="text-muted-foreground text-sm font-body">
                Gain practical skills and certifications that are highly valued by employers in today's job market.
              </p>
            </motion.div>
            <motion.div
              className="bg-card rounded-xl shadow-md p-6 border border-border flex flex-col items-center text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
            >
              <GraduationCap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Community Support</h3>
              <p className="text-muted-foreground text-sm font-body">
                Join a thriving community of learners, instructors, and mentors for collaborative growth.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/*
        ----------------------------------
        Call to Action
        ----------------------------------
        */}
        <motion.section
          className="text-center bg-primary rounded-xl p-10 md:p-14 shadow-lg"
          variants={itemVariants}
        >
          <h2 className="text-4xl font-display font-bold text-primary-foreground mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-primary-foreground mb-8 font-body">
            Explore our courses and find the perfect path for your growth.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/courses"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-foreground text-primary text-lg font-semibold rounded-full shadow-md hover:bg-white/90 transition-all duration-300"
            >
              Browse Courses
              <ChevronRight className="h-5 w-5 ml-2" />
            </Link>
          </motion.div>
        </motion.section>

      </div>
    </motion.div>
  );
};

export default AboutUs;