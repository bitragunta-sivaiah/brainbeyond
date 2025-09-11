import React from 'react';
import { motion } from 'framer-motion';
import {
    Crown,
    FileText,
    ScanSearch,
    LayoutGrid,
    Award,
    Users,
    MonitorPlay,
    Briefcase,
    Bot,
    Network,
    HelpCircle,
    MessageSquare,
    Headphones,
    FolderGit2,
    Infinity
} from 'lucide-react';
import Tilt from 'react-parallax-tilt'; 


// An array of feature objects with updated, professional descriptions.
const featuresData = [
    {
        icon: <Crown size={32} className="text-primary" />,
        title: "Flexible Subscriptions",
        description: "Unlock your potential with plans tailored to your learning journey. Gain unlimited access to our premium library and learn at your own pace."
    },
    {
        icon: <FileText size={32} className="text-primary" />,
        title: "AI Resume Builder",
        description: "Build a compelling, professional resume in minutes. Our AI-powered builder helps you highlight your skills to catch the eye of top recruiters."
    },
    {
        icon: <ScanSearch size={32} className="text-primary" />,
        title: "ATS Score Checker",
        description: "Ensure your resume gets seen by human eyes. Our ATS checker provides actionable feedback to beat automated screening bots."
    },
    {
        icon: <LayoutGrid size={32} className="text-primary" />,
        title: "Course Manager",
        description: "Your personal learning dashboard. Effortlessly track progress, manage schedules, and stay organized on your path to mastery."
    },
    {
        icon: <Award size={32} className="text-primary" />,
        title: "Verified Certifications",
        description: "Validate your expertise with certifications recognized by industry leaders. Add credible qualifications to your professional profile."
    },
    {
        icon: <Users size={32} className="text-primary" />,
        title: "Mentorship Support",
        description: "Accelerate your career with one-on-one guidance from seasoned industry experts. Get personalized advice and insights."
    },
    {
        icon: <MonitorPlay size={32} className="text-primary" />,
        title: "Exclusive Webinars",
        description: "Stay ahead of the curve. Access live workshops with leading minds on cutting-edge topics and emerging technologies."
    },
    {
        icon: <Briefcase size={32} className="text-primary" />,
        title: "Interview Preparation",
        description: "Walk into any interview with confidence. Access a suite of tools, from common questions to proven strategies, tailored to your target role."
    },
    {
        icon: <Bot size={32} className="text-primary" />,
        title: "AI Mock Interviews",
        description: "Hone your skills with realistic, AI-driven mock sessions. Receive instant, confidential feedback on your answers and delivery."
    },
    {
        icon: <Network size={32} className="text-primary" />,
        title: "Peer Networking",
        description: "Grow your professional network. Connect and collaborate with a vibrant community of ambitious learners and alumni."
    },
    {
        icon: <HelpCircle size={32} className="text-primary" />,
        title: "Weekend Doubt Sessions",
        description: "Never get stuck. Join live, interactive Q&A sessions with instructors to resolve your doubts and deepen your understanding."
    },
    {
        icon: <MessageSquare size={32} className="text-primary" />,
        title: "Dedicated Course Chat",
        description: "Learn collaboratively. Engage in real-time discussions, share resources, and get help from peers and teaching assistants."
    },
     {
        icon: <Headphones size={32} className="text-primary" />,
        title: "24/7 Customer Support",
        description: "Our dedicated support team is available around the clock to ensure a smooth and seamless learning experience."
    },
    {
        icon: <FolderGit2 size={32} className="text-primary" />,
        title: "Project-Based Learning",
        description: "Go beyond theory. Build a powerful portfolio by working on real-world projects that demonstrate your practical skills."
    },
    {
        icon: <Infinity size={32} className="text-primary" />,
        title: "Lifetime Access",
        description: "Your learning is a lifelong asset. Enjoy permanent access to course materials, including all future updates and resources."
    }
];

// Framer Motion animation variants for the container and items
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const Features = () => {
    return (
        <section className="py-20 sm:py-28 bg-muted/30">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
                        What You Will Get with <span className="text-primary">BB</span>
                    </h2>
                    <p className="mt-4 text-lg max-w-3xl mx-auto text-custom">
                        An entire ecosystem of tools and support designed to help you succeed, from learning to landing your dream job.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {featuresData.map((feature, index) => (
                        <Tilt>
                            <motion.div
                            key={index}
                            className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm transition-all duration-300 group relative overflow-hidden"
                            variants={itemVariants}
                             whileHover={{
                                scale: 1.03,
                                borderColor: 'var(--color-primary)',
                                boxShadow: '0 10px 25px -5px rgba(var(--color-primary-rgb), 0.1), 0 8px 10px -6px rgba(var(--color-primary-rgb), 0.1)'
                            }}
                        >
                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="mb-5">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                                <p className="text-custom leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                        </Tilt>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Features;

