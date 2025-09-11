import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    fetchPreparationById,
    generateQuestions,
    generateResources,
    deleteBulkQuestions,
    deleteBulkResources,
    updateResource,
    toggleQuestionPin,
} from '../store/redux/interviewPreparationSlice';
import {
    Briefcase, Building2, CheckCircle, BrainCircuit, BookOpen, Bot,
    ChevronDown, Trash2, Pin, Loader, AlertCircle, Sparkles,
    Link as LinkIcon, FileText, Youtube, Code, Lightbulb, X // Added X icon
} from 'lucide-react';
import { FaGraduationCap } from "react-icons/fa";
import { GiTalk } from "react-icons/gi";

// --- Helper Components ---

const Spinner = () => (
    <div className="flex justify-center items-center min-h-[50vh]">
        <Loader className="w-12 h-12 animate-spin text-primary" />
    </div>
);

const ErrorMessage = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center min-h-[50vh] bg-destructive/10 text-destructive rounded-lg p-8">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold font-heading mb-2">An Error Occurred</h2>
        <p className="font-body max-w-md">{message || "Could not load the preparation plan."}</p>
        <Link to="/dashboard" className="mt-6 bg-destructive text-destructive-foreground font-bold py-2 px-6 rounded-md hover:bg-opacity-80 transition-colors">
            Back to Dashboard
        </Link>
    </div>
);

const Section = ({ icon: IconComponent, title, count, children }) => (
    <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card p-4 sm:p-6 rounded-xl shadow-md border border-border mb-8"
    >
        <header className="flex items-center mb-6">
            <IconComponent className="w-8 h-8 text-primary mr-4" />
            <h2 className="text-xl md:text-3xl font-bold font-heading text-card-foreground flex items-center gap-3">
                {title}
                {typeof count !== 'undefined' && (
                    <span className="text-lg font-sans font-bold bg-muted text-muted-foreground px-3 py-1 rounded-full">
                        {count}
                    </span>
                )}
            </h2>
        </header>
        {children}
    </motion.section>
);

const SanitizedHtml = ({ content }) => {
    return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
};

// --- Custom Hooks for Logic Abstraction ---

const useQuestionManagement = (planId) => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector(state => state.interviewPrep);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    
    const handleGenerateQuestions = useCallback(() => dispatch(generateQuestions(planId)), [dispatch, planId]);
    
    const handleDeleteSelected = useCallback(() => {
        if (!selectedQuestions.length) return;
        dispatch(deleteBulkQuestions({ planId, questionIds: selectedQuestions }));
        setSelectedQuestions([]);
    }, [dispatch, planId, selectedQuestions]);
    
    const toggleSelection = useCallback((id) => {
        setSelectedQuestions(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]);
    }, []);
    
    const handlePinToggle = useCallback((questionId) => {
        dispatch(toggleQuestionPin({ planId, questionId }));
    }, [dispatch, planId]);

    return { isLoading, selectedQuestions, handleGenerateQuestions, handleDeleteSelected, toggleSelection, handlePinToggle };
};

const useResourceManagement = (planId) => {
    const dispatch = useDispatch();
    const [selectedResources, setSelectedResources] = useState([]);

    const handleDeleteSelected = useCallback(() => {
        if (!selectedResources.length) return;
        dispatch(deleteBulkResources({ planId, resourceIds: selectedResources }));
        setSelectedResources([]);
    }, [dispatch, planId, selectedResources]);

    const toggleSelection = useCallback((resourceId) => {
        setSelectedResources(prev => prev.includes(resourceId) ? prev.filter(id => id !== resourceId) : [...prev, resourceId]);
    }, []);

    const handleResourceUpdate = useCallback((resourceId, resourceData) => {
        dispatch(updateResource({ planId, resourceId, resourceData }));
    }, [dispatch, planId]);

    return { selectedResources, handleDeleteSelected, toggleSelection, handleResourceUpdate };
};


// --- Component Definitions ---

