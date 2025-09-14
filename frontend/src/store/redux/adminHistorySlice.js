import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming your API setup is in this file
import toast from "react-hot-toast";

// --- Initial State ---
// Defines the structure for storing each type of history report,
// including its data, loading status, and any potential errors.
const initialState = {
    purchaseHistory: {
        data: [],
        loading: false,
        error: null,
    },
    userHistory: {
        data: [],
        loading: false,
        error: null,
    },
    subscriptionHistory: {
        data: [],
        loading: false,
        error: null,
    },
    resumeHistory: {
        data: [],
        loading: false,
        error: null,
    },
    interviewHistory: {
        data: [],
        loading: false,
        error: null,
    },
    coursesHistory: {
        data: [],
        loading: false,
        error: null,
    },
};

// --- Async Thunks ---
// Each thunk corresponds to a specific API endpoint from your router.
// They handle the asynchronous logic of fetching data.

const API_BASE_URL = '/admin/history'; // Base URL from your router setup

export const fetchPurchaseHistory = createAsyncThunk(
    'adminHistory/fetchPurchaseHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get(`${API_BASE_URL}/purchase-history`);
            return response.data.data; // The router returns { success, count, data }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const fetchUserHistory = createAsyncThunk(
    'adminHistory/fetchUserHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get(`${API_BASE_URL}/user-history`);
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const fetchSubscriptionHistory = createAsyncThunk(
    'adminHistory/fetchSubscriptionHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get(`${API_BASE_URL}/subscription-history`);
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const fetchResumeHistory = createAsyncThunk(
    'adminHistory/fetchResumeHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get(`${API_BASE_URL}/resume-builder-history`);
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const fetchInterviewHistory = createAsyncThunk(
    'adminHistory/fetchInterviewHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get(`${API_BASE_URL}/interview-preparation-history`);
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const fetchCoursesHistory = createAsyncThunk(
    'adminHistory/fetchCoursesHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get(`${API_BASE_URL}/courses-history`);
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

// --- Slice Definition ---
const adminHistorySlice = createSlice({
    name: "adminHistory",
    initialState,
    reducers: {}, // No sync reducers needed for this case
    extraReducers: (builder) => {
        builder
            // Purchase History Cases
            .addCase(fetchPurchaseHistory.pending, (state) => {
                state.purchaseHistory.loading = true;
                state.purchaseHistory.error = null;
            })
            .addCase(fetchPurchaseHistory.fulfilled, (state, action) => {
                state.purchaseHistory.loading = false;
                state.purchaseHistory.data = action.payload;
            })
            .addCase(fetchPurchaseHistory.rejected, (state, action) => {
                state.purchaseHistory.loading = false;
                state.purchaseHistory.error = action.payload;
            })

            // User History Cases
            .addCase(fetchUserHistory.pending, (state) => {
                state.userHistory.loading = true;
                state.userHistory.error = null;
            })
            .addCase(fetchUserHistory.fulfilled, (state, action) => {
                state.userHistory.loading = false;
                state.userHistory.data = action.payload;
            })
            .addCase(fetchUserHistory.rejected, (state, action) => {
                state.userHistory.loading = false;
                state.userHistory.error = action.payload;
            })

            // Subscription History Cases
            .addCase(fetchSubscriptionHistory.pending, (state) => {
                state.subscriptionHistory.loading = true;
                state.subscriptionHistory.error = null;
            })
            .addCase(fetchSubscriptionHistory.fulfilled, (state, action) => {
                state.subscriptionHistory.loading = false;
                state.subscriptionHistory.data = action.payload;
            })
            .addCase(fetchSubscriptionHistory.rejected, (state, action) => {
                state.subscriptionHistory.loading = false;
                state.subscriptionHistory.error = action.payload;
            })

            // Resume History Cases
            .addCase(fetchResumeHistory.pending, (state) => {
                state.resumeHistory.loading = true;
                state.resumeHistory.error = null;
            })
            .addCase(fetchResumeHistory.fulfilled, (state, action) => {
                state.resumeHistory.loading = false;
                state.resumeHistory.data = action.payload;
            })
            .addCase(fetchResumeHistory.rejected, (state, action) => {
                state.resumeHistory.loading = false;
                state.resumeHistory.error = action.payload;
            })

            // Interview History Cases
            .addCase(fetchInterviewHistory.pending, (state) => {
                state.interviewHistory.loading = true;
                state.interviewHistory.error = null;
            })
            .addCase(fetchInterviewHistory.fulfilled, (state, action) => {
                state.interviewHistory.loading = false;
                state.interviewHistory.data = action.payload;
            })
            .addCase(fetchInterviewHistory.rejected, (state, action) => {
                state.interviewHistory.loading = false;
                state.interviewHistory.error = action.payload;
            })

            // Courses History Cases
            .addCase(fetchCoursesHistory.pending, (state) => {
                state.coursesHistory.loading = true;
                state.coursesHistory.error = null;
            })
            .addCase(fetchCoursesHistory.fulfilled, (state, action) => {
                state.coursesHistory.loading = false;
                state.coursesHistory.data = action.payload;
            })
            .addCase(fetchCoursesHistory.rejected, (state, action) => {
                state.coursesHistory.loading = false;
                state.coursesHistory.error = action.payload;
            });
    },
});

export default adminHistorySlice.reducer;