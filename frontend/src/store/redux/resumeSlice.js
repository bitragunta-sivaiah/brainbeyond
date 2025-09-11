import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import API from "../../api/api"; // Your pre-configured Axios instance

// ---------------------------------------------------------------------
// Async Thunks for All Resume Operations
// ---------------------------------------------------------------------

/**
 * @name createResume
 * @description Creates a new resume manually from JSON data.
 */
export const createResume = createAsyncThunk(
  "resume/createResume",
  async (resumeData, { rejectWithValue }) => {
    try {
      const response = await API.post("/resumes", resumeData);
      toast.success("Resume created successfully!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @name fetchResumes
 * @description Fetches all of the user's resumes.
 */
export const fetchResumes = createAsyncThunk(
  "resume/fetchResumes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/resumes");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @name fetchResumeById
 * @description Fetches a single resume by its ID.
 */
export const fetchResumeById = createAsyncThunk(
  "resume/fetchResumeById",
  async (resumeId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/resumes/${resumeId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @name updateResume
 * @description Updates an existing resume.
 */
export const updateResume = createAsyncThunk(
  "resume/updateResume",
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/resumes/${id}`, updatedData);
      toast.success("Resume updated successfully!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @name deleteResume
 * @description Soft deletes a resume by its ID.
 */
export const deleteResume = createAsyncThunk(
  "resume/deleteResume",
  async (resumeId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/resumes/${resumeId}`);
      toast.success(response.data.message || "Resume moved to trash!");
      return resumeId; // Return the ID for filtering state
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// --- AI-POWERED ATS THUNKS ---

/**
 * @name checkAtsScore
 * @description Uploads a resume file (as FormData) for ATS analysis.
 */
export const checkAtsScore = createAsyncThunk(
  "resume/checkAtsScore",
  async (formData, { rejectWithValue }) => {
    try {
      // CORRECTED: Added headers config for multipart/form-data.
      // This tells Axios to let the browser set the correct Content-Type with boundary.
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await API.post("/resumes/check-score", formData, config);
      toast.success("ATS analysis completed!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @name optimizeAndCreateResume
 * @description Uploads a resume (as FormData) for AI optimization and creation.
 */
export const optimizeAndCreateResume = createAsyncThunk(
  "resume/optimizeAndCreateResume",
  async (formData, { rejectWithValue }) => {
    try {
      // CORRECTED: Added headers config for multipart/form-data.
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await API.post(
        "/resumes/optimize-and-create",
        formData,
        config
      );
      toast.success(response.data.message || "Resume optimized and created!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ---------------------------------------------------------------------
// Resume Slice Definition
// ---------------------------------------------------------------------

const resumeSlice = createSlice({
  name: "resume",
  initialState: {
    resumes: [],
    currentResume: null,
    latestAnalysis: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearResumeError: (state) => {
      state.error = null;
    },
    setCurrentResume: (state, action) => {
      state.currentResume = action.payload;
    },
    clearLatestAnalysis: (state) => {
      state.latestAnalysis = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Create Resume Cases ---
      .addCase(createResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createResume.fulfilled, (state, action) => {
        state.loading = false;
        state.resumes.push(action.payload);
        state.currentResume = action.payload;
      })
      .addCase(createResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Resumes Cases ---
      .addCase(fetchResumes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResumes.fulfilled, (state, action) => {
        state.loading = false;
        state.resumes = action.payload;
      })
      .addCase(fetchResumes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Resume By ID Cases ---
      .addCase(fetchResumeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResumeById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResume = action.payload;
      })
      .addCase(fetchResumeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Update Resume Cases ---
      .addCase(updateResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateResume.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.resumes.findIndex(
          (r) => r._id === action.payload._id
        );
        if (index !== -1) {
          state.resumes[index] = action.payload;
        }
        if (state.currentResume?._id === action.payload._id) {
          state.currentResume = action.payload;
        }
      })
      .addCase(updateResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Delete Resume Cases ---
      .addCase(deleteResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteResume.fulfilled, (state, action) => {
        state.loading = false;
        state.resumes = state.resumes.filter((r) => r._id !== action.payload);
        if (state.currentResume?._id === action.payload) {
          state.currentResume = null;
        }
      })
      .addCase(deleteResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Check ATS Score Cases ---
      .addCase(checkAtsScore.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.latestAnalysis = null; // Clear previous analysis
      })
      .addCase(checkAtsScore.fulfilled, (state, action) => {
        state.loading = false;
        state.latestAnalysis = action.payload;
      })
      .addCase(checkAtsScore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Optimize and Create Resume Cases ---
      .addCase(optimizeAndCreateResume.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.latestAnalysis = null; // Clear previous analysis
      })
      .addCase(optimizeAndCreateResume.fulfilled, (state, action) => {
        state.loading = false;
        state.resumes.unshift(action.payload.newResume); // Add to beginning of the list
        state.currentResume = action.payload.newResume;
        state.latestAnalysis = action.payload.analysis;
      })
      .addCase(optimizeAndCreateResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearResumeError, setCurrentResume, clearLatestAnalysis } =
  resumeSlice.actions;

export default resumeSlice.reducer;
