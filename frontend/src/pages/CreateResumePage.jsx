import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  createResume,
  fetchResumeById,
  updateResume,
  checkAtsScore,
  optimizeAndCreateResume,
  clearLatestAnalysis,
} from "../store/redux/resumeSlice";
import { useForm } from "react-hook-form";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaIdCard,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { initialResumeData, mockResumeData } from "@/utils/mockResumeData";
import { templates } from "@/data/templates";
import ResumePreview from "@/components/resume-builder/ResumePreview";
import Sidebar from "@/components/Sidebar";
import AtsModal from "@/components/AiToolsModal";
import AtsResultModal from "@/components/AnalysisReportModal";
import { generatePdf } from "@/utils/pdfGenerator";
import TemplatePreviewModal from "@/components/TemplatePreviewModal";

// These icons are passed to the ResumePreview, not the Sidebar
const socialIcons = {
  LinkedIn: <FaLinkedin size={16} />,
  GitHub: <FaGithub size={16} />,
  Twitter: <FaTwitter size={16} />,
  "Personal Website": <FaGlobe size={16} />,
  Portfolio: <FaIdCard size={16} />,
};

// --- NEW TEMPLATE SELECTOR MODAL ---
const TemplateSelectorModal = ({ isOpen, onClose, onSelect, templates, currentTemplate }) => {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold">Select a Template</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {templates.map(template => (
                        <div 
                            key={template.id} 
                            className="cursor-pointer border-2 rounded-lg overflow-hidden hover:border-blue-500 transition-all"
                            onClick={() => onSelect(template)}
                        >
                            <img src={template.thumbnail} alt={template.name} className="w-full h-auto object-cover" />
                            <p className="text-center p-2 text-sm font-semibold">{template.name}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};


