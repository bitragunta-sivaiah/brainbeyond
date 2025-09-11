import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Your pre-configured Axios instance
import { toast } from "react-hot-toast";

// --- Initial State ---
const initialState = {
    certificates: [], // Holds the list of the user's certificates
    currentCertificate: null, // Holds a single cert, e.g., after issuing or verifying
    selectedCertificate: null, // New: Holds a single cert fetched by ID
    loading: false,
    error: null,
    isSuccess: false, // Flag for successful operations like creation/deletion
};

// --- Async Thunks ---

/**
 * @description Thunk to issue a new certificate for a completed course.
 * @param {string} courseId - The ID of the course to issue the certificate for.
 */
export const issueCertificate = createAsyncThunk(
    "certificates/issue",
    async ({ courseId }, { rejectWithValue }) => {
        try {
            const { data } = await API.post("/certificates", { courseId });
            toast.success("Certificate issued successfully!");
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Thunk to fetch all certificates for the currently logged-in user.
 */
export const getMyCertificates = createAsyncThunk(
    "certificates/getMyCertificates",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await API.get("/certificates/my-certificates");
            return data.data; // The API returns the array in the 'data' property
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Thunk to fetch a single certificate by its ID.
 * @param {string} certificateId - The ID of the certificate to fetch.
 */
export const getCertificateById = createAsyncThunk(
    "certificates/getCertificateById",
    async (certificateId, { rejectWithValue }) => {
        try {
            const { data } = await API.get(`/certificates/${certificateId}`);
            return data.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to fetch certificate.";
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Thunk for public verification of a certificate.
 * @param {string} verificationToken - The unique token for verification.
 */
export const verifyCertificate = createAsyncThunk(
    "certificates/verify",
    async (verificationToken, { rejectWithValue }) => {
        try {
            const { data } = await API.get(`/certificates/verify/${verificationToken}`);
            toast.success(data.message);
            return data.data;
        } catch (error) {
            const message = error.response?.data?.message || "Verification failed.";
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Thunk to delete a certificate (admin action).
 * @param {string} certificateId - The ID of the certificate to delete.
 */
export const deleteCertificate = createAsyncThunk(
    "certificates/delete",
    async (certificateId, { rejectWithValue }) => {
        try {
            await API.delete(`/certificates/${certificateId}`);
            toast.success("Certificate revoked successfully.");
            return certificateId; // Return the ID for filtering the state
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);


// --- Certificate Slice ---
const certificateSlice = createSlice({
    name: "certificates",
    initialState,
    reducers: {
        // Reducer to reset state, useful for component cleanup
        resetCertificateState: (state) => {
            state.certificates = [];
            state.currentCertificate = null;
            state.selectedCertificate = null;
            state.loading = false;
            state.error = null;
            state.isSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // --- Issue Certificate ---
            .addCase(issueCertificate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(issueCertificate.fulfilled, (state, action) => {
                state.loading = false;
                state.isSuccess = true;
                state.certificates.push(action.payload.data); // Add the new cert to the list
                state.currentCertificate = action.payload.data; // Set the new cert as the current one
            })
            .addCase(issueCertificate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- Get My Certificates ---
            .addCase(getMyCertificates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMyCertificates.fulfilled, (state, action) => {
                state.loading = false;
                state.certificates = action.payload;
            })
            .addCase(getMyCertificates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- Get Certificate By ID ---
            .addCase(getCertificateById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.selectedCertificate = null; // Clear previous selection
            })
            .addCase(getCertificateById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedCertificate = action.payload;
            })
            .addCase(getCertificateById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- Verify Certificate ---
            .addCase(verifyCertificate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyCertificate.fulfilled, (state, action) => {
                state.loading = false;
                state.currentCertificate = action.payload; // Store verified details
            })
            .addCase(verifyCertificate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- Delete Certificate ---
            .addCase(deleteCertificate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCertificate.fulfilled, (state, action) => {
                state.loading = false;
                state.isSuccess = true;
                // Remove the deleted certificate from the state array
                state.certificates = state.certificates.filter(
                    (cert) => cert._id !== action.payload
                );
            })
            .addCase(deleteCertificate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { resetCertificateState } = certificateSlice.actions;

export default certificateSlice.reducer;