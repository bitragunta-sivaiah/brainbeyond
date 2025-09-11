import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

// Async Thunks

// Thunk to fetch admin dashboard data.
export const fetchAdminDashboard = createAsyncThunk(
  "dashboard/fetchAdminDashboard",
  async (period = "monthly", { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/dashboard/admin?period=${period}`);
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch admin dashboard data.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Thunk to fetch instructor dashboard data.
export const fetchInstructorDashboard = createAsyncThunk(
  "dashboard/fetchInstructorDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/dashboard/instructor");
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch instructor dashboard data.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Thunk to fetch customer care dashboard data.
export const fetchCustomerCareDashboard = createAsyncThunk(
  "dashboard/fetchCustomerCareDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/dashboard/customercare");
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch customer care dashboard data.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Thunk to fetch student dashboard data.
export const fetchStudentDashboard = createAsyncThunk(
  "dashboard/fetchStudentDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/dashboard/student");
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch student dashboard data.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Thunk to handle the universal data export functionality.
export const exportData = createAsyncThunk(
  "dashboard/exportData",
  async ({ dataType, ids }, { rejectWithValue }) => {
    try {
      const response = await API.post(
        "/dashboard/export",
        { dataType, ids },
        {
          responseType: "blob", // Important: Ensures the response is handled as a binary blob
        }
      ); // Create a blob URL and a temporary link to download the file

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url; // Extract the filename from the Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = "export.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(
        "Data export successful! Your download should begin shortly."
      );
      return { success: true };
    } catch (error) {
      // Need to handle blob errors differently
      const errorBlob = await error.response?.data?.text();
      const message = errorBlob || "Failed to export data. Please try again.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Initial State
const initialState = {
  admin: {
    data: null,
    loading: false,
    error: null,
  },
  instructor: {
    data: null,
    loading: false,
    error: null,
  },
  customerCare: {
    data: null,
    loading: false,
    error: null,
  },
  student: {
    data: null,
    loading: false,
    error: null,
  },
  export: {
    loading: false,
    error: null,
  },
};

// Dashboard Slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Admin Dashboard
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.admin.loading = true;
        state.admin.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.admin.loading = false;
        state.admin.data = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.admin.loading = false;
        state.admin.error = action.payload;
      }); // Instructor Dashboard

    builder
      .addCase(fetchInstructorDashboard.pending, (state) => {
        state.instructor.loading = true;
        state.instructor.error = null;
      })
      .addCase(fetchInstructorDashboard.fulfilled, (state, action) => {
        state.instructor.loading = false;
        state.instructor.data = action.payload;
      })
      .addCase(fetchInstructorDashboard.rejected, (state, action) => {
        state.instructor.loading = false;
        state.instructor.error = action.payload;
      }); // Customer Care Dashboard

    builder
      .addCase(fetchCustomerCareDashboard.pending, (state) => {
        state.customerCare.loading = true;
        state.customerCare.error = null;
      })
      .addCase(fetchCustomerCareDashboard.fulfilled, (state, action) => {
        state.customerCare.loading = false;
        state.customerCare.data = action.payload;
      })
      .addCase(fetchCustomerCareDashboard.rejected, (state, action) => {
        state.customerCare.loading = false;
        state.customerCare.error = action.payload;
      }); // Student Dashboard

    builder
      .addCase(fetchStudentDashboard.pending, (state) => {
        state.student.loading = true;
        state.student.error = null;
      })
      .addCase(fetchStudentDashboard.fulfilled, (state, action) => {
        state.student.loading = false;
        state.student.data = action.payload;
      })
      .addCase(fetchStudentDashboard.rejected, (state, action) => {
        state.student.loading = false;
        state.student.error = action.payload;
      }); // Universal Export
    builder
      .addCase(exportData.pending, (state) => {
        state.export.loading = true;
        state.export.error = null;
      })
      .addCase(exportData.fulfilled, (state) => {
        state.export.loading = false; // No data payload needed as the file download is handled directly
      })
      .addCase(exportData.rejected, (state, action) => {
        state.export.loading = false;
        state.export.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
