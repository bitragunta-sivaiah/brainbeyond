import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming your API client is configured here
import { toast } from "react-hot-toast";

// Async Thunks for Student Profile Operations

// Create Student Profile
export const createStudentProfile = createAsyncThunk(
  "studentProfile/create",
  async (profileData, { rejectWithValue }) => {
    try {
      // The router expects the 'user' ID to be set from req.user.id,
      // so profileData should generally not include 'user' if creating for self.
      // However, if the action is dispatched with { ...formData, user: userId },
      // the router's logic handles it correctly.
      const response = await API.post("/studentprofiles", profileData);
      toast.success("Student profile created successfully!");
      return response.data.data;
    } catch (error) {
      const message =
        error.response && error.response.data.error ?
        error.response.data.error :
        error.message;
      toast.error(`Error creating profile: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Get Student Profile for the currently authenticated user
export const getStudentProfileForMe = createAsyncThunk(
  "studentProfile/getForMe",
  async (_, { rejectWithValue }) => { // No 'id' parameter needed as it fetches for 'me'
    try {
      const response = await API.get("/studentprofiles/me");
      return response.data.data;
    } catch (error) {
      const message =
        error.response && error.response.data.error ?
        error.response.data.error :
        error.message;
      toast.error(`Error fetching profile: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Update Student Profile
export const updateStudentProfile = createAsyncThunk(
  "studentProfile/update",
  async ({ id, profileData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/studentprofiles/${id}`, profileData);
      toast.success("Student profile updated successfully!");
      return response.data.data;
    } catch (error) {
      const message =
        error.response && error.response.data.error ?
        error.response.data.error :
        error.message;
      toast.error(`Error updating profile: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Delete Student Profile
export const deleteStudentProfile = createAsyncThunk(
  "studentProfile/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/studentprofiles/${id}`);
      toast.success("Student profile deleted successfully!");
      return id; // Return the ID of the deleted profile
    } catch (error) {
      const message =
        error.response && error.response.data.error ?
        error.response.data.error :
        error.message;
      toast.error(`Error deleting profile: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Initial State for the Student Profile Slice
const initialState = {
  profile: null,
  loading: false,
  error: null,
};

// Student Profile Slice
const studentProfileSlice = createSlice({
  name: "studentProfile",
  initialState,
  reducers: {
    // You can add synchronous reducers here if needed
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Student Profile
      .addCase(createStudentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudentProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(createStudentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.profile = null;
      })
      // Get Student Profile for current user ('me' endpoint)
      .addCase(getStudentProfileForMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStudentProfileForMe.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(getStudentProfileForMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.profile = null; // Clear profile on error
      })
      // Update Student Profile
      .addCase(updateStudentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload; // Update the profile in state
        state.error = null;
      })
      .addCase(updateStudentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Student Profile
      .addCase(deleteStudentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudentProfile.fulfilled, (state) => {
        state.loading = false;
        state.profile = null; // Clear profile after successful deletion
        state.error = null;
      })
      .addCase(deleteStudentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfile } = studentProfileSlice.actions;
export default studentProfileSlice.reducer;
