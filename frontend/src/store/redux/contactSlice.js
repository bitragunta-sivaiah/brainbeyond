import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import toast from "react-hot-toast";

// Async thunk to create a new contact message
export const createContactMessage = createAsyncThunk(
  "contact/createContactMessage",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/contact", formData);
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "An unknown error occurred";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk to get all contact messages (Admin/CustomerCare only)
export const getAllContactMessages = createAsyncThunk(
  "contact/getAllContactMessages",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/contact");
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "An unknown error occurred";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk to update the status of a contact message
export const updateContactStatus = createAsyncThunk(
  "contact/updateContactStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/contact/${id}/status`, { status });
      toast.success(data.message);
      return data.contact;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "An unknown error occurred";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk to add an internal note to a contact message
export const addContactNote = createAsyncThunk(
  "contact/addContactNote",
  async ({ id, note }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/contact/${id}/notes`, { note });
      toast.success(data.message);
      return data.contact;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "An unknown error occurred";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  messages: [],
  loading: false,
  error: null,
};

const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- createContactMessage ---
      .addCase(createContactMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(createContactMessage.fulfilled, (state, action) => {
        state.loading = false;
        // The message is successfully submitted, but we don't need to add it to the state for a public form
        // as the user is likely redirected or the form is cleared.
        state.error = null;
      })
      .addCase(createContactMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- getAllContactMessages ---
      .addCase(getAllContactMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllContactMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
        state.error = null;
      })
      .addCase(getAllContactMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.messages = [];
      })

      // --- updateContactStatus ---
      .addCase(updateContactStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateContactStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedMessage = action.payload;
        state.messages = state.messages.map((message) =>
          message._id === updatedMessage._id ? updatedMessage : message
        );
        state.error = null;
      })
      .addCase(updateContactStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // --- addContactNote ---
      .addCase(addContactNote.pending, (state) => {
        state.loading = true;
      })
      .addCase(addContactNote.fulfilled, (state, action) => {
        state.loading = false;
        const updatedMessage = action.payload;
        state.messages = state.messages.map((message) =>
          message._id === updatedMessage._id ? updatedMessage : message
        );
        state.error = null;
      })
      .addCase(addContactNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default contactSlice.reducer;