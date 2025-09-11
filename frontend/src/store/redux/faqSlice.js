import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

const initialState = {
  faqs: [],
  loading: false,
  error: null,
};

// ===================================
// === Async Thunks for API calls ===
// ===================================

/**
 * @desc Fetch all published FAQs for public view
 */
export const fetchPublicFAQs = createAsyncThunk(
  "faq/fetchPublicFAQs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/faq");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch FAQs.");
      return rejectWithValue(error.response?.data?.message || "Failed to fetch FAQs.");
    }
  }
);

/**
 * @desc Fetch all FAQs (including unpublished) for admin view
 */
export const fetchAdminFAQs = createAsyncThunk(
  "faq/fetchAdminFAQs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/faq/admin");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch admin FAQs.");
      return rejectWithValue(error.response?.data?.message || "Failed to fetch admin FAQs.");
    }
  }
);

/**
 * @desc Create a new FAQ
 */
export const createFAQ = createAsyncThunk(
  "faq/createFAQ",
  async (faqData, { rejectWithValue }) => {
    try {
      const response = await API.post("/faq", faqData);
      toast.success("FAQ created successfully!");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create FAQ.");
      return rejectWithValue(error.response?.data?.message || "Failed to create FAQ.");
    }
  }
);

/**
 * @desc Update an existing FAQ
 */
export const updateFAQ = createAsyncThunk(
  "faq/updateFAQ",
  async (faqData, { rejectWithValue }) => {
    try {
      const { _id, ...updateData } = faqData;
      const response = await API.put(`/faq/${_id}`, updateData);
      toast.success("FAQ updated successfully!");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update FAQ.");
      return rejectWithValue(error.response?.data?.message || "Failed to update FAQ.");
    }
  }
);

/**
 * @desc Delete an FAQ
 */
export const deleteFAQ = createAsyncThunk(
  "faq/deleteFAQ",
  async (faqId, { rejectWithValue }) => {
    try {
      await API.delete(`/faq/${faqId}`);
      toast.success("FAQ deleted successfully!");
      return faqId; // Return the ID to easily remove it from the state
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete FAQ.");
      return rejectWithValue(error.response?.data?.message || "Failed to delete FAQ.");
    }
  }
);

/**
 * @desc Update the order of multiple FAQs (for drag-and-drop)
 */
export const updateFAQOrder = createAsyncThunk(
  "faq/updateFAQOrder",
  async (faqOrders, { rejectWithValue }) => {
    try {
      const response = await API.put("/faq/order", { faqs: faqOrders });
      toast.success(response.data.message || "FAQ order updated successfully!");
      return faqOrders; // Return the new order to update the state
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update FAQ order.");
      return rejectWithValue(error.response?.data?.message || "Failed to update FAQ order.");
    }
  }
);


// ===================================
// === FAQ Slice ===
// ===================================

const faqSlice = createSlice({
  name: "faq",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Public FAQs
      .addCase(fetchPublicFAQs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicFAQs.fulfilled, (state, action) => {
        state.loading = false;
        state.faqs = action.payload;
      })
      .addCase(fetchPublicFAQs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Admin FAQs
      .addCase(fetchAdminFAQs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminFAQs.fulfilled, (state, action) => {
        state.loading = false;
        state.faqs = action.payload;
      })
      .addCase(fetchAdminFAQs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create FAQ
      .addCase(createFAQ.pending, (state) => {
        state.loading = true;
      })
      .addCase(createFAQ.fulfilled, (state, action) => {
        state.loading = false;
        state.faqs.push(action.payload);
      })
      .addCase(createFAQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update FAQ
      .addCase(updateFAQ.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateFAQ.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.faqs.findIndex(
          (faq) => faq._id === action.payload._id
        );
        if (index !== -1) {
          state.faqs[index] = action.payload;
        }
      })
      .addCase(updateFAQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete FAQ
      .addCase(deleteFAQ.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteFAQ.fulfilled, (state, action) => {
        state.loading = false;
        state.faqs = state.faqs.filter((faq) => faq._id !== action.payload);
      })
      .addCase(deleteFAQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update FAQ Order
      .addCase(updateFAQOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateFAQOrder.fulfilled, (state, action) => {
        state.loading = false;
        // The action.payload contains the array of { _id, order }
        const updatedOrders = action.payload;
        const newFaqs = state.faqs.map(faq => {
          const newOrder = updatedOrders.find(o => o._id === faq._id);
          return newOrder ? { ...faq, order: newOrder.order } : faq;
        });
        // Sort the FAQs by the new order to reflect the drag-and-drop
        state.faqs = newFaqs.sort((a, b) => a.order - b.order);
      })
      .addCase(updateFAQOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default faqSlice.reducer;