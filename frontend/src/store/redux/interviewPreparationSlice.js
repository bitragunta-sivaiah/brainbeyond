import API from "@/api/api";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

// --- Initial State ---
const initialState = {
    preparations: [],
    currentPreparation: null,
    currentInterview: null,
    adminQuestions: [],
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: "",
};

// --- Helper for consistent error message extraction ---
const getErrorMessage = (error, defaultMessage) => {
    return error.response?.data?.message || error.message || defaultMessage;
};


// =================================================================
// --- ASYNC THUNKS (USER PLANS & CONTENT) ---
// =================================================================

export const fetchPreparations = createAsyncThunk("interviewPrep/fetchAll", async (_, { rejectWithValue }) => {
    try {
        const { data } = await API.get("/interview-prep");
        return data;
    } catch (error) {
        return rejectWithValue(getErrorMessage(error, "Failed to fetch preparation plans."));
    }
});

export const createPreparation = createAsyncThunk("interviewPrep/create", async (prepData, { rejectWithValue }) => {
    try {
        const { data } = await API.post("/interview-prep", prepData);
        toast.success("Preparation plan created!");
        return data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to create plan.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const fetchPreparationById = createAsyncThunk("interviewPrep/fetchById", async (id, { rejectWithValue }) => {
    try {
        const { data } = await API.get(`/interview-prep/${id}`);
        return data;
    } catch (error) {
        return rejectWithValue(getErrorMessage(error, "Could not load the preparation plan."));
    }
});

export const updatePreparation = createAsyncThunk("interviewPrep/update", async ({ id, prepData }, { rejectWithValue }) => {
    try {
        const { data } = await API.put(`/interview-prep/${id}`, prepData);
        toast.success("Plan updated!");
        return data;
    } catch (error) {
        const message = getErrorMessage(error, "Update failed.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const deletePreparation = createAsyncThunk("interviewPrep/delete", async (id, { rejectWithValue }) => {
    try {
        await API.delete(`/interview-prep/${id}`);
        toast.success("Plan deleted!");
        return id;
    } catch (error) {
        const message = getErrorMessage(error, "Deletion failed.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const deleteBulkPreparations = createAsyncThunk("interviewPrep/deleteBulk", async (ids, { rejectWithValue }) => {
    try {
        const { data } = await API.post("/interview-prep/bulk-delete", { ids });
        toast.success(data.message);
        return ids;
    } catch (error) {
        const message = getErrorMessage(error, "Bulk delete failed.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const generateQuestions = createAsyncThunk("interviewPrep/generateQuestions", async (id, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/interview-prep/${id}/generate-questions`);
        toast.success("AI questions generated!");
        return data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to generate questions.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const toggleQuestionPin = createAsyncThunk("interviewPrep/toggleQuestionPin", async ({ planId, questionId }, { rejectWithValue }) => {
    try {
        const { data } = await API.patch(`/interview-prep/${planId}/questions/${questionId}/toggle-pin`);
        toast.success("Question pin updated!");
        return data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to update question pin.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const deleteBulkQuestions = createAsyncThunk("interviewPrep/deleteBulkQuestions", async ({ planId, questionIds }, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/interview-prep/${planId}/questions/bulk-delete`, { questionIds });
        toast.success(data.message);
        return data.plan;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to remove questions.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const generateResources = createAsyncThunk("interviewPrep/generateResources", async (id, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/interview-prep/${id}/generate-resources`);
        toast.success(data.message || "AI resources generated!");
        return data.plan || data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to generate resources.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const updateResource = createAsyncThunk(
    "interviewPrep/updateResource",
    async ({ planId, resourceId, resourceData }, { rejectWithValue }) => {
        try {
            const { data } = await API.put(`/interview-prep/${planId}/resources/${resourceId}`, resourceData);
            toast.success("Resource updated!");
            return data;
        } catch (error) {
            const message = getErrorMessage(error, "Failed to update resource.");
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const deleteBulkResources = createAsyncThunk("interviewPrep/deleteBulkResources", async ({ planId, resourceIds }, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/interview-prep/${planId}/resources/bulk-delete`, { resourceIds });
        toast.success(data.message);
        return data.plan;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to remove resources.");
        toast.error(message);
        return rejectWithValue(message);
    }
});


// =================================================================
// --- MOCK INTERVIEW THUNKS ---
// =================================================================

export const startInterview = createAsyncThunk(
    "interviewPrep/startInterview",
    async ({ planId, config }, { rejectWithValue }) => {
        try {
            const requestConfig = {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            };

            const { data } = await API.post(
                `/interview-prep/${planId}/start-interview`,
                config, 
                requestConfig
            );
            
            toast.success("Mock interview started!");
            return { ...data, planId };
        } catch (error) {
            const message = getErrorMessage(error, "Failed to start interview.");
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const respondToInterview = createAsyncThunk("interviewPrep/respondToInterview", async ({ planId, interviewId, answer }, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/interview-prep/${planId}/interviews/${interviewId}/respond`, { answer });
        return { ...data, answer, interviewId };
    } catch (error) {
        const message = getErrorMessage(error, "Error submitting answer.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const handleInterviewIssue = createAsyncThunk("interviewPrep/handleInterviewIssue", async ({ planId, interviewId, issueType, currentQuestion }, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/interview-prep/${planId}/interviews/${interviewId}/handle-issue`, { issueType, currentQuestion });
        return data;
    } catch (error) {
        const message = getErrorMessage(error, "Error handling interview issue.");
        console.error(message);
        return rejectWithValue(message);
    }
});

export const endInterview = createAsyncThunk("interviewPrep/endInterview", async ({ planId, interviewId }, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/interview-prep/${planId}/interviews/${interviewId}/end-interview`);
        toast.success("Interview finished. Feedback generated!");
        return { interviewData: data, planId };
    } catch (error) {
        const message = getErrorMessage(error, "Failed to generate feedback.");
        toast.error(message);
        return rejectWithValue(message);
    }
});


// =================================================================
// --- ADMIN THUNKS ---
// =================================================================

export const fetchAdminQuestions = createAsyncThunk("interviewPrep/admin/fetchAll", async (filters, { rejectWithValue }) => {
    try {
        const { data } = await API.get("/interview-prep/admin/questions", { params: filters });
        return data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to fetch admin questions.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const createAdminQuestion = createAsyncThunk("interviewPrep/admin/create", async (questionData, { rejectWithValue }) => {
    try {
        const { data } = await API.post("/interview-prep/admin/questions", questionData);
        toast.success("Admin question created!");
        return data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to create admin question.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const updateAdminQuestion = createAsyncThunk("interviewPrep/admin/update", async ({ questionId, questionData }, { rejectWithValue }) => {
    try {
        const { data } = await API.put(`/interview-prep/admin/questions/${questionId}`, questionData);
        toast.success("Admin question updated!");
        return data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to update admin question.");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const deleteBulkAdminQuestions = createAsyncThunk("interviewPrep/admin/deleteBulk", async (ids, { rejectWithValue }) => {
    try {
        const { data } = await API.post("/interview-prep/admin/questions/bulk-delete", { ids });
        toast.success(data.message);
        return ids;
    } catch (error) {
        const message = getErrorMessage(error, "Bulk deletion failed.");
        toast.error(message);
        return rejectWithValue(message);
    }
});


// =================================================================
// --- SLICE DEFINITION ---
// =================================================================

const interviewPrepSlice = createSlice({
    name: "interviewPrep",
    initialState,
    reducers: {
        reset: () => initialState,
        clearCurrentInterview: (state) => {
            state.currentInterview = null;
        },
    },
    extraReducers: (builder) => {
        const updatePreparationInState = (state, action) => {
            const updatedPlan = action.payload;
            const index = state.preparations.findIndex((p) => p._id === updatedPlan._id);
            if (index !== -1) {
                state.preparations[index] = updatedPlan;
            }
            if (state.currentPreparation?._id === updatedPlan._id) {
                state.currentPreparation = updatedPlan;
            }
        };

        builder
            .addCase(fetchPreparations.fulfilled, (state, action) => {
                state.preparations = action.payload;
            })
            .addCase(fetchPreparationById.fulfilled, (state, action) => {
                state.currentPreparation = action.payload;
            })
            .addCase(createPreparation.fulfilled, (state, action) => {
                state.preparations.unshift(action.payload);
            })
            .addCase(deletePreparation.fulfilled, (state, action) => {
                state.preparations = state.preparations.filter((p) => p._id !== action.payload);
            })
            .addCase(deleteBulkPreparations.fulfilled, (state, action) => {
                const idSet = new Set(action.payload);
                state.preparations = state.preparations.filter((p) => !idSet.has(p._id));
            })
            .addCase(updatePreparation.fulfilled, updatePreparationInState)
            .addCase(generateQuestions.fulfilled, updatePreparationInState)
            .addCase(toggleQuestionPin.fulfilled, updatePreparationInState)
            .addCase(deleteBulkQuestions.fulfilled, updatePreparationInState)
            .addCase(generateResources.fulfilled, updatePreparationInState)
            .addCase(updateResource.fulfilled, updatePreparationInState)
            .addCase(deleteBulkResources.fulfilled, updatePreparationInState)

            // --- Interview Lifecycle ---
            .addCase(startInterview.fulfilled, (state, action) => {
                state.currentInterview = {
                    planId: action.payload.planId,
                    interviewId: action.payload.interviewId,
                    question: action.payload.question,
                    feedback: null,
                    nextQuestion: null, // Ensure nextQuestion is initialized
                    empatheticMessage: null,
                    response: null,
                };
            })
            .addCase(respondToInterview.fulfilled, (state, action) => {
                if (state.currentInterview) {
                    // FIX: Populate all necessary fields for the component's useEffect to work.
                    // The component needs `feedback` and `nextQuestion` to construct the text to speak.
                    state.currentInterview.feedback = action.payload.feedback;
                    state.currentInterview.nextQuestion = action.payload.nextQuestion;
                    // Also update the main 'question' field for UI display.
                    state.currentInterview.question = action.payload.nextQuestion;

                    // Clear any temporary messages from handleIssue
                    state.currentInterview.empatheticMessage = null;
                    state.currentInterview.response = null;
                }
            })
            .addCase(handleInterviewIssue.fulfilled, (state, action) => {
                if (state.currentInterview) {
                    state.currentInterview.empatheticMessage = action.payload.empatheticMessage;
                    state.currentInterview.response = action.payload.response; 
                    state.currentInterview.feedback = null;
                    state.currentInterview.nextQuestion = null;
                }
            })
            .addCase(endInterview.fulfilled, (state, action) => {
                const { interviewData, planId } = action.payload;
                const preparation = state.currentPreparation?._id === planId 
                    ? state.currentPreparation 
                    : state.preparations.find(p => p._id === planId);

                if (preparation) {
                    // FIX: Add the new interview report instead of just trying to update.
                    // The old logic would fail if the interview didn't already exist in the array.
                    if (!preparation.aiMockInterviews) {
                        preparation.aiMockInterviews = []; // Initialize array if it doesn't exist
                    }
                    const index = preparation.aiMockInterviews.findIndex(i => i._id === interviewData._id);
                    if (index !== -1) {
                        // If it exists for some reason, update it
                        preparation.aiMockInterviews[index] = interviewData;
                    } else {
                        // Otherwise, add the new completed interview to the list
                        preparation.aiMockInterviews.unshift(interviewData);
                    }
                }
            })

            // --- Admin Questions ---
            .addCase(fetchAdminQuestions.fulfilled, (state, action) => {
                state.adminQuestions = action.payload;
            })
            .addCase(createAdminQuestion.fulfilled, (state, action) => {
                state.adminQuestions.unshift(action.payload);
            })
            .addCase(updateAdminQuestion.fulfilled, (state, action) => {
                const index = state.adminQuestions.findIndex(q => q._id === action.payload._id);
                if (index !== -1) state.adminQuestions[index] = action.payload;
            })
            .addCase(deleteBulkAdminQuestions.fulfilled, (state, action) => {
                const idSet = new Set(action.payload);
                state.adminQuestions = state.adminQuestions.filter(q => !idSet.has(q._id));
            })

            // --- Generic Matchers ---
            .addMatcher(
                (action) => action.type.endsWith('/pending'),
                (state) => {
                    state.isLoading = true;
                    state.isError = false;
                    state.isSuccess = false;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith('/fulfilled'),
                (state) => {
                    state.isLoading = false;
                    state.isSuccess = true;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith('/rejected'),
                (state, action) => {
                    state.isLoading = false;
                    state.isError = true;
                    state.message = action.payload;
                }
            );
    },
});

export const { reset, clearCurrentInterview } = interviewPrepSlice.actions;
export default interviewPrepSlice.reducer;