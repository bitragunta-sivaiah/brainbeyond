import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourseDetails,
  fetchCourseProgress,
  markLessonComplete,
  markLessonIncomplete,
  submitQuiz,
  addDoubt,
  submitCodingProblem,
} from "../store/redux/studentCourseSlice";
import {
  issueCertificate,
} from "../store/redux/courseCertificatesSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  PlayCircle,
  FileText,
  Code,
  HelpCircle,
  ChevronDown,
  Circle,
  Send,
  Loader2,
  XCircle,
  Trophy,
  Lightbulb,
  Info,
  BadgeCheck,
  Award,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";

// Helper component for lesson icons
const LessonIcon = ({ type, isCompleted = false }) => {
  const commonProps = {
    size: 20,
    strokeWidth: 2,
    className: isCompleted
      ? "text-primary dark:text-accent-foreground"
      : "text-custom",
  };
  switch (type) {
    case "video":
      return isCompleted ? <CheckCircle {...commonProps} /> : <PlayCircle {...commonProps} />;
    case "article":
      return isCompleted ? <CheckCircle {...commonProps} /> : <FileText {...commonProps} />;
    case "codingProblem":
      return isCompleted ? <CheckCircle {...commonProps} /> : <Code {...commonProps} />;
    case "quiz":
      return isCompleted ? <CheckCircle {...commonProps} /> : <HelpCircle {...commonProps} />;
    default:
      return <Circle {...commonProps} />;
  }
};

