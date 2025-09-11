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
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";
 
import ChapterForm from "../../components/ChapterForm";
import LessonForm from "../../components/LessonForm";
import { useNavigate } from "react-router-dom";

// Helper component for Sortable items (Chapters and Lessons)
const SortableItem = ({ id, children, data }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
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
      className="p-4 bg-card rounded-lg shadow-sm mb-2 relative"
      layout
    >
      <div {...attributes} {...listeners}>
        {children}
      </div>
    </motion.div>
  );
};

const InstructorCoursesContentManager = () => {
  const dispatch = useDispatch();
  const  navigate = useNavigate()
  const { courses, loading, error } = useSelector(
    (state) => state.courseContent
  );

  const [isChapterFormOpen, setIsChapterFormOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);

  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [lessonFormCourseId, setLessonFormCourseId] = useState(null);

  const [expandedCourses, setExpandedCourses] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  const chapterIdsByCourse = useMemo(() => {
    return courses.reduce((acc, course) => {
      acc[course._id] = course.chapters?.map((c) => c._id) || [];
      return acc;
    }, {});
  }, [courses]);

  const lessonIdsByChapter = useMemo(() => {
    return courses.flatMap(course => course.chapters || []).reduce((acc, chapter) => {
      acc[chapter._id] = chapter.lessons?.map(l => l._id) || [];
      return acc;
    }, {});
  }, [courses]);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCreateCourse = useCallback(() => {
      navigate('/instructor/create-Course')
  }, []);

  const handleEditCourse = useCallback((course) => {
    navigate(`/instructor/update-Course/${course.slug}`)
  }, []);

  const handleDeleteCourse = useCallback((id) => {
    toast((t) => (
      <div className="flex flex-col">
        <p className="mb-2">Are you sure you want to delete this course?</p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-md bg-destructive text-white hover:bg-red-700"
            onClick={() => {
              dispatch(deleteCourse(id))
                .unwrap()
                .then(() => {
                  toast.success("Course deleted successfully.", { id: t.id });
                  dispatch(fetchCourses());
                })
                .catch(() => toast.error("Failed to delete course.", { id: t.id }));
              toast.dismiss(t.id);
            }}
          >
            Delete
          </button>
          <button
            className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  }, [dispatch]);

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

  const handleDeleteChapter = useCallback((chapterId) => {
    toast((t) => (
      <div className="flex flex-col">
        <p className="mb-2">Are you sure you want to delete this chapter?</p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-md bg-destructive text-white hover:bg-red-700"
            onClick={() => {
              dispatch(deleteChapter(chapterId))
                .unwrap()
                .then(() => {
                  toast.success("Chapter deleted successfully.", { id: t.id });
                  dispatch(fetchCourses());
                })
                .catch(() => toast.error("Failed to delete chapter.", { id: t.id }));
              toast.dismiss(t.id);
            }}
          >
            Delete
          </button>
          <button
            className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  }, [dispatch]);

  const handleCreateLesson = useCallback((chapterId) => {
    setEditingLesson(null);
    setActiveChapterId(chapterId);
    const course = courses.find(c => c.chapters?.some(ch => ch._id === chapterId));
    if (course) {
      setLessonFormCourseId(course._id);
      setIsLessonFormOpen(true);
    } else {
      toast.error("Could not find associated course for this chapter.");
    }
  }, [courses]);

  const handleEditLesson = useCallback((lesson) => {
    setEditingLesson(lesson);
    setActiveChapterId(lesson.chapter);
    setLessonFormCourseId(lesson.course);
    setIsLessonFormOpen(true);
  }, []);

  const handleDeleteLesson = useCallback((lessonId) => {
    toast((t) => (
      <div className="flex flex-col">
        <p className="mb-2">Are you sure you want to delete this lesson?</p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-md bg-destructive text-white hover:bg-red-700"
            onClick={() => {
              dispatch(deleteLesson(lessonId))
                .unwrap()
                .then(() => {
                  toast.success("Lesson deleted successfully.", { id: t.id });
                  dispatch(fetchCourses());
                })
                .catch(() => toast.error("Failed to delete lesson.", { id: t.id }));
              toast.dismiss(t.id);
            }}
          >
            Delete
          </button>
          <button
            className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  }, [dispatch]);

  const handleDragEnd = useCallback(
    (result) => {
      const { active, over } = result;
      if (!over || active.id === over.id) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Handle Chapter reordering
      if (activeData?.type === "Chapter" && overData?.type === "Chapter") {
        const courseId = activeData.courseId;
        const chapterIds = chapterIdsByCourse[courseId];
        const oldIndex = chapterIds.indexOf(active.id);
        const newIndex = chapterIds.indexOf(over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newChapterIds = [...chapterIds];
          const [movedChapterId] = newChapterIds.splice(oldIndex, 1);
          newChapterIds.splice(newIndex, 0, movedChapterId);

          dispatch(reorderChapters({ courseId, chapterIds: newChapterIds }))
            .unwrap()
            .then(() => {
              toast.success("Chapters reordered successfully.");
              dispatch(fetchCourses());
            })
            .catch(() => {
              toast.error("Failed to reorder chapters. Please try again.");
              dispatch(fetchCourses());
            });
        }
      }
      // Handle Lesson reordering
      else if (activeData?.type === "Lesson" && overData?.type === "Lesson") {
        const chapterId = activeData.chapterId;
        const lessonIds = lessonIdsByChapter[chapterId];
        const oldIndex = lessonIds.indexOf(active.id);
        const newIndex = lessonIds.indexOf(over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLessonIds = [...lessonIds];
          const [movedLessonId] = newLessonIds.splice(oldIndex, 1);
          newLessonIds.splice(newIndex, 0, movedLessonId);

          dispatch(reorderLessons({ chapterId, lessonIds: newLessonIds }))
            .unwrap()
            .then(() => {
              toast.success("Lessons reordered successfully.");
              dispatch(fetchCourses());
            })
            .catch(() => {
              toast.error("Failed to reorder lessons. Please try again.");
              dispatch(fetchCourses());
            });
        }
      }
    },
    [dispatch, chapterIdsByCourse, lessonIdsByChapter]
  );

  const toggleCourse = useCallback((courseId) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  }, []);

  const toggleChapter = useCallback((chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  }, []);

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error)
    return (
      <div className="text-center p-8 text-destructive">Error: {error}</div>
    );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold text-primary">
          Course Content Manager
        </h1>
        <button
          onClick={handleCreateCourse}
          className="bg-primary p-4 rounded-lg shadow-2xl text-background font-bold py-2 flex items-center gap-2"
        >
          <Plus size={20} /> New Course
        </button>
      </div>

      <AnimatePresence>
        {isChapterFormOpen && (
          <ChapterForm
            chapter={editingChapter}
            courseId={activeCourseId}
            onClose={() => {
              setIsChapterFormOpen(false);
              dispatch(fetchCourses());
            }}
          />
        )}
        {isLessonFormOpen && (
          <LessonForm
            lesson={editingLesson}
            chapterId={activeChapterId}
            courseId={lessonFormCourseId}
            onClose={() => {
              setIsLessonFormOpen(false);
              dispatch(fetchCourses());
            }}
          />
        )}
      </AnimatePresence>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {courses && courses.length > 0 ? (
          <div className="space-y-6">
            <SortableContext
              items={courses.map(course => course._id)}
              strategy={verticalListSortingStrategy}
            >
              {courses.map((course) => (
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
                      <h2 className="text-3xl font-bold text-white mb-1">
                        {course.title}
                      </h2>
                      <p className="text-sm text-gray-300">
                        {course.shortDescription}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                        <span className="bg-[#54fb01] p-2 absolute top-0 left-0 rounded-br-sm text-black font-semibold">
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
                        onClick={() => toggleCourse(course._id)}
                        className="flex items-center gap-2 font-semibold text-primary-500 hover:text-primary transition-colors"
                      >
                        {expandedCourses[course._id] ? (
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
                          onClick={() => handleCreateChapter(course._id)}
                          className="bg-[#54fb01] py-1 px-3 rounded text-sm flex items-center gap-1"
                        >
                          <Plus size={16} /> Chapter
                        </button>
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="text-[#226200]"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="text-destructive"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedCourses[course._id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden mt-4"
                        >
                          <SortableContext
                            items={chapterIdsByCourse[course._id]}
                            strategy={verticalListSortingStrategy}
                          >
                            {course.chapters && course.chapters.length > 0 ? (
                              course.chapters.map((chapter) => (
                                <SortableItem
                                  key={chapter._id}
                                  id={chapter._id}
                                  data={{ type: "Chapter", courseId: course._id }}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 flex-grow">
                                      <GripVertical
                                        size={20}
                                        className="text-muted-foreground cursor-grab"
                                      />
                                      <button onClick={() => toggleChapter(chapter._id)}>
                                        {expandedChapters[chapter._id] ? (
                                          <ChevronDown size={20} />
                                        ) : (
                                          <ChevronRight size={20} />
                                        )}
                                      </button>
                                      <span className="text-lg font-semibold">
                                        {chapter.title}
                                      </span>
                                    </div>
                                    <div className="flex gap-4">
                                      <button
                                        onClick={() => handleCreateLesson(chapter._id)}
                                        className="bg-[#54fb01] p-1 px-3 rounded text-sm flex items-center gap-1"
                                      >
                                        <Plus size={16} /> Lesson
                                      </button>
                                      <button
                                        onClick={() => handleEditChapter(chapter)}
                                        className="text-[#226700]"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteChapter(chapter._id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                  <AnimatePresence>
                                    {expandedChapters[chapter._id] && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="pl-8 pt-4 overflow-hidden"
                                      >
                                        <SortableContext
                                          items={lessonIdsByChapter[chapter._id] || []}
                                          strategy={verticalListSortingStrategy}
                                        >
                                          {chapter.lessons && chapter.lessons.length > 0 ? (
                                            chapter.lessons.map((lesson) => (
                                              <SortableItem
                                                key={lesson._id}
                                                id={lesson._id}
                                                data={{
                                                  type: "Lesson",
                                                  chapterId: chapter._id,
                                                  courseId: course._id,
                                                }}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2 flex-grow">
                                                    <GripVertical
                                                      size={16}
                                                      className="text-muted-foreground cursor-grab"
                                                    />
                                                    <span className="text-md">
                                                      {lesson.title}
                                                    </span>
                                                  </div>
                                                  <div className="flex gap-4">
                                                    <button
                                                      onClick={() => handleEditLesson(lesson)}
                                                      className="text-[#1a4902]"
                                                    >
                                                      <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteLesson(lesson._id)}
                                                      className="text-destructive"
                                                    >
                                                      <Trash2 size={14} />
                                                    </button>
                                                  </div>
                                                </div>
                                              </SortableItem>
                                            ))
                                          ) : (
                                            <p className="text-muted-foreground p-2">
                                              No lessons yet.
                                            </p>
                                          )}
                                        </SortableContext>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </SortableItem>
                              ))
                            ) : (
                              <p className="text-muted-foreground p-4">
                                No chapters yet. Add one to get started.
                              </p>
                            )}
                          </SortableContext>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </SortableContext>
          </div>
        ) : (
          <p className="text-center text-muted-foreground p-8">
            No courses found. Create your first course now!
          </p>
        )}
      </DndContext>
    </div>
  );
};

export default InstructorCoursesContentManager;