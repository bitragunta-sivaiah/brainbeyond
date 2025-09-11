import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

// Async thunks for API calls
export const fetchEvents = createAsyncThunk("events/fetchEvents", async (_, { rejectWithValue }) => {
  try {
    const response = await API.get("/events");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchEventById = createAsyncThunk("events/fetchEventById", async (id, { rejectWithValue }) => {
  try {
    const response = await API.get(`/events/${id}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createEvent = createAsyncThunk("events/createEvent", async (eventData, { rejectWithValue }) => {
  try {
    const response = await API.post("/events", eventData);
    toast.success("Event created successfully!");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to create event.");
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateEvent = createAsyncThunk("events/updateEvent", async ({ id, eventData }, { rejectWithValue }) => {
  try {
    const response = await API.put(`/events/${id}`, eventData);
    toast.success("Event updated successfully!");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update event.");
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteEvent = createAsyncThunk("events/deleteEvent", async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/events/${id}`);
    toast.success("Event deleted successfully!");
    return id;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to delete event.");
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const registerForEvent = createAsyncThunk("events/registerForEvent", async (id, { rejectWithValue }) => {
  try {
    const response = await API.post(`/events/${id}/register`);
    toast.success(response.data.message);
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to register for event.");
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const eventSlice = createSlice({
  name: "events",
  initialState: {
    events: [],
    currentEvent: null,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetchEvents
      .addCase(fetchEvents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Handle fetchEventById
      .addCase(fetchEventById.pending, (state) => {
        state.status = "loading";
        state.currentEvent = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Handle createEvent
      .addCase(createEvent.fulfilled, (state, action) => {
        state.events.push(action.payload);
      })
      // Handle updateEvent
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex((event) => event._id === action.payload._id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      // Handle deleteEvent
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter((event) => event._id !== action.payload);
      })
      // Handle registerForEvent
      .addCase(registerForEvent.fulfilled, (state, action) => {
        // You might want to update the current event's attendees list here if applicable
        if (state.currentEvent && state.currentEvent._id === action.meta.arg) {
          state.currentEvent.attendees.push(action.meta.arg.userId); // This part assumes the API returns a user ID
        }
      });
  },
});

export default eventSlice.reducer;