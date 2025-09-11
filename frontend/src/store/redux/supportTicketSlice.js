import {
    createSlice,
    createAsyncThunk
} from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming your API instance is configured here
import {
    toast
} from "react-hot-toast";

const initialState = {
    tickets: [],
    ticket: null,
    loading: false,
    error: null,
};

// --- Async Thunks ---

/**
 * @desc    Create a new support ticket (for students)
 */
export const createTicket = createAsyncThunk(
    'supportTickets/create',
    async (ticketData, { rejectWithValue }) => {
        try {
            const response = await API.post('/support-tickets', ticketData);
            toast.success("Support ticket created successfully!");
            return response.data;
        } catch (error) {
            const message = (error.response?.data?.message) || error.message || error.toString();
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc    Get all tickets for the logged-in user (student, admin, or customercare)
 */
export const getTickets = createAsyncThunk(
    'supportTickets/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get('/support-tickets');
            return response.data;
        } catch (error) {
            const message = (error.response?.data?.message) || error.message || error.toString();
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc    Get a single ticket by its ID
 */
export const getTicketById = createAsyncThunk(
    'supportTickets/getById',
    async (ticketId, { rejectWithValue }) => {
        try {
            const response = await API.get(`/support-tickets/${ticketId}`);
            return response.data;
        } catch (error) {
            const message = (error.response?.data?.message) || error.message || error.toString();
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc    Add a response to a ticket (for students)
 */
export const addResponse = createAsyncThunk(
    'supportTickets/addResponse',
    async ({ ticketId, message }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/support-tickets/${ticketId}/responses`, { message });
            toast.success("Your reply has been sent.");
            return response.data;
        } catch (error) {
            const message = (error.response?.data?.message) || error.message || error.toString();
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc    Add a response to a ticket (for agents/admins)
 */
export const addAgentResponse = createAsyncThunk(
    'supportTickets/addAgentResponse',
    async ({ ticketId, message }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/support-tickets/${ticketId}/agent-response`, { message });
            toast.success("Reply sent to the student.");
            return response.data;
        } catch (error) {
            const message = (error.response?.data?.message) || error.message || error.toString();
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @desc    Update ticket details (status, priority, assignment)
 */
export const updateTicketDetails = createAsyncThunk(
    'supportTickets/updateDetails',
    async ({ ticketId, details }, { rejectWithValue }) => {
        try {
            const response = await API.put(`/support-tickets/${ticketId}/details`, details);
            toast.success("Ticket details updated.");
            return response.data;
        } catch (error) {
            const message = (error.response?.data?.message) || error.message || error.toString();
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);


// --- Slice Definition ---

export const supportTicketSlice = createSlice({
    name: 'supportTicket',
    initialState,
    reducers: {
        // Reducer to clear the single ticket view, e.g., when navigating away
        clearTicket: (state) => {
            state.ticket = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // --- createTicket ---
            .addCase(createTicket.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTicket.fulfilled, (state, action) => {
                state.loading = false;
                state.tickets.unshift(action.payload); // Add new ticket to the beginning of the list
                state.ticket = action.payload;
            })
            .addCase(createTicket.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- getTickets ---
            .addCase(getTickets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getTickets.fulfilled, (state, action) => {
                state.loading = false;
                state.tickets = action.payload;
            })
            .addCase(getTickets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- getTicketById ---
            .addCase(getTicketById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getTicketById.fulfilled, (state, action) => {
                state.loading = false;
                state.ticket = action.payload;
            })
            .addCase(getTicketById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- addResponse ---
            .addCase(addResponse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addResponse.fulfilled, (state, action) => {
                state.loading = false;
                state.ticket = action.payload;
                const index = state.tickets.findIndex(t => t.ticketId === action.payload.ticketId);
                if (index !== -1) {
                    state.tickets[index] = action.payload;
                }
            })
            .addCase(addResponse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- addAgentResponse ---
            .addCase(addAgentResponse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addAgentResponse.fulfilled, (state, action) => {
                state.loading = false;
                state.ticket = action.payload;
                const index = state.tickets.findIndex(t => t.ticketId === action.payload.ticketId);
                if (index !== -1) {
                    state.tickets[index] = action.payload;
                }
            })
            .addCase(addAgentResponse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- updateTicketDetails ---
            .addCase(updateTicketDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTicketDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.ticket = action.payload;
                const index = state.tickets.findIndex(t => t.ticketId === action.payload.ticketId);
                if (index !== -1) {
                    state.tickets[index] = action.payload;
                }
            })
            .addCase(updateTicketDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearTicket
} = supportTicketSlice.actions;

export default supportTicketSlice.reducer;