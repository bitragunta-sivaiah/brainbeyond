import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourses,
  deleteCourse,
  deleteChapter,
  deleteLesson,
  deleteLiveClass,
  reorderChapters,
  reorderLessons,
  reorderChaptersState,
  reorderLessonsState,
  fetchCourseBySlug, // ⭐️ ADDED: Import the thunk to fetch a single course
} from "../../store/redux/courseContentSlice";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  MessageSquare,
  Sparkles,
  LayoutDashboard,
  Video,
  Clock,
  Info,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";
import ChapterForm from "../../components/ChapterForm";
import LessonForm from "../../components/LessonForm";
import LiveClassForm from "../../components/LiveClassForm";
import DoubtManager from "../../components/DoubtManager";
import { useNavigate } from "react-router-dom";

// A general-purpose component for sortable items
const DraggableItem = ({ id, children, data }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, data });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-lg shadow-sm mb-2 relative ${isDragging ? "z-10 bg-primary/10" : "bg-card"}`}
      layout
    >
      <div className="flex items-center gap-4">
        <span {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
          <GripVertical size={20} />
        </span>
        <div className="flex-grow">{children}</div>
      </div>
    </motion.div>
  );
};

// --- Sub-components for better organization ---
const LessonItem = ({ lesson, handleDeleteLesson, handleEditLesson, handleOpenDoubts }) => (
  <DraggableItem id={lesson._id} data={{ type: "Lesson", chapterId: lesson.chapter }}>
    <div className="flex items-center justify-between">
      <span className="text-md">{lesson.title}</span>
      <div className="flex items-center gap-4">
        {lesson.doubts?.length > 0 && (
          <button
            onClick={() => handleOpenDoubts(lesson)}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm transition-colors"
            aria-label={`View ${lesson.doubts.length} doubts for ${lesson.title}`}
          >
            <MessageSquare size={14} />
            {lesson.doubts.length}
          </button>
        )}
        <button
          onClick={() => handleEditLesson(lesson)}
          className="text-green-600 hover:text-green-800 transition-colors"
          aria-label={`Edit ${lesson.title}`}
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => handleDeleteLesson(lesson._id)}
          className="text-red-500 hover:text-red-700 transition-colors"
          aria-label={`Delete ${lesson.title}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </DraggableItem>
);

