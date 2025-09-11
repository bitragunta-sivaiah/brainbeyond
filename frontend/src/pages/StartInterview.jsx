import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

// --- Redux Actions (Ensure this path is correct for your project) ---
import {
    fetchPreparationById,
    startInterview,
    respondToInterview,
    endInterview,
    clearCurrentInterview,
} from '../store/redux/interviewPreparationSlice';

// --- Icons ---
import { Mic, Send, StopCircle, Loader, AlertCircle, ArrowLeft, Volume2, Video, VideoOff, Upload } from 'lucide-react';
import { FaUserCircle } from 'react-icons/fa';

// =================================================================================
// --- HELPER & UI COMPONENTS ---
// =================================================================================

const Spinner = () => (
    <div className="flex justify-center items-center h-full">
        <Loader className="w-12 h-12 animate-spin text-primary" />
    </div>
);

const ErrorMessage = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center h-full bg-destructive/10 text-destructive p-8 rounded-lg">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold font-heading mb-2">An Error Occurred</h2>
        <p className="font-body max-w-md">{message || "Could not load the interview."}</p>
        <Link to="/" className="mt-6 bg-destructive text-destructive-foreground font-bold py-2 px-6 rounded-md hover:bg-opacity-80 transition-colors">
            Back to Dashboard
        </Link>
    </div>
);

const FeedbackLink = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 text-center bg-muted/50 p-6 rounded-lg border border-border"
    >
        <p className="font-semibold text-lg text-card-foreground mb-3">
            Help us improve! Your feedback is valuable.
        </p>
        <a
            href="https://forms.gle/FPwUorvBKKSuSjqq9" // Example link
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary text-primary-foreground font-bold py-2 px-6 rounded-md hover:bg-primary/90 transition-transform hover:scale-105"
        >
            Give Feedback
        </a>
        <p className="text-xs text-muted-foreground mt-4 max-w-xl mx-auto">
            <strong>Disclaimer:</strong> This is a beta feature. AI-generated feedback may occasionally be inaccurate.
        </p>
    </motion.div>
);

