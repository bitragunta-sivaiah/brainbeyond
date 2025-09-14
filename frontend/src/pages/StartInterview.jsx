import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import toast from 'react-hot-toast';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// --- REDUX THUNKS ---
import {
    startMockInterview,
    endMockInterview,
    uploadResume,
    getNextQuestion,
} from '../store/redux/interviewPreparationSlice';

// --- ICONS ---
import {
    ChevronRight, Lightbulb, CheckCircle, Mic, Volume2, Pause, Play,
    Repeat, Shield, Lock, Wifi, Captions, Settings, PhoneOff, Bot, User, BrainCircuit, BarChart, Trophy, FileUp, Loader2, X, Clock, HelpCircle, VideoOff
} from 'lucide-react';
import { FaClipboardList } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

// --- CONFIGURATION & CONSTANTS ---
const INTERVIEW_DURATION_SECONDS = 1200; // 20 minutes
const AI_STATUS = {
    SPEAKING: 'speaking',
    LISTENING: 'listening',
    THINKING: 'thinking',
    IDLE: 'idle',
};

const TIPS = [
    { icon: <BrainCircuit className="w-6 h-6 text-primary" />, title: "Master Data Structures & Algorithms", description: "Practice problems on platforms like LeetCode. Focus on understanding time and space complexity." },
    { icon: <FaClipboardList className="text-xl text-primary" />, title: "Use the STAR Method", description: "For behavioral questions, structure your answers using Situation, Task, Action, and Result." },
    { icon: <Bot className="w-6 h-6 text-primary" />, title: "Think Out Loud", description: "Explain your thought process. Interviewers care about how you approach problems, not just the final answer." },
    { icon: <CheckCircle className="w-6 h-6 text-primary" />, title: "Test Your Code", description: "Always consider edge cases and walk through your solution with an example to prove it works." },
];

// --- HELPER & NEW FEATURE COMPONENTS ---

