import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming this is your Axios instance
import { toast } from "react-hot-toast";

// Async Thunks for HomePage Management

// Fetch the currently active/default homepage
export const fetchActiveHomepage = createAsyncThunk(
  "homepage/fetchActiveHomepage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/homepage/active");
      // No toast.success here, as this is often a silent background fetch
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load homepage content.");
      return rejectWithValue(error.response?.data);
    }
  }
);

// Fetch all homepage configurations (for admin listing)
export const fetchAllHomepages = createAsyncThunk(
  "homepage/fetchAllHomepages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/homepage");
      // toast.success("All homepage configurations fetched!"); // Optional: Can be noisy for regular fetching
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch homepage configurations.");
      return rejectWithValue(error.response?.data);
    }
  }
);

// Fetch a single homepage configuration by ID
export const fetchHomepageById = createAsyncThunk(
  "homepage/fetchHomepageById",
  async (homepageId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/homepage/${homepageId}`);
      toast.success("Homepage configuration loaded.");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load homepage configuration.");
      return rejectWithValue(error.response?.data);
    }
  }
);

// Create a new homepage configuration
export const createHomepage = createAsyncThunk(
  "homepage/createHomepage",
  async (homepageData, { rejectWithValue }) => {
    try {
      const response = await API.post("/homepage", homepageData);
      toast.success("Homepage configuration created successfully!");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create homepage configuration.");
      return rejectWithValue(error.response?.data);
    }
  }
);

// Update an existing homepage configuration
export const updateHomepage = createAsyncThunk(
  "homepage/updateHomepage",
  async ({ id, homepageData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/homepage/${id}`, homepageData);
      toast.success("Homepage configuration updated successfully!");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update homepage configuration.");
      return rejectWithValue(error.response?.data);
    }
  }
);

// Delete a homepage configuration
export const deleteHomepage = createAsyncThunk(
  "homepage/deleteHomepage",
  async (homepageId, { rejectWithValue }) => {
    try {
      await API.delete(`/homepage/${homepageId}`);
      toast.success("Homepage configuration deleted successfully!");
      return homepageId; // Return the ID to easily remove from state
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete homepage configuration.");
      return rejectWithValue(error.response?.data);
    }
  }
);

// Set a homepage as the active default
export const setHomepageAsDefault = createAsyncThunk(
  "homepage/setHomepageAsDefault",
  async (homepageId, { rejectWithValue }) => {
    try {
      const response = await API.put(`/homepage/${homepageId}/set-default`);
      toast.success(response.data.message || "Homepage successfully set as default!");
      return response.data.data; // Return the newly default homepage data
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to set homepage as default.");
      return rejectWithValue(error.response?.data);
    }
  }
);

const homepageSlice = createSlice({
  name: "homepage",
  initialState: {
    homepages: [], // Array to store all homepage configurations (for admin view)
    activeHomepage: null, // The currently displayed homepage for the public
    selectedHomepage: null, // For editing a specific homepage in the admin panel
    loading: false,
    error: null,
  },
  reducers: {
    // Reducer to clear selected homepage data (e.g., when closing an edit form)
    clearSelectedHomepage: (state) => {
      state.selectedHomepage = null;
      state.error = null;
    },
    // Reducer to clear all homepage data if needed (e.g., on logout)
    clearHomepagesData: (state) => {
      state.homepages = [];
      state.activeHomepage = null;
      state.selectedHomepage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Active Homepage
      .addCase(fetchActiveHomepage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveHomepage.fulfilled, (state, action) => {
        state.loading = false;
        state.activeHomepage = action.payload;
      })
      .addCase(fetchActiveHomepage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.activeHomepage = null; // Clear active homepage on error
      })

      // Fetch All Homepages
      .addCase(fetchAllHomepages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllHomepages.fulfilled, (state, action) => {
        state.loading = false;
        state.homepages = action.payload;
      })
      .addCase(fetchAllHomepages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.homepages = [];
      })

      // Fetch Homepage By ID
      .addCase(fetchHomepageById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedHomepage = null; // Clear previous selection
      })
      .addCase(fetchHomepageById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedHomepage = action.payload;
      })
      .addCase(fetchHomepageById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.selectedHomepage = null;
      })

      // Create Homepage
      .addCase(createHomepage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHomepage.fulfilled, (state, action) => {
        state.loading = false;
        // Add new homepage to the list, or refresh all if list is not consistently ordered
        state.homepages.push(action.payload);
        // If the created homepage is default/active, update activeHomepage as well
        if (action.payload.isDefault || action.payload.isActive) {
            state.activeHomepage = action.payload;
        }
      })
      .addCase(createHomepage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Homepage
      .addCase(updateHomepage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHomepage.fulfilled, (state, action) => {
        state.loading = false;
        // Update the homepage in the list
        const index = state.homepages.findIndex(hp => hp._id === action.payload._id);
        if (index !== -1) {
          state.homepages[index] = action.payload;
        }
        // If the updated homepage is the currently selected one, update it
        if (state.selectedHomepage?._id === action.payload._id) {
            state.selectedHomepage = action.payload;
        }
        // If the updated homepage is default/active, update activeHomepage
        if (action.payload.isDefault || action.payload.isActive) {
            state.activeHomepage = action.payload;
        } else if (state.activeHomepage?._id === action.payload._id) {
            // If the previously active one is no longer active/default, clear it
            state.activeHomepage = null;
        }
      })
      .addCase(updateHomepage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Homepage
      .addCase(deleteHomepage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHomepage.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the deleted homepage from the list
        state.homepages = state.homepages.filter(hp => hp._id !== action.payload);
        // If the deleted homepage was the active one, clear it
        if (state.activeHomepage?._id === action.payload) {
            state.activeHomepage = null;
        }
        // If the deleted homepage was the selected one, clear it
        if (state.selectedHomepage?._id === action.payload) {
            state.selectedHomepage = null;
        }
      })
      .addCase(deleteHomepage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Set Homepage as Default
      .addCase(setHomepageAsDefault.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setHomepageAsDefault.fulfilled, (state, action) => {
        state.loading = false;
        // Mark all others as not default/active and then set the new one
        state.homepages = state.homepages.map(hp =>
            hp._id === action.payload._id
                ? { ...hp, isActive: true, isDefault: true }
                : { ...hp, isActive: false, isDefault: false } // Ensures only one is default/active
        );
        state.activeHomepage = action.payload;
      })
      .addCase(setHomepageAsDefault.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedHomepage, clearHomepagesData } = homepageSlice.actions;

export default homepageSlice.reducer;
