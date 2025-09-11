import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming your API utility is located here
import { toast } from "react-hot-toast";

// --- Async Thunks for API Calls ---

/**
 * @name fetchCoupons
 * @description Fetches all coupons from the API.
 */
export const fetchCoupons = createAsyncThunk(
  "coupons/fetchCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/coupons");
      return response.data.data.coupons;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch coupons.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @name fetchCouponById
 * @description Fetches a single coupon by its ID from the API.
 * @param {string} couponId - The ID of the coupon to fetch.
 */
export const fetchCouponById = createAsyncThunk(
  "coupons/fetchCouponById",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/coupons/${couponId}`);
      return response.data.data.coupon;
    } catch (error) {
      const message = error.response?.data?.message || error.message || `Failed to fetch coupon with ID ${couponId}.`;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @name createCoupon
 * @description Creates a new coupon via the API.
 * @param {object} couponData - The data for the new coupon.
 */
export const createCoupon = createAsyncThunk(
  "coupons/createCoupon",
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await API.post("/coupons", couponData);
      toast.success("Coupon created successfully!");
      return response.data.data.coupon;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to create coupon.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @name updateCoupon
 * @description Updates an existing coupon by its ID via the API.
 * @param {object} args - Object containing couponId and updateData.
 * @param {string} args.couponId - The ID of the coupon to update.
 * @param {object} args.updateData - The data to update the coupon with.
 */
export const updateCoupon = createAsyncThunk(
  "coupons/updateCoupon",
  async ({ couponId, updateData }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/coupons/${couponId}`, updateData);
      toast.success("Coupon updated successfully!");
      return response.data.data.coupon;
    } catch (error) {
      const message = error.response?.data?.message || error.message || `Failed to update coupon with ID ${couponId}.`;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * @name deleteCoupon
 * @description Deletes a coupon by its ID via the API.
 * @param {string} couponId - The ID of the coupon to delete.
 */
export const deleteCoupon = createAsyncThunk(
  "coupons/deleteCoupon",
  async (couponId, { rejectWithValue }) => {
    try {
      await API.delete(`/coupons/${couponId}`);
      toast.success("Coupon deleted successfully!");
      return couponId; // Return the ID of the deleted coupon for state update
    } catch (error) {
      const message = error.response?.data?.message || error.message || `Failed to delete coupon with ID ${couponId}.`;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// --- Initial State ---
const initialState = {
  coupons: [],
  selectedCoupon: null, // For single coupon details
  loading: false,
  error: null,
};

// --- Coupon Slice ---
const couponSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    // You can add synchronous reducers here if needed for direct state manipulation
    clearCouponError: (state) => {
      state.error = null;
    },
    clearSelectedCoupon: (state) => {
      state.selectedCoupon = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All Coupons ---
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Coupon By ID ---
      .addCase(fetchCouponById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedCoupon = null; // Clear previous selection
      })
      .addCase(fetchCouponById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCoupon = action.payload;
      })
      .addCase(fetchCouponById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create Coupon ---
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons.push(action.payload); // Add the new coupon to the list
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Update Coupon ---
      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.coupons.findIndex((coupon) => coupon._id === action.payload._id);
        if (index !== -1) {
          state.coupons[index] = action.payload; // Update the coupon in the list
        }
        if (state.selectedCoupon && state.selectedCoupon._id === action.payload._id) {
            state.selectedCoupon = action.payload; // Also update if it's the selected coupon
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Delete Coupon ---
      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        // Filter out the deleted coupon from the list
        state.coupons = state.coupons.filter((coupon) => coupon._id !== action.payload);
        if (state.selectedCoupon && state.selectedCoupon._id === action.payload) {
            state.selectedCoupon = null; // Clear selected coupon if it was deleted
        }
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCouponError, clearSelectedCoupon } = couponSlice.actions;
export default couponSlice.reducer;
