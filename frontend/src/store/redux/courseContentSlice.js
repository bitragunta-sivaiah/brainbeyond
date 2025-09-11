import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

// --- Async Thunks for Course Content API Interaction ---

// ---------------- Courses ----------------

export const fetchCourses = createAsyncThunk(
  "courseContent/fetchCourses",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/course");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch courses.");
    }
  }
);

export const fetchCourseBySlug = createAsyncThunk(
  "courseContent/fetchCourseBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/course/${slug}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch course.");
    }
  }
);

export const createCourse = createAsyncThunk(
  "courseContent/createCourse",
  async (courseData, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/course", courseData);
      toast.success("Course created successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create course.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const updateCourse = createAsyncThunk(
  "courseContent/updateCourse",
  async ({ id, courseData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/course/${id}`, courseData);
      toast.success("Course updated successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update course.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const deleteCourse = createAsyncThunk(
  "courseContent/deleteCourse",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/course/${id}`);
      toast.success("Course deleted successfully!");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete course.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// ---------------- Chapters ----------------

export const createChapter = createAsyncThunk(
  "courseContent/createChapter",
  async ({ courseId, chapterData }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/courses/${courseId}/chapters`, chapterData);
      toast.success("Chapter created successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create chapter.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const updateChapter = createAsyncThunk(
  "courseContent/updateChapter",
  async ({ id, chapterData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/chapters/${id}`, chapterData);
      toast.success("Chapter updated successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update chapter.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const deleteChapter = createAsyncThunk(
  "courseContent/deleteChapter",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/chapters/${id}`);
      toast.success("Chapter deleted successfully!");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete chapter.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const reorderChapters = createAsyncThunk(
  "courseContent/reorderChapters",
  async ({ courseId, chapterIds }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/courses/${courseId}/chapters/reorder`, { chapterIds });
      toast.success(data.message);
      return { courseId, chapterIds };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reorder chapters.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// ---------------- Lessons ----------------

export const createLesson = createAsyncThunk(
  "courseContent/createLesson",
  async ({ chapterId, lessonData }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/chapters/${chapterId}/lessons`, lessonData);
      toast.success("Lesson created successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create lesson.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createLessonAI = createAsyncThunk(
  "courseContent/createLessonAI",
  async ({ chapterId, title, type, prompt }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/chapters/${chapterId}/lessons/ai`, { title, type, prompt });
      toast.success("Lesson created with AI assistance!");
      return data.lesson;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create lesson with AI.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const updateLesson = createAsyncThunk(
  "courseContent/updateLesson",
  async ({ id, lessonData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/lessons/${id}`, lessonData);
      toast.success("Lesson updated successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update lesson.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const deleteLesson = createAsyncThunk(
  "courseContent/deleteLesson",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/lessons/${id}`);
      toast.success("Lesson deleted successfully!");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete lesson.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const reorderLessons = createAsyncThunk(
  "courseContent/reorderLessons",
  async ({ chapterId, lessonIds }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/chapters/${chapterId}/lessons/reorder`, { lessonIds });
      toast.success(data.message);
      return { chapterId, lessonIds };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reorder lessons.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// ---------------- Live Classes ----------------

export const createLiveClass = createAsyncThunk(
  "courseContent/createLiveClass",
  async ({ chapterId, liveClassData }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/chapters/${chapterId}/live-classes`, liveClassData);
      toast.success("Live Class created successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create live class.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const updateLiveClass = createAsyncThunk(
  "courseContent/updateLiveClass",
  async ({ id, liveClassData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/live-classes/${id}`, liveClassData);
      toast.success("Live Class updated successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update live class.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const deleteLiveClass = createAsyncThunk(
  "courseContent/deleteLiveClass",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/live-classes/${id}`);
      toast.success("Live Class deleted successfully!");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete live class.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);


// ---------------- Doubts ----------------

export const createDoubt = createAsyncThunk(
  "courseContent/createDoubt",
  async ({ lessonId, doubtData }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/lessons/${lessonId}/doubts`, doubtData);
      toast.success("Doubt submitted successfully!");
      return { lessonId, doubt: data.doubt };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit doubt.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const addReplyToDoubt = createAsyncThunk(
  "courseContent/addReplyToDoubt",
  async ({ lessonId, doubtId, replyData }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/lessons/${lessonId}/doubts/${doubtId}/replies`, replyData);
      toast.success("Reply added successfully!");
      return { lessonId, doubtId, reply: data.reply };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reply.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const resolveDoubt = createAsyncThunk(
  "courseContent/resolveDoubt",
  async ({ lessonId, doubtId }, { rejectWithValue }) => {
    try {
      await API.put(`/lessons/${lessonId}/doubts/${doubtId}/resolve`);
      toast.success("Doubt resolved successfully!");
      return { lessonId, doubtId };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resolve doubt.");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const initialState = {
  courses: [],
  currentCourse: null,
  loading: false,
  error: null,
};

const courseContentSlice = createSlice({
  name: "courseContent",
  initialState,
  reducers: {
    reorderChaptersState(state, action) {
      const { courseId, chapterIds } = action.payload;
      const course = state.courses.find(c => c._id === courseId);
      if (course) {
        course.chapters.sort((a, b) => chapterIds.indexOf(a._id) - chapterIds.indexOf(b._id));
      }
      if (state.currentCourse && state.currentCourse._id === courseId) {
        state.currentCourse.chapters.sort((a, b) => chapterIds.indexOf(a._id) - chapterIds.indexOf(b._id));
      }
    },
    reorderLessonsState(state, action) {
      const { chapterId, lessonIds } = action.payload;
      if (state.currentCourse) {
        const chapter = state.currentCourse.chapters.find(c => c._id === chapterId);
        if (chapter) {
          chapter.lessons.sort((a, b) => lessonIds.indexOf(a._id) - lessonIds.indexOf(b._id));
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ------------------ Fetch Courses ------------------
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ------------------ Fetch Course by Slug ------------------
      .addCase(fetchCourseBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentCourse = null;
      })
      .addCase(fetchCourseBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ------------------ Create / Update / Delete Course ------------------
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses.push(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.courses.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        if (state.currentCourse && state.currentCourse._id === action.payload._id) {
          state.currentCourse = action.payload;
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = state.courses.filter(c => c._id !== action.payload);
        if (state.currentCourse && state.currentCourse._id === action.payload) {
          state.currentCourse = null;
        }
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ------------------ Create / Update / Delete Chapter ------------------
      .addCase(createChapter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChapter.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse && state.currentCourse._id === action.payload.course) {
          state.currentCourse.chapters.push(action.payload);
        }
      })
      .addCase(createChapter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateChapter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateChapter.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          const chapterIndex = state.currentCourse.chapters.findIndex(c => c._id === action.payload._id);
          if (chapterIndex !== -1) {
            state.currentCourse.chapters[chapterIndex] = action.payload;
          }
        }
      })
      .addCase(updateChapter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteChapter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteChapter.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          state.currentCourse.chapters = state.currentCourse.chapters.filter(c => c._id !== action.payload);
        }
      })
      .addCase(deleteChapter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(reorderChapters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderChapters.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(reorderChapters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ------------------ Create / Update / Delete Lesson ------------------
      .addCase(createLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLesson.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          const chapter = state.currentCourse.chapters.find(c => c._id === action.payload.chapter);
          if (chapter) {
            if (!chapter.lessons) chapter.lessons = [];
            chapter.lessons.push(action.payload);
          }
        }
      })
      .addCase(createLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createLessonAI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLessonAI.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          const chapter = state.currentCourse.chapters.find(c => c._id === action.payload.chapter);
          if (chapter) {
            if (!chapter.lessons) chapter.lessons = [];
            chapter.lessons.push(action.payload);
          }
        }
      })
      .addCase(createLessonAI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLesson.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          const chapter = state.currentCourse.chapters.find(c => c._id === action.payload.chapter);
          if (chapter && chapter.lessons) {
            const lessonIndex = chapter.lessons.findIndex(l => l._id === action.payload._id);
            if (lessonIndex !== -1) {
              chapter.lessons[lessonIndex] = action.payload;
            }
          }
        }
      })
      .addCase(updateLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLesson.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          state.currentCourse.chapters.forEach(chapter => {
            if (chapter.lessons) {
              chapter.lessons = chapter.lessons.filter(l => l._id !== action.payload);
            }
          });
        }
      })
      .addCase(deleteLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(reorderLessons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderLessons.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(reorderLessons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ------------------ Live Classes ------------------
      .addCase(createLiveClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLiveClass.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          const chapter = state.currentCourse.chapters.find(c => c._id === action.payload.chapter);
          if (chapter) {
            if (!chapter.liveClasses) chapter.liveClasses = [];
            chapter.liveClasses.push(action.payload);
          }
        }
      })
      .addCase(createLiveClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateLiveClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLiveClass.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          const chapter = state.currentCourse.chapters.find(c => c._id === action.payload.chapter);
          if (chapter && chapter.liveClasses) {
            const liveClassIndex = chapter.liveClasses.findIndex(lc => lc._id === action.payload._id);
            if (liveClassIndex !== -1) {
              chapter.liveClasses[liveClassIndex] = action.payload;
            }
          }
        }
      })
      .addCase(updateLiveClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteLiveClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLiveClass.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          state.currentCourse.chapters.forEach(chapter => {
            if (chapter.liveClasses) {
              chapter.liveClasses = chapter.liveClasses.filter(lc => lc._id !== action.payload);
            }
          });
        }
      })
      .addCase(deleteLiveClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ------------------ Doubts ------------------
      .addCase(createDoubt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDoubt.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          state.currentCourse.chapters.forEach(chapter => {
            const lesson = chapter.lessons?.find(l => l._id === action.payload.lessonId);
            if (lesson) {
              if (!lesson.doubts) lesson.doubts = [];
              lesson.doubts.push(action.payload.doubt);
            }
          });
        }
      })
      .addCase(createDoubt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addReplyToDoubt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReplyToDoubt.fulfilled, (state, action) => {
        state.loading = false;
        const { lessonId, doubtId, reply } = action.payload;
        if (state.currentCourse) {
          state.currentCourse.chapters.forEach(chapter => {
            const lesson = chapter.lessons?.find(l => l._id === lessonId);
            if (lesson && lesson.doubts) {
              const doubt = lesson.doubts.find(d => d._id === doubtId);
              if (doubt) {
                if (!doubt.answers) doubt.answers = [];
                doubt.answers.push(reply);
                doubt.status = 'answered';
              }
            }
          });
        }
      })
      .addCase(addReplyToDoubt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resolveDoubt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveDoubt.fulfilled, (state, action) => {
        state.loading = false;
        const { lessonId, doubtId } = action.payload;
        if (state.currentCourse) {
          state.currentCourse.chapters.forEach(chapter => {
            const lesson = chapter.lessons?.find(l => l._id === lessonId);
            if (lesson && lesson.doubts) {
              const doubt = lesson.doubts.find(d => d._id === doubtId);
              if (doubt) {
                doubt.status = 'resolved';
              }
            }
          });
        }
      })
      .addCase(resolveDoubt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { reorderChaptersState, reorderLessonsState } = courseContentSlice.actions;
export default courseContentSlice.reducer;