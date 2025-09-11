import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import toast from "react-hot-toast";

// Async thunks for API calls

/**
 * @desc Registers a new user.
 */
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await API.post("/auth/register", userData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Logs in a user.
 */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await API.post("/auth/login", credentials);
      localStorage.setItem("token", response.data.token);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Verifies user's email using an OTP.
 */
export const verifyEmailOtp = createAsyncThunk(
  "auth/verifyEmailOtp",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await API.post("/auth/verify-email", otpData);
      localStorage.setItem("token", response.data.token);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Requests an OTP for login or verification re-send.
 */
export const requestOtp = createAsyncThunk(
  "auth/requestOtp",
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.post("/auth/request-otp", { email });
      toast.success(response.data.message);
      return response.data;
    } catch (error)
    {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Logs in a user using an OTP.
 */
export const loginWithOtp = createAsyncThunk(
  "auth/loginWithOtp",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await API.post("/auth/login-with-otp", otpData);
      localStorage.setItem("token", response.data.token);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Requests a password reset token.
 */
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.post("/auth/forgotpassword", { email });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Resets user password using the reset token.
 */
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (resetData, { rejectWithValue }) => {
    try {
      const response = await API.put("/auth/resetpassword", resetData);
      localStorage.setItem("token", response.data.token);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Fetches the current logged-in user's profile.
 */
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/auth/me");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Updates the currently logged-in user's profile.
 */
export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (updateData, { rejectWithValue }) => {
    try {
      const response = await API.put(`/auth/me`, updateData);
      toast.success("Profile updated successfully!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Allows a logged-in user to change their password.
 */
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwords, { rejectWithValue }) => {
    try {
      const response = await API.put("/auth/changepassword", passwords);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Logs out the user by calling the backend endpoint.
 */
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await API.get("/auth/logout");
      toast.success("Logged out successfully.");
      return;
    } catch (error) {
      const message = error.response?.data?.message || "Logout failed.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Requests a new email verification OTP.
 */
export const resendVerificationOtp = createAsyncThunk(
  "auth/resendVerificationOtp",
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.post("/auth/resend-verification-otp", { email });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// --- ADMIN THUNKS ---

/**
 * @desc Fetches all users (admin-only).
 */
export const fetchAllUsers = createAsyncThunk(
  "auth/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/auth/users");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Fetches a single user by ID (admin-only).
 */
export const fetchSingleUser = createAsyncThunk(
  "auth/fetchSingleUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Updates any user's profile (admin-only).
 */
export const adminUpdateUser = createAsyncThunk(
  "auth/adminUpdateUser",
  async ({ userId, updateData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/auth/users/${userId}`, updateData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Soft-deletes a user (admin-only).
 */
export const softDeleteUser = createAsyncThunk(
  "auth/softDeleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/auth/users/${userId}`);
      toast.success(response.data.message);
      return { ...response.data, userId }; // Pass userId to the reducer
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Restores a soft-deleted user (admin-only).
 */
export const restoreUser = createAsyncThunk(
  "auth/restoreUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.put(`/auth/users/restore/${userId}`);
      toast.success(response.data.message);
      return { ...response.data, userId }; // Pass userId to the reducer
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc Updates a user's role (admin-only).
 */
export const updateUserRole = createAsyncThunk(
  "auth/updateUserRole",
  async ({ userId, newRole }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/auth/users/update-role/${userId}`, { newRole });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);


// --- Helper function for rejected logic to avoid repetition ---
const handleRejected = (state, action) => {
  state.isLoading = false;
  state.error = action.payload;

  const sessionExpiredMessages = [
    'Session has expired. Please log in again.',
    'Not authorized, token failed',
    'Not authorized, user not found',
  ];

  if (typeof action.payload === 'string' && sessionExpiredMessages.some(msg => action.payload.includes(msg))) {
    toast.error("Session expired. Please log in again.");
    localStorage.removeItem("token");
    state.token = null;
    state.user = null;
    state.isAuthenticated = false;
  }
};


const initialState = {
  user: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  isLoading: false,
  error: null,
  users: [], // For admin management
  selectedUser: null, // For viewing/editing a single user
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      localStorage.removeItem("token");
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Register User ---
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, handleRejected)

      // --- Login User ---
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, handleRejected)

      // --- Verify Email OTP ---
      .addCase(verifyEmailOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(verifyEmailOtp.rejected, handleRejected)

      // --- Request OTP ---
      .addCase(requestOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestOtp.rejected, handleRejected)
      
      // --- Login with OTP ---
      .addCase(loginWithOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginWithOtp.rejected, handleRejected)

      // --- Forgot Password ---
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPassword.rejected, handleRejected)

      // --- Reset Password ---
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(resetPassword.rejected, handleRejected)

      // --- Fetch User Profile ---
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserProfile.rejected, handleRejected)

      // --- Update User Profile ---
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
      })
      .addCase(updateUserProfile.rejected, handleRejected)

      // --- Change Password ---
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, handleRejected)

      // --- Logout User ---
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        localStorage.removeItem("token");
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        // Force logout on client even if API call fails
        state.isLoading = false;
        state.error = action.payload;
        localStorage.removeItem("token");
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // --- Resend Verification OTP ---
      .addCase(resendVerificationOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendVerificationOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendVerificationOtp.rejected, handleRejected)

      // --- Admin: Fetch All Users ---
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.data;
      })
      .addCase(fetchAllUsers.rejected, handleRejected)

      // --- Admin: Fetch Single User ---
      .addCase(fetchSingleUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSingleUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedUser = action.payload.data;
      })
      .addCase(fetchSingleUser.rejected, handleRejected)

      // --- Admin: Update User ---
      .addCase(adminUpdateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminUpdateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(u => u._id === action.payload.data._id);
        if (index !== -1) {
          state.users[index] = action.payload.data;
        }
      })
      .addCase(adminUpdateUser.rejected, handleRejected)
      
      // --- Admin: Soft Delete User ---
      .addCase(softDeleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(softDeleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(u => u._id === action.payload.userId);
        if (index !== -1) {
            state.users[index].isDeleted = true;
            state.users[index].isActive = false;
        }
      })
      .addCase(softDeleteUser.rejected, handleRejected)

      // --- Admin: Restore User ---
      .addCase(restoreUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(u => u._id === action.payload.userId);
        if (index !== -1) {
            state.users[index].isDeleted = false;
            state.users[index].isActive = true;
        }
      })
      .addCase(restoreUser.rejected, handleRejected)

      // --- Admin: Update User Role ---
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(u => u._id === action.payload.data._id);
        if (index !== -1) {
          state.users[index].role = action.payload.data.role;
        }
        if (state.selectedUser?._id === action.payload.data._id) {
           state.selectedUser.role = action.payload.data.role;
       }
      })
      .addCase(updateUserRole.rejected, handleRejected);
  },
});

export const { clearError, logout } = authSlice.actions;

export default authSlice.reducer;