import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { performAtsCheck, resetAtsState } from '../store/redux/atsSlice';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { File, Loader2, ArrowRight, XCircle, Trash2 } from 'lucide-react';
import Confetti from 'react-confetti';
import 'react-circular-progressbar/dist/styles.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { IoIosRefresh } from 'react-icons/io';
// Icons for different file types
import { FaFilePdf, FaFileWord, FaFileAlt, FaFileImage } from 'react-icons/fa';

// Custom Error Alert Component
const ErrorAlert = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg bg-red-600 text-white flex items-center space-x-3 max-w-sm sm:max-w-md"
    role="alert"
  >
    <XCircle className="w-6 h-6 flex-shrink-0" />
    <p className="font-semibold text-sm sm:text-base flex-grow">{message}</p>
    <button
      onClick={onClose}
      className="ml-auto p-1 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      aria-label="Close alert"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  </motion.div>
);

// Helper component to render file-specific icons
const FileIcon = ({ file }) => {
    if (!file) return <File className="h-6 w-6 text-indigo-500" />;
    const type = file.type;
    if (type.includes('pdf')) return <FaFilePdf className="h-6 w-6 text-red-500" />;
    if (type.includes('word')) return <FaFileWord className="h-6 w-6 text-blue-500" />;
    if (type.includes('text')) return <FaFileAlt className="h-6 w-6 text-gray-500" />;
    if (type.includes('image')) return <FaFileImage className="h-6 w-6 text-teal-500" />;
    return <File className="h-6 w-6 text-indigo-500" />;
};


