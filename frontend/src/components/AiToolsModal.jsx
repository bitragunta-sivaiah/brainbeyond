import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { X, UploadCloud, FileText, Bot, Sparkles, Info } from "lucide-react";
import toast from "react-hot-toast";

const AtsModal = ({ isOpen, onClose, onCheckScore, onOptimize, loading }) => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDisclaimerVisible, setIsDisclaimerVisible] = useState(true);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      toast.error(rejectedFiles[0].errors[0].message);
      return;
    }
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      toast.success(`File "${acceptedFiles[0].name}" selected.`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleClose = () => {
    if (loading) return;
    setFile(null);
    setJobDescription("");
    setIsDisclaimerVisible(true); // Reset disclaimer on close
    onClose();
  };

  const handleCheckScore = () => {
    if (!file || !jobDescription.trim()) {
      toast.error("Please provide both a resume file and a job description.");
      return;
    }
    onCheckScore(file, jobDescription);
  };

  const handleOptimize = () => {
    if (!file || !jobDescription.trim()) {
      toast.error("Please provide both a resume file and a job description.");
      return;
    }
    onOptimize(file, jobDescription);
  };
  
  // Disclaimer Sub-component
  const Disclaimer = () => (
    <AnimatePresence>
      {isDisclaimerVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative mb-6 p-4 border border-accent/50 bg-accent/20 rounded-lg shadow-sm"
        >
          <button
            onClick={() => setIsDisclaimerVisible(false)}
            className="absolute top-2 right-2 p-1 text-accent-foreground/70 hover:bg-accent/30 rounded-full"
            aria-label="Close disclaimer"
          >
            <X size={16} />
          </button>
          <h4 className="flex items-center text-md font-semibold text-accent-foreground mb-2">
            <Info size={18} className="mr-2" />
            How to Use AI Tools
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li><strong className="font-medium text-foreground">Check ATS Score:</strong> Upload your resume and paste a job description to see how well you match the role.</li>
            <li><strong className="font-medium text-foreground">Optimize with AI:</strong> Let AI rewrite and tailor your uploaded resume to perfectly fit the job description, creating a new, optimized version.</li>
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-2xl h-[90%] overflow-auto custom-scrollbar  rounded-lg bg-card text-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-bold">AI-Powered ATS Tools</h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close modal"
                disabled={loading}
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <Disclaimer />
              {/* File Upload Section */}
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud
                  size={48}
                  className={`mb-4 ${
                    isDragActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <p className="text-lg font-semibold">
                  {isDragActive
                    ? "Drop your resume here"
                    : "Drag & drop resume or click to upload"}
                </p>
                <p className="text-sm text-muted-foreground">
                  (PDF, DOCX, TXT recommended, max 10MB)
                </p>
                {file && (
                  <div className="mt-4 flex items-center rounded-md bg-muted px-3 py-2 text-sm">
                    <FileText size={16} className="mr-2 text-primary" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                )}
              </div>
              {/* Job Description Section */}
              <div>
                <label
                  htmlFor="jobDescription"
                  className="block mb-2 text-lg font-semibold"
                >
                  Job Description
                </label>
                <textarea
                  id="jobDescription"
                  rows="8"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-shadow custom-scrollbar"
                  disabled={loading}
                ></textarea>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end p-6 border-t border-border space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleCheckScore}
                disabled={loading || !file || !jobDescription.trim()}
                className="flex items-center justify-center w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Analyzing..."
                ) : (
                  <>
                    <Bot size={16} className="mr-2" /> Check ATS Score
                  </>
                )}
              </button>
              <button
                onClick={handleOptimize}
                disabled={loading || !file || !jobDescription.trim()}
                className="flex items-center justify-center w-full sm:w-auto rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Optimizing..."
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" /> Optimize with AI
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AtsModal;
