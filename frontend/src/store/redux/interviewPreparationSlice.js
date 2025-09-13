import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import API from "@/api/api"; // Assuming your API wrapper is here

// --- INITIAL STATE ---
const initialState = {
    preparations: [],
    currentPreparation: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

// --- ASYNC THUNKS ---

// 1. Fetch ALL interview preparations
export const getPreparations = createAsyncThunk(
    'interview/getPreparations',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get('/interview-preparations');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// 2. Fetch a SINGLE interview preparation by ID
export const getPreparationById = createAsyncThunk(
    'interview/getPreparationById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await API.get(`/interview-preparations/${id}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// 3. Create a new interview preparation with AI
export const createPreparation = createAsyncThunk(
    'interview/createPreparation',
    async (initialData, { rejectWithValue }) => {
        try {
            const response = await API.post('/interview-preparations', initialData);
            toast.success("AI has successfully created your preparation plan!");
            return response.data.data;
        } catch (error) {
            toast.error("Failed to create AI preparation plan.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 4. Update an interview preparation
export const updatePreparation = createAsyncThunk(
    'interview/updatePreparation',
    async ({ id, updateData }, { rejectWithValue }) => {
        try {
            const response = await API.put(`/interview-preparations/${id}`, updateData);
            toast.success("Preparation plan updated.");
            return response.data.data;
        } catch (error) {
            toast.error("Failed to update preparation plan.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 5. Delete an interview preparation
export const deletePreparation = createAsyncThunk(
    'interview/deletePreparation',
    async (id, { rejectWithValue }) => {
        try {
            await API.delete(`/interview-preparations/${id}`);
            toast.success("Preparation plan deleted successfully.");
            return id;
        } catch (error) {
            toast.error("Failed to delete preparation plan.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 6. Batch delete study topics
export const deleteStudyTopics = createAsyncThunk(
    'interview/deleteStudyTopics',
    async ({ id, ids }, { rejectWithValue }) => {
        try {
            await API.delete(`/interview-preparations/${id}/learning/study-topics`, { data: { ids } });
            toast.success("Selected study topics deleted.");
            return { ids };
        } catch (error) {
            toast.error("Failed to delete study topics.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 7. Batch delete prepared questions
export const deletePreparedQuestions = createAsyncThunk(
    'interview/deletePreparedQuestions',
    async ({ id, ids }, { rejectWithValue }) => {
        try {
            await API.delete(`/interview-preparations/${id}/learning/prepared-questions`, { data: { ids } });
            toast.success("Selected questions deleted.");
            return { ids };
        } catch (error) {
            toast.error("Failed to delete prepared questions.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 8. Generate more learning items with AI
export const generateLearningItems = createAsyncThunk(
    'interview/generateLearningItems',
    async (id, { rejectWithValue }) => {
        try {
            const response = await API.post(`/interview-preparations/${id}/learning/generate`);
            toast.success("AI has generated new learning items!");
            return { preparationId: id, learningData: response.data.data };
        } catch (error) {
            toast.error("Failed to generate more learning items.");
            return rejectWithValue(error.response.data);
        }
    }
);


// 9. Generate practice items with AI
export const generatePracticeItems = createAsyncThunk(
    'interview/generatePracticeItems',
    async (id, { rejectWithValue }) => {
        try {
            const response = await API.post(`/interview-preparations/${id}/practice/generate`);
            toast.success("AI has generated new practice items!");
            return { preparationId: id, practiceData: response.data.data };
        } catch (error) {
            toast.error("Failed to generate practice items.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 10. Add a single practice problem
export const addPracticeProblem = createAsyncThunk(
    'interview/addPracticeProblem',
    async ({ id, problemData }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/interview-preparations/${id}/practice/problems`, problemData);
            toast.success("Practice problem added.");
            return { preparationId: id, problem: response.data.data };
        } catch (error) {
            toast.error("Failed to add practice problem.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 11. Upload a resume and get extracted text
export const uploadResume = createAsyncThunk(
    'interview/uploadResume',
    async ({ id, resumeFile }, { rejectWithValue }) => {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        try {
            const response = await API.post(`/interview-preparations/${id}/assessment/upload-resume`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success("Resume uploaded and analyzed!");
            return response.data;
        } catch (error) {
            toast.error("Failed to upload or analyze resume.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 12. Start a mock interview
export const startMockInterview = createAsyncThunk(
    'interview/startMockInterview',
    async ({ id, interviewData }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/interview-preparations/${id}/assessment/start`, interviewData);
            toast.success("Mock interview started!");
            return { preparationId: id, ...response.data };
        } catch (error) {
            toast.error("Failed to start the mock interview.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 13. Get a warning during a mock interview
export const getMockInterviewWarning = createAsyncThunk(
    'interview/getMockInterviewWarning',
    async ({ id, mockId, transcript }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/interview-preparations/${id}/assessment/${mockId}/warning`, { transcript });
            toast.info(`AI Suggestion: ${response.data.warning}`);
            return response.data.warning;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// 14. End a mock interview and get feedback
export const endMockInterview = createAsyncThunk(
    'interview/endMockInterview',
    async ({ id, mockId, transcript }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/interview-preparations/${id}/assessment/${mockId}/end`, { transcript });
            toast.success("AI feedback has been generated!");
            return { preparationId: id, mockInterviewData: response.data.data };
        } catch (error) {
            toast.error("Failed to generate AI feedback.");
            return rejectWithValue(error.response.data);
        }
    }
);

// 15. Get the next question during a mock interview
export const getNextQuestion = createAsyncThunk(
    'interview/getNextQuestion',
    async ({ id, mockId, transcript }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/interview-preparations/${id}/assessment/${mockId}/next`, { transcript });
            return response.data.nextQuestion;
        } catch (error) {
            toast.error("Failed to get next question from AI.");
            return rejectWithValue(error.response.data);
        }
    }
);


// --- SLICE DEFINITION ---
const interviewSlice = createSlice({
    name: 'interview',
    initialState,
    reducers: {
        setCurrentPreparation: (state, action) => {
            state.currentPreparation = state.preparations.find(p => p._id === action.payload) || null;
        },
        clearCurrentPreparation: (state) => {
            state.currentPreparation = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // GET ALL
            .addCase(getPreparations.pending, (state) => { state.status = 'loading'; })
            .addCase(getPreparations.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.preparations = action.payload;
            })
            .addCase(getPreparations.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // GET BY ID
            .addCase(getPreparationById.pending, (state) => { state.status = 'loading'; })
            .addCase(getPreparationById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentPreparation = action.payload;
            })
            .addCase(getPreparationById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // CREATE
            .addCase(createPreparation.pending, (state) => { state.status = 'loading'; })
            .addCase(createPreparation.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.preparations.unshift(action.payload);
            })
            .addCase(createPreparation.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // UPDATE
            .addCase(updatePreparation.pending, (state) => { state.status = 'loading'; })
            .addCase(updatePreparation.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const index = state.preparations.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.preparations[index] = action.payload;
                }
                if (state.currentPreparation?._id === action.payload._id) {
                    state.currentPreparation = action.payload;
                }
            })
            .addCase(updatePreparation.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // DELETE
            .addCase(deletePreparation.pending, (state) => { state.status = 'loading'; })
            .addCase(deletePreparation.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.preparations = state.preparations.filter((p) => p._id !== action.payload);
                if (state.currentPreparation?._id === action.payload) {
                    state.currentPreparation = null;
                }
            })
            .addCase(deletePreparation.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // DELETE STUDY TOPICS
            .addCase(deleteStudyTopics.pending, (state) => { state.status = 'loading'; })
            .addCase(deleteStudyTopics.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (state.currentPreparation) {
                    state.currentPreparation.learning.studyTopics = state.currentPreparation.learning.studyTopics.filter(
                        (topic) => !action.payload.ids.includes(topic._id)
                    );
                }
            })
            .addCase(deleteStudyTopics.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // DELETE PREPARED QUESTIONS
            .addCase(deletePreparedQuestions.pending, (state) => { state.status = 'loading'; })
            .addCase(deletePreparedQuestions.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (state.currentPreparation) {
                    state.currentPreparation.learning.preparedQuestions = state.currentPreparation.learning.preparedQuestions.filter(
                        (q) => !action.payload.ids.includes(q._id)
                    );
                }
            })
            .addCase(deletePreparedQuestions.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // GENERATE LEARNING ITEMS
            .addCase(generateLearningItems.pending, (state) => { state.status = 'loading'; })
            .addCase(generateLearningItems.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (state.currentPreparation?._id === action.payload.preparationId) {
                    state.currentPreparation.learning = action.payload.learningData;
                }
            })
            .addCase(generateLearningItems.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // GENERATE PRACTICE
            .addCase(generatePracticeItems.pending, (state) => { state.status = 'loading'; })
            .addCase(generatePracticeItems.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (state.currentPreparation?._id === action.payload.preparationId) {
                    state.currentPreparation.practice = action.payload.practiceData;
                }
            })
            .addCase(generatePracticeItems.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // ADD PRACTICE PROBLEM
            .addCase(addPracticeProblem.pending, (state) => { state.status = 'loading'; })
            .addCase(addPracticeProblem.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (state.currentPreparation?._id === action.payload.preparationId) {
                    state.currentPreparation.practice.practiceProblems.push(action.payload.problem);
                }
            })
            .addCase(addPracticeProblem.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // UPLOAD RESUME
            .addCase(uploadResume.pending, (state) => { state.status = 'loading'; })
            .addCase(uploadResume.fulfilled, (state) => { state.status = 'succeeded'; })
            .addCase(uploadResume.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // START MOCK INTERVIEW
            .addCase(startMockInterview.pending, (state) => { state.status = 'loading'; })
            .addCase(startMockInterview.fulfilled, (state) => { state.status = 'succeeded'; })
            .addCase(startMockInterview.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
             // GET MOCK INTERVIEW WARNING
            .addCase(getMockInterviewWarning.pending, (state) => { state.status = 'loading'; })
            .addCase(getMockInterviewWarning.fulfilled, (state) => { state.status = 'succeeded'; })
            .addCase(getMockInterviewWarning.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // GET NEXT QUESTION
            .addCase(getNextQuestion.pending, (state) => { state.status = 'loading'; })
            .addCase(getNextQuestion.fulfilled, (state) => { state.status = 'succeeded'; })
            .addCase(getNextQuestion.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            })
            // END MOCK INTERVIEW
            .addCase(endMockInterview.pending, (state) => { state.status = 'loading'; })
            .addCase(endMockInterview.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const updatedInterview = action.payload.mockInterviewData;
                if (state.currentPreparation?._id === action.payload.preparationId) {
                    const index = state.currentPreparation.assessment.aiMockInterviews.findIndex(i => i._id === updatedInterview._id);
                    if (index !== -1) {
                        state.currentPreparation.assessment.aiMockInterviews[index] = updatedInterview;
                    } else {
                        state.currentPreparation.assessment.aiMockInterviews.push(updatedInterview);
                    }
                }
            })
            .addCase(endMockInterview.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'An unknown error occurred';
            });
    },
});

export const { setCurrentPreparation, clearCurrentPreparation } = interviewSlice.actions;
export default interviewSlice.reducer;