import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

// Async thunk to fetch all notifications for the logged-in user.
// It will be handled in the extraReducers section of the slice.
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/notifications/my-notifications");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

// Async thunk to fetch the count of unread notifications.
export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/notifications/unread-count");
      return response.data.count;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

// Async thunk to mark a single notification as read by its ID.
export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await API.put(`/notifications/${notificationId}/read`);
      return response.data.data; // The updated notification object
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk to mark all notifications as read.
export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await API.put("/notifications/read-all");
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Async thunk to delete a single notification.
export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      await API.delete(`/notifications/${notificationId}`);
      toast.success("Notification deleted.");
      return notificationId;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount: 0,
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetching all notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error("Failed to fetch notifications.");
      })
      // Handle fetching unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Handle marking a single notification as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const updatedNotification = action.payload;
        const existingNotif = state.notifications.find(
          (n) => n._id === updatedNotification._id
        );
        if (existingNotif && !existingNotif.isRead) {
          existingNotif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Handle marking all notifications as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
        toast.success("All notifications marked as read.");
      })
      // Handle deleting a notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const deletedId = action.payload;
        const notificationToDelete = state.notifications.find(
          (n) => n._id === deletedId
        );
        if (notificationToDelete && !notificationToDelete.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(
          (n) => n._id !== deletedId
        );
      });
  },
});

export default notificationsSlice.reducer;