const LiveClassItem = ({ liveClass, handleDeleteLiveClass, handleEditLiveClass }) => {
  const formatSchedule = (isoString) => {
    if (!isoString) return "Not scheduled";
    return new Date(isoString).toLocaleString([], {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-4 rounded-lg shadow-sm mb-2 bg-card/50 border border-dashed border-purple-300">
      <div className="flex items-start justify-between">
        <div className="flex-grow pr-4">
          <span className="text-md flex items-center gap-2 font-semibold text-purple-600 mb-2">
            <Video size={16} />
            {liveClass.title}
          </span>
          <p className="text-sm text-muted-foreground ml-8 mb-2">{liveClass.description}</p>
          <div className="ml-8 space-y-1 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock size={12} />
              <span>{formatSchedule(liveClass.schedule?.startTime)} - {formatSchedule(liveClass.schedule?.endTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info size={12} />
              Status: <span className="font-medium capitalize">{liveClass.status}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleEditLiveClass(liveClass)}
            className="text-green-600 hover:text-green-800 transition-colors"
            aria-label={`Edit ${liveClass.title}`}
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDeleteLiveClass(liveClass._id, liveClass.chapter)}
            className="text-red-500 hover:text-red-700 transition-colors"
            aria-label={`Delete ${liveClass.title}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};


const ChapterItem = ({ chapter, expanded, onToggle, handleEditChapter, handleDeleteChapter, handleCreateLesson, handleCreateLessonAI, handleCreateLiveClass, ...restProps }) => (
  <DraggableItem id={chapter._id} data={{ type: "Chapter", courseId: chapter.course }}>
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => onToggle(chapter._id)} className="flex items-center gap-2 text-lg font-semibold flex-grow text-left">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          {chapter.title}
        </button>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => handleCreateLiveClass(chapter._id)}
            className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded text-sm flex items-center gap-1 font-semibold"
            aria-label={`Add live class to ${chapter.title}`}
          >
            <Video size={16} /> Live
          </button>
          <button
            onClick={() => handleCreateLesson(chapter._id)}
            className="bg-lime-500 hover:bg-lime-600 text-black py-1 px-3 rounded text-sm flex items-center gap-1 font-semibold"
            aria-label={`Add lesson to ${chapter.title}`}
          >
            <Plus size={16} /> Lesson
          </button>
          <button
            onClick={() => handleCreateLessonAI(chapter._id)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm flex items-center gap-1 font-semibold"
            aria-label={`Generate AI lesson for ${chapter.title}`}
          >
            <Sparkles size={16} /> AI
          </button>
          <button onClick={() => handleEditChapter(chapter)} className="text-green-600 hover:text-green-800 transition-colors p-1" aria-label={`Edit ${chapter.title}`}><Edit2 size={16} /></button>
          <button onClick={() => handleDeleteChapter(chapter._id)} className="text-red-500 hover:text-red-700 transition-colors p-1" aria-label={`Delete ${chapter.title}`}><Trash2 size={16} /></button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="pl-8 pt-4 overflow-hidden"
          >
            {chapter.liveClasses?.map(lc => (
              <LiveClassItem key={lc._id} liveClass={lc} {...restProps} />
            ))}

            <SortableContext items={chapter.lessons?.map((l) => l._id) || []} strategy={verticalListSortingStrategy}>
              {chapter.lessons?.length > 0 ? (
                chapter.lessons.map((lesson) => (
                  <LessonItem key={lesson._id} lesson={lesson} {...restProps} />
                ))
              ) : (
                (chapter.liveClasses?.length === 0) && <p className="text-muted-foreground p-2 text-center my-2">No content in this chapter yet.</p>
              )}
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </DraggableItem>
);

// --- Main CoursesContentManager Component ---

const CoursesContentManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // ⭐️ MODIFIED: Get `currentCourse` directly instead of managing `selectedCourse` locally.
  const { courses, currentCourse, loading, error } = useSelector((state) => state.courseContent);
  const { user } = useSelector((state) => state.auth);

  // ⭐️ ADDED: Local state to track which course is "selected" by ID for fetching.
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // Modal States
  const [isChapterFormOpen, setIsChapterFormOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isLiveClassFormOpen, setIsLiveClassFormOpen] = useState(false);
  const [editingLiveClass, setEditingLiveClass] = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [isAILessonCreation, setIsAILessonCreation] = useState(false);
  const [isDoubtManagerOpen, setIsDoubtManagerOpen] = useState(false);
  const [doubtsToManage, setDoubtsToManage] = useState([]);
  const [activeLessonIdForDoubt, setActiveLessonIdForDoubt] = useState(null);
  
  const [expandedChapters, setExpandedChapters] = useState({});

  useEffect(() => {
    // ⭐️ MODIFIED: Fetch all courses initially. If a course is selected, re-fetch it.
    dispatch(fetchCourses());
    if (selectedCourseId) {
      const course = courses.find(c => c._id === selectedCourseId);
      if (course) {
          dispatch(fetchCourseBySlug(course.slug));
      }
    }
  }, [dispatch, selectedCourseId]);

  // ⭐️ ADDED: New useEffect to handle initial selection.
  // This ensures a course is selected and fetched when the page loads, if courses exist.
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0]._id);
      dispatch(fetchCourseBySlug(courses[0].slug));
    }
  }, [courses, selectedCourseId, dispatch]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  
  // --- Delete Handlers ---
  const handleDelete = useCallback((id, action, deleteAction, extraPayload = {}) => {
    toast((t) => (
      <div className="flex flex-col">
        <p className="mb-2">Are you sure you want to delete this {action}?</p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
            onClick={() => {
              dispatch(deleteAction(id, extraPayload))
                .unwrap()
                .then(() => toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} deleted.`, { id: t.id }))
                .catch(() => toast.error(`Failed to delete ${action}.`, { id: t.id }));
              toast.dismiss(t.id);
            }}
          >
            Delete
          </button>
          <button
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  }, [dispatch]);

  const handleEditCourse = useCallback((course) => navigate(`/admin/update-Course/${course.slug}`), [navigate]);
  const handleDeleteCourse = useCallback((id) => handleDelete(id, "course", deleteCourse), [handleDelete]);
  const handleDeleteChapter = useCallback((id) => handleDelete(id, "chapter", deleteChapter), [handleDelete]);
  const handleDeleteLesson = useCallback((id) => handleDelete(id, "lesson", deleteLesson), [handleDelete]);
  const handleDeleteLiveClass = useCallback((id) => handleDelete(id, "live class", deleteLiveClass), [handleDelete]);


  // --- Form Open Handlers ---
  const handleCreateChapter = useCallback(() => {
    setEditingChapter(null);
    setIsChapterFormOpen(true);
  }, []);

  const handleEditChapter = useCallback((chapter) => {
    setEditingChapter(chapter);
    setIsChapterFormOpen(true);
  }, []);

  const handleCreateLesson = useCallback((chapterId, isAI = false) => {
    setEditingLesson(null);
    setActiveChapterId(chapterId);
    setIsAILessonCreation(isAI);
    setIsLessonFormOpen(true);
  }, []);

  const handleCreateLessonAI = useCallback((chapterId) => {
    handleCreateLesson(chapterId, true);
  }, [handleCreateLesson]);

  const handleEditLesson = useCallback((lesson) => {
    setEditingLesson(lesson);
    setActiveChapterId(lesson.chapter);
    setIsAILessonCreation(false);
    setIsLessonFormOpen(true);
  }, []);

  const handleCreateLiveClass = useCallback((chapterId) => {
    setEditingLiveClass(null);
    setActiveChapterId(chapterId);
    setIsLiveClassFormOpen(true);
  }, []);

  const handleEditLiveClass = useCallback((liveClass) => {
    setEditingLiveClass(liveClass);
    setActiveChapterId(liveClass.chapter);
    setIsLiveClassFormOpen(true);
  }, []);
  
  const handleOpenDoubts = useCallback((lesson) => {
    setDoubtsToManage(lesson.doubts);
    setActiveLessonIdForDoubt(lesson._id);
    setIsDoubtManagerOpen(true);
  }, []);
  
  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      // ⭐️ MODIFIED: Use `currentCourse` directly.
      if (!over || active.id === over.id || !currentCourse) return;
  
      const activeData = active.data.current;
      const itemType = activeData?.type;
      
      // Reorder Chapters
      if (itemType === "Chapter") {
        const chapterIds = currentCourse.chapters.map(c => c._id);
        const oldIndex = chapterIds.indexOf(active.id);
        const newIndex = chapterIds.indexOf(over.id);
        
        const newChapterIds = [...chapterIds];
        const [removed] = newChapterIds.splice(oldIndex, 1);
        newChapterIds.splice(newIndex, 0, removed);

        try {
          // Optimistic UI Update for reorder
          dispatch(reorderChaptersState({ courseId: currentCourse._id, chapterIds: newChapterIds }));
          await dispatch(reorderChapters({ courseId: currentCourse._id, chapterIds: newChapterIds })).unwrap();
        } catch (e) {
          toast.error(`Failed to reorder chapters.`);
          // A more robust app would roll back the state here
          dispatch(fetchCourses());
        }
      } else if (itemType === "Lesson") {
        const chapterId = activeData.chapterId;
        const chapter = currentCourse.chapters.find(c => c._id === chapterId);
        if (!chapter) return;

        const lessonIds = chapter.lessons.map(l => l._id);
        const oldIndex = lessonIds.indexOf(active.id);
        const newIndex = lessonIds.indexOf(over.id);

        const newLessonIds = [...lessonIds];
        const [removed] = newLessonIds.splice(oldIndex, 1);
        newLessonIds.splice(newIndex, 0, removed);

        try {
          // Optimistic UI Update for reorder
          dispatch(reorderLessonsState({ chapterId, lessonIds: newLessonIds }));
          await dispatch(reorderLessons({ chapterId, lessonIds: newLessonIds })).unwrap();
        } catch (e) {
          toast.error(`Failed to reorder lessons.`);
          // A more robust app would roll back the state here
          dispatch(fetchCourses());
        }
      }
    },
    [dispatch, currentCourse] // ⭐️ MODIFIED: Dependency array now uses `currentCourse`
  );

  const toggleChapter = useCallback((chapterId) => setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] })), []);
  // ⭐️ MODIFIED: Use `currentCourse` for the chapter IDs array.
  const chapterIds = useMemo(() => currentCourse?.chapters?.map(c => c._id) || [], [currentCourse]);

  if (loading && courses.length === 0) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-destructive">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background text-foreground min-h-screen">
      <header className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-heading font-bold text-primary">Content Manager</h1>
        <button
          onClick={() => navigate('/admin/create-course')}
          className="bg-primary hover:bg-primary/90 transition-colors p-2 rounded-lg text-white font-bold py-2 flex items-center gap-2"
        >
          <Plus size={20} /> New Course
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* --- Left Panel: Course Sidebar --- */}
        <aside className="w-full md:w-1/3 lg:w-1/4 bg-card p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><LayoutDashboard size={20} /> Courses</h2>
          <div className="space-y-2">
            {courses.map(course => (
              <button
                key={course._id}
                // ⭐️ MODIFIED: Set the ID for the `fetchCourseBySlug` thunk.
                onClick={() => setSelectedCourseId(course._id)}
                className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${currentCourse?._id === course._id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'}`}
              >
                <img src={course.thumbnail} alt={course.title} className="w-10 h-10 rounded-md object-cover" />
                <span className="flex-grow">{course.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* --- Right Panel: Content Display --- */}
        <main className="w-full md:w-2/3 lg:w-3/4">
          {currentCourse ? ( // ⭐️ MODIFIED: Use `currentCourse` for rendering.
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <header className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold">{currentCourse.title}</h2>
                  <p className="text-muted-foreground mt-1">{currentCourse.shortDescription}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={handleCreateChapter}
                    className="bg-lime-500 py-2 px-3 rounded-md text-sm flex items-center gap-1 font-semibold hover:bg-lime-600 transition-colors"
                  >
                    <Plus size={16} /> Chapter
                  </button>
                  <button onClick={() => handleEditCourse(currentCourse)} className="text-green-600 p-2 hover:bg-muted rounded-md" aria-label={`Edit ${currentCourse.title}`}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDeleteCourse(currentCourse._id)} className="text-red-500 p-2 hover:bg-muted rounded-md" aria-label={`Delete ${currentCourse.title}`}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </header>

              <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
                {currentCourse.chapters?.length > 0 ? (
                  currentCourse.chapters.map(chapter => (
                    <ChapterItem
                      key={chapter._id}
                      chapter={chapter}
                      expanded={expandedChapters[chapter._id]}
                      onToggle={toggleChapter}
                      handleEditChapter={handleEditChapter}
                      handleDeleteChapter={handleDeleteChapter}
                      handleCreateLesson={handleCreateLesson}
                      handleCreateLessonAI={handleCreateLessonAI}
                      handleEditLesson={handleEditLesson}
                      handleDeleteLesson={handleDeleteLesson}
                      handleOpenDoubts={handleOpenDoubts}
                      handleCreateLiveClass={handleCreateLiveClass}
                      handleEditLiveClass={handleEditLiveClass}
                      handleDeleteLiveClass={handleDeleteLiveClass}
                    />
                  ))
                ) : (
                  <div className="text-center p-12 bg-card rounded-lg">
                    <h3 className="text-lg font-semibold">No Chapters Yet</h3>
                    <p className="text-muted-foreground mt-1">Add a chapter to get started with your course content.</p>
                  </div>
                )}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center p-12 bg-card rounded-lg h-full flex flex-col justify-center items-center">
              <h3 className="text-lg font-semibold">Welcome!</h3>
              <p className="text-muted-foreground mt-1">{courses.length > 0 ? "Select a course from the sidebar to manage its content." : "Create your first course to begin."}</p>
            </div>
          )}
        </main>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {isChapterFormOpen && (
          <ChapterForm chapter={editingChapter} courseId={currentCourse?._id} onClose={() => setIsChapterFormOpen(false)} />
        )}
        {isLessonFormOpen && (
          <LessonForm 
            lesson={editingLesson} 
            chapterId={activeChapterId} 
            courseId={currentCourse?._id} 
            isAILessonCreation={isAILessonCreation}
            onClose={() => setIsLessonFormOpen(false)} 
          />
        )}
        {isLiveClassFormOpen && (
          <LiveClassForm
            liveClass={editingLiveClass}
            chapterId={activeChapterId}
            onClose={() => setIsLiveClassFormOpen(false)}
          />
        )}
        {isDoubtManagerOpen && (
          <DoubtManager
            doubts={doubtsToManage}
            lessonId={activeLessonIdForDoubt}
            userRole={user?.role}
            currentUserId={user?._id}
            onClose={() => setIsDoubtManagerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursesContentManager;