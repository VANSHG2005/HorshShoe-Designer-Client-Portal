import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard metrics'
      );
    }
  }
);

export const fetchDashboardCharts = createAsyncThunk(
  'dashboard/fetchDashboardCharts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/dashboard/charts');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch analytics charts'
      );
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    kpis: null,
    pendingReviewDesigns: [],
    recentActivity: [],
    charts: {
      projectsByStatus: [],
      deliverablesHealth: [],
      designerWorkload: [],
      tasksByPriority: [],
    },
    loading: false,
    chartsLoading: false,
    error: null,
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDashboardStats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.kpis = action.payload.kpis;
        state.pendingReviewDesigns = action.payload.pendingReviewDesigns;
        state.recentActivity = action.payload.recentActivity;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchDashboardCharts
      .addCase(fetchDashboardCharts.pending, (state) => {
        state.chartsLoading = true;
      })
      .addCase(fetchDashboardCharts.fulfilled, (state, action) => {
        state.chartsLoading = false;
        state.charts = action.payload;
      })
      .addCase(fetchDashboardCharts.rejected, (state, action) => {
        state.chartsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
