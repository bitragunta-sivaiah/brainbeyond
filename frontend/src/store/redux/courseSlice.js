import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; 
import { toast } from "react-hot-toast";

// Async thunk for creating a new course
export const createCourse = createAsyncThunk(
  "course/createCourse",
  async (courseData, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/courses", courseData);
      toast.success("Course created successfully!");
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk for fetching all courses
export const fetchAllCourses = createAsyncThunk(
  "course/fetchAllCourses",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/courses");
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

// Async thunk for fetching a single course by slug
export const fetchCourseBySlug = createAsyncThunk(
  "course/fetchCourseBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/courses/${slug}`);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk for updating a course
export const updateCourse = createAsyncThunk(
  "course/updateCourse",
  async ({ slug, updatedData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/courses/${slug}`, updatedData);
      toast.success("Course updated successfully!");
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk for deleting a course
export const deleteCourse = createAsyncThunk(
  "course/deleteCourse",
  async (slug, { rejectWithValue }) => {
    try {
      await API.delete(`/courses/${slug}`);
      toast.success("Course deleted successfully!");
      return slug;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk for adding coupons to a course
export const addCouponsToCourse = createAsyncThunk(
  "course/addCouponsToCourse",
  async ({ slug, couponIds }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/courses/${slug}/add-coupons`, { couponIds });
      toast.success("Coupons added successfully!");
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk for removing coupons from a course
export const removeCouponsFromCourse = createAsyncThunk(
  "course/removeCouponsFromCourse",
  async ({ slug, couponIds }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/courses/${slug}/remove-coupons`, { couponIds });
      toast.success("Coupons removed successfully!");
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk for fetching all instructors
export const fetchAllInstructors = createAsyncThunk(
  "course/fetchAllInstructors",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/courses/instructors");
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

const courseSlice = createSlice({
  name: "course",
  initialState: {
    courses: [],
    course: null,
    instructors: [],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    resetCourseStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle all async thunks (pending, fulfilled, rejected)
      .addCase(createCourse.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courses.push(action.payload); // Add new course to the list
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchAllCourses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courses = action.payload;
      })
      .addCase(fetchAllCourses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCourseBySlug.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCourseBySlug.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.course = action.payload;
      })
      .addCase(fetchCourseBySlug.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateCourse.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Update the course in the courses array
        const index = state.courses.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        // If the single course is being viewed, update it too
        if (state.course && state.course._id === action.payload._id) {
          state.course = action.payload;
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCourse.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Remove the deleted course from the courses array
        state.courses = state.courses.filter(
          (course) => course.slug !== action.payload
        );
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addCouponsToCourse.fulfilled, (state, action) => {
        if (state.course && state.course._id === action.payload._id) {
          state.course = action.payload;
        }
        state.status = "succeeded";
      })
      .addCase(removeCouponsFromCourse.fulfilled, (state, action) => {
        if (state.course && state.course._id === action.payload._id) {
          state.course = action.payload;
        }
        state.status = "succeeded";
      })
      .addCase(fetchAllInstructors.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllInstructors.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.instructors = action.payload;
      })
      .addCase(fetchAllInstructors.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetCourseStatus } = courseSlice.actions;

export default courseSlice.reducer;