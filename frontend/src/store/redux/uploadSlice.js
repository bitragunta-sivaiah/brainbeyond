import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming this is your Axios instance
import { toast } from "react-hot-toast";
  //  using cloundinary 
// Async thunk for single file upload
export const uploadSingleFile = createAsyncThunk(
  "upload/uploadSingleFile",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("media", file);

      const response = await API.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("File uploaded successfully!");
        return response.data.data; // Assuming data contains file info like { url, publicId }
      } else {
        toast.error(response.data.message || "Single file upload failed.");
        return rejectWithValue(
          response.data.message || "Single file upload failed."
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An unexpected error occurred during single file upload.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for bulk file upload
export const uploadBulkFiles = createAsyncThunk(
  "upload/uploadBulkFiles",
  async (files, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("media", file);
      }

      const response = await API.post("/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        return response.data; // Assuming data contains array of file info
      } else {
        toast.error(response.data.message || "Bulk file upload failed.");
        return rejectWithValue(
          response.data.message || "Bulk file upload failed."
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An unexpected error occurred during bulk file upload.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for deleting a file
export const deleteFile = createAsyncThunk(
  "upload/deleteFile",
  async (publicId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/delete/${publicId}`);

      if (response.data.success) {
        toast.success("File deleted successfully!");
        return { publicId };
      } else {
        toast.error(response.data.message || "File deletion failed.");
        return rejectWithValue(
          response.data.message || "File deletion failed."
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An unexpected error occurred during file deletion.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  // For single file upload
  singleFile: null,
  singleFileStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  singleFileError: null,

  // For bulk file upload
  bulkFiles: [],
  bulkFileStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  bulkFileError: null,

  // A list of all uploaded files (can be combined from both single and bulk uploads)
  uploadedFiles: [],
  deleteStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    // You can add a reducer to clear the state if needed
    clearUploadState: (state) => {
      state.singleFile = null;
      state.singleFileStatus = "idle";
      state.singleFileError = null;
      state.bulkFiles = [];
      state.bulkFileStatus = "idle";
      state.bulkFileError = null;
      state.deleteStatus = "idle";
    },
    // Optional: a reducer to clear a specific upload
    clearSingleFileUpload: (state) => {
      state.singleFile = null;
      state.singleFileStatus = "idle";
      state.singleFileError = null;
    },
    clearBulkFileUpload: (state) => {
      state.bulkFiles = [];
      state.bulkFileStatus = "idle";
      state.bulkFileError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle single file upload
      .addCase(uploadSingleFile.pending, (state) => {
        state.singleFileStatus = "loading";
      })
      .addCase(uploadSingleFile.fulfilled, (state, action) => {
        state.singleFileStatus = "succeeded";
        state.singleFile = action.payload;
        // Add the new file to the general list of uploaded files
        state.uploadedFiles.push(action.payload);
      })
      .addCase(uploadSingleFile.rejected, (state, action) => {
        state.singleFileStatus = "failed";
        state.singleFileError = action.payload;
      })

      // Handle bulk file upload
      .addCase(uploadBulkFiles.pending, (state) => {
        state.bulkFileStatus = "loading";
      })
      .addCase(uploadBulkFiles.fulfilled, (state, action) => {
        state.bulkFileStatus = "succeeded";
        state.bulkFiles = action.payload.data; // Assuming action.payload.data is an array of uploaded files
        // Add the new files to the general list of uploaded files
        state.uploadedFiles.push(...action.payload.data);
      })
      .addCase(uploadBulkFiles.rejected, (state, action) => {
        state.bulkFileStatus = "failed";
        state.bulkFileError = action.payload;
      })

      // Handle file deletion
      .addCase(deleteFile.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        // Remove the file from the uploadedFiles list
        state.uploadedFiles = state.uploadedFiles.filter(
          (file) => file.publicId !== action.payload.publicId
        );
        // Also clear from single or bulk state if it was there
        if (state.singleFile && state.singleFile.publicId === action.payload.publicId) {
          state.singleFile = null;
        }
        state.bulkFiles = state.bulkFiles.filter(
          (file) => file.publicId !== action.payload.publicId
        );
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.deleteStatus = "failed";
        // No need to change the state of files, as deletion failed
        state.singleFileError = action.payload; // Or a dedicated error for delete
      });
  },
});

export const { clearUploadState, clearSingleFileUpload, clearBulkFileUpload } = uploadSlice.actions;

export default uploadSlice.reducer;
