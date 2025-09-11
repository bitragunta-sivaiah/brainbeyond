import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming this is your Axios instance
import { toast } from "react-hot-toast";

// Async thunks for API calls

export const fetchSubscriptions = createAsyncThunk(
  "subscriptions/fetchSubscriptions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/subscriptions");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createSubscriptionPlan = createAsyncThunk(
  "subscriptions/createSubscriptionPlan",
  async (planData, { rejectWithValue }) => {
    try {
      const response = await API.post("/subscriptions", planData);
      toast.success("Subscription plan created successfully!");
      return response.data;
    } catch (error) {
      toast.error(error.response.data.message || "Failed to create subscription plan.");
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateSubscriptionPlan = createAsyncThunk(
  "subscriptions/updateSubscriptionPlan",
  async ({ id, planData }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/subscriptions/${id}`, planData);
      toast.success("Subscription plan updated successfully!");
      return response.data;
    } catch (error) {
      toast.error(error.response.data.message || "Failed to update subscription plan.");
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteSubscriptionPlan = createAsyncThunk(
  "subscriptions/deleteSubscriptionPlan",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/subscriptions/${id}`);
      toast.success("Subscription plan deleted successfully!");
      return id;
    } catch (error) {
      toast.error(error.response.data.message || "Failed to delete subscription plan.");
      return rejectWithValue(error.response.data);
    }
  }
);

export const buySubscription = createAsyncThunk(
  "subscriptions/buySubscription",
  async (subscriptionId, { rejectWithValue }) => {
    try {
      const response = await API.post(`/subscriptions/buy/${subscriptionId}`);
      toast.success("Payment initiated. Please complete the transaction.");
      return response.data;
    } catch (error) {
      toast.error(error.response.data.message || "Failed to initiate purchase.");
      return rejectWithValue(error.response.data);
    }
  }
);

export const renewSubscription = createAsyncThunk(
  "subscriptions/renewSubscription",
  async (currentSubscriptionId, { rejectWithValue }) => {
    try {
      const response = await API.post(`/subscriptions/renew/${currentSubscriptionId}`);
      toast.success("Renewal payment initiated. Please complete the transaction.");
      return response.data;
    } catch (error) {
      toast.error(error.response.data.message || "Failed to initiate renewal.");
      return rejectWithValue(error.response.data);
    }
  }
);

export const upgradeSubscription = createAsyncThunk(
  "subscriptions/upgradeSubscription",
  async (newSubscriptionId, { rejectWithValue }) => {
    try {
      const response = await API.post(`/subscriptions/upgrade/${newSubscriptionId}`);
      toast.success("Upgrade payment initiated. Please complete the transaction.");
      return response.data;
    } catch (error) {
      toast.error(error.response.data.message || "Failed to initiate upgrade.");
      return rejectWithValue(error.response.data);
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "subscriptions/verifyPayment",
  async (paymentData, { rejectWithValue, dispatch }) => {
    try {
      const response = await API.post("/subscriptions/verify-payment", paymentData);
      toast.success("Payment verified and subscription activated successfully! 🎉");
      // After successful payment verification, re-fetch user's subscriptions
      // This ensures the UI reflects the latest subscription status
      dispatch(fetchMySubscriptions()); 
      return response.data;
    } catch (error) {
      toast.error(error.response.data.message || "Payment verification failed.");
      return rejectWithValue(error.response.data);
    }
  }
);

// New async thunk to fetch the user's subscriptions
export const fetchMySubscriptions = createAsyncThunk(
  "subscriptions/fetchMySubscriptions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/subscriptions/my-subscription");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


const subscriptionSlice = createSlice({
  name: "subscriptions",
  initialState: {
    subscriptions: [], // All available subscription plans
    mySubscriptions: null, // User's purchased/active subscriptions
    loading: false,
    error: null,
    razorpayOrder: null,
  },
  reducers: {
    clearPaymentData: (state) => {
      state.razorpayOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Cases for fetching all subscriptions (public list)
      .addCase(fetchSubscriptions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = action.payload.data;
        state.error = null;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cases for creating, updating, deleting subscription plans (admin)
      .addCase(createSubscriptionPlan.fulfilled, (state, action) => {
        state.subscriptions.push(action.payload.data);
      })
      .addCase(updateSubscriptionPlan.fulfilled, (state, action) => {
        const index = state.subscriptions.findIndex(
          (sub) => sub._id === action.payload.data._id
        );
        if (index !== -1) {
          state.subscriptions[index] = action.payload.data;
        }
      })
      .addCase(deleteSubscriptionPlan.fulfilled, (state, action) => {
        state.subscriptions = state.subscriptions.filter(
          (sub) => sub._id !== action.payload
        );
      })
      // Cases for buying, renewing, upgrading subscriptions (user actions)
      .addCase(buySubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(buySubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.razorpayOrder = action.payload.razorpayOrder;
      })
      .addCase(buySubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(renewSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.razorpayOrder = action.payload.razorpayOrder;
      })
      .addCase(renewSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(upgradeSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(upgradeSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.razorpayOrder = action.payload.razorpayOrder;
      })
      .addCase(upgradeSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reducer cases for payment verification
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.razorpayOrder = null;
        state.error = null;
        // The fetchMySubscriptions thunk is dispatched from verifyPayment
        // so `mySubscriptions` will be updated by its own fulfilled case.
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // New Cases for fetching user's subscriptions
      .addCase(fetchMySubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear previous errors
      })
      .addCase(fetchMySubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.mySubscriptions = action.payload.data; // Store the user's subscriptions
        state.error = null;
      })
      .addCase(fetchMySubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.mySubscriptions = null; // Clear if fetch fails
      });
  },
});

export const { clearPaymentData } = subscriptionSlice.actions;

export default subscriptionSlice.reducer;