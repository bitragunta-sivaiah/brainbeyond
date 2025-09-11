import React, { useState, useEffect, useCallback } from 'react';
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
import { FaRegFileWord } from 'react-icons/fa'; // Added missing import
import { MdOutlineTipsAndUpdates } from 'react-icons/md'; // Added missing import


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

const AtsResumeChecker = () => {
  const dispatch = useDispatch();
  const { analysisData, isLoading, isSuccess, isError, message } = useSelector((state) => state.ats);

  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [windowDimension, setWindowDimension] = useState({ width: window.innerWidth, height: window.innerHeight });

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
      setShowResults(false); // Hide previous results while loading a new analysis
      setShowConfetti(false);
      setShowErrorAlert(false); // Hide error alert if a new analysis starts
    } else if (isSuccess && analysisData && analysisData.geminiAnalysis) {
      setShowResults(true);
      setShowErrorAlert(false); // Hide error alert on success
      if (analysisData.geminiAnalysis.atsScore >= 80) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 5000); // Confetti for 5 seconds
        return () => clearTimeout(timer);
      }
    } else if (isError) {
      setShowResults(false); // Hide results if there's an error
      setShowConfetti(false);
      if (message) {
        setShowErrorAlert(true); // Show custom error alert with the message
      }
    } else {
      // This covers the initial state or after a reset where no analysis is pending or successful
      setShowResults(false);
      setShowConfetti(false);
      setShowErrorAlert(false);
    }
  }, [isSuccess, analysisData, isLoading, isError, message]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          toast.error('Please upload a DOCX file.'); // Using toast for file type validation
          return;
        }
        setResumeFile(file);
        dispatch(resetAtsState()); // Reset Redux state on new file upload
        setShowErrorAlert(false); // Hide error if a new file is dropped
      }
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescriptionText.trim()) {
      toast.error('Please upload a resume and enter a job description.'); // Using toast for form validation
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
    ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600'}
    flex flex-col items-center justify-center space-y-3
  `;

  // Helper functions to determine score-based colors for the CircularProgressbar
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 50) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getPathColor = (score) => {
    if (score >= 80) return '#10B981'; // Emerald-500
    if (score >= 50) return '#F59E0B'; // Yellow-500
    return '#EF4444'; // Red-500
  };

  const atsScore = analysisData?.geminiAnalysis?.atsScore || 0;

  return (
    <div className="min-h-screen bg-background text-gray-900 dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-inter antialiased">
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
        {showErrorAlert && message && ( // Use 'message' from Redux state
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
          <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-4 tracking-tight leading-tight">
            ATS Resume Checker 🚀
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Get an instant, AI-powered analysis of your resume's compatibility with any job description to boost your chances of landing that interview.
          </p>
        </div>

        {/* Form Section - Shown if no results or if there's an error */}
        {(!showResults || isError) && ( // Changed condition to explicitly use showResults
          <form onSubmit={handleSubmit} className="bg-background dark:bg-gray-800 shadow-xl rounded-2xl p-6 sm:p-10 space-y-8 border border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <label htmlFor="job-description" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                Job Description
              </label>
              <textarea
                id="job-description"
                value={jobDescriptionText}
                onChange={(e) => setJobDescriptionText(e.target.value)}
                placeholder="Paste the job description here (e.g., 'Software Engineer at Google - requires strong Python, Java, and cloud experience')..."
                required
                rows={8}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 custom-scrollbar"
                aria-label="Job Description Textarea"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Upload Resume (<span className="text-indigo-600 dark:text-indigo-400">.docx only</span>)
              </label>
              {!resumeFile ? (
                <div {...getRootProps()} className={dropzoneClasses}>
                  <input {...getInputProps()} aria-label="Upload Resume File Input" />
                  <File className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
                    Drag 'n' drop your .docx file here, or <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">click to select a file</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Max file size: 5MB</p>
                </div>
              ) : (
                <div className="mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-3">
                    <File className="h-6 w-6 text-indigo-500" />
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{resumeFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                    aria-label="Remove resume file"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold shadow-md flex items-center justify-center space-x-2"
                aria-label="Reset Form"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading || !resumeFile || !jobDescriptionText}
                className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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

        {/* Analysis Results Section - Shown only on successful analysis */}
        {showResults && analysisData && analysisData.geminiAnalysis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="bg-card dark:bg-gray-800 shadow-xl rounded-2xl p-6 sm:p-10 space-y-8 border  border-border "
          >
            <h2 className="text-3xl font-extrabold text-center text-primary   mb-6">
              Analysis Results 📊
            </h2>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* ATS Match Score Card */}
              <div className="lg:col-span-1 flex flex-col items-center p-6 rounded-xl bg-background shadow-md border  border-border ">
                <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-4">ATS Match Score</h3>
                <div className="w-40 h-40">
                  <CircularProgressbar
                    value={atsScore}
                    text={`${atsScore}%`}
                    styles={buildStyles({
                      pathColor: getPathColor(atsScore),
                      textColor: getPathColor(atsScore),
                      trailColor: 'var(--color-muted, #e0e0e0)', // Fallback color for trail
                      backgroundColor: 'transparent',
                    })}
                  />
                </div>
                <p className={`mt-6 text-base text-center ${getScoreColor(atsScore)} font-bold`}>
                  {atsScore >= 80 ? "Excellent Match!" :
                   atsScore >= 50 ? "Good Potential!" : "Needs Work!"}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                  This score indicates how well your resume's content aligns with the job description.
                </p>
              </div>

              {/* Summary of Analysis Card */}
              <div className="lg:col-span-2 p-6 rounded-xl bg-background shadow-md border  border-border">
                <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-4">Summary of Analysis</h3>
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none  text-foreground leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisData.geminiAnalysis.summary}</ReactMarkdown>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Keywords Breakdown Card */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 dark:from-gray-700 to-white dark:to-gray-800 shadow-md border border-purple-100 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-4">
                  Keywords Breakdown 🔑
                </h3>
                <div className="text-base space-y-6">
                  <div>
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center">
                      <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-2"></span> Matched Keywords:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-gray-700 dark:text-gray-300 pl-4">
                      {analysisData.geminiAnalysis.keywords.matched.length > 0 ? (
                        analysisData.geminiAnalysis.keywords.matched.map((kw, index) => (
                          <li key={index}>{kw}</li>
                        ))
                      ) : (
                        <li className="italic text-gray-500">No specific matched keywords identified.</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-600 dark:text-red-400 mb-2 flex items-center">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span> Missing Keywords:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-gray-700 dark:text-gray-300 pl-4">
                      {analysisData.geminiAnalysis.keywords.missing.length > 0 ? (
                        analysisData.geminiAnalysis.keywords.missing.map((kw, index) => (
                          <li key={index}>{kw}</li>
                        ))
                      ) : (
                        <li className="italic text-gray-500">No crucial missing keywords identified. Great job!</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Suggested Action Words Card */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-50 dark:from-gray-700 to-white dark:to-gray-800 shadow-md border border-yellow-100 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300 mb-4">
                  Suggested Action Words 💡
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed pl-4">
                  {analysisData.geminiAnalysis.suggestActionWords && analysisData.geminiAnalysis.suggestActionWords.length > 0 ? (
                    analysisData.geminiAnalysis.suggestActionWords.map((word, index) => (
                      <li key={index}>{word}</li>
                    ))
                  ) : (
                    <li className="italic text-gray-500">No specific action words suggested at this time.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Section-wise Changes Card */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-pink-50 dark:from-gray-700 to-white dark:to-gray-800 shadow-md border border-pink-100 dark:border-gray-600">
              <h3 className="text-xl font-semibold text-pink-700 dark:text-pink-300 mb-4">
                Section-wise Improvements & Ratings 📝
              </h3>
              {analysisData.geminiAnalysis.sectionWaysChanges && analysisData.geminiAnalysis.sectionWaysChanges.length > 0 ? (
                <div className="space-y-6">
                  {analysisData.geminiAnalysis.sectionWaysChanges.map((section, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                      <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 flex items-center mb-2">
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
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Mistakes:</p>
                          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 pl-4">
                            {section.sectionMistakesSentences.map((mistake, i) => (
                              <li key={i}>{mistake}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {section.bestAIGenerateSentences && section.bestAIGenerateSentences.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">AI-Generated Improvements:</p>
                          <ul className="list-disc list-outside space-y-1 text-sm   mt-1 ml-4">
                            {section.bestAIGenerateSentences.map((bestSentence, i) => (
                              <li key={i}>{bestSentence}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                       {!section.sectionMistakesSentences.length && !section.bestAIGenerateSentences.length && (
                        <p className="italic text-gray-500 text-sm">No specific feedback for this section.</p>
                       )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-gray-500">No detailed section-wise analysis available.</p>
              )}
            </div>

            {/* Actionable Suggestions for Improvement Card */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 dark:from-gray-700 to-white dark:to-gray-800 shadow-md border border-green-100 dark:border-gray-600">
              <h3 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-4">
                Actionable Suggestions for Improvement 💡
              </h3>
              <ul className="list-disc list-outside space-y-1 text-sm md:text-[16px] mt-1 ml-4">
                {analysisData.geminiAnalysis.improvements.length > 0 ? (
                  analysisData.geminiAnalysis.improvements.map((suggestion, index) => (
                    <li key={index}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{suggestion}</ReactMarkdown>
                    </li>
                  ))
                ) : (
                  <li className="italic text-gray-500">Your resume is already highly optimized for this role!</li>
                )}
              </ul>
            </div>
            
            {/* General Optimization Tips Card */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 dark:from-gray-700 to-white dark:to-gray-800 shadow-md border border-orange-100 dark:border-gray-600">
              <h3 className="text-xl font-semibold text-orange-700 dark:text-orange-300 mb-4">
                General Optimization Tips ✨
              </h3>
              <ul className="list-disc list-outside space-y-1 text-sm md:text-[16px] mt-1 ml-4">
                {analysisData.geminiAnalysis.tips.length > 0 ? (
                  analysisData.geminiAnalysis.tips.map((tip, index) => (
                    <li key={index}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{tip}</ReactMarkdown>
                    </li>
                  ))
                ) : (
                  <li className="italic text-gray-500">No additional specific tips at this time.</li>
                )}
              </ul>
            </div>

            {/* Reset Button */}
            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="px-6 py-3 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold shadow-md flex items-center justify-center space-x-2"
                aria-label="Start a New Check"
              >
                <IoIosRefresh className="w-5 h-5" /> Start a New Check
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center space-x-3 mt-12 text-indigo-600 dark:text-indigo-400 text-xl font-semibold">
            <Loader2 className="animate-spin w-7 h-7" />
            <span>Analyzing your resume, please wait...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AtsResumeChecker;
