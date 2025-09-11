import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming your API client is at this path
import toast from "react-hot-toast";

// Async thunks for API interactions

// Create a new learning roadmap
export const createLearningRoadmap = createAsyncThunk(
  "roadmaps/create",
  async (roadmapData, { rejectWithValue }) => {
    try {
      const { skill, skillLevel, totalDurationDays } = roadmapData;
      const response = await API.post("/roadmaps", { skill, skillLevel, totalDurationDays });
      toast.success("Roadmap created successfully!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Error creating roadmap: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Fetch all learning roadmaps (public or by owner)
export const fetchLearningRoadmaps = createAsyncThunk(
  "roadmaps/fetchAll",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await API.get("/roadmaps", { params: queryParams });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Error fetching roadmaps: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Fetch a single learning roadmap by ID or slug
export const fetchLearningRoadmapById = createAsyncThunk(
  "roadmaps/fetchById",
  async (identifier, { rejectWithValue }) => {
    try {
      const response = await API.get(`/roadmaps/${identifier}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Error fetching roadmap: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Update an existing learning roadmap
export const updateLearningRoadmap = createAsyncThunk(
  "roadmaps/update",
  async ({ id, roadmapData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/roadmaps/${id}`, roadmapData);
      toast.success("Roadmap updated successfully!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Error updating roadmap: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Delete a learning roadmap
export const deleteLearningRoadmap = createAsyncThunk(
  "roadmaps/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/roadmaps/${id}`);
      toast.success("Roadmap deleted successfully!");
      return id; // Return the ID of the deleted roadmap for state update
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Error deleting roadmap: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Like a learning roadmap
export const likeLearningRoadmap = createAsyncThunk(
  "roadmaps/like",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.put(`/roadmaps/${id}/like`);
      toast.success("Roadmap liked!");
      return { id, likesCount: response.data.likesCount }; // Return ID and new count
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Error liking roadmap: ${message}`);
      return rejectWithValue(message);
    }
  }
);

// Fork a learning roadmap
export const forkLearningRoadmap = createAsyncThunk(
  "roadmaps/fork",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.post(`/roadmaps/${id}/fork`);
      toast.success("Roadmap forked successfully!");
      return response.data; // Return the new forked roadmap
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Error forking roadmap: ${message}`);
      return rejectWithValue(message);
    }
  }
);


// Initial state for the slice
const initialState = {
  roadmaps: [],
  currentRoadmap: null,
  loading: false,
  error: null,
};

// Learning Roadmap slice
const learningRoadmapSlice = createSlice({
  name: "learningRoadmap",
  initialState,
  reducers: {
    clearCurrentRoadmap: (state) => {
      state.currentRoadmap = null;
    },
    clearRoadmapError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // createLearningRoadmap
      .addCase(createLearningRoadmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLearningRoadmap.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps.push(action.payload); // Add new roadmap to the list
        state.currentRoadmap = action.payload;
      })
      .addCase(createLearningRoadmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchLearningRoadmaps
      .addCase(fetchLearningRoadmaps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLearningRoadmaps.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps = action.payload.roadmaps; // Assuming payload has a 'roadmaps' array
        // If your API returns pagination info, you might store it here too
      })
      .addCase(fetchLearningRoadmaps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchLearningRoadmapById
      .addCase(fetchLearningRoadmapById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLearningRoadmapById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRoadmap = action.payload;
      })
      .addCase(fetchLearningRoadmapById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // updateLearningRoadmap
      .addCase(updateLearningRoadmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLearningRoadmap.fulfilled, (state, action) => {
        state.loading = false;
        // Update the roadmap in the list
        const index = state.roadmaps.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.roadmaps[index] = action.payload;
        }
        // Update the current roadmap if it's the one being edited
        if (state.currentRoadmap && state.currentRoadmap._id === action.payload._id) {
          state.currentRoadmap = action.payload;
        }
      })
      .addCase(updateLearningRoadmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // deleteLearningRoadmap
      .addCase(deleteLearningRoadmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLearningRoadmap.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps = state.roadmaps.filter((roadmap) => roadmap._id !== action.payload);
        if (state.currentRoadmap && state.currentRoadmap._id === action.payload) {
          state.currentRoadmap = null;
        }
      })
      .addCase(deleteLearningRoadmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // likeLearningRoadmap
      .addCase(likeLearningRoadmap.pending, (state) => {
        // No loading state change for like to keep UI responsive unless specifically needed
        state.error = null;
      })
      .addCase(likeLearningRoadmap.fulfilled, (state, action) => {
        // Find and update the likesCount for the specific roadmap
        const index = state.roadmaps.findIndex((r) => r._id === action.payload.id);
        if (index !== -1) {
          state.roadmaps[index].likesCount = action.payload.likesCount;
        }
        if (state.currentRoadmap && state.currentRoadmap._id === action.payload.id) {
          state.currentRoadmap.likesCount = action.payload.likesCount;
        }
      })
      .addCase(likeLearningRoadmap.rejected, (state, action) => {
        state.error = action.payload;
      })

      // forkLearningRoadmap
      .addCase(forkLearningRoadmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forkLearningRoadmap.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps.push(action.payload); // Add the new forked roadmap
        toast.success(`Roadmap "${action.payload.title}" forked successfully!`);
        // You might also want to update the original roadmap's forksCount if it's in the state
        const originalRoadmapIndex = state.roadmaps.findIndex(r => r._id === action.payload.originalId); // Assuming originalId is returned
        if (originalRoadmapIndex !== -1) {
             state.roadmaps[originalRoadmapIndex].forksCount = (state.roadmaps[originalRoadmapIndex].forksCount || 0) + 1;
        }
        if (state.currentRoadmap && state.currentRoadmap._id === action.payload.originalId) {
          state.currentRoadmap.forksCount = (state.currentRoadmap.forksCount || 0) + 1;
        }

      })
      .addCase(forkLearningRoadmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentRoadmap, clearRoadmapError } = learningRoadmapSlice.actions;
export default learningRoadmapSlice.reducer;
