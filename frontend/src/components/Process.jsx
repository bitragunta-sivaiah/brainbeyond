import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Compass, Users, Rocket, FileText, ScanSearch, Briefcase, Bot } from 'lucide-react';

// Data for the "How It Works" section with more professional descriptions
const processSteps = [
    {
        icon: <UserPlus className="w-8 h-8 text-background" />,
        title: "Build Your Foundation",
        description: "Quickly establish your professional profile and set the stage for your learning journey. Your personalized dashboard awaits."
    },
    {
        icon: <Compass className="w-8 h-8 text-background" />,
        title: "Discover Your Path",
        description: "Navigate our curated library of industry-leading courses. Find the perfect learning path to match your career ambitions."
    },
    {
        icon: <Users className="w-8 h-8 text-background" />,
        title: "Forge Strategic Connections",
        description: "Tap into a dynamic community of motivated peers and gain invaluable insights from seasoned industry mentors."
    },
    {
        icon: <Rocket className="w-8 h-8 text-background" />,
        title: "Accelerate Your Career",
        description: "Apply your new skills with confidence. Leverage our comprehensive career tools to land interviews and secure your dream role."
    }
];

// Data for the "Personalized Tools" section with more professional descriptions
const toolSteps = [
    {
        icon: <FileText className="w-8 h-8 text-background" />,
        title: "Craft a Standout Resume",
        description: "Utilize our AI-driven builder to create a polished, professional resume that effectively showcases your skills to employers."
    },
    {
        icon: <ScanSearch className="w-8 h-8 text-background" />,
        title: "Optimize for Recruiters",
        description: "Ensure your resume bypasses automated filters. Our ATS checker provides instant analysis and actionable feedback."
    },
    {
        icon: <Briefcase className="w-8 h-8 text-background" />,
        title: "Master Your Interview",
        description: "Prepare for any scenario with our extensive library of role-specific interview questions, strategies, and expert tips."
    },
    {
        icon: <Bot className="w-8 h-8 text-background" />,
        title: "Refine with AI Feedback",
        description: "Sharpen your communication skills in a realistic, pressure-free environment. Receive instant, data-driven performance feedback."
    }
];

const StepCard = ({ icon, title, description, index }) => (
    <motion.div
        className="flex items-start gap-6"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, delay: index * 0.15 }}
    >
        <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-custom leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

const Process = () => {
    return (
        <section className="bg-background overflow-hidden">
            <div className="max-w-full  w-full mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    
                    {/* Top-Left: Image 1 */}
                    <motion.div
                        className="w-full h-96 lg:h-[650px] overflow-hidden lg:rounded-r-[4rem]"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                            alt="A diverse team collaborating in a modern office"
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                    
                    {/* Top-Right: Text 1 */}
                    <div className="flex items-center px-8 py-16 lg:p-24">
                        <div>
                            <motion.h2 
                                className="font-display text-4xl sm:text-5xl font-bold tracking-tighter mb-10"
                                initial={{ opacity: 0, y: -20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{ duration: 0.6 }}
                            >
                                How It <span className="text-primary">Works</span>
                            </motion.h2>
                            <div className="flex flex-col gap-10">
                                {processSteps.map((step, index) => (
                                    <StepCard key={index} {...step} index={index} />
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom-Left: Text 2 (order flipped on mobile) */}
                    <div className="flex items-center px-8 py-16 lg:p-24 order-last lg:order-none">
                         <div>
                            <motion.h2 
                                className="font-display text-4xl sm:text-5xl font-bold tracking-tighter mb-10"
                                initial={{ opacity: 0, y: -20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{ duration: 0.6 }}
                            >
                                Your Personalized <span className="text-primary">Career Toolkit</span>
                            </motion.h2>
                            <div className="flex flex-col gap-10">
                                {toolSteps.map((step, index) => (
                                    <StepCard key={index} {...step} index={index} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom-Right: Image 2 */}
                    <motion.div
                        className="w-full h-96 lg:h-[650px] overflow-hidden lg:rounded-l-[4rem]"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                         <img 
                            src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="A professional analyzing data on a laptop in a well-lit workspace"
                            className="w-full h-full object-cover"
                        />
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default Process;