const CreateResume = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentResume, loading, latestAnalysis } = useSelector(
    (state) => state.resume
  );
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("contact");
  const [activeTemplate, setActiveTemplate] = useState(templates[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- State for Modals & Mobile View ---
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); // For individual template preview
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false); // For the main selector
  const [isPreviewVisibleOnMobile, setIsPreviewVisibleOnMobile] = useState(false);
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = useForm({
    defaultValues: initialResumeData,
  });

  const watchAllFields = watch();

  useEffect(() => {
    if (id) {
      dispatch(fetchResumeById(id));
    } else {
      reset(initialResumeData);
    }
  }, [dispatch, id, reset]);

  useEffect(() => {
    if (currentResume && id) {
      reset(currentResume);
      const template = templates.find((t) => t.id === currentResume.templateId);
      if (template) {
        setActiveTemplate(template);
      }
    }
  }, [currentResume, id, reset]);

  useEffect(() => {
    if (latestAnalysis) {
      setIsResultModalOpen(true);
    }
  }, [latestAnalysis]);

  const onSubmit = async (data) => {
    if (!user) {
      toast.error("Please log in to save your resume.");
      return;
    }
    const resumeData = { ...data, templateId: activeTemplate.id };
    if (id) {
      await dispatch(updateResume({ id, updatedData: resumeData }));
      toast.success("Resume updated successfully!");
    } else {
      const result = await dispatch(createResume(resumeData));
      if (createResume.fulfilled.match(result)) {
        toast.success("Resume created successfully!");
        navigate(`/resumes/builder/${result.payload._id}`);
      }
    }
  };

  const handleDownload = () => {
    const toastPromise = toast.loading("Generating PDF...");
    try {
      const resumeData = watchAllFields;
      const templateId = activeTemplate.id;
      const fileName = `${resumeData.fileName || "resume"}.pdf`;
      const pdfDoc = generatePdf(templateId, resumeData);

      pdfDoc.download(fileName, () => {
        toast.success("PDF downloaded successfully!", { id: toastPromise });
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.", { id: toastPromise });
    }
  };

  const handleLoadMockData = () => {
    reset(mockResumeData);
    toast.success("Mock data loaded! You can now edit it.");
  };

  const handleClearForm = () => {
    reset(initialResumeData);
    toast.success("Form cleared. Start fresh!");
  };

  const handleAtsCheck = async (file, jobDescription) => {
    const formData = new FormData();
    formData.append("resumeFile", file);
    formData.append("jobDescription", jobDescription);
    await dispatch(checkAtsScore(formData));
    setIsAtsModalOpen(false);
  };

  const handleOptimizeAndCreate = async (file, jobDescription) => {
    const formData = new FormData();
    formData.append("resumeFile", file);
    formData.append("jobDescription", jobDescription);
    const result = await dispatch(optimizeAndCreateResume(formData));
    if (optimizeAndCreateResume.fulfilled.match(result)) {
      setIsAtsModalOpen(false);
      toast.success("AI Optimized Resume Created!");
      navigate(`/resumes/builder/${result.payload.newResume._id}`);
    }
  };

  const closeResultModal = () => {
    dispatch(clearLatestAnalysis());
    setIsResultModalOpen(false);
  };
  
  const openPreviewModal = (template) => {
    setSelectedPreviewTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const handleTemplateSelect = (template) => {
    setActiveTemplate(template);
    setIsTemplateSelectorOpen(false);
  }

  return (
    <>
      <div className="flex flex-col md:flex-row   bg-background text-foreground">
        <div className="w-full md:max-w-md lg:max-w-lg xl:max-w-xl">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.3, type: "tween" }}
                className="fixed top-0 left-0 w-full max-w-md h-screen mt-20 pb-40 overflow-y-auto border-r border-border shadow custom-scrollbar bg-card z-30 lg:max-w-lg xl:max-w-xl"
              >
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  control={control}
                  onSave={handleSubmit(onSubmit)}
                  isSaving={loading}
                  onDownload={handleDownload}
                  onLoadMockData={handleLoadMockData}
                  onClearForm={handleClearForm}
                  onAtsTools={() => setIsAtsModalOpen(true)}
                  onSelectTemplate={() => setIsTemplateSelectorOpen(true)}
                  onPreviewMobile={() => setIsPreviewVisibleOnMobile(true)}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
        
        <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? ' ' : 'ml-0'}`}>
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="rounded-full p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted"
                aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl hidden sm:block">
                <FileText className="inline-block mr-2" size={24} />
                {id ? "Edit Resume" : "Create New Resume"}
              </h1>
            </div>
          </header>

          {/* --- DESKTOP PREVIEW --- */}
          <div className="flex-1 overflow-y-auto bg-muted p-4 md:p-8 hidden md:block">
            <div className="relative mx-auto w-full max-w-4xl rounded-md shadow-2xl bg-white">
                <ResumePreview
                  data={watchAllFields}
                  template={activeTemplate}
                  socialIcons={socialIcons}
                />
            </div>
          </div>
        </main>
      </div>

      {/* --- MOBILE PREVIEW MODAL --- */}
        <AnimatePresence>
            {isPreviewVisibleOnMobile && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 w-full bg-black/60 z-40 overflow-hidden pt-20 md:hidden"
                    onClick={() => setIsPreviewVisibleOnMobile(false)}
                >
                    <div className="absolute inset-0 overflow-y-auto p-4">
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="relative mx-auto   w-full mt-20 max-w-3xl rounded-md bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ResumePreview
                                data={watchAllFields}
                                template={activeTemplate}
                                socialIcons={socialIcons}
                            />
                        </motion.div>
                    </div>
                     <button 
                        onClick={() => setIsPreviewVisibleOnMobile(false)}
                        className="fixed top-20 right-4 bg-white rounded-full p-2 shadow-lg z-50"
                    >
                        <X size={24} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

      <TemplateSelectorModal
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        onSelect={handleTemplateSelect}
        templates={templates}
      />

      <AtsModal
        isOpen={isAtsModalOpen}
        onClose={() => setIsAtsModalOpen(false)}
        onCheckScore={handleAtsCheck}
        onOptimize={handleOptimizeAndCreate}
        loading={loading}
      />
      <AtsResultModal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        analysisData={latestAnalysis}
      />
      <TemplatePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        template={selectedPreviewTemplate}
      />
    </>
  );
};

export default CreateResume;
