import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const informationData = {
    'College Students': {
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: 'For Ambitious College Students',
        description: 'Bridge the gap between academic knowledge and real-world application. Brain Beyond is your launchpad for a successful career, providing you with the tools, skills, and connections to thrive in the competitive job market.',
        points: [
            'Access project-based courses to build a strong portfolio.',
            'Prepare for interviews with AI-powered mock sessions.',
            'Connect with industry mentors for invaluable career guidance.',
            'Gain verified certifications to enhance your resume.'
        ],
        cta: 'Explore Student Benefits'
    },
    'Recruiters': {
        image: 'https://images.unsplash.com/photo-1556742212-5b321f3c261b?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: 'For Insightful Recruiters',
        description: 'Discover a curated pool of top-tier talent equipped with practical, verified skills. Our platform simplifies your hiring process by connecting you directly with candidates who are ready to make an impact from day one.',
        points: [
            'Access a diverse pipeline of pre-vetted, skilled candidates.',
            'Review comprehensive profiles with portfolios and certifications.',
            'Reduce hiring time with advanced search and filtering tools.',
            'Identify the best-fit talent for your organization’s needs.'
        ],
        cta: 'Find Top Talent'
    },
    'Course Creators': {
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: 'For Visionary Course Creators',
        description: 'Share your expertise with a global audience of eager learners. Our platform provides the tools and support you need to create high-quality, engaging courses and build a thriving educational business.',
        points: [
            'Utilize our intuitive tools to build and manage your courses.',
            'Reach a dedicated and motivated community of learners.',
            'Monetize your knowledge with our flexible revenue models.',
            'Receive analytics and feedback to continuously improve.'
        ],
cta: 'Become an Instructor'
    },
    'Mentors': {
        image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: 'For Experienced Mentors',
        description: 'Shape the next generation of industry leaders by sharing your wisdom and experience. Make a lasting impact by guiding ambitious learners on their career path, helping them navigate challenges and seize opportunities.',
        points: [
            'Give back to the community by sharing your expertise.',
            'Connect with and inspire highly motivated individuals.',
            'Enhance your leadership and coaching skills.',
            'Build your professional network and personal brand.'
        ],
        cta: 'Join as a Mentor'
    },
};

const tabs = Object.keys(informationData);

const InformationBB = () => {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const activeData = informationData[activeTab];

    return (
        <section className="py-20 sm:py-28 bg-muted/30">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
                        Who Else is on <span className="text-primary">BB</span>
                    </h2>
                    <p className="mt-4 text-lg max-w-3xl mx-auto text-custom">
                        A diverse ecosystem of learners, experts, and companies working together to shape the future of talent.
                    </p>
                </motion.div>

                {/* Tab Buttons */}
                <div className="flex flex-wrap justify-center  gap-2 sm:gap-4 mb-12">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-4 py-3 sm:px-6 sm:py-3 text-sm sm:text-base font-bold rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-primary rounded-full"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className={`relative z-10 ${activeTab === tab ? 'text-primary-foreground' : 'text-foreground'}`}>{tab}</span>
                        </button>
                    ))}
                </div>
                
                {/* Content Display */}
                <div className="bg-card p-2 sm:p-12 rounded-2xl border border-border/50 shadow overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center"
                        >
                            {/* Left Side: Image */}
                            <motion.div 
                                className="w-full h-80 sm:h-96 rounded-xl overflow-hidden"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <img src={activeData.image} alt={activeData.title} className="w-full h-full object-cover"/>
                            </motion.div>

                            {/* Right Side: Information */}
                            <div className="flex flex-col gap-6">
                                <h3 className="text-3xl font-bold font-heading text-foreground">{activeData.title}</h3>
                                <p className="text-custom leading-relaxed">{activeData.description}</p>
                                <ul className="space-y-3">
                                    {activeData.points.map((point, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to={'/pricing'}
                                     whileHover={{ scale: 1.05 }}
                                     whileTap={{ scale: 0.95 }}
                                     className="bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all duration-300 mt-4 max-w-xs"
                                >
                                    {activeData.cta} <ArrowRight size={20} />
                                </Link>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

export default InformationBB;