const SectionCard = ({ icon, title, children, className = "" }) => (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 shadow-md w-full ${className}`}>
        <div className="flex items-center mb-4">
            <div className="p-2 bg-accent rounded-full mr-4">{icon}</div>
            <h3 className="text-lg md:text-xl font-heading font-bold text-card-foreground">{title}</h3>
        </div>
        <div>{children}</div>
    </div>
);

const Loader = ({ text }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <Loader className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-semibold">{text}</p>
    </div>
);

const Tooltip = ({ text, children }) => (
    <div className="relative group flex items-center">
        {children}
        <div className="absolute bottom-full mb-2 w-max px-3 py-1.5 text-sm font-semibold text-primary-foreground bg-primary rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {text}
        </div>
    </div>
);

// Custom hook for microphone testing logic
const useMicTest = () => {
    const [micVolume, setMicVolume] = useState(0);
    const [isTestingMic, setIsTestingMic] = useState(false);
    const audioContextRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const mediaStreamRef = useRef(null);

    const stopMicTest = useCallback(() => {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
        if (audioContextRef.current?.state !== "closed") audioContextRef.current?.close();

        animationFrameIdRef.current = null;
        mediaStreamRef.current = null;
        audioContextRef.current = null;

        setMicVolume(0);
        setIsTestingMic(false);
    }, []);

    const startMicTest = useCallback(async () => {
        setIsTestingMic(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            const context = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = context;
            const analyser = context.createAnalyser();
            const source = context.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const draw = () => {
                animationFrameIdRef.current = requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setMicVolume(Math.min(100, average * 1.5));
            };
            draw();
        } catch (err) {
            toast.error("Microphone access denied.");
            setIsTestingMic(false);
        }
    }, []);

    useEffect(() => () => stopMicTest(), [stopMicTest]);

    return { micVolume, isTestingMic, startMicTest, stopMicTest };
};

// NEW: More professional SpeakingIndicator
const SpeakingIndicator = () => (
    <motion.div
        className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none"
        animate={{
            scale: [1, 1.05, 1],
            opacity: [0, 0.8, 0],
        }}
        transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
        }}
    />
);


const SettingsModal = ({ isOpen, onClose, micVolume, isTestingMic, onToggleMicTest, onPlaySound }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md border border-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-heading font-bold text-card-foreground">Device Settings</h3>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X /></button>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">The interview is paused. Test your devices below.</p>
                        <div className="space-y-2">
                             <button onClick={onToggleMicTest} className={`w-full flex items-center justify-center gap-2 py-2 rounded-md transition ${isTestingMic ? 'bg-destructive/80' : 'bg-secondary'} text-secondary-foreground`}>
                                 <Mic className="w-5 h-5" /> {isTestingMic ? 'Stop Test' : 'Test Mic'}
                            </button>
                            <div className="w-full bg-input h-2 rounded-full overflow-hidden">
                                <motion.div className="bg-primary h-full" animate={{ width: `${micVolume}%` }} transition={{ duration: 0.1 }} />
                            </div>
                        </div>
                         <button onClick={onPlaySound} className="w-full flex items-center justify-center gap-2 bg-secondary py-2 rounded-md hover:bg-muted transition text-secondary-foreground">
                            <Volume2 className="w-5 h-5" /> Play Test Sound
                        </button>
                        <button onClick={onClose} className="w-full mt-4 bg-primary text-primary-foreground font-bold py-3 rounded-lg">
                            Resume Interview
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};


// --- UI SECTIONS ---

const IntroSection = ({ onNext }) => (
     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 md:p-8 space-y-8">
        <h2 className="font-display text-3xl md:text-4xl text-foreground">Ace Your SWE Interview</h2>
        <p className="text-md md:text-lg text-muted-foreground font-body">
            Welcome! This AI-powered mock interview is designed to simulate a real-world technical screening.
        </p>
        <div className="space-y-6">
            <h3 className="font-heading text-xl md:text-2xl font-bold">Tips for Success</h3>
            {TIPS.map((tip, i) => (
                <motion.div key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 * i }}
                    className="flex items-start p-4 bg-card border border-border rounded-lg shadow-sm"
                >
                    {tip.icon}
                    <div className="ml-4">
                        <h4 className="font-heading font-bold text-card-foreground">{tip.title}</h4>
                        <p className="text-muted-foreground text-sm">{tip.description}</p>
                    </div>
                </motion.div>
            ))}
        </div>
        <div className="text-right pt-4">
            <button
                onClick={onNext}
                className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-lg shadow-md hover:bg-primary/90 transition-all transform hover:scale-105 flex items-center gap-2 ml-auto"
            >
                Continue to Setup <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    </motion.div>
);

const SetupSection = ({ preparationId, onStart, status }) => {
    const dispatch = useDispatch();
    const { micVolume, isTestingMic, startMicTest, stopMicTest } = useMicTest();
    // NEW: State to track camera permissions
    const [isCameraReady, setIsCameraReady] = useState(false);

    const [interviewConfig, setInterviewConfig] = useState({
        type: 'behavioral',
        difficulty: 'medium',
        resumeFile: null,
        resumeUrl: '',
        resumeContent: ''
    });
    const [uploading, setUploading] = useState(false);

    const handleConfigChange = (e) => setInterviewConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setInterviewConfig(prev => ({ ...prev, resumeFile: file }));
        setUploading(true);
        try {
            const result = await dispatch(uploadResume({ id: preparationId, resumeFile: file })).unwrap();
            setInterviewConfig(prev => ({ ...prev, resumeUrl: result.url, resumeContent: result.extractedText }));
            toast.success("Resume processed successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to process resume.");
            setInterviewConfig(prev => ({ ...prev, resumeFile: null }));
        } finally {
            setUploading(false);
        }
    };

    const playTestSound = () => {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
        audio.play().catch(e => console.error("Error playing test sound:", e));
    };

    const handleStart = () => {
        stopMicTest();
        // NEW: Enforce camera access before starting
        if (!isCameraReady) {
            toast.error("Please enable your camera to start the interview.");
            return;
        }
        if (interviewConfig.type === 'resume-based' && !interviewConfig.resumeUrl) {
            toast.error("Please upload a resume for this interview type.");
            return;
        }
        onStart(interviewConfig);
    };
    
    // NEW: Added warning about closing other apps for a better experience.
    const sideInfo = [
        { icon: Clock, title: "Expect to spend ~20 minutes", desc: "This simulates a typical first-round technical screen." },
        { icon: Wifi, title: "Ensure a Stable Environment", desc: "For best results, close other applications and ensure a stable internet connection." },
        { icon: HelpCircle, title: "Need assistance? Just ask", desc: "During the interview, you can ask the AI to repeat or clarify a question." },
        { icon: Shield, title: "Your data is in your control", desc: "Your interview recording and feedback are private." },
    ];

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 md:p-8 flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-2/3 space-y-6">
                <h2 className="font-display text-3xl md:text-4xl text-foreground">Device & Interview Setup</h2>

                <SectionCard icon={<Settings className="w-6 h-6 text-primary" />} title="Configure Your Interview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-muted-foreground mb-1">Interview Type</label>
                            <select id="type" name="type" value={interviewConfig.type} onChange={handleConfigChange} className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-ring focus:outline-none">
                                <option value="behavioral">Behavioral</option>
                                <option value="technical-quiz">Technical Quiz</option>
                                <option value="system-design">System Design</option>
                                <option value="resume-based">Resume-Based</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="difficulty" className="block text-sm font-medium text-muted-foreground mb-1">Difficulty</label>
                            <select id="difficulty" name="difficulty" value={interviewConfig.difficulty} onChange={handleConfigChange} className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-ring focus:outline-none">
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        {interviewConfig.type === 'resume-based' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Upload Resume (.pdf, .docx)</label>
                                <div className="relative">
                                    <input type="file" id="resume-upload" onChange={handleFileChange} accept=".pdf,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} />
                                    <label htmlFor="resume-upload" className="flex items-center justify-center gap-2 w-full bg-input border-2 border-dashed border-border rounded-md px-3 py-3 text-muted-foreground cursor-pointer">
                                        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                                        <span>{uploading ? 'Processing...' : (interviewConfig.resumeFile ? interviewConfig.resumeFile.name : 'Choose a file')}</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* NEW: Webcam status overlay */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border shadow-lg relative flex items-center justify-center">
                    <Webcam
                        audio={false}
                        className="w-full h-full object-cover"
                        mirrored={true}
                        onUserMedia={() => setIsCameraReady(true)}
                        onUserMediaError={() => setIsCameraReady(false)}
                    />
                    {!isCameraReady && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4">
                            <VideoOff className="w-12 h-12 mb-4" />
                            <h3 className="font-bold text-lg">Camera Access Required</h3>
                            <p className="text-center text-sm text-muted-foreground">Please grant camera permissions in your browser to proceed.</p>
                        </div>
                    )}
                </div>

                <div className="bg-card border border-border p-4 rounded-lg space-y-4">
                    <h3 className="font-heading font-bold text-lg">Test Your Devices</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <button onClick={() => isTestingMic ? stopMicTest() : startMicTest()} className={`w-full flex items-center justify-center gap-2 py-2 rounded-md transition ${isTestingMic ? 'bg-destructive/80 text-white hover:bg-destructive' : 'bg-secondary hover:bg-muted text-secondary-foreground'}`}>
                                <Mic className="w-5 h-5" />
                                <span>{isTestingMic ? 'Stop Test' : 'Test Mic'}</span>
                            </button>
                            <div className="w-full bg-input h-4 rounded-full overflow-hidden">
                                <motion.div className="bg-primary h-full" animate={{ width: `${micVolume}%` }} transition={{ duration: 0.1 }} />
                            </div>
                        </div>
                        <button onClick={playTestSound} className="flex-1 flex items-center justify-center gap-2 bg-secondary py-2 rounded-md hover:bg-muted transition text-secondary-foreground">
                            <Volume2 className="w-5 h-5" /> <span>Play Test Sound</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/3 space-y-4 pt-0 lg:pt-16">
                 <div className="bg-card border border-border p-6 rounded-lg shadow-md space-y-5">
                    <h3 className="font-heading font-bold text-lg">Things to Know</h3>
                    {sideInfo.map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <item.icon className="w-6 h-6 text-primary mt-1 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-card-foreground">{item.title}</h4>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleStart}
                    // FIX: Button is disabled if camera is not ready
                    disabled={status === 'loading' || !isCameraReady}
                    className="w-full bg-primary text-primary-foreground font-bold py-4 text-lg rounded-lg shadow-lg hover:bg-primary/90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? <Loader2 className="animate-spin" /> : 'Start Now'}
                </button>
            </div>
        </motion.div>
    );
};


const InterviewSection = ({ initialQuestion, onEnd, onNextQuestion, interviewConfig }) => {
    const { user } = useSelector(state => state.auth || {});
    const [timeLeft, setTimeLeft] = useState(INTERVIEW_DURATION_SECONDS);
    const [transcript, setTranscript] = useState([{ speaker: 'ai', content: initialQuestion, timestamp: new Date() }]);
    const [aiStatus, setAiStatus] = useState(AI_STATUS.IDLE);
    const hasSpokenInitialQuestion = useRef(false);
    const transcriptEndRef = useRef(null);
    const isEndingRef = useRef(false); // NEW: Prevent multiple end calls

    const [isPaused, setIsPaused] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { micVolume, isTestingMic, startMicTest, stopMicTest } = useMicTest();

    const { interimTranscript, finalTranscript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

    const speak = useCallback((text) => {
        const speakNow = () => {
            window.speechSynthesis.cancel();
            setAiStatus(AI_STATUS.SPEAKING);
            const utterance = new SpeechSynthesisUtterance(text);

            utterance.onend = () => {
                setAiStatus(AI_STATUS.LISTENING);
                if (browserSupportsSpeechRecognition && !isPaused) {
                    SpeechRecognition.startListening({ continuous: false });
                }
            };

            const voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('David')));
            utterance.voice = englishVoice || voices.find(v => v.lang.startsWith('en'));

            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = speakNow;
        } else {
            speakNow();
        }
    }, [browserSupportsSpeechRecognition, isPaused]);

    const pauseInterview = useCallback(() => {
        setIsPaused(true);
        SpeechRecognition.stopListening();
        window.speechSynthesis.cancel();
        setAiStatus(AI_STATUS.IDLE);
    }, []);

    const resumeInterview = useCallback(() => {
        setIsPaused(false);
        stopMicTest();
        const lastQuestion = transcript.filter(t => t.speaker === 'ai').pop()?.content;
        if (lastQuestion) {
            toast("Resuming interview...", { icon: '▶️' });
            speak(`Let's continue. The last question was: ${lastQuestion}`);
        }
    }, [transcript, speak, stopMicTest]);

    const handleEndInterview = useCallback(async () => {
        // NEW: Check ref to ensure this only runs once
        if (isEndingRef.current) return;
        isEndingRef.current = true;

        setIsPaused(true);
        setAiStatus(AI_STATUS.IDLE);
        SpeechRecognition.stopListening();
        window.speechSynthesis.cancel();
        const finalUtterance = finalTranscript || interimTranscript;
        const finalTranscriptPayload = finalUtterance
            ? [...transcript, { speaker: 'user', content: finalUtterance, timestamp: new Date() }]
            : transcript;
        await onEnd({ finalTranscript: finalTranscriptPayload });
    }, [transcript, onEnd, finalTranscript, interimTranscript]);
    
    // NEW: Effect to auto-end interview on tab switch
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                toast.error("Tab switch detected. Ending interview.", { duration: 4000 });
                handleEndInterview();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleEndInterview]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, aiStatus]);

    useEffect(() => {
        if (isPaused) return;
        if (timeLeft <= 0) {
            toast.success("Time's up! Generating feedback.");
            handleEndInterview();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, handleEndInterview, isPaused]);

    useEffect(() => {
        if (!finalTranscript || isPaused) return;
        setAiStatus(AI_STATUS.THINKING);
        const userEntry = { speaker: 'user', content: finalTranscript, timestamp: new Date() };
        const newTranscriptForApi = [...transcript, userEntry];

        setTranscript(newTranscriptForApi);
        resetTranscript();

        onNextQuestion({ transcript: newTranscriptForApi })
            .then(nextQuestion => {
                if (nextQuestion) {
                    const aiEntry = { speaker: 'ai', content: nextQuestion, timestamp: new Date() };
                    setTranscript(prev => [...prev, aiEntry]);
                    speak(nextQuestion);
                } else {
                    handleEndInterview();
                }
            })
            .catch(error => {
                toast.error("An AI error occurred. Ending interview.");
                handleEndInterview();
            });
    }, [finalTranscript, isPaused, transcript, resetTranscript, onNextQuestion, speak, handleEndInterview]);

    useEffect(() => {
        if (!browserSupportsSpeechRecognition) {
            toast.error("Your browser doesn't support speech recognition.", { duration: 6000 });
            return;
        }
        if (!hasSpokenInitialQuestion.current && initialQuestion) {
            hasSpokenInitialQuestion.current = true;
            setTimeout(() => speak(initialQuestion), 1000);
        }
    }, [initialQuestion, speak, browserSupportsSpeechRecognition]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // NEW: Helper to format the interview title dynamically
    const formatTitle = (config) => {
        if (!config) return 'SWE Interview';
        const type = config.type.replace('-', ' ');
        return `${config.difficulty} ${type} Interview`.replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full bg-background flex flex-col p-2 md:p-4 fixed inset-0">
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => { setIsSettingsOpen(false); resumeInterview(); }}
                micVolume={micVolume}
                isTestingMic={isTestingMic}
                onToggleMicTest={() => isTestingMic ? stopMicTest() : startMicTest()}
                onPlaySound={() => new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg').play()}
            />

            <div className="flex-grow bg-card border border-border rounded-lg p-4 md:p-6 overflow-y-auto custom-scrollbar relative">
                <div className="max-w-4xl mx-auto space-y-6 pb-24">
                    {transcript.map((entry, index) => (
                        <div key={index} className={`flex gap-4 items-start ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                           {entry.speaker === 'ai' && <Bot className="w-8 h-8 p-1.5 bg-primary text-primary-foreground rounded-full shrink-0" />}
                            <div className={`max-w-xl p-4 rounded-lg font-body shadow-md ${entry.speaker === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-muted-foreground rounded-bl-none'}`}>
                                {entry.content}
                            </div>
                           {entry.speaker === 'user' && <User className="w-8 h-8 p-1.5 bg-secondary text-secondary-foreground rounded-full shrink-0" />}
                        </div>
                    ))}
                    {aiStatus === AI_STATUS.THINKING && (
                         <div className="flex gap-4 items-start justify-start">
                            <Bot className="w-8 h-8 p-1.5 bg-primary text-primary-foreground rounded-full shrink-0" />
                            <div className="max-w-xl p-4 rounded-lg font-body bg-muted text-muted-foreground rounded-bl-none flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse "/>
                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"/>
                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-400"/>
                            </div>
                         </div>
                    )}
                    <div ref={transcriptEndRef} />
                </div>
            </div>

            <div className="fixed bottom-24 right-4 w-[150px] h-[112px] md:w-[340px] md:h-[280px] rounded-lg overflow-hidden border-2 border-primary shadow-2xl group z-10">
                <Webcam audio={false} className="w-full h-full object-cover" mirrored={true} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <p className="text-white text-xs md:text-sm font-bold drop-shadow-lg">{user?.username || 'You'}</p>
                </div>
                {/* FIX: Using new, more visible speaking indicator */}
                {listening && <SpeakingIndicator />}
            </div>
            {interimTranscript && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-full z-20">
                    <p className="text-center p-3 bg-black/60 text-white rounded-lg text-lg font-medium">{interimTranscript}</p>
                </motion.div>
            )}

            <div className="flex-shrink-0 bg-background pt-3">
                <div className="flex items-center justify-between p-2 md:p-3 bg-card border border-border rounded-lg">
                    <div className="hidden md:flex items-center gap-4">
                        {/* FIX: Dynamic interview title */}
                        <span className="font-heading font-bold text-lg">{formatTitle(interviewConfig)}</span>
                        <div className="w-px h-6 bg-border" />
                        {/* FIX: Shows remaining and total time */}
                        <span className="font-mono text-lg flex items-center gap-2">
                            {isPaused ? <Pause className="text-primary"/> : `${formatTime(timeLeft)} / ${formatTime(INTERVIEW_DURATION_SECONDS)}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 mx-auto">
                        <Tooltip text={isPaused ? "Resume" : "Settings & Pause"}>
                            <button aria-label={isPaused ? "Resume Interview" : "Pause Interview"} onClick={() => { setIsSettingsOpen(true); pauseInterview(); }} className="p-3 bg-secondary rounded-full text-secondary-foreground hover:bg-muted transition">
                                {isPaused ? <Play className="w-5 h-5"/> : <Settings className="w-5 h-5"/>}
                            </button>
                        </Tooltip>
                        <Tooltip text="End Interview">
                            <button aria-label="End Interview" onClick={handleEndInterview} className="p-3 bg-destructive rounded-full text-destructive-foreground hover:bg-destructive/90 transition"><PhoneOff className="w-5 h-5"/></button>
                        </Tooltip>
                    </div>
                     <div className="hidden md:flex items-center gap-4">
                        <Tooltip text="Live Captions Enabled">
                           <Captions className="w-5 h-5 text-primary"/>
                        </Tooltip>
                        <div className="flex items-center gap-2 text-green-500">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm font-semibold">Secure</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ScoreBar = ({ label, score }) => (
    <div>
        <div className="flex justify-between mb-1">
            <span className="font-semibold text-sm capitalize">{label.replace(/([A-Z])/g, ' $1')}</span>
            <span className="text-sm font-bold text-primary">{score}/10</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
            <motion.div
                className="bg-primary h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${score * 10}%`}}
                transition={{ duration: 0.8 }}
            />
        </div>
    </div>
);

const FeedbackSection = ({ onRestart, status }) => {
    const latestInterview = useSelector(state => state.interview.currentPreparation?.assessment?.aiMockInterviews?.slice(-1)[0]);

    if (status === 'loading' || (status === 'succeeded' && !latestInterview?.aiFeedback)) {
        return <Loader text="Analyzing your performance and generating feedback..." />;
    }

    if (!latestInterview || !latestInterview.aiFeedback) {
        return (
            <div className="p-8 text-center">
                <h3 className="text-2xl font-bold text-destructive">Feedback Error</h3>
                <p className="text-muted-foreground mt-2">Could not load feedback report. Please try another interview.</p>
                 <button onClick={onRestart} className="mt-6 bg-primary text-primary-foreground font-bold py-3 px-8 rounded-lg">
                    Try Again
                </button>
            </div>
        );
    }

    const { aiFeedback } = latestInterview;
    const { communicationAnalysis, contentAnalysis } = aiFeedback;
    const circularProgressStyles = buildStyles({
        rotation: 0.25, strokeLinecap: 'round', textSize: '16px',
        pathTransitionDuration: 0.5, pathColor: `hsl(var(--primary))`,
        textColor: `hsl(var(--foreground))`, trailColor: `hsl(var(--muted))`,
    });

    const renderCommunicationValue = (key, value) => {
        if (key === 'fillerWords' && typeof value === 'object') {
            return `${value.count} (${value.words.slice(0, 3).join(', ') || 'none'})`;
        }
        return String(value).replace(/-/g, ' ');
    };

    const SuggestedAnswer = ({ answer }) => {
        const sections = answer.split(/\n\n\d+\.\s*\*\*/);
        return (
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <p>{sections[0]}</p>
                <ol className="list-decimal list-inside space-y-3">
                    {sections.slice(1).map((section, index) => {
                        const [title, ...content] = section.split(/\*\*\s*:\s*\n/);
                        return (
                            <li key={index}>
                                <strong className="font-semibold text-card-foreground">{title.replace(/\*/g, '')}</strong>
                                <p className="mt-1 pl-2 whitespace-pre-line">{content.join(':\n').replace(/(\n\s*\*\s*)/g, '\n• ').trim()}</p>
                            </li>
                        );
                    })}
                </ol>
            </div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center">AI-Powered Feedback</h2>
            <p className="text-md md:text-lg text-muted-foreground font-body text-center max-w-3xl mx-auto">
                Here's a breakdown of your performance. Use these insights to improve for your next interview.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-1 space-y-6">
                    <SectionCard icon={<Trophy className="w-6 h-6 text-primary" />} title="Overall Score">
                        <div className="w-40 h-40 md:w-48 md:h-48 mx-auto">
                             <CircularProgressbar
                                value={aiFeedback.overallScore}
                                text={`${aiFeedback.overallScore}%`}
                                styles={circularProgressStyles}
                            />
                        </div>
                    </SectionCard>
                     <SectionCard icon={<BarChart className="w-6 h-6 text-primary" />} title="Communication">
                        <ul className="space-y-3 font-body">
                            {Object.entries(communicationAnalysis || {}).map(([key, value]) => (
                                 <li key={key} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="font-bold text-foreground capitalize">{renderCommunicationValue(key, value)}</span>
                                 </li>
                            ))}
                        </ul>
                    </SectionCard>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <SectionCard icon={<Lightbulb className="w-6 h-6 text-primary" />} title="Performance Summary">
                       <p className="text-muted-foreground font-body leading-relaxed">{aiFeedback.performanceSummary}</p>
                    </SectionCard>
                     <SectionCard icon={<BrainCircuit className="w-6 h-6 text-primary" />} title="Content Analysis">
                        <div className="space-y-6">
                            {Object.entries(contentAnalysis || {}).filter(([key]) => key !== 'useOfKeywords').map(([key, value]) => (
                                <div key={key}>
                                    <ScoreBar label={key} score={value.score} />
                                    <p className="text-xs text-muted-foreground mt-1.5">{value.feedback}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

                {aiFeedback.suggestedAnswers && aiFeedback.suggestedAnswers.length > 0 && (
                 <div className="md:col-span-3">
                      <SectionCard icon={<CheckCircle className="w-6 h-6 text-green-500" />} title="Example of a Strong Answer">
                        <h4 className="font-semibold text-card-foreground mb-4">For the question: <span className="italic">"{aiFeedback.suggestedAnswers[0].question}"</span></h4>
                        <SuggestedAnswer answer={aiFeedback.suggestedAnswers[0].suggestedAnswer} />
                      </SectionCard>
                 </div>
                )}
            </div>
            <div className="text-center pt-6">
                <button
                    onClick={onRestart}
                    className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-lg shadow-md hover:bg-primary/90 transition-all transform hover:scale-105"
                >
                    Take Another Interview
                </button>
            </div>
        </motion.div>
    );
};


// --- MAIN PAGE COMPONENT ---
const SWEInterview = ({ onExitInterview }) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { status } = useSelector(state => state.interview);

    const [activeSection, setActiveSection] = useState('intro');
    // FIX: Added interviewConfig to state to pass it down
    const [interviewSession, setInterviewSession] = useState({
        mockInterviewId: null,
        firstQuestion: '',
        interviewConfig: null,
    });

    const sections = [
        { id: 'intro', title: 'Introduction & Tips' },
        { id: 'setup', title: 'Device Setup' },
        { id: 'interview', title: 'SWE Interview' },
        { id: 'feedback', title: 'AI-Powered Feedback' },
    ];
    const currentSectionIndex = sections.findIndex(s => s.id === activeSection);

    const handleStartInterview = async (interviewData) => {
        try {
            const result = await dispatch(startMockInterview({ id, interviewData })).unwrap();
            setInterviewSession({
                mockInterviewId: result.mockInterviewId,
                firstQuestion: result.firstQuestion,
                interviewConfig: interviewData, // Store config
            });
            setActiveSection('interview');
        } catch (error) {
            toast.error(error.message || "Could not start interview. Please try again.");
        }
    };

    const handleNextQuestion = useCallback(async ({ transcript }) => {
        try {
            const nextQuestion = await dispatch(getNextQuestion({
                id,
                mockId: interviewSession.mockInterviewId,
                transcript
            })).unwrap();
            return nextQuestion;
        } catch (error) {
            console.error("Failed to fetch next question:", error);
            return "I seem to have encountered a temporary issue. Let's move on. Can you tell me about a time you had to learn a new technology quickly?";
        }
    }, [dispatch, id, interviewSession.mockInterviewId]);

    const handleEndInterview = useCallback(async ({ finalTranscript }) => {
        try {
            await dispatch(endMockInterview({ id, mockId: interviewSession.mockInterviewId, transcript: finalTranscript })).unwrap();
        } catch (error) {
            toast.error(error.message || "Could not generate feedback. Please try again.");
        } finally {
            setActiveSection('feedback');
        }
    }, [dispatch, id, interviewSession.mockInterviewId]);

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'intro':
                return <IntroSection onNext={() => setActiveSection('setup')} />;
            case 'setup':
                return <SetupSection preparationId={id} onStart={handleStartInterview} status={status} />;
            case 'feedback':
                return <FeedbackSection onRestart={() => setActiveSection('intro')} status={status}/>;
            case 'interview':
                 return <InterviewSection
                    initialQuestion={interviewSession.firstQuestion}
                    onEnd={handleEndInterview}
                    onNextQuestion={handleNextQuestion}
                    interviewConfig={interviewSession.interviewConfig} // Pass config
                />;
            default:
                return <IntroSection onNext={() => setActiveSection('setup')} />;
        }
    };

    if (activeSection === 'interview') {
        return renderActiveSection();
    }

    return (
        <div className="  flex-wrap  bg-background text-foreground flex font-body">
            <aside className="w-full max-w-sm bg-card border-r border-border p-8 hidden lg:flex flex-col">
                <div className="flex items-center justify-between mb-12">
                    <h1 className="font-display text-2xl text-primary">AI Mock Interview</h1>
                    <Tooltip text="Exit">
                        <button aria-label="Exit Interview" onClick={onExitInterview} className="text-muted-foreground hover:text-foreground">
                            <X className="w-6 h-6" />
                        </button>
                    </Tooltip>
                </div>
                <nav>
                    <ul className="space-y-2">
                        {sections.map((section, index) => (
                             <li key={section.id} className="relative">
                                <button
                                    onClick={() => activeSection !== 'interview' && setActiveSection(section.id)}
                                    className={`w-full text-left flex items-center p-3 rounded-lg transition-colors ${activeSection === section.id ? 'bg-accent text-accent-foreground font-bold' : 'hover:bg-muted'}`}
                                    disabled={activeSection === 'interview' || (index > currentSectionIndex && status !== 'succeeded')}
                                >
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${currentSectionIndex >= index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                        {currentSectionIndex > index ? <MdVerified  className="w-5 h-5"/> : index + 1}
                                    </span>
                                    {section.title}
                                </button>
                                {index < sections.length - 1 && (
                                     <div className={`absolute left-[27px] z-0 h-full w-0.5 mt-1 ${currentSectionIndex > index ? 'bg-primary' : 'bg-border'}`} style={{ top: '24px' }} />
                                )}
                             </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <main className="w-full lg:flex-1 overflow-y-auto custom-scrollbar">
                 <AnimatePresence mode="wait">
                      <div key={activeSection}>
                          {renderActiveSection()}
                      </div>
                 </AnimatePresence>
            </main>
        </div>
    );
};

export default SWEInterview;