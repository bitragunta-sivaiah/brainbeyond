import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    getPreparationById,
    deleteStudyTopics,
    deletePreparedQuestions,
    generateLearningItems,
    generatePracticeItems,
    addPracticeProblem
} from '../store/redux/interviewPreparationSlice'; // 👈 Adjust this import path
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, BookOpen, BrainCircuit, Code, Brain, Lightbulb, FileText, Bot,
    GraduationCap, Briefcase, BarChart, Link as LinkIcon, Loader2,
    Trash2, PlusCircle, Sparkles, AlertTriangle, ArrowLeft, X, Trophy
} from 'lucide-react';
import { FaGoogle, FaQuestionCircle } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';

// Import the SWEInterview component to render it directly
import SWEInterview from './StartInterview'; // 👈 Adjust this import path

// --- HELPER & UI COMPONENTS ---

const Loader = () => (
    <div className="flex items-center justify-center h-screen bg-background">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-t-4 border-primary border-t-transparent rounded-full"
        />
    </div>
);

const ErrorMessage = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-destructive p-4">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold font-heading mb-2">Oops! Something went wrong.</h2>
        <p className="font-body text-center">{message}</p>
    </div>
);

const Pill = ({ children, className }) => (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${className}`}>
        {children}
    </span>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                     <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                         onClick={onClose}
                     />
                     <motion.div
                         initial={{ scale: 0.9, opacity: 0, y: 30 }}
                         animate={{ scale: 1, opacity: 1, y: 0 }}
                         exit={{ scale: 0.9, opacity: 0, y: 30 }}
                         transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                         className="relative w-full max-w-lg bg-card border border-border rounded-lg shadow-xl z-10"
                     >
                         <div className="flex justify-between items-center p-4 border-b border-border">
                             <h3 className="text-lg font-bold font-heading">{title}</h3>
                             <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded-full p-1 transitions">
                                 <X className="w-5 h-5"/>
                             </button>
                         </div>
                         <div className="p-6">
                             {children}
                         </div>
                     </motion.div>
                 </div>
            )}
        </AnimatePresence>
    );
};

const SectionCard = ({ title, icon, children, actionButton }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card border border-border rounded-lg shadow-md p-4 sm:p-6 mb-8"
    >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="flex items-center">
                {icon}
                <h3 className="text-xl font-heading font-bold text-card-foreground ml-3">{title}</h3>
            </div>
            {actionButton}
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </motion.div>
);

// --- MAIN FEATURE COMPONENTS ---

const PreparationHeader = ({ preparation }) => {
    const navigate = useNavigate();
    const { target, title, targetDate } = preparation;

    const Countdown = () => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();
            let timeLeft = {};
            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                };
            }
            return timeLeft;
        };
        const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

        useEffect(() => {
            const timer = setInterval(() => {
                setTimeLeft(calculateTimeLeft());
            }, 1000 * 60);
            return () => clearInterval(timer);
        });

        return (
            <div className="flex space-x-4">
                {Object.keys(timeLeft).length > 0 ? (
                    <>
                        {timeLeft.days > 0 && <div><span className="text-3xl font-bold font-heading">{timeLeft.days}</span><span className="text-sm text-muted-foreground ml-1">days</span></div>}
                        {timeLeft.hours > 0 && <div><span className="text-3xl font-bold font-heading">{timeLeft.hours}</span><span className="text-sm text-muted-foreground ml-1">hours</span></div>}
                        {timeLeft.minutes > 0 && <div><span className="text-3xl font-bold font-heading">{timeLeft.minutes}</span><span className="text-sm text-muted-foreground ml-1">mins</span></div>}
                    </>
                ) : (
                    <span className="text-3xl font-bold font-heading text-primary">Today! 🎉</span>
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8 p-6 bg-card border border-border rounded-lg shadow-lg"
        >
            <button onClick={() => navigate(-1)} className="flex items-center text-sm text-primary hover:underline mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Preparations
            </button>
            <div className="flex flex-col md:flex-row justify-between items-start">
                <div>
                    <div className="flex items-center mb-2">
                        <Target className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl md:text-4xl font-display text-foreground ml-3">{title}</h1>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-x-4 text-muted-foreground font-body">
                        <span className="flex items-center"><Briefcase className="w-4 h-4 mr-2" /> {target.company}</span>
                        <span className="flex items-center"><GraduationCap className="w-4 h-4 mr-2" /> {target.role}</span>
                        <span className="flex items-center"><BarChart className="w-4 h-4 mr-2" /> {target.level}</span>
                    </div>
                </div>
                <div className="text-left md:text-right mt-4 md:mt-0 w-full md:w-auto">
                    <div className="text-md md:text-lg font-heading font-semibold text-foreground mb-2">Interview Date: {new Date(targetDate).toLocaleDateString()}</div>
                    <Countdown />
                </div>
            </div>
        </motion.div>
    );
};

const StudyTopicsSection = ({ topics, prepId, isLoading }) => {
    const dispatch = useDispatch();
    const [selected, setSelected] = useState([]);

    const handleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    
    const handleDelete = () => {
        if (selected.length > 0) {
            dispatch(deleteStudyTopics({ id: prepId, ids: selected }));
            setSelected([]);
        }
    };
    
    const handleGenerate = () => dispatch(generateLearningItems(prepId));

    return (
        <SectionCard
            title="Study Topics"
            icon={<BookOpen className="w-6 h-6 text-accent-foreground" />}
            actionButton={
                <div className="flex items-center flex-wrap gap-2">
                    <button onClick={handleGenerate} disabled={isLoading} className="flex items-center px-4 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-md hover:bg-primary/20 transitions disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2"/>}
                        Generate More
                    </button>
                    {selected.length > 0 && (
                         <motion.button 
                             initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}}
                             onClick={handleDelete}
                             className="flex items-center px-4 py-2 text-sm font-semibold text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90 transitions">
                             <Trash2 className="w-4 h-4 mr-2"/> Delete ({selected.length})
                         </motion.button>
                    )}
                </div>
            }
        >
            <AnimatePresence>
                {topics.map(topic => (
                    <motion.div
                        key={topic._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, transition: {duration: 0.2} }}
                        className="flex items-start p-4 border border-border rounded-lg bg-background hover:shadow-md transition-shadow"
                    >
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-primary bg-input border-border rounded mt-1 mr-4 focus:ring-ring shrink-0"
                            checked={selected.includes(topic._id)}
                            onChange={() => handleSelect(topic._id)}
                        />
                        <div className="flex-grow">
                            <h4 className="font-bold font-heading text-lg text-foreground">{topic.topic}</h4>
                            <div className="flex items-center flex-wrap gap-2 my-2">
                                <Pill className="bg-secondary text-secondary-foreground">{topic.category}</Pill>
                                <Pill className="bg-accent text-accent-foreground">Priority: {topic.priority}/5</Pill>
                            </div>
                            <div className="mt-3">
                                <h5 className="text-sm font-semibold text-muted-foreground mb-2">Resources:</h5>
                                <ul className="space-y-2">
                                    {topic.resources.map(res => (
                                        <li key={res._id}>
                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline text-sm">
                                                <LinkIcon className="w-4 h-4 mr-2" /> {res.title} <span className="text-custom ml-2">({res.type})</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </SectionCard>
    );
};

const PreparedQuestionsSection = ({ questions, prepId, isLoading }) => {
    const dispatch = useDispatch();
    const [selected, setSelected] = useState([]);
    const [expanded, setExpanded] = useState(null);

    const handleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    
    const handleDelete = () => {
        if (selected.length > 0) {
            dispatch(deletePreparedQuestions({ id: prepId, ids: selected }));
            setSelected([]);
        }
    };

    const handleGenerate = () => dispatch(generateLearningItems(prepId));
    
    const categoryIcons = {
        general: <FaQuestionCircle className="text-blue-500" />,
        technical: <Code className="w-5 h-5 text-green-500" />,
        behavioral: <Brain className="w-5 h-5 text-purple-500" />,
        "company-specific": <FaGoogle className="text-red-500" />,
        situational: <Lightbulb className="w-5 h-5 text-yellow-500" />,
    };

    return (
        <SectionCard
            title="Prepared Questions"
            icon={<FaQuestionCircle className="w-6 h-6 text-accent-foreground" />}
            actionButton={
                 <div className="flex items-center flex-wrap gap-2">
                     <button onClick={handleGenerate} disabled={isLoading} className="flex items-center px-4 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-md hover:bg-primary/20 transitions disabled:opacity-50 disabled:cursor-not-allowed">
                         {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2"/>}
                         Generate More
                     </button>
                     {selected.length > 0 && (
                          <motion.button initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} onClick={handleDelete} className="flex items-center px-4 py-2 text-sm font-semibold text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90 transitions">
                              <Trash2 className="w-4 h-4 mr-2"/> Delete ({selected.length})
                          </motion.button>
                     )}
                 </div>
            }
        >
            <AnimatePresence>
            {questions.map((q, index) => (
                 <motion.div
                     key={q._id}
                     layout
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="border border-border rounded-lg bg-background overflow-hidden"
                 >
                     <div 
                         className="flex items-start p-4 cursor-pointer"
                         onClick={() => setExpanded(expanded === index ? null : index)}
                     >
                         <input
                             type="checkbox"
                             className="form-checkbox h-5 w-5 text-primary bg-input border-border rounded mt-1 mr-4 focus:ring-ring shrink-0"
                             checked={selected.includes(q._id)}
                             onChange={(e) => { e.stopPropagation(); handleSelect(q._id); }}
                         />
                          <div className="flex-grow">
                               <div className="flex items-center mb-2">
                                   {categoryIcons[q.category] || <FaQuestionCircle />}
                                   <span className="ml-2 text-sm capitalize text-muted-foreground">{q.category}</span>
                               </div>
                             <p className="font-semibold text-foreground">{q.question}</p>
                          </div>
                     </div>
                     <AnimatePresence>
                     {expanded === index && (
                         <motion.div
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="px-6 pb-4 ml-8 border-l-2 border-primary"
                         >
                             {q.answer && <div className="prose prose-sm dark:prose-invert max-w-none mb-4" dangerouslySetInnerHTML={{ __html: `<p><strong>Answer:</strong> ${q.answer}</p>` }} />}
                             {q.notes && <div className="prose prose-sm dark:prose-invert max-w-none bg-muted p-3 rounded-md" dangerouslySetInnerHTML={{ __html: `<strong>Notes:</strong> ${q.notes}` }} />}
                         </motion.div>
                     )}
                     </AnimatePresence>
                  </motion.div>
            ))}
            </AnimatePresence>
        </SectionCard>
    );
};

const PracticeProblemsSection = ({ problems, prepId, isLoading }) => {
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleGenerate = () => dispatch(generatePracticeItems(prepId));
    
    const handleAddProblem = (problemData) => {
        dispatch(addPracticeProblem({ id: prepId, problemData })).then(() => {
            setIsModalOpen(false);
        });
    };

    const difficultyColors = {
        easy: 'bg-green-500/20 text-green-400',
        medium: 'bg-yellow-500/20 text-yellow-400',
        hard: 'bg-red-500/20 text-red-400',
    };

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Practice Problem">
                <AddPracticeProblemForm onSubmit={handleAddProblem} isLoading={isLoading}/>
            </Modal>
            <SectionCard
                title="Practice Problems"
                icon={<Code className="w-6 h-6 text-accent-foreground" />}
                actionButton={
                    <div className="flex items-center flex-wrap gap-2">
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-md hover:bg-primary/20 transitions">
                            <PlusCircle className="w-4 h-4 mr-2"/> Add Problem
                        </button>
                        <button onClick={handleGenerate} disabled={isLoading} className="flex items-center px-4 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-md hover:bg-primary/20 transitions disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2"/>}
                            Generate More
                        </button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {problems.map(p => (
                    <motion.a 
                        href={p.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        key={p._id}
                        whileHover={{ scale: 1.03, boxShadow: "var(--shadow-md)" }}
                        className="block p-4 bg-background border border-border rounded-lg transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-2">
                            {p.source === 'leetcode' ? <SiLeetcode className="w-6 h-6"/> : <Code className="w-6 h-6"/>}
                            <Pill className={difficultyColors[p.difficulty] || 'bg-gray-500/20 text-gray-400'}>
                                {p.difficulty}
                            </Pill>
                        </div>
                        <h4 className="font-bold text-foreground">{p.title}</h4>
                    </motion.a>
                ))}
                </div>
            </SectionCard>
        </>
    );
};

const AddPracticeProblemForm = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({ title: '', url: '', source: 'leetcode', difficulty: 'medium' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-ring focus:outline-none"/>
            </div>
            <div>
                <label htmlFor="url" className="block text-sm font-medium text-muted-foreground mb-1">URL</label>
                <input type="url" name="url" id="url" value={formData.url} onChange={handleChange} required className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-ring focus:outline-none"/>
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label htmlFor="source" className="block text-sm font-medium text-muted-foreground mb-1">Source</label>
                    <select name="source" id="source" value={formData.source} onChange={handleChange} className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-ring focus:outline-none">
                        <option value="leetcode">LeetCode</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label htmlFor="difficulty" className="block text-sm font-medium text-muted-foreground mb-1">Difficulty</label>
                    <select name="difficulty" id="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-ring focus:outline-none">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={isLoading} className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 w-32">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Problem'}
                </button>
            </div>
        </form>
    );
};

const StoryBankSection = ({ stories }) => {
    const [expanded, setExpanded] = useState(null);

    return (
        <SectionCard
            title="Behavioral Story Bank (STAR Method)"
            icon={<FileText className="w-6 h-6 text-accent-foreground" />}
            actionButton={
                <button className="flex items-center px-4 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-md hover:bg-primary/20 transitions">
                    <PlusCircle className="w-4 h-4 mr-2"/> Add Story
                </button>
            }
        >
             {stories.map((story, index) => (
                 <div key={story._id} className="border border-border rounded-lg bg-background overflow-hidden">
                     <h4 
                         className="font-semibold text-foreground p-4 cursor-pointer"
                         onClick={() => setExpanded(expanded === index ? null : index)}
                     >
                         {story.prompt}
                     </h4>
                     <AnimatePresence>
                     {expanded === index && (
                         <motion.div
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="px-4 pb-4 border-t border-border"
                         >
                             <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                                 <p><strong>Situation:</strong> {story.situation}</p>
                                 <p><strong>Task:</strong> {story.task}</p>
                                 <p><strong>Action:</strong> {story.action}</p>
                                 <p><strong>Result:</strong> {story.result}</p>
                             </div>
                         </motion.div>
                     )}
                     </AnimatePresence>
                  </div>
             ))}
        </SectionCard>
    );
};


// --- MAIN PAGE COMPONENT ---

const PreparationDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { currentPreparation, status, error } = useSelector((state) => state.interview);
    const [activeTab, setActiveTab] = useState('learning');
    
    // NEW STATE: To toggle between the details view and the live interview view
    const [isStartingInterview, setIsStartingInterview] = useState(false);

    useEffect(() => {
        // When returning from an interview, refresh the data to get the latest feedback
        if (!isStartingInterview && id) {
            dispatch(getPreparationById(id));
        }
    }, [id, dispatch, isStartingInterview]);

    const handleStartInterview = () => {
        setIsStartingInterview(true);
    };
    
    // This function will be passed to the SWEInterview component to return to this view
    const handleExitInterview = () => {
        setIsStartingInterview(false);
    }
    
    // If the view is toggled to the interview, render it full-screen
    if (isStartingInterview) {
        // Pass the exit handler to the SWEInterview component
        return <SWEInterview onExitInterview={handleExitInterview} />;
    }

    if (status === 'loading' && !currentPreparation) return <Loader />;
    if (status === 'failed' && !currentPreparation) return <ErrorMessage message={error} />;
    if (!currentPreparation) {
        return <ErrorMessage message="Preparation plan not found. It might have been deleted or the ID is incorrect." />;
    }

    const isLoading = status === 'loading';

    const tabs = [
        { id: 'learning', label: 'Learning Plan', icon: <BookOpen /> },
        { id: 'practice', label: 'Practice Zone', icon: <BrainCircuit /> },
        { id: 'assessment', label: 'AI Assessment', icon: <Bot /> },
    ];

    return (
        <div className="p-4 md:p-8 bg-background min-h-screen text-foreground">
            <PreparationHeader preparation={currentPreparation} />

            <div className="mb-6 border-b border-border">
                 <nav className="flex space-x-2 md:space-x-4 custom-scrollbar pb-1 -mb-px overflow-x-auto" aria-label="Tabs">
               <div className='flex mb-2 '>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center px-3 py-3 text-sm md:text-base font-bold font-heading whitespace-nowrap
                                ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
                            }
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    layoutId="underline"
                                />
                            )}
                        </button>
                    ))}
               </div>
                </nav>
            </div>

            <main>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'learning' && (
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1"><StudyTopicsSection topics={currentPreparation.learning.studyTopics} prepId={currentPreparation.id} isLoading={isLoading}/></div>
                                <div className="flex-1"><PreparedQuestionsSection questions={currentPreparation.learning.preparedQuestions} prepId={currentPreparation.id} isLoading={isLoading}/></div>
                            </div>
                        )}
                        {activeTab === 'practice' && (
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1"><PracticeProblemsSection problems={currentPreparation.practice.practiceProblems} prepId={currentPreparation.id} isLoading={isLoading} /></div>
                                <div className="flex-1"><StoryBankSection stories={currentPreparation.practice.storyBank} /></div>
                            </div>
                        )}
                        {activeTab === 'assessment' && (
                             <SectionCard
                                 title="Mock Interviews"
                                 icon={<Bot className="w-6 h-6 text-accent-foreground" />}
                             >
                                 <div className="text-center p-8 bg-background rounded-lg">
                                     <h4 className="text-lg font-bold font-heading mb-2">Ready to test your skills?</h4>
                                     <p className="text-muted-foreground mb-6">Start a mock interview with our AI to get real-time feedback and improve your performance.</p>
                                     <button 
                                        onClick={handleStartInterview}
                                        className="px-6 py-3 font-semibold text-primary-foreground bg-primary rounded-lg shadow-md hover:bg-primary/90 transition-all transform hover:scale-105"
                                    >
                                         Start AI Mock Interview
                                     </button>
                                 </div>
                                 <div className="mt-8">
                                     <h4 className="font-bold font-heading mb-4">Past Interviews</h4>
                                     {currentPreparation.assessment.aiMockInterviews.length === 0 ? (
                                         <p className="text-custom text-center py-4">No mock interviews completed yet.</p>
                                     ) : (
                                        <div className="space-y-3">
                                            {currentPreparation.assessment.aiMockInterviews.slice().reverse().map(interview => (
                                                <div key={interview._id} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                                                    <div>
                                                        <p className="font-semibold">{new Date(interview.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                        <p className="text-sm text-muted-foreground capitalize">{interview.type ? interview.type.replace('-', ' ') : 'General'} Interview</p>
                                                    </div>
                                                    {interview.aiFeedback?.overallScore && (
                                                        <div className="flex items-center gap-2 text-primary font-bold">
                                                            <Trophy className="w-5 h-5"/>
                                                            <span>{interview.aiFeedback.overallScore}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                     )}
                                 </div>
                             </SectionCard>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default PreparationDetails;