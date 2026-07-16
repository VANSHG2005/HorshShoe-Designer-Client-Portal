import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/activity', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch activity logs'
      );
    }
  }
);

const activitySlice = createSlice({
  name: 'activity',
  initialState: {
    activities: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearActivityError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload.activities;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearActivityError } = activitySlice.actions;
export default activitySlice.reducer;
