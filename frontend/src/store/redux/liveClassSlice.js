import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import toast from "react-hot-toast";

// Async Thunks for API calls

/**
 * @desc Create a new live class.
 * @param {Object} classData - The data for the new live class.
 */
export const createLiveClass = createAsyncThunk(
  "liveClasses/createLiveClass",
  async (classData, { rejectWithValue }) => {
    try {
      const response = await API.post("/liveclasses", classData);
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Fetch all live classes.
 */
export const fetchLiveClasses = createAsyncThunk(
  "liveClasses/fetchLiveClasses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/liveclasses");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Fetch a single live class by ID.
 * @param {string} id - The ID of the live class.
 */
export const fetchSingleLiveClass = createAsyncThunk(
  "liveClasses/fetchSingleLiveClass",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/liveclasses/${id}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Update a live class by ID.
 * @param {Object} payload - Contains the class ID and updated data.
 * @param {string} payload.id - The ID of the live class to update.
 * @param {Object} payload.updateData - The data to update the live class with.
 */
export const updateLiveClass = createAsyncThunk(
  "liveClasses/updateLiveClass",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/liveclasses/${id}`, updateData);
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Delete a live class by ID.
 * @param {string} id - The ID of the live class to delete.
 */
export const deleteLiveClass = createAsyncThunk(
  "liveClasses/deleteLiveClass",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/liveclasses/${id}`);
      toast.success(response.data.message);
      return id; // Return the ID to easily remove it from the state
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Initial state for the live classes slice
const initialState = {
  liveClasses: [],
  selectedLiveClass: null,
  isLoading: false,
  error: null,
};

const liveClassSlice = createSlice({
  name: "liveClasses",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle `createLiveClass` lifecycle
      .addCase(createLiveClass.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createLiveClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.liveClasses.push(action.payload);
      })
      .addCase(createLiveClass.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Handle `fetchLiveClasses` lifecycle
      .addCase(fetchLiveClasses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLiveClasses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.liveClasses = action.payload;
      })
      .addCase(fetchLiveClasses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.liveClasses = [];
      })
      // Handle `fetchSingleLiveClass` lifecycle
      .addCase(fetchSingleLiveClass.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.selectedLiveClass = null;
      })
      .addCase(fetchSingleLiveClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedLiveClass = action.payload;
      })
      .addCase(fetchSingleLiveClass.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.selectedLiveClass = null;
      })
      // Handle `updateLiveClass` lifecycle
      .addCase(updateLiveClass.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLiveClass.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.liveClasses.findIndex(
          (lc) => lc._id === action.payload._id
        );
        if (index !== -1) {
          state.liveClasses[index] = action.payload;
        }
        if (state.selectedLiveClass && state.selectedLiveClass._id === action.payload._id) {
          state.selectedLiveClass = action.payload;
        }
      })
      .addCase(updateLiveClass.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Handle `deleteLiveClass` lifecycle
      .addCase(deleteLiveClass.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteLiveClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.liveClasses = state.liveClasses.filter(
          (lc) => lc._id !== action.payload
        );
        if (state.selectedLiveClass && state.selectedLiveClass._id === action.payload) {
          state.selectedLiveClass = null;
        }
      })
      .addCase(deleteLiveClass.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = liveClassSlice.actions;

export default liveClassSlice.reducer;