const CourseContent = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const { selectedCourse, detailsStatus, actionStatus } = useSelector((state) => state.studentCourses);
  const { certificates, loading: certLoading } = useSelector((state) => state.certificates);
  const { details: courseDetails, progress: courseProgress } = selectedCourse;

  const [activeChapter, setActiveChapter] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [showDoubtInput, setShowDoubtInput] = useState(false);
  const [doubtQuestion, setDoubtQuestion] = useState("");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [codingProblemCode, setCodingProblemCode] = useState("");
  const [codingOutput, setCodingOutput] = useState(null);

  const existingCertificate = useMemo(() => {
    return certificates?.find(cert => cert.course?._id === courseDetails?._id);
  }, [certificates, courseDetails]);

  useEffect(() => {
    if (slug) {
      dispatch(fetchCourseDetails(slug));
      dispatch(fetchCourseProgress(slug));
    }
  }, [dispatch, slug]);

  useEffect(() => {
    if (detailsStatus === "succeeded" && courseDetails) {
      const firstChapter = courseDetails.chapters[0];
      if (firstChapter && firstChapter.lessons[0]) {
        setActiveChapter(firstChapter._id);
        setActiveLesson(firstChapter.lessons[0]);
      }
    }
  }, [detailsStatus, courseDetails]);

  if (detailsStatus === "loading" || !courseDetails) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-custom">
        <Loader2 className="animate-spin mr-2" /> Loading course content...
      </div>
    );
  }

  // Improved error handling for non-existent or unenrolled courses
  if (detailsStatus === "failed" || !courseDetails?.hasAccess) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-lg text-custom px-4 text-center">
        <XCircle size={64} className="text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-4">Course Not Found or Not Enrolled</h1>
        <p>It looks like this course doesn't exist or you haven't enrolled yet. Please check your dashboard.</p>
      </div>
    );
  }

  const fullActiveLesson = activeLesson
    ? courseDetails.chapters
        .flatMap((chapter) => chapter.lessons)
        .find((lesson) => lesson._id === activeLesson._id)
    : null;

  const isLessonCompleted = (lessonId) =>
    courseProgress?.completedLessons?.some(cl => cl.lesson === lessonId) || false;

  const isChapterCompleted = (chapter) => {
    if (!courseProgress) return false;
    const lessonIdsInChapter = chapter.lessons.map(lesson => lesson._id);
    return lessonIdsInChapter.length > 0 && lessonIdsInChapter.every(lessonId => isLessonCompleted(lessonId));
  };

  const progressPercentage = courseProgress?.overallProgress || 0;
  const isCourseComplete = progressPercentage === 100;

  const handleToggleChapter = (chapterId) => {
    setActiveChapter(activeChapter === chapterId ? null : chapterId);
  };

  const handleLessonClick = (lesson) => {
    setActiveLesson(lesson);
    setQuizAnswers({}); // Reset quiz answers on lesson change
    setQuizResult(null);
    setCodingProblemCode(""); // Clear code editor
    setCodingOutput(null);
    if (lesson.type === "codingProblem" && lesson.content?.codingProblem?.starterCode) {
      setCodingProblemCode(lesson.content.codingProblem.starterCode);
    }
  };

  const handleToggleComplete = async (lessonId) => {
    if (isLessonCompleted(lessonId)) {
      await dispatch(markLessonIncomplete(lessonId));
    } else {
      await dispatch(markLessonComplete(lessonId));
    }
    // Re-fetch progress after action to ensure UI is up-to-date
    dispatch(fetchCourseProgress(slug));
  };

  const handleAddDoubt = async () => {
    if (doubtQuestion.trim()) {
      await dispatch(addDoubt({ lessonId: activeLesson._id, question: doubtQuestion }));
      setDoubtQuestion("");
      setShowDoubtInput(false);
    }
  };

  const handleQuizAnswer = (questionId, value) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleQuizSubmit = async () => {
    if (actionStatus === "loading") return;
    const answers = Object.entries(quizAnswers).map(([questionId, value]) => ({
      questionId,
      selectedOptions: Array.isArray(value) ? value : [value],
    }));
    try {
      const result = await dispatch(submitQuiz({ lessonId: activeLesson._id, answers })).unwrap();
      setQuizResult(result);
      dispatch(fetchCourseProgress(slug));
    } catch (error) {
      // Handle submission errors
      console.error("Quiz submission failed:", error);
    }
  };

  const handleSubmitCode = async () => {
    if (actionStatus === "loading") return;
    setCodingOutput({
      status: "Running...",
      output: null,
      error: null,
    });
    try {
      const response = await dispatch(submitCodingProblem({
        lessonId: activeLesson._id,
        code: codingProblemCode,
        language: fullActiveLesson.content.codingProblem.allowedLanguages[0] || "javascript",
      })).unwrap();
      setCodingOutput({
        status: "Submission Accepted! ✅",
        output: response.message,
        error: null,
      });
      // A successful submission should mark the lesson complete
      dispatch(markLessonComplete(activeLesson._id));
      dispatch(fetchCourseProgress(slug));
    } catch (error) {
      setCodingOutput({
        status: "Error",
        output: null,
        error: error.message,
      });
    }
  };

  const handleIssueCertificate = async () => {
    if (certLoading) return;
    await dispatch(issueCertificate({ courseId: courseDetails._id }));
  };

  const renderCertificateButton = () => {
    if (!isCourseComplete) return null;

    if (existingCertificate) {
      return (
        <div className="flex flex-col items-center mt-4">
          <p className="text-sm text-green-600 dark:text-green-400 mb-2 font-medium">
            <BadgeCheck size={18} className="inline-block mr-1" /> You already have this certificate!
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={`/certificates/${existingCertificate._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 rounded-full font-semibold transition-colors shrink-0 bg-primary text-primary-foreground"
          >
            <Award size={20} className="mr-2" />
            Get Certificate Link
          </motion.a>
        </div>
      );
    } else {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleIssueCertificate}
          disabled={certLoading}
          className="flex items-center px-4 py-2 rounded-full font-semibold transition-colors shrink-0 bg-accent text-accent-foreground mt-4"
        >
          {certLoading ? <Loader2 className="animate-spin mr-2" /> : <Award size={20} className="mr-2" />}
          Create Certificate
        </motion.button>
      );
    }
  };

  const getLanguageExtension = (lang) => {
    switch (lang?.toLowerCase()) {
      case "javascript":
        return javascript();
      case "python":
        return python();
      case "c++":
        return cpp();
      case "java":
        return java();
      default:
        return javascript();
    }
  };

  const renderLessonContent = () => {
    if (!fullActiveLesson) {
      return (
        <div className="flex justify-center items-center h-full text-custom">
          Select a lesson to get started.
        </div>
      );
    }
    switch (fullActiveLesson.type) {
      case "video":
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4">{fullActiveLesson.title}</h2>
            <p className="text-muted-foreground mb-4">{fullActiveLesson.description}</p>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-6">
              <iframe
                src={fullActiveLesson.content.video.videoUrl}
                title={fullActiveLesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        );
      case "article":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">{fullActiveLesson.title}</h2>
            <p className="text-muted-foreground mb-6">{fullActiveLesson.description}</p>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: fullActiveLesson.content.article.content }}
            ></div>
          </div>
        );
      case "quiz":
        const quiz = fullActiveLesson.content.quiz;
        if (!quizResult) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-center mb-2">{fullActiveLesson.title}</h2>
              <div className="p-6 bg-accent rounded-lg shadow-inner flex items-start space-x-4">
                <Info size={24} className="text-accent-foreground flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-accent-foreground">Quiz Instructions</h3>
                  <p className="text-accent-foreground/90 mt-1">{quiz.quizInstructions}</p>
                  <ul className="mt-2 text-sm text-accent-foreground/80 space-y-1 list-disc list-inside">
                    <li>Total questions: {quiz.questions.length}</li>
                    <li>Passing score: {quiz.passScore}%</li>
                    <li>Attempts allowed: {quiz.attemptsAllowed === 0 ? "Unlimited" : quiz.attemptsAllowed}</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuizResult("start")}
                  className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full shadow-lg transition-colors"
                >
                  Start Quiz
                </motion.button>
              </div>
            </motion.div>
          );
        } else if (quizResult === "start") {
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">{fullActiveLesson.title}</h2>
              {quiz.questions.map((q, index) => (
                <div key={q._id} className="p-4 border border-border rounded-lg bg-card">
                  <p className="font-semibold text-lg mb-4">{index + 1}. {q.questionText}</p>
                  <div className="space-y-2">
                    {q.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center space-x-2 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted"
                      >
                        <input
                          type="radio"
                          name={`question-${q._id}`}
                          value={option.optionText}
                          onChange={(e) => handleQuizAnswer(q._id, e.target.value)}
                          className="accent-primary"
                        />
                        <span>{option.optionText}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuizSubmit}
                  disabled={actionStatus === "loading"}
                  className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full shadow-lg transition-colors"
                >
                  {actionStatus === "loading" ? <Loader2 className="animate-spin" /> : "Submit Quiz"}
                </motion.button>
              </div>
            </div>
          );
        } else {
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center p-8 rounded-xl shadow-lg border border-border bg-card"
            >
              <Trophy size={64} className="mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">Quiz Results</h2>
              <p className="text-xl text-custom mb-4">You scored: {quizResult.score}%</p>
              <div className={`p-4 rounded-lg font-semibold ${quizResult.isPassed ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                {quizResult.isPassed ? "Congratulations! You passed the quiz." : "You did not pass. You can try again!"}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setQuizResult("start")}
                className="mt-6 bg-secondary text-secondary-foreground font-semibold px-6 py-3 rounded-full transition-colors"
              >
                Retake Quiz
              </motion.button>
            </motion.div>
          );
        }
      case "codingProblem":
        const codingProblem = fullActiveLesson.content.codingProblem;
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">{fullActiveLesson.title}</h2>
            <div className="p-6 bg-muted rounded-lg shadow-inner flex items-start space-x-4">
              <Lightbulb size={24} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Tips & Tricks</h3>
                <p className="text-muted-foreground mt-1">{codingProblem.description}</p>
                <p className="mt-2 text-sm text-custom">Difficulty: <span className="capitalize font-semibold text-foreground">{codingProblem.difficulty}</span></p>
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <h3 className="font-semibold text-lg mb-2">Code Editor</h3>
              <div className="w-full">
                <CodeMirror
                  value={codingProblemCode} // Use component state for code
                  height="400px"
                  theme="dark"
                  extensions={[getLanguageExtension(codingProblem.allowedLanguages[0] || "javascript")]}
                  onChange={(value) => setCodingProblemCode(value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmitCode}
                disabled={actionStatus === "loading"}
                className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full shadow-lg transition-colors"
              >
                {actionStatus === "loading" ? <Loader2 className="animate-spin" /> : "Run Code"}
              </motion.button>
            </div>
            <AnimatePresence>
              {codingOutput && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card p-4 rounded-lg border border-border"
                >
                  <h3 className="font-semibold text-lg mb-2">Output</h3>
                  <div className="text-sm font-mono whitespace-pre-wrap">
                    <p className={`font-semibold ${codingOutput.error ? "text-destructive" : "text-primary"}`}>Status: {codingOutput.status}</p>
                    {codingOutput.output && <p>Output: {codingOutput.output}</p>}
                    {codingOutput.error && <p>Error: {codingOutput.error}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      default:
        return (
          <div className="flex justify-center items-center h-full text-custom">
            Lesson content type not supported.
          </div>
        );
    }
  };
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "tween", duration: 0.3 }}
        className="w-full md:w-1/4 min-w-[300px] bg-card border-r border-border p-6 flex flex-col custom-scrollbar overflow-y-auto"
      >
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">{courseDetails.title}</h2>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8 }}
            ></motion.div>
          </div>
          <p className="text-sm text-custom mt-2">{progressPercentage}% Complete</p>
          {isCourseComplete && (
            <div className="mt-4 flex justify-center">
              {renderCertificateButton()}
            </div>
          )}
        </div>

        {/* Chapters and Lessons */}
        <div className="space-y-4 flex-1">
          {courseDetails.chapters.map((chapter) => (
            <div key={chapter._id} className="border-b border-border pb-4">
              <button
                onClick={() => handleToggleChapter(chapter._id)}
                className="flex items-center justify-between w-full text-left font-semibold text-lg transition-colors hover:text-primary"
              >
                <div className="flex items-center space-x-2">
                  <span>{chapter.title}</span>
                  {isChapterCompleted(chapter) && (
                    <BadgeCheck size={18} className="text-primary dark:text-accent-foreground" />
                  )}
                </div>
                <motion.div
                  initial={false}
                  animate={{ rotate: activeChapter === chapter._id ? 180 : 0 }}
                >
                  <ChevronDown size={20} />
                </motion.div>
              </button>

              <AnimatePresence>
                {activeChapter === chapter._id && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-2 pl-4"
                  >
                    {chapter.lessons.map((lesson) => (
                      <li
                        key={lesson._id}
                        onClick={() => handleLessonClick(lesson)}
                        className={`flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer ${
                          activeLesson?._id === lesson._id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <LessonIcon
                          type={lesson.type}
                          isCompleted={isLessonCompleted(lesson._id)}
                        />
                        <span className="flex-1 truncate">{lesson.title}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col bg-background p-8 custom-scrollbar overflow-y-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-border">
          <h1 className="text-3xl font-bold mb-4 sm:mb-0">{activeLesson?.title || "Select a Lesson"}</h1>
          {activeLesson && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToggleComplete(activeLesson._id)}
              className={`flex items-center px-4 py-2 rounded-full font-semibold transition-colors shrink-0 ${
                isLessonCompleted(activeLesson._id)
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isLessonCompleted(activeLesson._id) ? "Mark as Incomplete" : "Mark as Complete"}
              <CheckCircle size={20} className="ml-2" />
            </motion.button>
          )}
        </header>

        {/* Lesson Content */}
        <main className="flex-1">{renderLessonContent()}</main>

        {/* Doubt and Resource Section */}
        {activeLesson && (
          <div className="mt-8 pt-6 border-t border-border space-y-4">
            <h3 className="text-xl font-bold">Resources & Doubts</h3>
            {/* Resources */}
            {fullActiveLesson?.resources?.length > 0 && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-lg mb-2">Lesson Resources</h4>
                <ul className="list-disc list-inside space-y-1">
                  {fullActiveLesson.resources.map((res, index) => (
                    <li key={index}>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {res.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Doubts */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <h4 className="font-semibold text-lg mb-2">Ask a Question</h4>
              <AnimatePresence mode="wait">
                {showDoubtInput ? (
                  <motion.div
                    key="doubt-input"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col space-y-2"
                  >
                    <textarea
                      value={doubtQuestion}
                      onChange={(e) => setDoubtQuestion(e.target.value)}
                      placeholder="Type your question here..."
                      className="w-full p-2 rounded-md border border-input bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="4"
                    />
                    <div className="flex justify-end space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDoubtInput(false)}
                        className="px-4 py-2 text-custom rounded-full"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddDoubt}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-semibold"
                        disabled={actionStatus === "loading"}
                      >
                        {actionStatus === "loading" ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="doubt-button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDoubtInput(true)}
                    className="w-full flex items-center justify-center p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <HelpCircle size={20} className="mr-2" />
                    Ask a Question
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContent;