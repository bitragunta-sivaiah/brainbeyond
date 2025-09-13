import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming your API instance is configured here
import toast from "react-hot-toast";

const initialState = {
  roadmaps: [],
  myRoadmaps: [],
  currentRoadmap: null,
  pagination: {},
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// --- ASYNC THUNKS ---

// POST /api/v1/roadmaps/generate-with-ai
export const generateRoadmapAI = createAsyncThunk(
  "roadmaps/generateWithAi",
  async (roadmapData, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/roadmaps/generate-with-ai", roadmapData);
      toast.success("AI has successfully generated your roadmap draft!");
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// GET /api/v1/roadmaps
export const fetchPublicRoadmaps = createAsyncThunk(
  "roadmaps/fetchPublic",
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/roadmaps?page=${page}&limit=${limit}`);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

// GET /api/v1/roadmaps/my-roadmaps
export const fetchMyRoadmaps = createAsyncThunk(
  "roadmaps/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/roadmaps/my-roadmaps");
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

// GET /api/v1/roadmaps/:slug
export const fetchRoadmapBySlug = createAsyncThunk(
  "roadmaps/fetchBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/roadmaps/${slug}`);
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

// POST /api/v1/roadmaps
export const createRoadmap = createAsyncThunk(
  "roadmaps/create",
  async (roadmapData, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/roadmaps", roadmapData);
      toast.success("Roadmap created successfully!");
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// PUT /api/v1/roadmaps/:id
export const updateRoadmap = createAsyncThunk(
  "roadmaps/update",
  async ({ id, roadmapData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/roadmaps/${id}`, roadmapData);
      toast.success("Roadmap updated successfully!");
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// DELETE /api/v1/roadmaps/:id
export const deleteRoadmap = createAsyncThunk(
  "roadmaps/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/roadmaps/${id}`);
      toast.success("Roadmap deleted successfully!");
      return id; // Return the id to filter it out from the state
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// POST /api/v1/roadmaps/:id/fork
export const forkRoadmap = createAsyncThunk(
  "roadmaps/fork",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/roadmaps/${id}/fork`);
      toast.success("Roadmap forked to your collection!");
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// POST /api/v1/roadmaps/:id/ratings
export const addOrUpdateRating = createAsyncThunk(
  "roadmaps/addRating",
  async ({ id, ratingData }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/roadmaps/${id}/ratings`, ratingData);
      toast.success("Your review has been submitted!");
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// --- SLICE DEFINITION ---

const roadmapsSlice = createSlice({
  name: "roadmaps",
  initialState,
  reducers: {
    // Synchronous action to clear the detailed view of a roadmap
    clearCurrentRoadmap: (state) => {
      state.currentRoadmap = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Cases for Multiple Thunks ---
      .addCase(fetchPublicRoadmaps.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPublicRoadmaps.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.roadmaps = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPublicRoadmaps.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(fetchMyRoadmaps.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyRoadmaps.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.myRoadmaps = action.payload;
      })
      .addCase(fetchMyRoadmaps.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(fetchRoadmapBySlug.pending, (state) => {
        state.status = "loading";
        state.currentRoadmap = null;
      })
      .addCase(fetchRoadmapBySlug.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentRoadmap = action.payload;
      })
      .addCase(fetchRoadmapBySlug.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(generateRoadmapAI.pending, (state) => {
        state.status = "loading";
      })
      .addCase(generateRoadmapAI.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.myRoadmaps.unshift(action.payload); // Add to the beginning of my roadmaps
      })
      .addCase(generateRoadmapAI.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(createRoadmap.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.myRoadmaps.unshift(action.payload);
      })

      .addCase(updateRoadmap.fulfilled, (state, action) => {
        const updatedRoadmap = action.payload;
        // Update in the main list if it exists
        const publicIndex = state.roadmaps.findIndex(r => r._id === updatedRoadmap._id);
        if (publicIndex !== -1) {
          state.roadmaps[publicIndex] = updatedRoadmap;
        }
        // Update in the user's personal list
        const myIndex = state.myRoadmaps.findIndex(r => r._id === updatedRoadmap._id);
        if (myIndex !== -1) {
          state.myRoadmaps[myIndex] = updatedRoadmap;
        }
        // Update the currently viewed roadmap
        if (state.currentRoadmap?._id === updatedRoadmap._id) {
          state.currentRoadmap = updatedRoadmap;
        }
      })

      .addCase(deleteRoadmap.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.roadmaps = state.roadmaps.filter((r) => r._id !== deletedId);
        state.myRoadmaps = state.myRoadmaps.filter((r) => r._id !== deletedId);
        if (state.currentRoadmap?._id === deletedId) {
          state.currentRoadmap = null;
        }
      })
      
      .addCase(forkRoadmap.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.myRoadmaps.unshift(action.payload);
      })

      .addCase(addOrUpdateRating.fulfilled, (state, action) => {
          if (state.currentRoadmap) {
              state.currentRoadmap.ratings = action.payload;
              // Recalculate average rating locally for immediate UI update
              const sum = action.payload.reduce((acc, item) => acc + item.rating, 0);
              state.currentRoadmap.averageRating = Math.round((sum / action.payload.length) * 10) / 10 || 0;
          }
      });
  },
});

export const { clearCurrentRoadmap } = roadmapsSlice.actions;

export default roadmapsSlice.reducer;