// --- NEW How-To-Use Guide Component ---
const HowToUseGuide = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative bg-primary/10 border-l-4 border-primary p-6 rounded-lg mb-8"
        >
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary/20 text-primary"
                aria-label="Dismiss guide"
            >
                <X size={20} />
            </button>
            <div className="flex items-start">
                <Lightbulb className="w-8 h-8 mr-4 text-primary flex-shrink-0" />
                <div>
                    <h3 className="font-bold font-heading text-lg mb-2 text-foreground">How to Use This Preparation Plan</h3>
                    <p className="text-sm text-muted-foreground mb-4">Here’s a quick guide to get the most out of this page:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li><strong>Start New Mock Interview:</strong> Click this button in the header to begin an interactive AI-powered mock interview session.</li>
                        <li><strong>Practice Questions:</strong> Use the <span className="font-semibold text-foreground">"Generate with AI"</span> button to get a list of relevant questions. You can <span className="font-semibold text-foreground">Pin</span> important ones to keep them at the top. Use the checkboxes to select and delete multiple questions at once.</li>
                        <li><strong>Study Resources:</strong> Generate helpful articles, videos, and courses. You can also <span className="font-semibold text-foreground">Pin</span> your favorites and rate their usefulness with the dropdown menu.</li>
                        <li><strong>AI Mock Interview History:</strong> Review the scores and detailed feedback from all your past mock interview sessions for this plan.</li>
                    </ul>
                </div>
            </div>
        </motion.div>
    );
};


const PlanHeader = React.memo(({ plan }) => {
    const statusStyles = useMemo(() => ({
        'not-started': 'bg-muted text-muted-foreground',
        'in-progress': 'bg-blue-500/20 text-blue-500',
        'completed': 'bg-primary/20 text-primary',
    }), []);

    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 p-6 bg-card rounded-xl shadow-md border border-border">
            <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4 break-words">{plan.title}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-muted-foreground font-body">
                <div className="flex items-center gap-2"><Briefcase size={18} /> {plan.targetRole}</div>
                <div className="flex items-center gap-2"><Building2 size={18} /> {plan.targetCompany}</div>
                <div className="flex items-center gap-2"><FaGraduationCap size={18} /> {plan.experienceLevel}</div>
                <div className="flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${statusStyles[plan.status]}`}>{plan.status.replace('-', ' ')}</span>
                </div>
            </div>
            <div className="mt-6 border-t border-border pt-6">
                <Link to={`/interview-prep/session/${plan._id}`}>
                    <button className="flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg">
                        <GiTalk size={22} />
                        Start New Mock Interview
                    </button>
                </Link>
            </div>
        </motion.div>
    );
});

