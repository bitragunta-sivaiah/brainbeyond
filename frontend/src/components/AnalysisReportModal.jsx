import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Lightbulb, CheckCircle, XCircle, ChevronDown, Wand2, FileText, Rocket, ClipboardList } from "lucide-react";

// Helper component for the animated score circle
const ScoreCircle = ({ score = 0 }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  let colorClass = "text-green-500";
  if (score < 50) colorClass = "text-red-500";
  else if (score < 75) colorClass = "text-yellow-500";

  return (
    <div className="relative flex items-center justify-center w-32 h-32 flex-shrink-0">
      <svg className="transform -rotate-90" width="128" height="128">
        <circle className="text-muted" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="64" cy="64" />
        <motion.circle
          className={colorClass}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="64"
          cy="64"
        />
      </svg>
      <span className="absolute text-3xl font-bold">{score}</span>
    </div>
  );
};

// Helper component for collapsible sections
const CollapsibleSection = ({ title, icon, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="border-b border-border">
      <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full py-4 font-semibold text-lg text-left">
        <span className="flex items-center">
          {icon}
          {title}
        </span>
        <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} size={20} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-muted-foreground">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- NEW FEEDBACK COMPONENT ---
const FeedbackLink = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 p-6 text-center bg-muted/50 rounded-lg border border-border"
    >
        <p className="font-semibold text-lg text-card-foreground mb-3">
            Was this analysis helpful? Let us know!
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
            <strong>Disclaimer:</strong> AI-powered analysis provides suggestions to improve your resume's chances with automated systems. It's a tool to guide you, not a guarantee of success.
        </p>
    </motion.div>
);


// Main Component
const AtsResultModal = ({ isOpen, onClose, analysisData }) => {
  if (!analysisData?.analysisReport) return null;

  const {
    atsScore,
    summary,
    keywords,
    improvements,
    sectionAnalysis,
    tips,
    suggestedActionWords,
  } = analysisData.analysisReport;

  const allImprovements = [
    ...(improvements?.content ?? []),
    ...(improvements?.formatting ?? []),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-4xl h-[90vh] flex flex-col rounded-lg bg-card text-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-2xl font-bold">ATS Analysis Report</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 p-3 md:p-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 mb-8 p-6 rounded-lg bg-muted">
                <ScoreCircle score={atsScore} />
                <div>
                  <h3 className="text-xl font-bold mb-2">Overall Summary</h3>
                  <p className="text-muted-foreground">{summary}</p>
                </div>
              </div>

              <CollapsibleSection title="Keyword Analysis" icon={<FileText size={18} className="mr-2" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center text-green-500">
                      <CheckCircle size={18} className="mr-2" /> Matched
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {keywords?.matched?.length > 0 ? (
                        keywords.matched.map((k, i) => (
                          <span key={i} className="px-3 py-1 text-sm rounded-full bg-green-500/10 text-green-600 font-medium">{k}</span>
                        ))
                      ) : (
                        <span>No matched keywords found.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center text-red-500">
                      <XCircle size={18} className="mr-2" /> Missing
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {keywords?.missing?.length > 0 ? (
                        keywords.missing.map((k, i) => (
                          <span key={i} className="px-3 py-1 text-sm rounded-full bg-red-500/10 text-red-600 font-medium">{k}</span>
                        ))
                      ) : (
                        <span>No missing keywords identified.</span>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Actionable Improvements" icon={<Rocket size={18} className="mr-2" />}>
                <ul className="space-y-2 list-disc list-inside">
                  {allImprovements.length > 0 ? (
                    allImprovements.map((item, i) => <li key={i}>{item}</li>)
                  ) : (
                    <li>No specific improvements suggested.</li>
                  )}
                </ul>
              </CollapsibleSection>

              <CollapsibleSection title="Section-by-Section Analysis" icon={<ClipboardList size={18} className="mr-2" />}>
                <div className="space-y-6">
                  {sectionAnalysis?.length > 0 ? ( 
                    sectionAnalysis.map((sec, i) => ( 
                      <div key={i} className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-bold text-lg mb-2">{sec.sectionName} - <span className="text-primary">Rating: {sec.rating}/10</span></h4>
                        {sec.weakSentences?.length > 0 && ( 
                          <div className="mb-3">
                            <h5 className="font-semibold text-red-500">Areas to Improve:</h5>
                            <ul className="text-sm list-disc list-inside pl-2">
                              {sec.weakSentences.map((s, j) => <li key={j}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        {sec.suggestedSentences?.length > 0 && ( 
                          <div>
                            <h5 className="font-semibold text-green-500">AI Suggestions:</h5>
                            <ul className="text-sm list-disc list-inside pl-2">
                              {sec.suggestedSentences.map((s, j) => <li key={j}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No detailed section analysis available.</p>
                  )}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Suggested Action Words" icon={<Wand2 size={18} className="mr-2" />}>
                <div className="flex flex-wrap gap-2">
                  {suggestedActionWords?.length > 0 ? (
                    suggestedActionWords.map((word, i) => (
                      <span key={i} className="px-3 py-1 text-sm rounded-full bg-blue-500/10 text-blue-600 font-medium">{word}</span>
                    ))
                  ) : (
                    <span>No specific action words suggested.</span>
                  )}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="General Tips" icon={<Lightbulb size={18} className="mr-2" />}>
                <ul className="space-y-2 list-disc list-inside">
                  {tips?.length > 0 ? (
                    tips.map((tip, i) => <li key={i}>{tip}</li>)
                  ) : (
                    <li>No general tips provided.</li>
                  )}
                </ul>
              </CollapsibleSection>
              
              {/* --- ADDED FEEDBACK LINK --- */}
              <FeedbackLink />
              
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AtsResultModal;