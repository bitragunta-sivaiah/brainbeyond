import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

const initialState = {
  messages: [],
  loading: false,
  error: null,
};

// --- Async Thunks for API calls ---

/**
 * @desc Fetch all active marquee messages for public view
 */
export const fetchPublicMarqueeMessages = createAsyncThunk(
  "marquee/fetchPublicMessages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/marquee");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages.");
      return rejectWithValue(error.response?.data?.message || "Failed to fetch messages.");
    }
  }
);

/**
 * @desc Fetch all marquee messages (active and inactive) for admin view
 */
export const fetchAdminMarqueeMessages = createAsyncThunk(
  "marquee/fetchAdminMessages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/marquee/admin");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch admin messages.");
      return rejectWithValue(error.response?.data?.message || "Failed to fetch admin messages.");
    }
  }
);

/**
 * @desc Create a new marquee message
 */
export const createMarqueeMessage = createAsyncThunk(
  "marquee/createMessage",
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await API.post("/marquee", messageData);
      toast.success("Marquee message created successfully!");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create message.");
      return rejectWithValue(error.response?.data?.message || "Failed to create message.");
    }
  }
);

/**
 * @desc Update an existing marquee message
 */
export const updateMarqueeMessage = createAsyncThunk(
  "marquee/updateMessage",
  async (messageData, { rejectWithValue }) => {
    try {
      const { _id, ...updateData } = messageData;
      const response = await API.put(`/marquee/${_id}`, updateData);
      toast.success("Marquee message updated successfully!");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update message.");
      return rejectWithValue(error.response?.data?.message || "Failed to update message.");
    }
  }
);

/**
 * @desc Delete a marquee message
 */
export const deleteMarqueeMessage = createAsyncThunk(
  "marquee/deleteMessage",
  async (messageId, { rejectWithValue }) => {
    try {
      await API.delete(`/marquee/${messageId}`);
      toast.success("Marquee message deleted successfully!");
      return messageId; // Return the ID to easily remove it from the state
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message.");
      return rejectWithValue(error.response?.data?.message || "Failed to delete message.");
    }
  }
);

// --- Marquee Message Slice ---

const marqueeSlice = createSlice({
  name: "marquee",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Public Marquee Messages
      .addCase(fetchPublicMarqueeMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicMarqueeMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchPublicMarqueeMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Admin Marquee Messages
      .addCase(fetchAdminMarqueeMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminMarqueeMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchAdminMarqueeMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Marquee Message
      .addCase(createMarqueeMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(createMarqueeMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.unshift(action.payload); // Add new message to the beginning
      })
      .addCase(createMarqueeMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Marquee Message
      .addCase(updateMarqueeMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateMarqueeMessage.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.messages.findIndex(
          (msg) => msg._id === action.payload._id
        );
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      .addCase(updateMarqueeMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Marquee Message
      .addCase(deleteMarqueeMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteMarqueeMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = state.messages.filter((msg) => msg._id !== action.payload);
      })
      .addCase(deleteMarqueeMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default marqueeSlice.reducer;