const QuestionItem = React.memo(({ question, isSelected, onToggleSelect, onPinToggle }) => {
    const [isAnswerVisible, setIsAnswerVisible] = useState(false);
    const difficultyStyles = useMemo(() => ({
        easy: 'bg-green-500/20 text-green-700 dark:text-green-300',
        medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
        hard: 'bg-red-500/20 text-red-700 dark:text-red-300'
    }), []);

    return (
        <motion.div layout className="bg-muted/30 p-4 rounded-lg border border-border/80 transition-shadow hover:shadow-md">
            <div className="flex items-start gap-4">
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(question._id)} className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary" aria-label={`Select question: ${question.question}`} />
                <div className="flex-1">
                    <p className="text-card-foreground font-medium">{question.question}</p>
                    <div className="flex items-center flex-wrap gap-3 mt-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize ${difficultyStyles[question.difficulty]}`}>{question.difficulty}</span>
                        {question.aiGeneratedAnswers?.[0] && (
                            <button onClick={() => setIsAnswerVisible(!isAnswerVisible)} className="flex items-center gap-1 text-sm text-primary font-semibold">
                                <Lightbulb size={14} />{isAnswerVisible ? 'Hide' : 'Show'} Answer
                            </button>
                        )}
                    </div>
                </div>
                <button onClick={() => onPinToggle(question._id)} className="p-2 text-muted-foreground hover:bg-accent rounded-full" aria-label={question.isPinned ? 'Unpin question' : 'Pin question'}>
                    {question.isPinned ? <Pin size={18} className="text-primary fill-primary"/> : <Pin size={18} />}
                </button>
            </div>
            <AnimatePresence>
                {isAnswerVisible && (
                    <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: '16px' }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="overflow-hidden">
                        <div className="p-4 bg-background rounded-md border border-border">
                            <SanitizedHtml content={question.aiGeneratedAnswers[0]} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

const QuestionsSection = ({ plan }) => {
    const { isLoading, selectedQuestions, handleGenerateQuestions, handleDeleteSelected, toggleSelection, handlePinToggle } = useQuestionManagement(plan._id);

    return (
        <Section icon={BrainCircuit} title="Practice Questions" count={plan.questions?.length || 0}>
            <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <button onClick={handleGenerateQuestions} disabled={isLoading} className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md font-semibold hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {isLoading ? <Loader className="animate-spin" size={20}/> : <Sparkles size={20} />}
                    <span>Generate with AI</span>
                </button>
                <AnimatePresence>
                    {selectedQuestions.length > 0 && (
                        <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={handleDeleteSelected} className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-semibold hover:bg-destructive/90 transition-colors">
                            <Trash2 size={20} /><span>Delete ({selectedQuestions.length})</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </header>
            <motion.div layout className="space-y-4">
                {plan.questions?.length > 0 ? (
                    [...plan.questions].sort((a, b) => b.isPinned - a.isPinned).map(q => <QuestionItem key={q._id} question={q} isSelected={selectedQuestions.includes(q._id)} onToggleSelect={toggleSelection} onPinToggle={handlePinToggle} />)
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-border rounded-lg"><p className="text-muted-foreground">No questions yet. Generate some with AI!</p></div>
                )}
            </motion.div>
        </Section>
    );
};

const ResourceItem = React.memo(({ resource, isSelected, onToggleSelect, onUpdate }) => {
    const resourceIcons = useMemo(() => ({
        article: <FileText size={20} />, video: <Youtube size={20} />, course: <FaGraduationCap size={20} />,
        documentation: <Code size={20} />, book: <BookOpen size={20} />, other: <LinkIcon size={20} />,
    }), []);

    const recommendationConfig = useMemo(() => ({
        best: { class: 'bg-green-500/20 text-green-700 dark:text-green-300', label: 'Best' },
        good: { class: 'bg-blue-500/20 text-blue-700 dark:text-blue-300', label: 'Good' },
        average: { class: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300', label: 'Average' },
        poor: { class: 'bg-red-500/20 text-red-700 dark:text-red-300', label: 'Poor' },
    }), []);

    const handlePinToggle = () => onUpdate(resource._id, { isPinned: !resource.isPinned });
    const handleRecommendationChange = (e) => onUpdate(resource._id, { recommendation: e.target.value });
    
    const currentRecommendation = recommendationConfig[resource.recommendation] || recommendationConfig.average;

    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-muted/30 p-4 rounded-lg border border-border/80 flex flex-col justify-between gap-3 hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-3">
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(resource._id)} className="mt-1.5 h-5 w-5 rounded border-border text-primary focus:ring-primary" />
                <div className="flex-1 flex items-start gap-3">
                    <div className="text-primary mt-1">{resourceIcons[resource.type] || resourceIcons.other}</div>
                    <div className="flex-1">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-card-foreground hover:underline break-all">{resource.name}</a>
                        <p className="text-sm text-muted-foreground capitalize">{resource.type}</p>
                    </div>
                </div>
                <button onClick={handlePinToggle} className="p-2 text-muted-foreground hover:bg-accent rounded-full">
                    {resource.isPinned ? <Pin size={18} className="text-primary fill-primary" /> : <Pin size={18} />}
                </button>
            </div>
            <div className="flex justify-end items-center gap-4 pl-8">
                <span className="text-sm font-bold text-muted-foreground">Order: {resource.recommendedOrder}</span>
                <select value={resource.recommendation} onChange={handleRecommendationChange} className={`bg-transparent text-xs font-bold rounded-full py-0.5 pl-2 pr-1 border-2 border-transparent hover:border-border cursor-pointer focus:ring-1 focus:ring-primary ${currentRecommendation.class}`}>
                    {Object.keys(recommendationConfig).map(key => (
                        <option key={key} value={key} className="bg-background text-foreground font-bold">{recommendationConfig[key].label}</option>
                    ))}
                </select>
            </div>
        </motion.div>
    );
});

const ResourcesSection = React.memo(({ plan }) => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector(state => state.interviewPrep);
    const { selectedResources, handleDeleteSelected, toggleSelection, handleResourceUpdate } = useResourceManagement(plan._id);

    const handleGenerateResources = useCallback(() => {
        dispatch(generateResources(plan._id));
    }, [dispatch, plan._id]);

    const sortedResources = useMemo(() => {
        if (!plan.studyResources) return [];
        return [...plan.studyResources].sort((a, b) => b.isPinned - a.isPinned || a.recommendedOrder - b.recommendedOrder);
    }, [plan.studyResources]);

    return (
        <Section icon={BookOpen} title="Study Resources" count={plan.studyResources?.length || 0}>
            <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <button onClick={handleGenerateResources} disabled={isLoading} className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md font-semibold hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {isLoading ? <Loader className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    <span>Generate with AI</span>
                </button>
                <AnimatePresence>
                    {selectedResources.length > 0 && (
                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleDeleteSelected} className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-semibold hover:bg-destructive/90">
                            <Trash2 size={20} /><span>Delete ({selectedResources.length})</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </header>
            {sortedResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedResources.map((res) => (
                        <ResourceItem 
                            key={res._id}
                            resource={res}
                            isSelected={selectedResources.includes(res._id)}
                            onToggleSelect={toggleSelection}
                            onUpdate={handleResourceUpdate}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-lg"><p className="text-muted-foreground">No study resources found. Generate some!</p></div>
            )}
        </Section>
    );
});


const InterviewsSection = React.memo(({ plan }) => (
    <Section icon={Bot} title="AI Mock Interview History" count={plan.aiMockInterviews?.length || 0}>
        <div className="space-y-4">
            {plan.aiMockInterviews?.length > 0 ? (
                [...plan.aiMockInterviews].reverse().map(interview => (
                    <details key={interview._id} className="bg-muted/30 p-4 rounded-lg border border-border/80 transition-shadow hover:shadow-lg group">
                        <summary className="flex justify-between items-center cursor-pointer list-none">
                            <div className="flex-1">
                                <p className="font-semibold text-card-foreground">Interview on: {new Date(interview.interviewDate).toLocaleDateString()}</p>
                                <p className="text-sm text-muted-foreground">{interview.targetRole} for {interview.targetCompany}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="font-bold text-2xl text-primary font-heading">{interview.overallScore || 'N/A'}/100</p>
                                    <p className="text-xs text-muted-foreground">Overall Score</p>
                                </div>
                                <ChevronDown className="group-open:rotate-180 transition-transform" />
                            </div>
                        </summary>
                        <div className="mt-4 pt-4 border-t border-border">
                            <h4 className="font-bold mb-2">Overall Feedback:</h4>
                            <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{interview.overallFeedback}</p>
                            <h4 className="font-bold mb-2">Transcript:</h4>
                            <div className="space-y-3 text-sm">
                                {interview.questions.map((q) => (
                                    <div key={q._id}>
                                        <p className="font-semibold text-card-foreground">Q: {q.question}</p>
                                        {q.studentRespondedAnswer ? (
                                            <>
                                                <p className="text-muted-foreground pl-4 border-l-2 border-primary ml-2 mt-1">A: {q.studentRespondedAnswer}</p>
                                                {q.feedback && <p className="text-blue-500 pl-4 border-l-2 border-blue-500 ml-2 mt-1 italic">Feedback: {q.feedback}</p>}
                                            </>
                                        ) : (
                                            <p className="text-muted-foreground/70 pl-4 border-l-2 border-muted ml-2 mt-1 italic">A: No answer provided.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </details>
                ))
            ) : (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-lg"><p className="text-muted-foreground">No mock interview history. Start one to practice!</p></div>
            )}
        </div>
    </Section>
));

const FeedbackLink = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-12 text-center bg-card p-6 rounded-lg border border-border shadow-md"
    >
        <p className="font-semibold text-lg text-card-foreground mb-3">
            Help us improve this feature! Your feedback is valuable.
        </p>
        <a
            href="https://forms.gle/FPwUorvBKKSuSjqq9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary text-primary-foreground font-bold py-2 px-6 rounded-md hover:bg-primary/90 transition-transform hover:scale-105"
        >
            Give Feedback
        </a>
        <p className="text-xs text-muted-foreground mt-4 max-w-xl mx-auto">
            <strong>Disclaimer:</strong> This is a beta feature. AI-generated questions, answers, and resources may occasionally be inaccurate or incomplete. Please use this as a supplementary tool for your interview preparation.
        </p>
    </motion.div>
);


const PreparationDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { currentPreparation, isLoading, isError, message } = useSelector(state => state.interviewPrep);

    useEffect(() => {
        if (id) {
            dispatch(fetchPreparationById(id));
        }
    }, [id, dispatch]);

    if (isLoading && !currentPreparation) return <Spinner />;
    if (isError) return <ErrorMessage message={message} />;
    if (!currentPreparation) return <ErrorMessage message="The preparation plan could not be found." />;
    
    return (
        <div className="bg-background text-foreground min-h-screen">
            <main className="container mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
                <PlanHeader plan={currentPreparation} />
                {/* --- ADDED HOW-TO GUIDE --- */}
                <HowToUseGuide />
                <QuestionsSection plan={currentPreparation} />
                <ResourcesSection plan={currentPreparation} />
                <InterviewsSection plan={currentPreparation} />
                <FeedbackLink />
            </main>
        </div>
    );
};

export default PreparationDetails;