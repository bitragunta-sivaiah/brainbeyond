import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

// Async Thunks

// ... (Existing async thunks: fetchAdminProfile, updateAdminProfile,
//      fetchAllUsers, fetchUserById, updateUserRole, updateUserStatus, deleteUser)

export const fetchAdminProfile = createAsyncThunk(
  "admin/fetchAdminProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/me");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateAdminProfile = createAsyncThunk(
  "admin/updateAdminProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await API.put("/admin/me", profileData);
      toast.success("Profile updated successfully!");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  "admin/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/users");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchUserById = createAsyncThunk(
  "admin/fetchUserById",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/admin/users/${userId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateUserRole = createAsyncThunk(
  "admin/updateUserRole",
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/users/${userId}/role`, { role });
      toast.success("User role updated successfully!");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  "admin/updateUserStatus",
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/users/${userId}/status`, { status });
      toast.success(`User status updated to '${status}' successfully!`);
      return { userId, updatedUser: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await API.delete(`/admin/users/${userId}`);
      toast.success("User deleted successfully!");
      return userId;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);


// New Async Thunk for Orders
export const fetchAllOrders = createAsyncThunk(
  "admin/fetchAllOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/orders");
      // The backend returns { summary: { ... }, orders: [...] }
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Initial State
const initialState = {
  adminProfile: null,
  allUsers: [],
  selectedUser: null,
  allOrders: [], // New state for all orders
  ordersSummary: { // New state for orders summary
    totalOrders: 0,
    totalStudentsEnrolled: 0,
    totalRevenue: "0.00",
  },
  loading: false,
  error: null,
};

// Slice
const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admin Profile
      .addCase(fetchAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.adminProfile = action.payload;
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Admin Profile
      .addCase(updateAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.adminProfile = action.payload.profile;
        // Optionally update the user part of the profile if it's returned
        state.adminProfile.user = action.payload.user;
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch All Users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.allUsers = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch User by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User Role
      .addCase(updateUserRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        state.allUsers = state.allUsers.map((user) =>
          user._id === updatedUser._id ? updatedUser : user
        );
        if (state.selectedUser && state.selectedUser._id === updatedUser._id) {
          state.selectedUser = { ...state.selectedUser, ...updatedUser };
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User Status
      .addCase(updateUserStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, updatedUser } = action.payload;
        state.allUsers = state.allUsers.map((user) =>
          user._id === userId ? { ...user, ...updatedUser } : user
        );
        if (state.selectedUser && state.selectedUser._id === userId) {
          state.selectedUser = updatedUser;
        }
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.allUsers = state.allUsers.filter((user) => user._id !== action.payload);
        if (state.selectedUser && state.selectedUser._id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch All Orders (NEW)
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.allOrders = action.payload.orders;
        state.ordersSummary = action.payload.summary;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedUser } = adminSlice.actions;

export default adminSlice.reducer;
