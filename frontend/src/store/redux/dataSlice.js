import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

// Async thunks for Ads
export const fetchAds = createAsyncThunk('data/fetchAds', async () => {
    const response = await API.get('/ads');
    return response.data;
});

export const createAd = createAsyncThunk('data/createAd', async (newAd) => {
    const response = await API.post('/ads', newAd);
    return response.data;
});

export const updateAd = createAsyncThunk('data/updateAd', async ({ id, updatedAd }) => {
    const response = await API.patch(`/ads/${id}`, updatedAd);
    return response.data;
});

export const deleteAd = createAsyncThunk('data/deleteAd', async (id) => {
    await API.delete(`/ads/${id}`);
    return id;
});

// Async thunks for Announcements
export const fetchAnnouncements = createAsyncThunk('data/fetchAnnouncements', async () => {
    const response = await API.get('/announcements');
    return response.data;
});

export const createAnnouncement = createAsyncThunk('data/createAnnouncement', async (newAnnouncement) => {
    const response = await API.post('/announcements', newAnnouncement);
    return response.data;
});

export const updateAnnouncement = createAsyncThunk('data/updateAnnouncement', async ({ id, updatedAnnouncement }) => {
    const response = await API.patch(`/announcements/${id}`, updatedAnnouncement);
    return response.data;
});

export const deleteAnnouncement = createAsyncThunk('data/deleteAnnouncement', async (id) => {
    await API.delete(`/announcements/${id}`);
    return id;
});

const initialState = {
    ads: [],
    announcements: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Ad Reducers
            .addCase(fetchAds.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAds.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.ads = action.payload;
            })
            .addCase(fetchAds.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
                toast.error(`Failed to fetch ads: ${action.error.message}`);
            })
            .addCase(createAd.fulfilled, (state, action) => {
                state.ads.push(action.payload);
                toast.success("Ad created successfully!");
            })
            .addCase(createAd.rejected, (state, action) => {
                toast.error(`Failed to create ad: ${action.error.message}`);
            })
            .addCase(updateAd.fulfilled, (state, action) => {
                const index = state.ads.findIndex(ad => ad._id === action.payload._id);
                if (index !== -1) {
                    state.ads[index] = action.payload;
                }
                toast.success("Ad updated successfully!");
            })
            .addCase(updateAd.rejected, (state, action) => {
                toast.error(`Failed to update ad: ${action.error.message}`);
            })
            .addCase(deleteAd.fulfilled, (state, action) => {
                state.ads = state.ads.filter(ad => ad._id !== action.payload);
                toast.success("Ad deleted successfully!");
            })
            .addCase(deleteAd.rejected, (state, action) => {
                toast.error(`Failed to delete ad: ${action.error.message}`);
            })

            // Announcement Reducers
            .addCase(fetchAnnouncements.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAnnouncements.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.announcements = action.payload;
            })
            .addCase(fetchAnnouncements.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
                toast.error(`Failed to fetch announcements: ${action.error.message}`);
            })
            .addCase(createAnnouncement.fulfilled, (state, action) => {
                state.announcements.push(action.payload);
                toast.success("Announcement created successfully!");
            })
            .addCase(createAnnouncement.rejected, (state, action) => {
                toast.error(`Failed to create announcement: ${action.error.message}`);
            })
            .addCase(updateAnnouncement.fulfilled, (state, action) => {
                const index = state.announcements.findIndex(announcement => announcement._id === action.payload._id);
                if (index !== -1) {
                    state.announcements[index] = action.payload;
                }
                toast.success("Announcement updated successfully!");
            })
            .addCase(updateAnnouncement.rejected, (state, action) => {
                toast.error(`Failed to update announcement: ${action.error.message}`);
            })
            .addCase(deleteAnnouncement.fulfilled, (state, action) => {
                state.announcements = state.announcements.filter(announcement => announcement._id !== action.payload);
                toast.success("Announcement deleted successfully!");
            })
            .addCase(deleteAnnouncement.rejected, (state, action) => {
                toast.error(`Failed to delete announcement: ${action.error.message}`);
            });
    },
});

export default dataSlice.reducer;