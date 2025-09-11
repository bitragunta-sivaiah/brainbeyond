import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import toast from "react-hot-toast";

// Async Thunk for performing the ATS resume check
export const performAtsCheck = createAsyncThunk(
  "ats/performAtsCheck",
  async ({ resumeFile, jobDescriptionText }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescriptionText", jobDescriptionText);

      const response = await API.post("/ats", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        toast.success("Resume analysis complete!");
        return response.data;
      }
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "An unknown error occurred";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Initial state for the ATS slice
const initialState = {
  analysisData: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

// Create the ATS slice
const atsSlice = createSlice({
  name: "ats",
  initialState,
  reducers: {
    resetAtsState: (state) => {
      state.analysisData = null;
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(performAtsCheck.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
      })
      .addCase(performAtsCheck.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.analysisData = action.payload;
        state.message = "Analysis successful";
      })
      .addCase(performAtsCheck.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = true;
        state.message = action.payload || "Analysis failed";
      });
  },
});

// Export the reducer and actions
export const { resetAtsState } = atsSlice.actions;
export default atsSlice.reducer;