import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

// Create an entity adapter for courses
const studentCoursesAdapter = createEntityAdapter({
  selectId: (course) => course._id,
  sortComparer: (a, b) => a.title.localeCompare(b.title),
});

// Async Thunks

// Public Routes
export const fetchPublicCourses = createAsyncThunk(
  "studentCourses/fetchPublicCourses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/student/courses/public");
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchCourseDetails = createAsyncThunk(
  "studentCourses/fetchCourseDetails",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await API.get(`/student/courses/${slug}/details`);
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// User-Specific & Enrollment Routes
export const fetchMyCourses = createAsyncThunk(
  "studentCourses/fetchMyCourses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/student/courses/my");
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchCourseProgress = createAsyncThunk(
  "studentCourses/fetchCourseProgress",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await API.get(`/student/courses/${slug}/progress`);
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const enrollFreeCourse = createAsyncThunk(
  "studentCourses/enrollFreeCourse",
  async (slug, { rejectWithValue, dispatch }) => {
    try {
      const response = await API.post(`/student/courses/${slug}/enroll-free`);
      toast.success(response.data.message);
      dispatch(fetchMyCourses()); // Refetch my courses to update the list
      return {
        message: response.data.message
      };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  "studentCourses/createOrder",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await API.post(`/student/courses/${slug}/create-order`);
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "studentCourses/verifyPayment",
  async ({
    slug,
    paymentData
  }, {
    rejectWithValue,
    dispatch
  }) => {
    try {
      const response = await API.post(
        `/student/courses/${slug}/payment-verify`,
        paymentData
      );
      toast.success(response.data.message);
      dispatch(fetchMyCourses()); // Refetch my courses to update the list
      return {
        message: response.data.message
      };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const addDoubt = createAsyncThunk(
  "studentCourses/addDoubt",
  async ({
    lessonId,
    question
  }, {
    rejectWithValue
  }) => {
    try {
      const response = await API.post(
        `/student/courses/lessons/${lessonId}/doubts`, {
          question
        }
      );
      toast.success(response.data.message);
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Lesson & Progress Routes
export const completeLesson = createAsyncThunk(
  "studentCourses/completeLesson",
  async (lessonId, {
    rejectWithValue,
    dispatch
  }) => {
    try {
      const response = await API.post(
        `/student/courses/lessons/${lessonId}/complete`
      );
      toast.success(response.data.message);
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const incompleteLesson = createAsyncThunk(
  "studentCourses/incompleteLesson",
  async (lessonId, {
    rejectWithValue,
    dispatch
  }) => {
    try {
      const response = await API.post(
        `/student/courses/lessons/${lessonId}/incomplete`
      );
      toast.success(response.data.message);
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const submitQuiz = createAsyncThunk(
  "studentCourses/submitQuiz",
  async ({
    lessonId,
    answers
  }, {
    rejectWithValue
  }) => {
    try {
      const response = await API.post(
        `/student/courses/lessons/${lessonId}/submit-quiz`, {
          answers
        }
      );
      if (response.data.data.isPassed) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const submitCodingProblem = createAsyncThunk(
  "studentCourses/submitCodingProblem",
  async ({
    lessonId,
    code,
    language
  }, {
    rejectWithValue
  }) => {
    try {
      const response = await API.post(
        `/student/courses/lessons/${lessonId}/submit-coding-problem`, {
          code,
          language
        }
      );
      if (response.data.data.status === "correct") {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const runCode = createAsyncThunk(
  "studentCourses/runCode",
  async ({
    code,
    language,
    lessonId
  }, {
    rejectWithValue
  }) => {
    try {
      const response = await API.post(`/student/courses/lessons/run-code`, {
        code,
        language,
        lessonId,
      });
      toast.success(response.data.message);
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Review Routes
export const addReview = createAsyncThunk(
  "studentCourses/addReview",
  async ({
    slug,
    rating,
    comment
  }, {
    rejectWithValue,
    dispatch
  }) => {
    try {
      const response = await API.post(`/student/courses/${slug}/reviews`, {
        rating,
        comment,
      });
      toast.success(response.data.message);
      dispatch(fetchCourseDetails(slug)); // Refetch to update reviews
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateReview = createAsyncThunk(
  "studentCourses/updateReview",
  async ({
    slug,
    rating,
    comment
  }, {
    rejectWithValue,
    dispatch
  }) => {
    try {
      const response = await API.put(`/student/courses/${slug}/reviews`, {
        rating,
        comment,
      });
      toast.success(response.data.message);
      dispatch(fetchCourseDetails(slug)); // Refetch to update reviews
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteReview = createAsyncThunk(
  "studentCourses/deleteReview",
  async (slug, {
    rejectWithValue,
    dispatch
  }) => {
    try {
      const response = await API.delete(`/student/courses/${slug}/reviews`);
      toast.success(response.data.message);
      dispatch(fetchCourseDetails(slug)); // Refetch to update reviews
      return {
        slug
      };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Initial state
const initialState = {
  publicCourses: [],
  myCourses: [],
  courseDetails: null, // New field for specific course details
  courseProgress: null, // New field for specific course progress
  order: null,
  status: "idle",
  error: null,
};

// Create Slice
const studentCourseSlice = createSlice({
  name: "studentCourses",
  initialState,
  reducers: {
    resetCourseDetails: (state) => {
      state.courseDetails = null;
      state.courseProgress = null;
      state.order = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder // Fetch Public Courses
      .addCase(fetchPublicCourses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPublicCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.publicCourses = action.payload;
      })
      .addCase(fetchPublicCourses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      }) // Fetch Course Details
      .addCase(fetchCourseDetails.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseDetails = action.payload;
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      }) // Fetch My Courses
      .addCase(fetchMyCourses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.myCourses = action.payload;
      })
      .addCase(fetchMyCourses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      }) // Fetch Course Progress
      .addCase(fetchCourseProgress.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCourseProgress.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseProgress = action.payload;
      })
      .addCase(fetchCourseProgress.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Added a case for `runCode`
      .addCase(runCode.pending, (state) => {
        state.status = "loading";
      })
      .addCase(runCode.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(runCode.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      }) // All other actions (enroll, payment, etc.)
      .addMatcher(
        (action) =>
        action.type.startsWith("studentCourses") &&
        action.type.endsWith("/pending"),
        (state) => {
          state.status = "loading";
        }
      )
      .addMatcher(
        (action) =>
        action.type.startsWith("studentCourses") &&
        action.type.endsWith("/fulfilled"),
        (state) => {
          state.status = "succeeded";
        }
      )
      .addMatcher(
        (action) =>
        action.type.startsWith("studentCourses") &&
        action.type.endsWith("/rejected"),
        (state, action) => {
          state.status = "failed";
          state.error = action.payload;
        }
      );
  },
});

export const {
  resetCourseDetails
} = studentCourseSlice.actions;

export default studentCourseSlice.reducer;