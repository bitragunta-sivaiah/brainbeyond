import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, FileText, Bot, Users, FolderGit2, Award, Briefcase, Network, MonitorPlay,
    CheckCircle2, XCircle, ChevronRight, GraduationCap, Sparkles
} from 'lucide-react';

// 1. Data is now structured into categories for a more organized UI.
//    Descriptions and limitations have been expanded with more detail.
const featureCategories = [
    {
        category: "AI Career Toolkit",
        icon: Sparkles,
        features: [
            {
                icon: FileText,
                title: "AI Resume & Cover Letter",
                description: "Craft job-winning resumes and cover letters tailored to specific roles in minutes. Our AI analyzes job descriptions to suggest keywords and optimize your content.",
                limitation: "Static templates that require manual effort and often miss crucial keywords for ATS screening."
            },
            {
                icon: Bot,
                title: "AI Mock Interviews",
                description: "Practice with an AI interviewer that asks relevant questions and provides instant, private feedback on your answers, pacing, and use of filler words.",
                limitation: "A simple list of common questions with no interactive practice or performance analysis."
            },
            {
                icon: Briefcase,
                title: "Curated Job Board",
                description: "Access a filtered list of high-quality jobs and internships from partner companies, specifically curated for students and recent graduates.",
                limitation: "Overwhelming, unfiltered job feeds that are not tailored for entry-level candidates."
            },
        ]
    },
    {
        category: "Expert-Led Learning",
        icon: GraduationCap,
        features: [
            {
                icon: FolderGit2,
                title: "Real-World Projects",
                description: "Build a portfolio that impresses employers. Go beyond theory with hands-on projects that mirror real industry challenges and workflows.",
                limitation: "Primarily theoretical video lectures with quizzes that don't build practical, demonstrable skills."
            },
            {
                icon: Award,
                title: "Verified Certifications",
                description: "Earn industry-recognized certifications upon completion. Each certificate is verifiable and showcases your mastery of in-demand skills.",
                limitation: "Basic certificates of completion that lack credibility and are not valued by recruiters."
            },
            {
                icon: MonitorPlay,
                title: "Exclusive Webinars",
                description: "Stay ahead of the curve with live workshops and Q&A sessions hosted by leading industry experts on emerging technologies and trends.",
                limitation: "Pre-recorded, outdated content with no opportunity for live interaction with experts."
            },
        ]
    },
    {
        category: "Community & Support",
        icon: Users,
        features: [
            {
                icon: Users,
                title: "1-on-1 Mentorship",
                description: "Get personalized career guidance, code reviews, and industry insights from a dedicated mentor who is an expert in your field.",
                limitation: "Relying on crowded community forums where quality advice is not guaranteed and often delayed."
            },
            {
                icon: Network,
                title: "Peer Networking",
                description: "Connect with a motivated community of peers. Collaborate on projects, form study groups, and build your professional network from day one.",
                limitation: "An isolated learning experience with no structured way to connect or collaborate with other students."
            },
            {
                icon: Crown,
                title: "Premium Access",
                description: "One subscription unlocks everything: all courses, career tools, mentorship access, and community features, with continuous updates.",
                limitation: "Complex pricing tiers and costly a-la-carte models for individual courses or tools."
            },
        ]
    }
];

const FeatureShowdown = () => {
    // Initialize state with the first feature of the first category
    const [selectedFeature, setSelectedFeature] = useState(featureCategories[0].features[0]);

    return (
        <section className="py-20 sm:py-28 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#2d3748_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
                        Engineered for Advantage
                    </h2>
                    <p className="mt-4 text-lg max-w-3xl mx-auto text-muted-foreground">
                        Every feature is designed to give you a distinct edge. See the difference for yourself.
                    </p>
                </motion.div>

                {/* --- Main Layout --- */}
                {/* We use a mobile-first approach, then apply the grid layout for large screens */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr_1fr] gap-8 lg:gap-12 items-start">
                    {/* On mobile, order-2 makes this panel appear after the selector */}
                    <div className="lg:order-1">
                        <ShowcasePanel type="advantage" feature={selectedFeature} />
                    </div>

                    {/* On mobile, order-1 makes the selector appear at the top */}
                    <div className="lg:order-2">
                        <FeatureSelector
                            categories={featureCategories}
                            selected={selectedFeature}
                            onSelect={setSelectedFeature}
                        />
                    </div>

                    {/* On mobile, order-3 makes this panel appear last */}
                    <div className="lg:order-3">
                        <ShowcasePanel type="limitation" feature={selectedFeature} />
                    </div>
                </div>
            </div>
        </section>
    );
};

// Component for the central feature selector. It now handles categories.
const FeatureSelector = ({ categories, selected, onSelect }) => {
    return (
        <div className="space-y-6 sticky top-24">
            {categories.map((category) => (
                <div key={category.category}>
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <category.icon className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                            {category.category}
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {category.features.map(feature => (
                            <button
                                key={feature.title}
                                onClick={() => onSelect(feature)}
                                className={`w-full p-4 rounded-lg transition-all duration-300 flex items-center justify-between text-left border-2 ${
                                    selected.title === feature.title
                                    ? 'bg-primary/10 border-primary shadow-lg'
                                    : 'bg-card border-border hover:border-primary/50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <feature.icon className={`w-6 h-6 flex-shrink-0 ${ selected.title === feature.title ? 'text-primary' : 'text-muted-foreground' }`} />
                                    <span className="font-semibold text-foreground">{feature.title}</span>
                                </div>
                                <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${ selected.title === feature.title ? 'translate-x-1 text-primary' : 'text-muted-foreground' }`} />
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Component for the side panels (This component required no changes)
const ShowcasePanel = ({ type, feature }) => {
    const isAdvantage = type === 'advantage';
    const title = isAdvantage ? 'Brain Beyond' : 'Other Platforms';
    const Icon = isAdvantage ? CheckCircle2 : XCircle;
    const text = isAdvantage ? feature.description : feature.limitation;

    return (
        <div className={`p-8 rounded-2xl h-full border ${ isAdvantage ? 'border-primary/30 bg-primary/5' : 'border-border bg-card' }`}>
            <div className={`flex items-center gap-3 mb-4`}>
                <Icon className={`w-7 h-7 ${ isAdvantage ? 'text-primary' : 'text-destructive' }`} />
                <h3 className={`text-2xl font-bold font-heading ${ isAdvantage ? 'text-foreground' : 'text-muted-foreground' }`}>
                    {title}
                </h3>
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                >
                    <p className="text-lg text-muted-foreground leading-relaxed min-h-[120px]">
                        {text}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default FeatureShowdown;