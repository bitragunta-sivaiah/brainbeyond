import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import API from "../../../api/api"; // Your configured axios instance
import { toast } from "react-hot-toast";

// 1. Create an entity adapter for managing subscription plans
// This provides a normalized state for plans (e.g., { ids: [], entities: {} })
const plansAdapter = createEntityAdapter({
  // Assuming your plan objects have an '_id' field from MongoDB
  selectId: (plan) => plan._id,
});

// Initial state using the adapter
const initialState = {
  plans: plansAdapter.getInitialState(),
  analyticsData: [],
  plansStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  analyticsStatus: 'idle',
  exportStatus: 'idle',
  error: null,
};


// ------------------ ASYNC THUNKS ------------------

//## Subscription Plan Thunks

/**
 * @description Fetch all subscription plans
 */
export const fetchPlans = createAsyncThunk(
  "adminCollab/fetchPlans",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/collab/plans");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @description Create a new subscription plan
 */
export const createPlan = createAsyncThunk(
  "adminCollab/createPlan",
  async (planData, { rejectWithValue }) => {
    try {
      const response = await API.post("/admin/collab/plans", planData);
      toast.success("Plan created successfully!");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Creation failed: ${message}`);
      return rejectWithValue(message);
    }
  }
);

/**
 * @description Update an existing subscription plan
 */
export const updatePlan = createAsyncThunk(
  "adminCollab/updatePlan",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/collab/plans/${id}`, updateData);
      toast.success("Plan updated successfully!");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Update failed: ${message}`);
      return rejectWithValue(message);
    }
  }
);

/**
 * @description Delete a subscription plan
 */
export const deletePlan = createAsyncThunk(
  "adminCollab/deletePlan",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/admin/collab/plans/${id}`);
      toast.success("Plan deleted successfully!");
      return id; // Return the ID for removal from the state
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Deletion failed: ${message}`);
      return rejectWithValue(message);
    }
  }
);

//## Analytics Thunks

/**
 * @description Fetch hiring analytics data
 */
export const fetchAnalytics = createAsyncThunk(
  "adminCollab/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/collab/analytics");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @description Export hiring analytics data as an Excel file
 */
export const exportAnalytics = createAsyncThunk(
  "adminCollab/exportAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/collab/analytics/export", {
        responseType: 'blob', // Important: we expect a binary file
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set the filename for the download
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'hiring_analytics.xlsx'; // default
      if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch.length > 1) {
              filename = filenameMatch[1];
          }
      }
      link.setAttribute('download', filename);

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Export started successfully!");
      return { success: true };
    } catch (error) {
      const message = "Failed to export analytics data.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);


// ------------------ SLICE DEFINITION ------------------

const adminCollabSlice = createSlice({
  name: "adminCollab",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Plans
      .addCase(fetchPlans.pending, (state) => {
        state.plansStatus = 'loading';
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.plansStatus = 'succeeded';
        plansAdapter.setAll(state.plans, action.payload);
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.plansStatus = 'failed';
        state.error = action.payload;
      })
      
      // Create Plan
      .addCase(createPlan.fulfilled, (state, action) => {
        plansAdapter.addOne(state.plans, action.payload);
      })
      
      // Update Plan
      .addCase(updatePlan.fulfilled, (state, action) => {
        plansAdapter.upsertOne(state.plans, action.payload);
      })
      
      // Delete Plan
      .addCase(deletePlan.fulfilled, (state, action) => {
        plansAdapter.removeOne(state.plans, action.payload); // action.payload is the ID
      })
      
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.analyticsStatus = 'loading';
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analyticsStatus = 'succeeded';
        state.analyticsData = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.analyticsStatus = 'failed';
        state.error = action.payload;
      })
      
      // Export Analytics
      .addCase(exportAnalytics.pending, (state) => {
        state.exportStatus = 'loading';
      })
      .addCase(exportAnalytics.fulfilled, (state) => {
        state.exportStatus = 'succeeded';
      })
      .addCase(exportAnalytics.rejected, (state, action) => {
        state.exportStatus = 'failed';
        state.error = action.payload;
      });
  },
});

// ------------------ SELECTORS ------------------

// Export the entity adapter's pre-built selectors
export const {
  selectAll: selectAllPlans,
  selectById: selectPlanById,
  selectIds: selectPlanIds,
} = plansAdapter.getSelectors((state) => state.adminCollab.plans);

// Custom selectors for other state properties
export const getPlansStatus = (state) => state.adminCollab.plansStatus;
export const getAnalyticsStatus = (state) => state.adminCollab.analyticsStatus;
export const getExportStatus = (state) => state.adminCollab.exportStatus;
export const getAnalyticsData = (state) => state.adminCollab.analyticsData;
export const getAdminCollabError = (state) => state.adminCollab.error;


export default adminCollabSlice.reducer;