const AtsResumeChecker = () => {
  const dispatch = useDispatch();
  const { analysisData, isLoading, isSuccess, isError, message } = useSelector((state) => state.ats);

  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [windowDimension, setWindowDimension] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Ref for the results section to auto-scroll
  const resultsRef = useRef(null);

  // Effect to handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to manage the display of results, confetti, and error alerts
  useEffect(() => {
    if (isLoading) {
      setShowResults(false);
      setShowConfetti(false);
      setShowErrorAlert(false);
    } else if (isSuccess && analysisData && analysisData.geminiAnalysis) {
      setShowResults(true);
      setShowErrorAlert(false);
      if (analysisData.geminiAnalysis.atsScore >= 80) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
      }
    } else if (isError) {
      setShowResults(false);
      setShowConfetti(false);
      if (message) {
        setShowErrorAlert(true);
      }
    } else {
      setShowResults(false);
      setShowConfetti(false);
      setShowErrorAlert(false);
    }
  }, [isSuccess, analysisData, isLoading, isError, message]);

  // Effect to auto-scroll to results when they appear
  useEffect(() => {
    if (showResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showResults]);

  // **CORRECTED useDropzone to accept multiple file types**
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setResumeFile(file);
        dispatch(resetAtsState());
        setShowErrorAlert(false);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescriptionText.trim()) {
      toast.error('Please upload a resume and enter a job description.');
      return;
    }
    dispatch(performAtsCheck({ resumeFile, jobDescriptionText }));
  };

  const handleReset = () => {
    dispatch(resetAtsState());
    setResumeFile(null);
    setJobDescriptionText('');
    setShowConfetti(false);
    setShowErrorAlert(false);
  };

  const dropzoneClasses = `
    mt-4 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200
    ${isDragActive ? 'border-primary bg-accent/20 dark:bg-accent/10' : 'border-border hover:border-primary/50 dark:hover:border-primary'}
    flex flex-col items-center justify-center space-y-3
  `;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 50) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getPathColor = (score) => {
    if (score >= 80) return '#10B981'; // Emerald
    if (score >= 50) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const atsScore = analysisData?.geminiAnalysis?.atsScore || 0;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 font-body antialiased">
      <AnimatePresence>
        {showConfetti && (
          <Confetti
            width={windowDimension.width}
            height={windowDimension.height}
            recycle={false}
            numberOfPieces={500}
            tweenDuration={5000}
          />
        )}
        {showErrorAlert && message && (
          <ErrorAlert message={message} onClose={() => setShowErrorAlert(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl bg-background mx-auto space-y-10"
      >
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-display text-primary mb-4 tracking-tight leading-tight">
            ATS Resume Checker 🚀
          </h1>
          <p className="text-lg text-custom max-w-2xl mx-auto leading-relaxed">
            Get an instant, AI-powered analysis of your resume's compatibility with any job description to boost your chances of landing that interview.
          </p>
        </div>

        {/* Form Section */}
        {(!showResults || isError) && (
          <form onSubmit={handleSubmit} className="bg-card shadow-xl rounded-2xl p-6 sm:p-10 space-y-8 border border-border">
            <div className="space-y-3">
              <label htmlFor="job-description" className="block text-sm sm:text-base font-semibold text-foreground">
                Job Description
              </label>
              <textarea
                id="job-description"
                value={jobDescriptionText}
                onChange={(e) => setJobDescriptionText(e.target.value)}
                placeholder="Paste the job description here..."
                required
                rows={8}
                className="w-full p-4 border border-input rounded-lg bg-input text-foreground resize-y focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 custom-scrollbar"
                aria-label="Job Description Textarea"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-semibold text-foreground mb-3">
                Upload Resume (<span className="text-primary">PDF, DOCX, TXT, etc.</span>)
              </label>
              {!resumeFile ? (
                <div {...getRootProps()} className={dropzoneClasses}>
                  <input {...getInputProps()} aria-label="Upload Resume File Input" />
                  <File className="h-10 w-10 text-custom" />
                  <p className="text-sm text-custom text-center font-medium">
                    Drag 'n' drop your file here, or <span className="text-primary font-bold hover:underline">click to select a file</span>
                  </p>
                  <p className="text-xs text-custom">Max file size: 10MB</p>
                </div>
              ) : (
                <div className="mt-4 p-4 border border-border rounded-lg bg-card flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileIcon file={resumeFile} />
                    <span className="truncate text-sm font-medium text-foreground">{resumeFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="text-destructive hover:text-destructive-foreground transition-colors p-1 rounded-full hover:bg-destructive/10"
                    aria-label="Remove resume file"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 rounded-lg text-secondary-foreground bg-secondary hover:bg-secondary/80 transition-colors font-semibold shadow-md flex items-center justify-center space-x-2"
                aria-label="Reset Form"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading || !resumeFile || !jobDescriptionText}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                aria-label="Check Resume"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Check Resume</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Analysis Results Section */}
        {showResults && analysisData && analysisData.geminiAnalysis && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="bg-card shadow-xl rounded-2xl p-6 sm:p-10 space-y-8 border border-border"
          >
            <h2 className="text-3xl font-heading text-center text-primary mb-6">
              Analysis Results 📊
            </h2>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* ATS Match Score Card */}
              <div className="lg:col-span-1 flex flex-col items-center p-6 rounded-xl bg-background shadow-md border border-border">
                <h3 className="text-xl font-heading text-primary mb-4">ATS Match Score</h3>
                <div className="w-40 h-40">
                  <CircularProgressbar
                    value={atsScore}
                    text={`${atsScore}%`}
                    styles={buildStyles({
                      pathColor: getPathColor(atsScore),
                      textColor: getPathColor(atsScore),
                      trailColor: 'var(--muted)', // A neutral gray color for the trail
                      backgroundColor: 'transparent',
                    })}
                  />
                </div>
                <p className={`mt-6 text-base text-center ${getScoreColor(atsScore)} font-bold`}>
                  {atsScore >= 80 ? "Excellent Match!" :
                    atsScore >= 50 ? "Good Potential!" : "Needs Work!"}
                </p>
                <p className="mt-2 text-sm text-custom text-center">
                  This score indicates how well your resume aligns with the job description.
                </p>
              </div>

              {/* Summary of Analysis Card */}
              <div className="lg:col-span-2 p-6 rounded-xl bg-background shadow-md border border-border">
                <h3 className="text-xl font-heading text-primary mb-4">Summary of Analysis</h3>
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisData.geminiAnalysis.summary}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Other result cards... (no changes needed below this line) */}
            
            <div className="grid md:grid-cols-2 gap-8">
                {/* Keywords Breakdown Card */}
                <div className="p-6 rounded-xl bg-background shadow-md border border-border">
                    <h3 className="text-xl font-heading text-primary mb-4">
                        Keywords Breakdown 🔑
                    </h3>
                    <div className="text-base space-y-6">
                        <div>
                            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center">
                                <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-2"></span> Matched Keywords:
                            </h4>
                            <ul className="list-disc list-inside space-y-1 mt-1 text-foreground pl-4">
                                {analysisData.geminiAnalysis.keywords.matched.length > 0 ? (
                                    analysisData.geminiAnalysis.keywords.matched.map((kw, index) => (
                                        <li key={index}>{kw}</li>
                                    ))
                                ) : (
                                    <li className="italic text-custom">No specific matched keywords identified.</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-red-600 dark:text-red-400 mb-2 flex items-center">
                                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span> Missing Keywords:
                            </h4>
                            <ul className="list-disc list-inside space-y-1 mt-1 text-foreground pl-4">
                                {analysisData.geminiAnalysis.keywords.missing.length > 0 ? (
                                    analysisData.geminiAnalysis.keywords.missing.map((kw, index) => (
                                        <li key={index}>{kw}</li>
                                    ))
                                ) : (
                                    <li className="italic text-custom">No crucial missing keywords identified. Great job!</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Suggested Action Words Card */}
                <div className="p-6 rounded-xl bg-background shadow-md border border-border">
                    <h3 className="text-xl font-heading text-primary mb-4">
                        Suggested Action Words 💡
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-foreground leading-relaxed pl-4">
                        {analysisData.geminiAnalysis.suggestActionWords && analysisData.geminiAnalysis.suggestActionWords.length > 0 ? (
                            analysisData.geminiAnalysis.suggestActionWords.map((word, index) => (
                                <li key={index}>{word}</li>
                            ))
                        ) : (
                            <li className="italic text-custom">No specific action words suggested at this time.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Section-wise Changes Card */}
            <div className="p-6 rounded-xl bg-background shadow-md border border-border">
                <h3 className="text-xl font-heading text-primary mb-4">
                    Section-wise Improvements & Ratings 📝
                </h3>
                {analysisData.geminiAnalysis.sectionWaysChanges && analysisData.geminiAnalysis.sectionWaysChanges.length > 0 ? (
                    <div className="space-y-6">
                        {analysisData.geminiAnalysis.sectionWaysChanges.map((section, index) => (
                            <div key={index} className="border-b border-border pb-4 last:border-b-0">
                                <h4 className="font-bold text-lg text-foreground flex items-center mb-2">
                                    {section.sectionName}
                                    <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full 
                                        ${section.rating >= 8 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                        section.rating >= 5 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                        }`}>
                                        Rating: {section.rating}/10
                                    </span>
                                </h4>
                                {section.sectionMistakesSentences && section.sectionMistakesSentences.length > 0 && (
                                    <div className="mb-2">
                                        <p className="text-sm font-semibold text-destructive">Mistakes:</p>
                                        <ul className="list-disc list-inside text-sm text-foreground pl-4">
                                            {section.sectionMistakesSentences.map((mistake, i) => (
                                                <li key={i}>{mistake}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {section.bestAIGenerateSentences && section.bestAIGenerateSentences.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-accent-foreground">AI-Generated Improvements:</p>
                                        <ul className="list-disc list-outside space-y-1 text-sm mt-1 ml-4">
                                            {section.bestAIGenerateSentences.map((bestSentence, i) => (
                                                <li key={i}>{bestSentence}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {!section.sectionMistakesSentences.length && !section.bestAIGenerateSentences.length && (
                                    <p className="italic text-custom text-sm">No specific feedback for this section.</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="italic text-custom">No detailed section-wise analysis available.</p>
                )}
            </div>
            
            {/* Reset Button */}
            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="px-6 py-3 rounded-lg text-secondary-foreground bg-secondary hover:bg-secondary/80 transition-colors font-semibold shadow-md flex items-center justify-center space-x-2"
                aria-label="Start a New Check"
              >
                <IoIosRefresh className="w-5 h-5" /> Start a New Check
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center space-x-3 mt-12 text-primary text-xl font-semibold">
            <Loader2 className="animate-spin w-7 h-7" />
            <span>Analyzing your resume, please wait...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AtsResumeChecker;