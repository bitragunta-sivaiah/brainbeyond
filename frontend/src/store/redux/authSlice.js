import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import API from "../../api/api";
import toast from "react-hot-toast";

// --- ASYNC THUNKS ---

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

export const resendVerificationOtp = createAsyncThunk(
    "auth/resendVerificationOtp",
    async (email, { rejectWithValue }) => {
        try {
            const response = await API.post("/auth/resend-verification", { email });
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

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

export const requestOtp = createAsyncThunk(
    "auth/requestOtp",
    async (email, { rejectWithValue }) => {
        try {
            const response = await API.post("/auth/request-otp", { email });
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const loginWithOtp = createAsyncThunk(
    "auth/loginWithOtp",
    async (otpData, { rejectWithValue }) => {
        try {
            const response = await API.post("/auth/login-otp", otpData);
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

export const forgotPassword = createAsyncThunk(
    "auth/forgotPassword",
    async (email, { rejectWithValue }) => {
        try {
            const response = await API.post("/auth/forgot-password", { email });
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const resetPassword = createAsyncThunk(
    "auth/resetPassword",
    async (resetData, { rejectWithValue }) => {
        try {
            const response = await API.put("/auth/reset-password", resetData);
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

export const changePassword = createAsyncThunk(
    "auth/changePassword",
    async (passwords, { rejectWithValue }) => {
        try {
            const response = await API.put("/auth/change-password", passwords);
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logoutUser",
    async (_, { rejectWithValue }) => {
        try {
            await API.post("/auth/logout");
            toast.success("Logged out successfully.");
            return;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Logout failed on server, logged out locally.";
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

// --- ADMIN THUNKS ---

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

export const createUser = createAsyncThunk(
    "auth/createUser",
    async ({ email, role }, { rejectWithValue }) => {
        try {
            const response = await API.post("/auth/users", { email, role });
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const updateUserRole = createAsyncThunk(
    "auth/updateUserRole",
    async ({ userId, newRole }, { rejectWithValue }) => {
        try {
            const response = await API.put(`/auth/users/${userId}/role`, { newRole });
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const softDeleteUser = createAsyncThunk(
    "auth/softDeleteUser",
    async (userId, { rejectWithValue }) => {
        try {
            const response = await API.delete(`/auth/users/${userId}`);
            toast.success(response.data.message);
            return { ...response.data, userId };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const restoreUser = createAsyncThunk(
    "auth/restoreUser",
    async (userId, { rejectWithValue }) => {
        try {
            const response = await API.put(`/auth/users/${userId}/restore`);
            toast.success(response.data.message);
            return { ...response.data, userId };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

// --- INITIAL STATE & SLICE DEFINITION ---

const initialState = {
    user: null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
    isLoading: false,
    error: null,
    users: [], // For admin management
};

// --- HELPER REDUCERS for DRY code ---
const handleAuthSuccess = (state, action) => {
    state.user = action.payload.user;
    state.token = action.payload.token;
    state.isAuthenticated = true;
};

const handleLogout = (state) => {
    localStorage.removeItem("token");
    state.token = null;
    state.user = null;
    state.isAuthenticated = false;
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        logout: (state) => {
            handleLogout(state);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.user = action.payload.data;
                state.isAuthenticated = true;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.user = action.payload.data;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action) => {
                state.users = action.payload.data;
            })
            .addCase(softDeleteUser.fulfilled, (state, action) => {
                state.users = state.users.map((u) =>
                    u._id === action.payload.userId
                        ? { ...u, isDeleted: true, isActive: false }
                        : u
                );
            })
            .addCase(restoreUser.fulfilled, (state, action) => {
                state.users = state.users.map((u) =>
                    u._id === action.payload.userId
                        ? { ...u, isDeleted: false, isActive: true }
                        : u
                );
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.users.push(action.payload.data);
            })
            .addCase(updateUserRole.fulfilled, (state, action) => {
                const updatedUser = action.payload.data;
                const oldRole = updatedUser.role;

                // Define fields to remove based on the *old* role
                const roleSpecificFields = {
                    student: ['careerGoals', 'learningObjectives', 'achievements', 'education', 'skills', 'interests', 'workExperience', 'stats'],
                    instructor: ['experience', 'certifications', 'specializations', 'teachingPhilosophy', 'portfolioUrl', 'courses', 'totalStudents', 'totalCourses', 'totalReviews', 'averageRating'],
                    customercare: ['position', 'specialization', 'languages', 'availability', 'stats', 'skills', 'tools', 'performanceReviews', 'currentAssignments']
                };

                state.users = state.users.map((user) => {
                    if (user._id === updatedUser._id) {
                        const newUser = { ...updatedUser };
                        // Remove old role-specific fields from the local state
                        if (roleSpecificFields[oldRole]) {
                            roleSpecificFields[oldRole].forEach(field => {
                                delete newUser[field];
                            });
                        }
                        // Set the new role
                        newUser.role = action.meta.arg.newRole;

                        return newUser;
                    }
                    return user;
                });
            })
            .addCase(logoutUser.fulfilled, (state) => {
                handleLogout(state);
            })
            .addCase(logoutUser.rejected, (state) => {
                handleLogout(state);
            })
            .addMatcher(
                isAnyOf(
                    loginUser.fulfilled,
                    verifyEmailOtp.fulfilled,
                    loginWithOtp.fulfilled,
                    resetPassword.fulfilled
                ),
                (state, action) => {
                    handleAuthSuccess(state, action);
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/pending"),
                (state) => {
                    state.isLoading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/fulfilled"),
                (state) => {
                    state.isLoading = false;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/rejected"),
                (state, action) => {
                    state.isLoading = false;
                    state.error = action.payload;

                    const sessionExpiredMessages = [
                        "Session has expired",
                        "token failed",
                        "user not found",
                    ];

                    if (
                        typeof action.payload === "string" &&
                        sessionExpiredMessages.some((msg) => action.payload.includes(msg))
                    ) {
                        toast.error("Session expired. Please log in again.");
                        handleLogout(state);
                    }
                }
            );
    },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;