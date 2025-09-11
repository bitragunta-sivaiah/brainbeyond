import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api"; // Assuming your API utility is structured like this
import { toast } from "react-hot-toast";

// Async Thunks for API calls

// Create a new hero page
export const createHero = createAsyncThunk(
  "hero/createHero",
  async (heroData, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/heroes", heroData);
      toast.success("Hero page created successfully!");
      return data;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Fetch all active hero pages (with optional role filter)
export const getHeroes = createAsyncThunk(
  "hero/getHeroes",
  async (role = "", { rejectWithValue }) => {
    try {
      // Pass role as a query parameter
      const { data } = await API.get(`/heroes${role ? `?role=${role}` : ""}`);
      return data;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Update a hero page
export const updateHero = createAsyncThunk(
  "hero/updateHero",
  async ({ id, heroData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/heroes/${id}`, heroData);
      toast.success("Hero page updated successfully!");
      return data;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Delete a hero page
export const deleteHero = createAsyncThunk(
  "hero/deleteHero",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/heroes/${id}`);
      toast.success("Hero page deleted successfully!");
      return id; // Return the ID to easily remove it from the state
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Hero Slice
const heroSlice = createSlice({
  name: "hero",
  initialState: {
    heroes: [],
    loading: false,
    error: null,
  },
  reducers: {
    // You can add synchronous reducers here if needed
  },
  extraReducers: (builder) => {
    builder
      // Create Hero
      .addCase(createHero.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHero.fulfilled, (state, action) => {
        state.loading = false;
        state.heroes.push(action.payload); // Add new hero to the list
      })
      .addCase(createHero.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Heroes
      .addCase(getHeroes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHeroes.fulfilled, (state, action) => {
        state.loading = false;
        state.heroes = action.payload; // Set heroes with fetched data
      })
      .addCase(getHeroes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Hero
      .addCase(updateHero.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHero.fulfilled, (state, action) => {
        state.loading = false;
        // Find and replace the updated hero in the state
        const index = state.heroes.findIndex(
          (hero) => hero._id === action.payload._id
        );
        if (index !== -1) {
          state.heroes[index] = action.payload;
        }
      })
      .addCase(updateHero.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Hero
      .addCase(deleteHero.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHero.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the deleted hero from the state
        state.heroes = state.heroes.filter((hero) => hero._id !== action.payload);
      })
      .addCase(deleteHero.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default heroSlice.reducer;