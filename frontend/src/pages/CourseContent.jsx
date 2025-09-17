import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourseProgress,
  completeLesson,
  incompleteLesson,
  submitQuiz,
  addDoubt,
  submitCodingProblem,
  runCode,
} from "../store/redux/studentCourseSlice";
import { issueCertificate } from "../store/redux/courseCertificatesSlice";
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
  Terminal,
  Lock,
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

  const {
    courseProgress,
    status: detailsStatus,
  } = useSelector((state) => state.studentCourses);

  const {
    certificates,
    loading: certLoading,
  } = useSelector((state) => state.certificates);

  const [activeChapter, setActiveChapter] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [showDoubtInput, setShowDoubtInput] = useState(false);
  const [doubtQuestion, setDoubtQuestion] = useState("");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [codingProblemCode, setCodingProblemCode] = useState("");
  const [runCodeOutput, setRunCodeOutput] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLessonActionLoading, setIsLessonActionLoading] = useState(false);

  // We get the course data from courseProgress now
  const courseData = courseProgress;

  const existingCertificate = useMemo(() => {
    return certificates?.find((cert) => cert.course?._id === courseData?._id);
  }, [certificates, courseData]);

  useEffect(() => {
    if (slug) {
      dispatch(fetchCourseProgress(slug));
    }
  }, [dispatch, slug]);

  useEffect(() => {
    if (detailsStatus === "succeeded" && courseData) {
      const firstChapter = courseData.chapters[0];
      if (firstChapter && firstChapter.lessons[0]) {
        setActiveChapter(firstChapter._id);
        setActiveLesson(firstChapter.lessons[0]);
      }
    }
  }, [detailsStatus, courseData]);

  useEffect(() => {
    if (activeLesson?.type === "codingProblem") {
      const starterCode = activeLesson.content?.codingProblem?.starterCode || "";
      setCodingProblemCode(starterCode);
    }
    setQuizAnswers({});
    setQuizResult(null);
    setRunCodeOutput(null);
    setSubmissionResult(null);
  }, [activeLesson]);

  if (detailsStatus === "loading" || !courseData) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-custom">
        <Loader2 className="animate-spin mr-2" /> Loading course content...
      </div>
    );
  }

  // The backend already handles access denial, so this check is simpler.
  // The fetchCourseProgress endpoint will return a 403 or 404.
  if (detailsStatus === "failed") {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-lg text-custom px-4 text-center">
        <XCircle size={64} className="text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p>
          It looks like you don't have access to this course. Please enroll to view its content.
        </p>
      </div>
    );
  }

  const fullActiveLesson = activeLesson
    ? courseData.chapters
        .flatMap((chapter) => chapter.lessons)
        .find((lesson) => lesson._id === activeLesson._id)
    : null;

  const isLessonCompleted = (lessonId) =>
    courseData?.completedLessons?.some((cl) => cl === lessonId) || false;

  const isChapterCompleted = (chapter) => {
    if (!courseData) return false;
    const lessonIdsInChapter = chapter.lessons.map((lesson) => lesson._id);
    return lessonIdsInChapter.length > 0 && lessonIdsInChapter.every((lessonId) => isLessonCompleted(lessonId));
  };

  const progressPercentage = courseData?.progress || 0;
  const isCourseComplete = progressPercentage === 100;

  const handleToggleChapter = (chapterId) => {
    setActiveChapter(activeChapter === chapterId ? null : chapterId);
  };

  const handleLessonClick = (lesson) => {
    setActiveLesson(lesson);
  };

  const handleToggleComplete = async (lessonId) => {
    setIsLessonActionLoading(true);
    try {
      if (isLessonCompleted(lessonId)) {
        await dispatch(incompleteLesson(lessonId)).unwrap();
      } else {
        await dispatch(completeLesson(lessonId)).unwrap();
      }
      dispatch(fetchCourseProgress(slug));
    } catch (error) {
      console.error("Failed to toggle lesson completion:", error);
    } finally {
      setIsLessonActionLoading(false);
    }
  };

  const handleAddDoubt = async () => {
    if (doubtQuestion.trim()) {
      setIsLessonActionLoading(true);
      try {
        await dispatch(addDoubt({ lessonId: activeLesson._id, question: doubtQuestion })).unwrap();
        setDoubtQuestion("");
        setShowDoubtInput(false);
      } catch (error) {
        console.error("Failed to add doubt:", error);
      } finally {
        setIsLessonActionLoading(false);
      }
    }
  };

  const handleQuizAnswer = (questionId, value, type) => {
    setQuizAnswers((prev) => {
      const newAnswers = { ...prev };
      if (type === 'multiple-choice') {
        const currentAnswers = newAnswers[questionId] || [];
        if (currentAnswers.includes(value)) {
          newAnswers[questionId] = currentAnswers.filter((v) => v !== value);
        } else {
          newAnswers[questionId] = [...currentAnswers, value];
        }
      } else {
        newAnswers[questionId] = value;
      }
      return newAnswers;
    });
  };

  const handleQuizSubmit = async () => {
    setIsSubmitting(true);
    const answers = Object.entries(quizAnswers).map(([questionId, value]) => {
      const question = fullActiveLesson.content.quiz.questions.find(q => q._id === questionId);
      const isTextAnswer = ['short-answer', 'fill-in-the-blank'].includes(question.questionType);
      
      return {
        questionId,
        answeredText: isTextAnswer ? value : undefined,
        selectedOptions: isTextAnswer ? [] : (Array.isArray(value) ? value : [value]),
      };
    });

    try {
      const result = await dispatch(submitQuiz({ lessonId: activeLesson._id, answers })).unwrap();
      setQuizResult(result);
      dispatch(fetchCourseProgress(slug));
    } catch (error) {
      console.error("Quiz submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setSubmissionResult({
      status: "Running...",
      output: null,
      error: null,
    });
    try {
      const response = await dispatch(
        submitCodingProblem({
          lessonId: activeLesson._id,
          code: codingProblemCode,
          language: fullActiveLesson.content.codingProblem.allowedLanguages[0] || "javascript",
        })
      ).unwrap();

      setSubmissionResult(response);
      dispatch(fetchCourseProgress(slug));
    } catch (error) {
      setSubmissionResult({
        isPassed: false,
        score: 0,
        status: "error",
        message: error.message || "An error occurred during submission.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunCode = async () => {
    setIsSubmitting(true);
    setRunCodeOutput({ status: "running" });
    try {
      const response = await dispatch(
        runCode({
          lessonId: activeLesson._id,
          code: codingProblemCode,
          language: fullActiveLesson.content.codingProblem.allowedLanguages[0] || "javascript",
        })
      ).unwrap();
      setRunCodeOutput({ status: "success", output: response.output, message: response.message });
    } catch (error) {
      setRunCodeOutput({ status: "error", output: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (certLoading) return;
    try {
      await dispatch(issueCertificate({ courseId: courseData._id })).unwrap();
      dispatch(fetchCourseProgress(slug));
    } catch (error) {
      console.error("Failed to issue certificate:", error);
    }
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

  const renderQuizQuestion = (q, index) => {
    const isCompleted = isLessonCompleted(fullActiveLesson._id);
    const selectedAnswer = quizAnswers[q._id];

    switch (q.questionType) {
      case 'short-answer':
      case 'fill-in-the-blank':
        const questionText = q.questionText.split('____').map((part, partIndex) => (
          <React.Fragment key={partIndex}>
            {part}
            {partIndex < q.questionText.split('____').length - 1 && (
              <input
                type="text"
                value={selectedAnswer || ''}
                onChange={(e) => handleQuizAnswer(q._id, e.target.value, q.questionType)}
                className="mx-2 w-auto p-1.5 rounded-md border-b border-input bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isCompleted}
              />
            )}
          </React.Fragment>
        ));
        return (
          <div key={q._id} className="p-4 border border-border rounded-lg bg-card">
            <p className="font-semibold text-lg mb-4 flex items-center flex-wrap">
              {index + 1}. {questionText}
            </p>
          </div>
        );
      case 'true-false':
        return (
          <div key={q._id} className="p-4 border border-border rounded-lg bg-card">
            <p className="font-semibold text-lg mb-4">{index + 1}. {q.questionText}</p>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${q._id}`}
                  value="True"
                  onChange={() => handleQuizAnswer(q._id, "True", q.questionType)}
                  checked={selectedAnswer === "True"}
                  className="accent-primary"
                  disabled={isCompleted}
                />
                <span>True</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${q._id}`}
                  value="False"
                  onChange={() => handleQuizAnswer(q._id, "False", q.questionType)}
                  checked={selectedAnswer === "False"}
                  className="accent-primary"
                  disabled={isCompleted}
                />
                <span>False</span>
              </label>
            </div>
          </div>
        );
      case 'multiple-choice':
        return (
          <div key={q._id} className="p-4 border border-border rounded-lg bg-card">
            <p className="font-semibold text-lg mb-4">{index + 1}. {q.questionText}</p>
            <div className="space-y-2">
              {q.options.map((option, optIndex) => (
                <label
                  key={optIndex}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    name={`question-${q._id}`}
                    value={option.optionText}
                    onChange={(e) => handleQuizAnswer(q._id, e.target.value, q.questionType)}
                    checked={Array.isArray(selectedAnswer) && selectedAnswer.includes(option.optionText)}
                    className="accent-primary"
                    disabled={isCompleted}
                  />
                  <span>{option.optionText}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case 'single-choice':
      default:
        return (
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
                    onChange={(e) => handleQuizAnswer(q._id, e.target.value, q.questionType)}
                    checked={selectedAnswer === option.optionText}
                    className="accent-primary"
                    disabled={isCompleted}
                  />
                  <span>{option.optionText}</span>
                </label>
              ))}
            </div>
          </div>
        );
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

    // Check if the lesson content exists or if it's a locked lesson
    if (!fullActiveLesson.content) {
      // This is a locked lesson
      return (
        <div className="flex flex-col justify-center items-center h-full text-custom px-4 text-center">
          <Lock size={64} className="text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2">Lesson Locked</h1>
          <p className="text-muted-foreground">
            This lesson is part of the premium course content. To unlock it, please purchase the full course or get a subscription.
          </p>
        </div>
      );
    }

    switch (fullActiveLesson.type) {
      case "video":
        const videoContent = fullActiveLesson.content.video;
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4">{fullActiveLesson.title}</h2>
            <p className="text-muted-foreground mb-4">{fullActiveLesson.description}</p>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-6">
              <iframe
                src={videoContent.videoUrl}
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
        const articleContent = fullActiveLesson.content.article;
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">{fullActiveLesson.title}</h2>
            <p className="text-muted-foreground mb-6">{fullActiveLesson.description}</p>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: articleContent.content }}
            ></div>
          </div>
        );
      case "quiz":
        const quizContent = fullActiveLesson.content.quiz;
        if (!quizContent || !quizContent.questions) {
          return (
            <div className="flex justify-center items-center h-full text-custom">
              Quiz content not available.
            </div>
          );
        }
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
                  <p className="text-accent-foreground/90 mt-1">{quizContent.quizInstructions}</p>
                  <ul className="mt-2 text-sm text-accent-foreground/80 space-y-1 list-disc list-inside">
                    <li>Total questions: {quizContent.questions.length}</li>
                    <li>Passing score: {quizContent.passScore}%</li>
                    <li>Attempts allowed: {quizContent.attemptsAllowed === 0 ? "Unlimited" : quizContent.attemptsAllowed}</li>
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
              {quizContent.questions.map((q, index) => renderQuizQuestion(q, index))}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuizSubmit}
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full shadow-lg transition-colors"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Quiz"}
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
                <h3 className="text-lg font-semibold text-foreground">Problem Description</h3>
                <p className="text-muted-foreground mt-1">{codingProblem.description}</p>
                <p className="mt-2 text-sm text-custom">Difficulty: <span className="capitalize font-semibold text-foreground">{codingProblem.difficulty}</span></p>
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <h3 className="font-semibold text-lg mb-2">Code Editor</h3>
              <div className="w-full">
                <CodeMirror
                  value={codingProblemCode}
                  height="400px"
                  theme="dark"
                  extensions={[getLanguageExtension(codingProblem.allowedLanguages[0] || "javascript")]}
                  onChange={(value) => setCodingProblemCode(value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRunCode}
                disabled={isSubmitting}
                className="flex items-center bg-secondary text-secondary-foreground font-semibold px-6 py-3 rounded-full shadow-lg transition-colors"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Terminal size={20} className="mr-2" />}
                Run Code
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmitCode}
                disabled={isSubmitting}
                className="flex items-center bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full shadow-lg transition-colors"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Code size={20} className="mr-2" />}
                Submit
              </motion.button>
            </div>
            <AnimatePresence>
              {runCodeOutput && (
                <motion.div
                  key="run-output"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card p-4 rounded-lg border border-border"
                >
                  <h3 className="font-semibold text-lg mb-2">Code Run Output</h3>
                  <div className="text-sm font-mono whitespace-pre-wrap">
                    <p className={`font-semibold ${runCodeOutput.status === "error" ? "text-destructive" : "text-primary"}`}>Status: {runCodeOutput.status}</p>
                    {runCodeOutput.output && <p>Output: {runCodeOutput.output}</p>}
                  </div>
                </motion.div>
              )}
              {submissionResult && (
                <motion.div
                  key="submission-output"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card p-4 rounded-lg border border-border"
                >
                  <h3 className="font-semibold text-lg mb-2">Submission Result</h3>
                  <div className="text-sm font-mono whitespace-pre-wrap">
                    <p className={`font-semibold ${submissionResult.isPassed ? "text-green-600" : "text-destructive"}`}>Status: {submissionResult.isPassed ? "Correct" : "Incorrect"}</p>
                    {submissionResult.message && <p>Message: {submissionResult.message}</p>}
                    {submissionResult.score !== undefined && <p>Score: {submissionResult.score}</p>}
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
          <h2 className="text-xl font-bold mb-2">{courseData?.title}</h2>
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
          {courseData?.chapters?.map((chapter) => (
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
              disabled={
                (!fullActiveLesson?.isFree && !fullActiveLesson?.content) ||
                (activeLesson.type === 'quiz' && !isLessonCompleted(activeLesson._id)) ||
                (activeLesson.type === 'codingProblem' && !isLessonCompleted(activeLesson._id)) ||
                isLessonActionLoading
              }
              className={`flex items-center px-4 py-2 rounded-full font-semibold transition-colors shrink-0 ${
                isLessonCompleted(activeLesson._id)
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLessonActionLoading ? <Loader2 className="animate-spin" /> : isLessonCompleted(activeLesson._id) ? "Mark as Incomplete" : "Mark as Complete"}
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
                        disabled={isLessonActionLoading}
                      >
                        {isLessonActionLoading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
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