const useWindowSize = () => {
    const [size, setSize] = useState([0, 0]);
    useEffect(() => {
        const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return { width: size[0], height: size[1] };
};

const PreInterviewScreen = ({ 
    onStart, 
    onVoiceChange, 
    selectedVoice, 
    aiVoices, 
    videoRef, 
    onCameraToggle, 
    isCameraOn, 
    preparation,
    onAvatarChange,
    selectedAvatar,
    aiAvatars,
    user
}) => {
    const [config, setConfig] = useState({
        type: 'role-based',
        targetCompany: preparation.targetCompany || '',
        targetRole: preparation.targetRole || '',
        resume: null,
    });
    const [isSpeakingTest, setIsSpeakingTest] = useState(false);
    const fileInputRef = useRef(null);

    const handleConfigChange = (e) => {
        const { name, value, files } = e.target;
        setConfig(prev => ({ ...prev, [name]: files ? files[0] : value }));
    };

    const handleTestSpeak = useCallback(() => {
        if (typeof window.speechSynthesis === 'undefined' || !selectedVoice) return;
        const text = "This is a test of the selected voice.";
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voiceToUse = aiVoices.find(voice => voice.name === selectedVoice);
        if (voiceToUse) utterance.voice = voiceToUse;
        utterance.onstart = () => setIsSpeakingTest(true);
        utterance.onend = () => setIsSpeakingTest(false);
        utterance.onerror = () => setIsSpeakingTest(false);
        window.speechSynthesis.speak(utterance);
    }, [selectedVoice, aiVoices]);

    const handleStartClick = () => {
        if (!isCameraOn) {
            return toast.error("Please turn on your camera to start the interview.");
        }
        if (config.type === 'resume-based' && !config.resume) {
            return toast.error("Please upload a resume for a resume-based interview.");
        }
        onStart(config);
    };

    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-2 font-heading">Ready to Start?</h2>
            <p className="text-lg text-muted-foreground mb-6 font-body">Configure your setup before beginning.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                    <div className="w-full h-48 bg-black rounded-lg overflow-hidden border border-border flex items-center justify-center relative">
                        <video ref={videoRef} className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} autoPlay muted playsInline></video>
                        {!isCameraOn && (
                            user?.profileInfo?.avatar ? 
                                <img src={user.profileInfo.avatar} alt="Your avatar" className="absolute inset-0 w-full h-full object-cover" /> :
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
                                    <FaUserCircle size={40} />
                                    <p className="mt-2 text-sm">Camera is Off</p>
                                </div>
                        )}
                    </div>
                    <button onClick={onCameraToggle} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-body">
                        {isCameraOn ? <VideoOff size={20} /> : <Video size={20} />}
                        {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                    </button>
                    <div className="flex flex-col items-start text-left w-full">
                        <label htmlFor="ai-voice" className="font-semibold mb-2 text-foreground font-body">Select AI Voice:</label>
                        <div className="flex items-center gap-3 w-full">
                            <select id="ai-voice" value={selectedVoice} onChange={onVoiceChange} className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground font-body focus:ring-2 focus:ring-ring" disabled={isSpeakingTest}>
                                {aiVoices.map((voice) => (<option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>))}
                            </select>
                            <button type="button" onClick={handleTestSpeak} disabled={isSpeakingTest || !selectedVoice} className="p-2 rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed">
                                <Volume2 size={24} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-start text-left w-full pt-2">
                        <label className="font-semibold mb-3 text-foreground font-body">Select AI Avatar:</label>
                        <div className="flex flex-wrap items-center gap-4 w-full">
                            {aiAvatars.map((avatarUrl) => (
                                <button
                                    key={avatarUrl}
                                    onClick={() => onAvatarChange(avatarUrl)}
                                    className={`w-16 h-16 rounded-full overflow-hidden border-4 transition-all duration-200 ease-in-out ${selectedAvatar === avatarUrl ? 'border-primary scale-110 shadow-lg' : 'border-transparent hover:border-primary/50'}`}
                                >
                                    <img src={avatarUrl} alt="AI Avatar Option" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 text-left">
                    <div>
                        <label htmlFor="type" className="font-semibold mb-2 block text-foreground font-body">Interview Type:</label>
                        <select name="type" id="type" value={config.type} onChange={handleConfigChange} className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground font-body focus:ring-2 focus:ring-ring">
                            <option value="role-based">Role-Based</option>
                            <option value="resume-based">Resume-Based</option>
                            <option value="general">General Conversation</option>
                        </select>
                    </div>
                    {config.type === 'resume-based' && (
                        <div>
                            <label className="font-semibold mb-2 block text-foreground font-body">Upload Resume:</label>
                            <input type="file" name="resume" ref={fileInputRef} onChange={handleConfigChange} accept=".pdf,.doc,.docx,.png,.jpg" className="hidden" />
                            <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-accent">
                                <Upload size={20} />
                                {config.resume ? `${config.resume.name}` : 'Choose File (PDF, DOC, IMG)'}
                            </button>
                        </div>
                    )}
                    <div>
                        <label htmlFor="targetRole" className="font-semibold mb-2 block text-foreground font-body">Target Role:</label>
                        <input type="text" name="targetRole" id="targetRole" value={config.targetRole} onChange={handleConfigChange} className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground font-body focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                        <label htmlFor="targetCompany" className="font-semibold mb-2 block text-foreground font-body">Target Company (Optional):</label>
                        <input type="text" name="targetCompany" id="targetCompany" value={config.targetCompany} onChange={handleConfigChange} className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground font-body focus:ring-2 focus:ring-ring" placeholder="e.g., Google, Microsoft"/>
                    </div>
                </div>
            </div>
            
            <motion.button 
                onClick={handleStartClick}
                disabled={!isCameraOn}
                className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 bg-primary text-primary-foreground px-6 py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all transform shadow-lg font-body disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:scale-100"
                whileHover={isCameraOn ? { scale: 1.02 } : {}}
                whileTap={isCameraOn ? { scale: 0.98 } : {}}
            >
                {isCameraOn ? 'Start Interview' : 'Enable Camera to Start'}
            </motion.button>
        </div>
    );
};

const FinalReportScreen = ({ finalReport, onRestart }) => {
    const { width, height } = useWindowSize();
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (finalReport && finalReport.overallScore >= 70) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [finalReport]);

    if (!finalReport) {
        return <div className="text-center"><Spinner /><p>Generating your report...</p></div>;
    }

    return (
        <div className="text-center">
            {showConfetti && <Confetti width={width} height={height} recycle={false} />}
            <h2 className="text-3xl font-bold text-primary mb-4 font-heading">Interview Complete!</h2>
            <p className="text-lg text-muted-foreground mb-6 font-body">Here is your performance summary.</p>
            <div className="text-6xl font-display font-bold text-foreground mb-2">{finalReport.overallScore || 'N/A'}<span className="text-3xl text-muted-foreground font-body">/100</span></div>
            
            <div className="bg-muted/50 p-6 rounded-lg text-left prose prose-sm dark:prose-invert max-w-none mb-6 font-body whitespace-pre-wrap">
                <div dangerouslySetInnerHTML={{ __html: finalReport.overallFeedback }} />
            </div>

            <div className="text-left">
                <h3 className="text-xl font-bold mb-4 font-heading">Transcript & Feedback</h3>
                <div className="space-y-4 max-h-60 overflow-y-auto p-4 bg-background rounded-lg border border-border">
                    {finalReport.questions?.map((q, i) => (
                        q.studentRespondedAnswer && (
                            <div key={i} className="pb-2 border-b border-border last:border-b-0">
                                <p className="font-semibold text-card-foreground font-body">Q: {q.question}</p>
                                <p className="text-muted-foreground pl-4 border-l-2 border-primary ml-2 mt-1 font-body">A: {q.studentRespondedAnswer}</p>
                                {q.feedback && 
                                    <div 
                                        className="text-sm text-blue-500 pl-4 ml-2 mt-1 italic font-body prose prose-sm dark:prose-invert max-w-none" 
                                        dangerouslySetInnerHTML={{ __html: "<b>Feedback:</b> " + q.feedback }} 
                                    />
                                }
                            </div>
                        )
                    ))}
                </div>
            </div>

            <FeedbackLink />

            <button onClick={onRestart} className="mt-8 flex items-center justify-center gap-3 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                Try Another Interview
            </button>
        </div>
    );
};

// =================================================================================
// --- MAIN MOCK INTERVIEW COMPONENT ---
// =================================================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
}
const AudioContext = window.AudioContext || window.webkitAudioContext;

const MockInterview = () => {
    const { planId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const utteranceRef = useRef(null);
    const transcriptBeforePause = useRef("");
    const lastSpokenTexts = useRef({ feedback: null, nextQuestion: null });
    const timersRef = useRef({
        midSpeechPause: null,
        noiseCheck: null,
        cameraCheck: null,
        continueButtonTimeout: null,
    });

    const { user } = useSelector(state => state.auth);
    const { currentPreparation, currentInterview, isLoading, isError, message } = useSelector(state => state.interviewPrep);

    const [interviewStatus, setInterviewStatus] = useState('idle');
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [mediaStream, setMediaStream] = useState(null);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [showContinueButton, setShowContinueButton] = useState(false);
    const [noiseWarnings, setNoiseWarnings] = useState(0);
    const [multipleVoiceWarnings, setMultipleVoiceWarnings] = useState(0);
    const [aiVoices, setAiVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [speakingQueue, setSpeakingQueue] = useState([]);
    const [currentSpokenText, setCurrentSpokenText] = useState("");
    const [aiAvatars] = useState([
        'https://img.freepik.com/premium-photo/robot-with-eyes-open-eyes-are-open_1309810-19537.jpg',
        'https://img.freepik.com/premium-photo/captivating-image-futuristic-ai-robot-with-headphones-showcasing-convergence-technology-human-like-features_856795-92318.jpg',
    ]);
    const [selectedAvatar, setSelectedAvatar] = useState(aiAvatars[0]);

    const clearAllTimers = useCallback(() => {
        Object.values(timersRef.current).forEach(timer => {
            if (timer) clearTimeout(timer);
        });
    }, []);
    
    const handleEndInterview = useCallback((reason) => {
        if (interviewStatus !== 'started' && interviewStatus !== 'ending') return;
        setInterviewStatus('ending'); // Prevent multiple triggers
        
        const toastOptions = { duration: 6000, icon: '🛑' };
        let toastMessage = 'Interview ended.';
        switch(reason) {
            case 'visibility_change': toastMessage = 'Interview ended. Please stay on the interview page.'; break;
            case 'excessive_noise': toastMessage = 'Interview ended due to excessive background noise.'; break;
            case 'camera_off': toastMessage = 'Interview ended. Your camera must remain on.'; break;
            case 'multiple_voices': toastMessage = 'Interview ended: Multiple voices were detected.'; toastOptions.icon = '👥'; break;
            default: toastMessage = 'You have ended the interview.'; toastOptions.icon = '👋'; break;
        }
        toast.error(toastMessage, toastOptions);
        
        clearAllTimers();
        window.speechSynthesis.cancel();
        if (recognition) recognition.abort();

        // **This is where the webcam and mic are turned off**
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
        }
        
        setInterviewStatus('ended');
        if (currentInterview?.interviewId) {
            dispatch(endInterview({ planId, interviewId: currentInterview.interviewId }));
        }
    }, [interviewStatus, mediaStream, dispatch, planId, currentInterview, clearAllTimers]);
    
    useEffect(() => {
        dispatch(fetchPreparationById(planId));
        const populateVoices = () => {
            const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
            if (voices.length > 0) {
                setAiVoices(voices);
                const defaultVoice = voices.find(v => v.name.includes('Google') || v.name.includes('David')) || voices[0];
                setSelectedVoice(defaultVoice.name);
            }
        };
        populateVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
             window.speechSynthesis.onvoiceschanged = populateVoices;
        }
        return () => {
            // Cleanup function when component unmounts
            clearAllTimers();
            window.speechSynthesis.cancel();
            if (recognition) recognition.abort();
            // Also turn off camera/mic if user navigates away
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            dispatch(clearCurrentInterview());
        };
    }, [planId, dispatch, clearAllTimers, mediaStream]);

    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream, interviewStatus]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && interviewStatus === 'started') {
                handleEndInterview('visibility_change');
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [interviewStatus, handleEndInterview]);

    // useEffect to handle the timeout for the "Continue" button
    useEffect(() => {
        clearTimeout(timersRef.current.continueButtonTimeout);
        if (showContinueButton) {
            timersRef.current.continueButtonTimeout = setTimeout(() => {
                setShowContinueButton(false); // Hide "Continue" and show "Submit"
            }, 3000); // 3-second timeout
        }
        return () => {
            clearTimeout(timersRef.current.continueButtonTimeout);
        };
    }, [showContinueButton]);

    const detectMultipleVoices = useCallback((audioFrequencyData) => {
        return false;
    }, []);

    const setupAudioAnalysis = useCallback(async (stream) => {
        if (!AudioContext || audioContextRef.current || !stream.getAudioTracks().length) return;
        try {
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 512;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkAudio = () => {
                if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setIsUserSpeaking(average > 15); 
                if (average > 25 && !isUserSpeaking) {
                    setNoiseWarnings(prev => {
                        const newCount = prev + 1;
                        if (newCount === 1) toast('High background noise detected.', { icon: '🤫' });
                        if (newCount >= 3) handleEndInterview('excessive_noise');
                        return newCount;
                    });
                }
                if (detectMultipleVoices(dataArray)) {
                    setMultipleVoiceWarnings(prev => {
                        const newCount = prev + 1;
                        toast.error(`Warning ${newCount}/3: Multiple voices detected.`, { icon: '👥' });
                        if (newCount >= 3) handleEndInterview('multiple_voices');
                        return newCount;
                    });
                }
                timersRef.current.noiseCheck = requestAnimationFrame(checkAudio);
            };
            checkAudio();
        } catch(error) {
            console.error("Audio analysis setup failed:", error);
        }
    }, [isUserSpeaking, handleEndInterview, detectMultipleVoices]);

    const speak = useCallback((text, onEndCallback) => {
        if (!text || typeof window.speechSynthesis === 'undefined') {
            if (onEndCallback) onEndCallback();
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voiceToUse = aiVoices.find(voice => voice.name === selectedVoice);
        if (voiceToUse) utterance.voice = voiceToUse;
        utterance.onstart = () => {
            setCurrentSpokenText(text);
            setIsSpeaking(true);
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEndCallback) onEndCallback();
        };
        utterance.onerror = (e) => {
            console.error("SpeechSynthesis Error:", e);
            setIsSpeaking(false);
            if (onEndCallback) onEndCallback();
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [aiVoices, selectedVoice]);

    // Effect to populate the speaking queue based on API response structure
    useEffect(() => {
        if (interviewStatus !== 'started' || !currentInterview) return;
        
        const { feedback, nextQuestion, question } = currentInterview;
        const currentQuestion = nextQuestion || question;
        const newQueue = [];

        if (feedback && lastSpokenTexts.current.feedback !== feedback) {
            newQueue.push(feedback);
            lastSpokenTexts.current.feedback = feedback;
        }
        if (currentQuestion && lastSpokenTexts.current.nextQuestion !== currentQuestion) {
            newQueue.push(currentQuestion);
            lastSpokenTexts.current.nextQuestion = currentQuestion;
        }

        if (newQueue.length > 0) {
            setSpeakingQueue(q => [...q, ...newQueue]);
        }
    }, [currentInterview, interviewStatus]);

    // Effect to process the speaking queue
    useEffect(() => {
        if (!isSpeaking && speakingQueue.length > 0) {
            const [nextText, ...rest] = speakingQueue;
            setSpeakingQueue(rest);

            const isLastInQueue = rest.length === 0;
            const onEndCallback = isLastInQueue
                ? () => {
                    transcriptBeforePause.current = ""; 
                    if (interviewStatus === 'started' && recognition) {
                        try {
                           recognition.start();
                        } catch (e) {
                           console.error("Recognition start error:", e);
                        }
                    }
                }
                : null;
            speak(nextText, onEndCallback);
        }
    }, [isSpeaking, speakingQueue, speak, interviewStatus]);

    useEffect(() => {
        if (!recognition) return;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (e) => {
            console.error("Speech Recognition Error:", e.error);
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            clearTimeout(timersRef.current.midSpeechPause);
            setShowContinueButton(false);
            
            let currentSessionTranscript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            setTranscript(transcriptBeforePause.current + currentSessionTranscript);
            
            if (event.results[event.results.length - 1].isFinal) {
                timersRef.current.midSpeechPause = setTimeout(() => {
                    if (isListening) recognition.stop();
                    setShowContinueButton(true);
                }, 2000); 
            }
        };
    }, [isListening]);

    const handleCameraToggle = useCallback(async (enable) => {
        if (timersRef.current.cameraCheck) clearInterval(timersRef.current.cameraCheck);
        if (enable) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setMediaStream(stream);
                setIsCameraOn(true);
                await setupAudioAnalysis(stream);
                timersRef.current.cameraCheck = setInterval(() => {
                    if (stream.getVideoTracks()[0]?.readyState === 'ended') {
                        handleEndInterview('camera_off');
                    }
                }, 3000);
            } catch (err) {
                toast.error("Camera and Mic access are required.");
                setIsCameraOn(false);
            }
        } else {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            setMediaStream(null);
            setIsCameraOn(false);
        }
    }, [mediaStream, setupAudioAnalysis, handleEndInterview]);
    
    const handleStartInterview = useCallback((config) => {
        if (!isCameraOn) {
            return toast.error("Please enable your camera to start.");
        }
        const formData = new FormData();
        formData.append('type', config.type);
        formData.append('targetRole', config.targetRole);
        formData.append('targetCompany', config.targetCompany);
        if (config.resume) formData.append('resume', config.resume);
        
        dispatch(startInterview({ planId, config: formData }))
            .unwrap()
            .then(() => setInterviewStatus('started'))
            .catch(() => setInterviewStatus('idle'));
    }, [planId, dispatch, isCameraOn]);

    const handleSubmitAnswer = () => {
        if (!transcript.trim()) return toast.error("Please provide an answer.");
        clearAllTimers();
        if (isListening) recognition.stop();
        setShowContinueButton(false);
        transcriptBeforePause.current = "";
        dispatch(respondToInterview({ planId, interviewId: currentInterview.interviewId, answer: transcript }));
        setTranscript('');
    };
    
    const handleContinueSpeaking = () => {
        setShowContinueButton(false);
        transcriptBeforePause.current = transcript.trim() ? transcript.trim() + ' ' : '';
        if (recognition && !isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Recognition restart error:", e);
            }
        }
    };

    const finalReport = useMemo(() => {
        if (!currentPreparation?.aiMockInterviews || !currentInterview?.interviewId) return null;
        return currentPreparation.aiMockInterviews.find(i => i._id === currentInterview.interviewId);
    }, [currentPreparation, currentInterview]);

    if (!currentPreparation && isLoading) return <div className="bg-background text-foreground min-h-screen flex items-center justify-center"><Spinner /></div>;
    if (isError) return <ErrorMessage message={message} />;
    if (!currentPreparation) return null;

    const renderContent = () => {
        if (interviewStatus === 'ended') {
            return <FinalReportScreen finalReport={finalReport} onRestart={() => { setInterviewStatus('idle'); dispatch(clearCurrentInterview()); }} />;
        }

        if (interviewStatus === 'started' && currentInterview) {
            return (
                 <div className="flex flex-col h-full">
                     <div className="flex-grow grid grid-cols-2 gap-4 md:gap-8 mb-4">
                         <motion.div className="flex flex-col items-center justify-center" animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}>
                             <img src={selectedAvatar} alt="AI Interviewer" className="w-24 h-24 rounded-full object-cover border-4 border-accent-foreground shadow-lg"/>
                             <p className="mt-2 font-semibold">AI Interviewer</p>
                         </motion.div>
                         <div className="flex flex-col items-center justify-center">
                             <motion.div className="w-24 h-24 rounded-full bg-black overflow-hidden border-4 border-primary shadow-lg relative" animate={{ scale: isUserSpeaking ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                                 <video ref={videoRef} className={`w-full h-full object-cover ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} autoPlay muted playsInline></video>
                                 {!isCameraOn && (user?.profileInfo?.avatar ? 
                                     <img src={user.profileInfo.avatar} alt="Your avatar" className="w-full h-full object-cover" /> :
                                     <div className="absolute inset-0 flex items-center justify-center bg-black/70"><FaUserCircle size={40} className="text-gray-500" /></div>
                                 )}
                                 {isListening && <div className="absolute bottom-1 right-1 p-1 bg-red-500 rounded-full animate-pulse"><Mic size={12} className="text-white"/></div>}
                             </motion.div>
                              <p className="mt-2 font-semibold">{user?.username || 'You'}</p>
                         </div>
                     </div>
                     <div className="text-center my-4 p-4 bg-muted/50 rounded-lg min-h-[6rem] flex items-center justify-center">
                         <p className="text-lg font-semibold text-card-foreground">
                            {isSpeaking ? currentSpokenText : (lastSpokenTexts.current.nextQuestion || "Loading question...")}
                         </p>
                     </div>
                     <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder={isListening ? "Listening..." : "Your answer..."} className="w-full h-28 p-4 bg-background border-2 border-border rounded-lg" disabled={isLoading || isSpeaking}/>
                     <div className="flex items-center justify-between gap-4 mt-4">
                         <button onClick={() => handleEndInterview('user_request')} className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90">
                             <StopCircle size={20} /> End
                         </button>
                         
                         <div className="flex-grow flex justify-end">
                            {showContinueButton ? (
                                <button onClick={handleContinueSpeaking} className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-yellow-500 text-black hover:bg-yellow-600 animate-pulse">
                                    <Mic size={20} /> Continue
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSubmitAnswer} 
                                    disabled={!transcript.trim() || isSpeaking || isLoading || isListening} 
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader className="animate-spin" size={20}/> : <Send size={20} />} 
                                    Submit
                                </button>
                            )}
                         </div>
                     </div>
                 </div>
            );
        }
        
        return <PreInterviewScreen 
            onStart={handleStartInterview}
            onVoiceChange={(e) => setSelectedVoice(e.target.value)} 
            selectedVoice={selectedVoice} 
            aiVoices={aiVoices} 
            videoRef={videoRef} 
            onCameraToggle={() => handleCameraToggle(!isCameraOn)} 
            isCameraOn={isCameraOn} 
            preparation={currentPreparation}
            aiAvatars={aiAvatars}
            selectedAvatar={selectedAvatar}
            onAvatarChange={(avatarUrl) => setSelectedAvatar(avatarUrl)}
            user={user}
        />;
    };

    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col items-center justify-center p-4 font-body">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 flex flex-col min-h-[85vh]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold font-heading text-primary">{currentPreparation.targetRole} Interview</h1>
                    <button onClick={() => navigate(`/interview-prep/${planId}`)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
                        <ArrowLeft size={16} /> Back to Plan
                    </button>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                    {renderContent()}
                </div>
            </motion.div>
        </div>
    );
};

export default MockInterview;