import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming your API setup is in this file
import { toast } from "react-hot-toast";

// --- Entity Adapter for Courses ---
// Normalizes course data for efficient lookup and updates.
const coursesAdapter = createEntityAdapter({
    selectId: (course) => course._id, // Use _id as the unique identifier
});

const initialState = coursesAdapter.getInitialState({
    myCourses: [], // Stores courses the user has access to
    selectedCourse: {
        details: null, // Full details of a single selected course
        progress: null, // Progress for the selected course
    },
    // Status flags for different async operations
    status: 'idle', // General status for fetching lists
    detailsStatus: 'idle', // Status for fetching single course details
    actionStatus: 'idle', // Status for actions like enroll, review, etc.
    paymentStatus: 'idle', // Status for payment-related actions
    error: null,
});


// ----------------------------------------------------------------------------------
// --- ASYNC THUNKS (API Calls) ---
// ----------------------------------------------------------------------------------

/**
 * @desc Fetch all available (published) courses for browsing
 */
export const fetchCourses = createAsyncThunk(
    'studentCourses/fetchCourses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get('/student/courses');
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Fetch all courses the student has access to
 */
export const fetchMyCourses = createAsyncThunk(
    'studentCourses/fetchMyCourses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get('/student/courses/my-courses');
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Fetch detailed information for a single course by its slug
 */
export const fetchCourseDetails = createAsyncThunk(
    'studentCourses/fetchCourseDetails',
    async (slug, { rejectWithValue }) => {
        try {
            const response = await API.get(`/student/courses/${slug}/details`);
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Enroll the current student in a FREE course
 */
export const enrollFreeCourse = createAsyncThunk(
    'studentCourses/enrollFreeCourse',
    async (slug, { rejectWithValue }) => {
        try {
            const response = await API.post(`/student/courses/${slug}/enroll-free`);
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Create a Razorpay order to purchase a course
 */
export const createCourseOrder = createAsyncThunk(
    'studentCourses/createCourseOrder',
    async (slug, { rejectWithValue }) => {
        try {
            const response = await API.post(`/student/courses/${slug}/create-order`);
            toast.success(response.data.message);
            return response.data.order; // Return only the order object for the payment gateway
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Verify Razorpay payment and grant course access
 */
export const verifyPayment = createAsyncThunk(
    'studentCourses/verifyPayment',
    async (paymentData, { rejectWithValue }) => {
        try {
            const response = await API.post('/student/courses/payment/verify', paymentData);
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Mark a lesson as complete
 */
export const markLessonComplete = createAsyncThunk(
    'studentCourses/markLessonComplete',
    async (lessonId, { rejectWithValue }) => {
        try {
            const response = await API.post(`/student/courses/lessons/${lessonId}/complete`);
            toast.success(response.data.message);
            return response.data.data; // Returns the updated progress object
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Mark a lesson as incomplete
 */
export const markLessonIncomplete = createAsyncThunk(
    'studentCourses/markLessonIncomplete',
    async (lessonId, { rejectWithValue }) => {
        try {
            const response = await API.post(`/student/courses/lessons/${lessonId}/incomplete`);
            toast.success(response.data.message);
            return response.data.data; // Returns the updated progress object
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Add a doubt/question to a lesson
 */
export const addDoubt = createAsyncThunk(
    'studentCourses/addDoubt',
    async ({ lessonId, question }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/student/courses/lessons/${lessonId}/doubt`, { question });
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Submit answers for a quiz and get the result
 */
export const submitQuiz = createAsyncThunk(
    'studentCourses/submitQuiz',
    async ({ lessonId, answers }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/student/courses/lessons/${lessonId}/submit-quiz`, { answers });
            toast.success(response.data.message);
            return response.data.result;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc Submit code for a coding problem
 */
export const submitCodingProblem = createAsyncThunk(
    'studentCourses/submitCodingProblem',
    async ({ lessonId, code, language }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/student/courses/lessons/${lessonId}/submit-coding-problem`, { code, language });
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);


/**
 * @desc Get the student's progress for a specific course
 */
export const fetchCourseProgress = createAsyncThunk(
    'studentCourses/fetchCourseProgress',
    async (slug, { rejectWithValue }) => {
        try {
            const response = await API.get(`/student/courses/${slug}/progress`);
            return response.data.data;
        } catch (error) {
            // Don't show toast for 404, as it's a common case (not enrolled)
            if (error.response?.status !== 404) {
                const message = error.response?.data?.message || error.message;
                toast.error(message);
            }
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * @desc Add or update a review for a course
 */
export const addOrUpdateReview = createAsyncThunk(
    'studentCourses/addOrUpdateReview',
    async ({ slug, rating, comment }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/student/courses/${slug}/review`, { rating, comment });
            toast.success(response.data.message);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);


// ----------------------------------------------------------------------------------
// --- THE SLICE ---
// ----------------------------------------------------------------------------------

const studentCourseSlice = createSlice({
    name: 'studentCourses',
    initialState,
    reducers: {
        // Action to reset the selected course details, useful when navigating away
        resetSelectedCourse: (state) => {
            state.selectedCourse.details = null;
            state.selectedCourse.progress = null;
            state.detailsStatus = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // --- Fetch All Courses ---
            .addCase(fetchCourses.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCourses.fulfilled, (state, action) => {
                state.status = 'succeeded';
                coursesAdapter.setAll(state, action.payload); // Use adapter to set courses
            })
            .addCase(fetchCourses.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // --- Fetch My Courses ---
            .addCase(fetchMyCourses.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchMyCourses.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.myCourses = action.payload;
            })
            .addCase(fetchMyCourses.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // --- Fetch Course Details ---
            .addCase(fetchCourseDetails.pending, (state) => {
                state.detailsStatus = 'loading';
            })
            .addCase(fetchCourseDetails.fulfilled, (state, action) => {
                state.detailsStatus = 'succeeded';
                state.selectedCourse.details = action.payload;
            })
            .addCase(fetchCourseDetails.rejected, (state, action) => {
                state.detailsStatus = 'failed';
                state.error = action.payload;
            })

            // --- Fetch Course Progress ---
            .addCase(fetchCourseProgress.fulfilled, (state, action) => {
                state.selectedCourse.progress = action.payload;
            })
            .addCase(fetchCourseProgress.rejected, (state, action) => {
                // If progress not found, set to a default state, not an error state
                state.selectedCourse.progress = { completedLessons: [], overallProgress: 0 };
            })
            
            // --- Mark Lesson Complete/Incomplete ---
            .addCase(markLessonComplete.fulfilled, (state, action) => {
                if (state.selectedCourse.progress) {
                    state.selectedCourse.progress = action.payload;
                }
            })
            .addCase(markLessonIncomplete.fulfilled, (state, action) => {
                if (state.selectedCourse.progress) {
                    state.selectedCourse.progress = action.payload;
                }
            })

            // --- Enroll Free Course ---
            .addCase(enrollFreeCourse.pending, (state) => {
                state.actionStatus = 'loading';
            })
            .addCase(enrollFreeCourse.fulfilled, (state) => {
                state.actionStatus = 'succeeded';
            })
            .addCase(enrollFreeCourse.rejected, (state, action) => {
                state.actionStatus = 'failed';
                state.error = action.payload;
            })

            // --- Add or Update Review ---
            .addCase(addOrUpdateReview.pending, (state) => {
                state.actionStatus = 'loading';
            })
            .addCase(addOrUpdateReview.fulfilled, (state) => {
                state.actionStatus = 'succeeded';
            })
            .addCase(addOrUpdateReview.rejected, (state, action) => {
                state.actionStatus = 'failed';
                state.error = action.payload;
            })

            // --- Add Doubt ---
            .addCase(addDoubt.pending, (state) => {
                state.actionStatus = 'loading';
            })
            .addCase(addDoubt.fulfilled, (state) => {
                state.actionStatus = 'succeeded';
            })
            .addCase(addDoubt.rejected, (state, action) => {
                state.actionStatus = 'failed';
                state.error = action.payload;
            })

            // --- Submit Quiz ---
            .addCase(submitQuiz.pending, (state) => {
                state.actionStatus = 'loading';
            })
            .addCase(submitQuiz.fulfilled, (state) => {
                state.actionStatus = 'succeeded';
            })
            .addCase(submitQuiz.rejected, (state, action) => {
                state.actionStatus = 'failed';
                state.error = action.payload;
            })

            // --- Submit Coding Problem ---
            .addCase(submitCodingProblem.pending, (state) => {
                state.actionStatus = 'loading';
            })
            .addCase(submitCodingProblem.fulfilled, (state) => {
                state.actionStatus = 'succeeded';
            })
            .addCase(submitCodingProblem.rejected, (state, action) => {
                state.actionStatus = 'failed';
                state.error = action.payload;
            })
            
            // --- Create Course Order ---
            .addCase(createCourseOrder.pending, (state) => {
                state.paymentStatus = 'loading';
            })
            .addCase(createCourseOrder.fulfilled, (state) => {
                state.paymentStatus = 'succeeded';
            })
            .addCase(createCourseOrder.rejected, (state, action) => {
                state.paymentStatus = 'failed';
                state.error = action.payload;
            })

            // --- Verify Payment ---
            .addCase(verifyPayment.pending, (state) => {
                state.paymentStatus = 'loading';
            })
            .addCase(verifyPayment.fulfilled, (state) => {
                state.paymentStatus = 'succeeded';
            })
            .addCase(verifyPayment.rejected, (state, action) => {
                state.paymentStatus = 'failed';
                state.error = action.payload;
            });
    },
});


// --- Export Actions and Selectors ---
export const { resetSelectedCourse } = studentCourseSlice.actions;

// Export adapter selectors with renamed aliases for clarity
export const {
    selectAll: selectAllCourses,
    selectById: selectCourseById,
    selectIds: selectCourseIds,
} = coursesAdapter.getSelectors((state) => state.studentCourses);


export default studentCourseSlice.reducer;