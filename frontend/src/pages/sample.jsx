import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchCourses,
    deleteCourse,
    deleteChapter,
    deleteLesson,
    reorderChapters,
    reorderLessons,
} from "../../store/redux/courseContentSlice";
import {
    deleteLiveClass,
    fetchLiveClasses,
} from "../../store/redux/liveClassSlice";
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
    Video,
    Calendar,
    ArrowUpRightFromSquare,
    Sparkles,
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
            <div {...attributes} {...listeners}>
                {children}
            </div>
        </motion.div>
    );
};

// --- Sub-components for better organization and readability ---

const LiveClassItem = ({ liveClass, handleDeleteLiveClass, handleEditLiveClass }) => (
    <div className="flex flex-col p-4 border-l-4 border-l-primary bg-secondary/50 rounded-lg shadow-sm mb-2">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <Calendar size={20} className="text-primary" />
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">{liveClass.title}</span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(liveClass.startTime).toLocaleString()}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3 pr-2">
                <a href={liveClass.meetingDetails?.joinUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 transition-colors" aria-label="Join Live Class">
                    <ArrowUpRightFromSquare size={16} />
                </a>
                <button
                    onClick={() => handleEditLiveClass(liveClass)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    aria-label={`Edit ${liveClass.title}`}
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => handleDeleteLiveClass(liveClass._id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    aria-label={`Delete ${liveClass.title}`}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
        <div className="flex flex-col text-sm text-muted-foreground mt-2">
            <span><strong>Course:</strong> {liveClass.course?.title}</span>
            <span><strong>Chapter:</strong> {liveClass.chapter?.title}</span>
            <span><strong>Instructor:</strong> {liveClass.instructor?.fullName || liveClass.instructor?.username}</span>
        </div>
    </div>
);

const LessonItem = ({ lesson, handleCreateLiveClass, handleDeleteLesson, handleEditLesson, handleOpenDoubts }) => (
    <DraggableItem id={lesson._id} data={{ type: "Lesson", chapterId: lesson.chapter, courseId: lesson.course }}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-grow">
                <GripVertical size={16} className="text-muted-foreground cursor-grab" />
                <span className="text-md">{lesson.title}</span>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => handleCreateLiveClass(lesson)}
                    className="text-purple-500 hover:text-purple-600 transition-colors"
                    aria-label={`Schedule Live Class for ${lesson.title}`}
                >
                    <Video size={16} />
                </button>
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

const ChapterItem = ({ chapter, courseId, expanded, onToggle, liveClasses, handleEditChapter, handleDeleteChapter, handleCreateLesson, handleCreateLessonAI, ...lessonProps }) => (
    <DraggableItem id={chapter._id} data={{ type: "Chapter", courseId }}>
        <div className="flex flex-col">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-grow">
                    <GripVertical size={20} className="text-muted-foreground cursor-grab" />
                    <button onClick={() => onToggle(chapter._id)} className="flex items-center gap-1">
                        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <span className="text-lg font-semibold">{chapter.title}</span>
                    </button>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleCreateLesson(chapter._id)}
                        className="bg-lime-500 hover:bg-lime-600 transition-colors text-black py-1 px-3 rounded text-sm flex items-center gap-1 font-semibold"
                        aria-label={`Add lesson to ${chapter.title}`}
                    >
                        <Plus size={16} /> Lesson
                    </button>
                    <button
                        onClick={() => handleCreateLessonAI(chapter._id)}
                        className="bg-blue-500 hover:bg-blue-600 transition-colors text-white py-1 px-3 rounded text-sm flex items-center gap-1 font-semibold"
                        aria-label={`Generate AI lesson for ${chapter.title}`}
                    >
                        <Sparkles size={16} /> AI Lesson
                    </button>
                    <button
                        onClick={() => handleEditChapter(chapter)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        aria-label={`Edit ${chapter.title}`}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDeleteChapter(chapter._id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label={`Delete ${chapter.title}`}
                    >
                        <Trash2 size={16} />
                    </button>
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
                        {liveClasses && liveClasses.length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                {liveClasses.map(liveClass => (
                                    <LiveClassItem
                                        key={liveClass._id}
                                        liveClass={liveClass}
                                        handleDeleteLiveClass={lessonProps.handleDeleteLiveClass}
                                        handleEditLiveClass={lessonProps.handleEditLiveClass}
                                    />
                                ))}
                            </motion.div>
                        )}
                        <SortableContext
                            items={chapter.lessons?.map((l) => l._id) || []}
                            strategy={verticalListSortingStrategy}
                        >
                            {chapter.lessons && chapter.lessons.length > 0 ? (
                                chapter.lessons.map((lesson) => (
                                    <LessonItem
                                        key={lesson._id}
                                        lesson={lesson}
                                        {...lessonProps}
                                    />
                                ))
                            ) : (
                                <p className="text-muted-foreground p-2">No lessons yet.</p>
                            )}
                        </SortableContext>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </DraggableItem>
);

const CourseCard = ({ course, expanded, onToggle, handleEditCourse, handleDeleteCourse, ...chapterProps }) => {
    const chapterIds = useMemo(() => course.chapters?.map((c) => c._id) || [], [course.chapters]);

    const courseLiveClasses = chapterProps.allLiveClasses.filter(lc => (lc.course?._id || lc.course) === course._id);

    return (
        <motion.div
            key={course._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-xl shadow-md overflow-hidden"
        >
            <div className="relative">
                <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/CCCCCC/000000?text=No+Image"; }}
                />
                <div className="absolute inset-0 bg-black/70"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <h2 className="text-3xl font-bold text-white mb-1">{course.title}</h2>
                    <p className="text-sm text-gray-300">{course.shortDescription}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                        <span className="absolute top-0 left-0 rounded-br-sm bg-lime-500 p-2 text-black font-semibold">
                            {course.category}
                        </span>
                        <span className="flex items-center gap-1 text-white">
                            <span className="font-medium">{course.totalStudents}</span> students
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => onToggle(course._id)}
                        className="flex items-center gap-2 font-semibold text-primary-500 hover:text-primary transition-colors"
                    >
                        {expanded ? (
                            <>
                                <ChevronDown size={20} /> Hide Chapters
                            </>
                        ) : (
                            <>
                                <ChevronRight size={20} /> Show Chapters ({course.chapters?.length || 0})
                            </>
                        )}
                    </button>
                    <div className="flex gap-4">
                        <button
                            onClick={() => chapterProps.handleCreateChapter(course._id)}
                            className="bg-lime-500 py-1 px-3 rounded text-sm flex items-center gap-1 font-semibold hover:bg-lime-600 transition-colors"
                        >
                            <Plus size={16} /> Chapter
                        </button>
                        <button onClick={() => handleEditCourse(course)} className="text-green-600 hover:text-green-800 transition-colors" aria-label={`Edit ${course.title}`}>
                            <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteCourse(course._id)} className="text-red-500 hover:text-red-700 transition-colors" aria-label={`Delete ${course.title}`}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden mt-4"
                        >
                            <SortableContext
                                items={chapterIds}
                                strategy={verticalListSortingStrategy}
                            >
                                {course.chapters && course.chapters.length > 0 ? (
                                    course.chapters.map((chapter) => {
                                        const chapterLiveClasses = courseLiveClasses.filter(lc => lc.chapter?._id === chapter._id);
                                        return (
                                            <ChapterItem
                                                key={chapter._id}
                                                chapter={chapter}
                                                courseId={course._id}
                                                liveClasses={chapterLiveClasses}
                                                expanded={chapterProps.expandedChapters[chapter._id]}
                                                onToggle={chapterProps.toggleChapter}
                                                handleCreateLesson={chapterProps.handleCreateLesson}
                                                handleCreateLessonAI={chapterProps.handleCreateLessonAI}
                                                handleEditChapter={chapterProps.handleEditChapter}
                                                handleDeleteChapter={chapterProps.handleDeleteChapter}
                                                handleEditLesson={chapterProps.handleEditLesson}
                                                handleDeleteLesson={chapterProps.handleDeleteLesson}
                                                handleOpenDoubts={chapterProps.handleOpenDoubts}
                                                handleDeleteLiveClass={chapterProps.handleDeleteLiveClass}
                                                handleEditLiveClass={chapterProps.handleEditLiveClass}
                                                handleCreateLiveClass={chapterProps.handleCreateLiveClass}
                                            />
                                        );
                                    })
                                ) : (
                                    <p className="text-muted-foreground p-4">No chapters yet. Add one to get started.</p>
                                )}
                            </SortableContext>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// --- Main CoursesContentManager Component ---

const CoursesContentManager = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { courses, loading, error } = useSelector((state) => state.courseContent);
    const { liveClasses } = useSelector((state) => state.liveClasses);
    const { user } = useSelector((state) => state.auth);

    const [isChapterFormOpen, setIsChapterFormOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState(null);
    const [activeCourseId, setActiveCourseId] = useState(null);

    const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [activeChapterId, setActiveChapterId] = useState(null);
    const [lessonFormCourseId, setLessonFormCourseId] = useState(null);
    const [isAILessonCreation, setIsAILessonCreation] = useState(false);

    const [isLiveClassFormOpen, setIsLiveClassFormOpen] = useState(false);
    const [editingLiveClass, setEditingLiveClass] = useState(null);
    const [activeLiveClassCourseId, setActiveLiveClassCourseId] = useState(null);
    const [activeLiveClassChapterId, setActiveLiveClassChapterId] = useState(null);

    const [expandedCourses, setExpandedCourses] = useState({});
    const [expandedChapters, setExpandedChapters] = useState({});

    const [isDoubtManagerOpen, setIsDoubtManagerOpen] = useState(false);
    const [doubtsToManage, setDoubtsToManage] = useState([]);
    const [activeLessonIdForDoubt, setActiveLessonIdForDoubt] = useState(null);

    useEffect(() => {
        dispatch(fetchCourses());
        dispatch(fetchLiveClasses());
    }, [dispatch]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handleActionSuccess = useCallback(() => {
        dispatch(fetchCourses());
        dispatch(fetchLiveClasses());
    }, [dispatch]);

    const handleActionError = useCallback((t, action) => {
        toast.error(`Failed to ${action}. Please try again.`, { id: t.id });
    }, []);

    const handleDelete = useCallback((id, action, deleteAction) => {
        toast((t) => (
            <div className="flex flex-col">
                <p className="mb-2">Are you sure you want to delete this {action}?</p>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                        onClick={() => {
                            dispatch(deleteAction(id))
                                .unwrap()
                                .then(() => toast.success(`${action} deleted successfully.`, { id: t.id }))
                                .catch(() => handleActionError(t, `delete ${action}`));
                            toast.dismiss(t.id);
                        }}
                    >
                        Delete
                    </button>
                    <button
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    }, [dispatch, handleActionError]);


    const handleEditCourse = useCallback((course) => navigate(`/admin/update-Course/${course.slug}`), [navigate]);
    const handleDeleteCourse = useCallback((id) => handleDelete(id, "course", deleteCourse), [handleDelete]);
    const handleDeleteChapter = useCallback((id) => handleDelete(id, "chapter", deleteChapter), [handleDelete]);
    const handleDeleteLesson = useCallback((id) => handleDelete(id, "lesson", deleteLesson), [handleDelete]);
    const handleDeleteLiveClass = useCallback((id) => handleDelete(id, "live class", deleteLiveClass), [handleDelete]);


    const handleCreateChapter = useCallback((courseId) => {
        setEditingChapter(null);
        setActiveCourseId(courseId);
        setIsChapterFormOpen(true);
    }, []);

    const handleEditChapter = useCallback((chapter) => {
        setEditingChapter(chapter);
        setActiveCourseId(chapter.course);
        setIsChapterFormOpen(true);
    }, []);

    const handleCreateLesson = useCallback((chapterId, isAI = false) => {
        setEditingLesson(null);
        setActiveChapterId(chapterId);
        const course = courses.find(c => c.chapters?.some(ch => ch._id === chapterId));
        if (course) {
            setLessonFormCourseId(course._id);
            setIsAILessonCreation(isAI);
            setIsLessonFormOpen(true);
        } else {
            toast.error("Could not find associated course for this chapter.");
        }
    }, [courses]);

    const handleCreateLessonAI = useCallback((chapterId) => {
        handleCreateLesson(chapterId, true);
    }, [handleCreateLesson]);


    const handleEditLesson = useCallback((lesson) => {
        setEditingLesson(lesson);
        setActiveChapterId(lesson.chapter);
        setLessonFormCourseId(lesson.course);
        setIsAILessonCreation(false);
        setIsLessonFormOpen(true);
    }, []);

    const handleCreateLiveClass = useCallback((lesson) => {
        if (!lesson.course) {
            toast.error("Lesson is not associated with a course. Cannot schedule live class.");
            return;
        }
        setEditingLiveClass(null);
        setActiveLiveClassCourseId(lesson.course);
        setActiveLiveClassChapterId(lesson.chapter || null);
        setIsLiveClassFormOpen(true);
    }, []);

    const handleEditLiveClass = useCallback((liveClass) => {
        setEditingLiveClass(liveClass);
        setActiveLiveClassCourseId(liveClass.course?._id || liveClass.course);
        setActiveLiveClassChapterId(liveClass.chapter?._id || liveClass.chapter || null);
        setIsLiveClassFormOpen(true);
    }, []);

    const handleOpenDoubts = useCallback((lesson) => {
        setDoubtsToManage(lesson.doubts);
        setActiveLessonIdForDoubt(lesson._id);
        setIsDoubtManagerOpen(true);
    }, []);


    const handleDragEnd = useCallback(
        async (result) => {
            const { active, over } = result;
            if (!over || active.id === over.id) return;

            const activeData = active.data.current;
            const overData = over.data.current;

            const isChapterDrag = activeData?.type === "Chapter" && overData?.type === "Chapter";
            const isLessonDrag = activeData?.type === "Lesson" && overData?.type === "Lesson";

            let actionPayload;
            let action;

            if (isChapterDrag) {
                const courseId = activeData.courseId;
                const course = courses.find((c) => c._id === courseId);
                const chapterIds = course.chapters?.map((c) => c._id) || [];
                const oldIndex = chapterIds.indexOf(active.id);
                const newIndex = chapterIds.indexOf(over.id);

                const newOrder = [...chapterIds];
                const [movedItem] = newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, movedItem);

                actionPayload = { courseId, chapterIds: newOrder };
                action = reorderChapters;
            } else if (isLessonDrag) {
                const chapterId = activeData.chapterId;
                const course = courses.find((c) => c.chapters?.some((ch) => ch._id === chapterId));
                const chapter = course?.chapters?.find((ch) => ch._id === chapterId);
                const lessonIds = chapter?.lessons?.map((l) => l._id) || [];
                const oldIndex = lessonIds.indexOf(active.id);
                const newIndex = lessonIds.indexOf(over.id);

                const newOrder = [...lessonIds];
                const [movedItem] = newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, movedItem);

                actionPayload = { chapterId, lessonIds: newOrder };
                action = reorderLessons;
            }

            if (actionPayload && action) {
                try {
                    await dispatch(action(actionPayload)).unwrap();
                    toast.success(`${activeData.type}s reordered successfully.`);
                } catch (e) {
                    console.error("Reorder failed:", e);
                    toast.error(`Failed to reorder ${activeData.type}s. Please try again.`);
                } finally {
                    dispatch(fetchCourses());
                }
            }
        },
        [courses, dispatch]
    );

    const toggleCourse = useCallback((courseId) => setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] })), []);
    const toggleChapter = useCallback((chapterId) => setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] })), []);

    if (loading) return <div className="text-center p-8 text-lg font-medium">Loading...</div>;
    if (error) return <div className="text-center p-8 text-destructive text-lg font-medium">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 bg-background text-foreground min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-heading font-bold text-primary">Course Content Manager</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/admin/create-course')}
                        className="bg-primary hover:bg-primary-600 transition-colors p-4 rounded-lg shadow-2xl text-white font-bold py-2 flex items-center gap-2"
                    >
                        <Plus size={20} /> New Course
                    </button>
                </div>
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                <h2 className="text-2xl font-heading font-bold text-primary mb-4">Upcoming Live Classes</h2>
                {liveClasses && liveClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liveClasses
                            .filter(lc => lc.status === 'scheduled' || lc.status === 'ongoing')
                            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                            .map(liveClass => (
                                <LiveClassItem
                                    key={liveClass._id}
                                    liveClass={liveClass}
                                    handleDeleteLiveClass={handleDeleteLiveClass}
                                    handleEditLiveClass={handleEditLiveClass}
                                />
                            ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No upcoming live classes scheduled.</p>
                )}
            </motion.div>


            <AnimatePresence>
                {isChapterFormOpen && (
                    <ChapterForm chapter={editingChapter} courseId={activeCourseId} onClose={() => { setIsChapterFormOpen(false); handleActionSuccess(); }} />
                )}
                {isLessonFormOpen && (
                    <LessonForm 
                        lesson={editingLesson} 
                        chapterId={activeChapterId} 
                        courseId={lessonFormCourseId} 
                        isAILessonCreation={isAILessonCreation}
                        onClose={() => { setIsLessonFormOpen(false); handleActionSuccess(); }} 
                    />
                )}
                {isLiveClassFormOpen && (
                    <LiveClassForm
                        liveClass={editingLiveClass}
                        courseId={activeLiveClassCourseId}
                        chapterId={activeLiveClassChapterId}
                        onClose={() => { setIsLiveClassFormOpen(false); handleActionSuccess(); }}
                    />
                )}
                {isDoubtManagerOpen && (
                    <DoubtManager
                        doubts={doubtsToManage}
                        lessonId={activeLessonIdForDoubt}
                        userRole={user?.role}
                        currentUserId={user?._id}
                        onClose={() => { setIsDoubtManagerOpen(false); handleActionSuccess(); }}
                    />
                )}
            </AnimatePresence>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {courses && courses.length > 0 ? (
                    <div className="space-y-6">
                        {courses.map((course) => (
                            <CourseCard
                                key={course._id}
                                course={course}
                                expanded={expandedCourses[course._id]}
                                onToggle={toggleCourse}
                                handleEditCourse={handleEditCourse}
                                handleDeleteCourse={handleDeleteCourse}
                                handleCreateChapter={handleCreateChapter}
                                handleEditChapter={handleEditChapter}
                                handleDeleteChapter={handleDeleteChapter}
                                handleCreateLesson={handleCreateLesson}
                                handleCreateLessonAI={handleCreateLessonAI}
                                handleEditLesson={handleEditLesson}
                                handleDeleteLesson={handleDeleteLesson}
                                handleOpenDoubts={handleOpenDoubts}
                                handleDeleteLiveClass={handleDeleteLiveClass}
                                handleEditLiveClass={handleEditLiveClass}
                                handleCreateLiveClass={handleCreateLiveClass}
                                expandedChapters={expandedChapters}
                                toggleChapter={toggleChapter}
                                allLiveClasses={liveClasses}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground p-8">No courses found. Create your first course now! 🚀</p>
                )}
            </DndContext>
        </div>
    );
};

export default CoursesContentManager;