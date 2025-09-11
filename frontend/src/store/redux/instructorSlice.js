import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming your API client handles adding the auth token
import { toast } from "react-hot-toast";

// ===================================
// Async Thunks
// ===================================

/**
 * @desc Create a new instructor profile.
 * @param {object} profileData - The data for the new profile, including the userId.
 */
export const createInstructorProfile = createAsyncThunk(
  "instructor/createProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      // The API call assumes the userId is part of the profileData object
      const { data } = await API.post(`/instructors/profile`, profileData);
      toast.success("Instructor profile created successfully! 🎉");
      return data.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      toast.error(`Creation failed: ${message}`);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Get an instructor's profile by their user ID. This is a public route on the API.
 * @param {string} userId - The ID of the user/instructor.
 */
export const getInstructorProfile = createAsyncThunk(
  "instructor/getProfile",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/instructors/${userId}/profile`);
      return data.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Update an instructor's profile and user details.
 * @param {object} payload - Contains userId and the updateData object.
 */
export const updateInstructorProfile = createAsyncThunk(
  "instructor/updateProfile",
  async ({ userId, updateData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/instructors/${userId}/profile`, updateData);
      toast.success("Profile updated successfully! ✅");
      return data.data; // The returned data contains both user and profile info
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      toast.error(`Update failed: ${message}`);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Delete an instructor's profile.
 * @param {string} userId - The ID of the user/instructor.
 */
export const deleteInstructorProfile = createAsyncThunk(
  "instructor/deleteProfile",
  async (userId, { rejectWithValue }) => {
    try {
      await API.delete(`/instructors/${userId}/profile`);
      toast.success("Profile deleted successfully! 🗑️");
      return userId;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      toast.error(`Deletion failed: ${message}`);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Get all courses created by an instructor.
 * @param {string} userId - The ID of the user/instructor.
 */
export const getInstructorCourses = createAsyncThunk(
  "instructor/getCourses",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/instructors/${userId}/courses`);
      return data.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      return rejectWithValue(message);
    }
  }
);

// ===================================
// Slice Definition
// ===================================

const initialState = {
  profile: null,
  courses: [],
  isLoading: false,
  error: null,
};

const instructorSlice = createSlice({
  name: "instructor",
  initialState,
  reducers: {
    clearInstructorState: (state) => {
      state.profile = null;
      state.courses = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Create Profile ---
      .addCase(createInstructorProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createInstructorProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(createInstructorProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // --- Get Profile ---
      .addCase(getInstructorProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInstructorProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(getInstructorProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // --- Update Profile ---
      .addCase(updateInstructorProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateInstructorProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        // The payload contains both user and instructorProfile data
        // We merge the updated instructorProfile into our state
        state.profile = { ...state.profile, ...action.payload.instructorProfile };
        // We then merge the updated user data into the nested user object
        state.profile.user = { ...state.profile.user, ...action.payload.user };
        state.error = null;
      })
      .addCase(updateInstructorProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // --- Delete Profile ---
      .addCase(deleteInstructorProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteInstructorProfile.fulfilled, (state) => {
        state.isLoading = false;
        state.profile = null; // Clear the profile from state
        state.error = null;
      })
      .addCase(deleteInstructorProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // --- Get Courses ---
      .addCase(getInstructorCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInstructorCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
        state.error = null;
      })
      .addCase(getInstructorCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearInstructorState } = instructorSlice.actions;
export default instructorSlice.reducer;