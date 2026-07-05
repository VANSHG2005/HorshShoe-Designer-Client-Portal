import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Async Thunks ─────────────────────────────────────────

export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/clients', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch clients'
      );
    }
  }
);

export const fetchClientStats = createAsyncThunk(
  'clients/fetchClientStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/clients/stats');
      return response.data.data.stats;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch client stats'
      );
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData, { rejectWithValue }) => {
    try {
      const response = await api.post('/clients', clientData);
      return response.data.data.client;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create client'
      );
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/clients/${id}`, data);
      return response.data.data.client;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update client'
      );
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/clients/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete client'
      );
    }
  }
);

// ── Slice Definition ─────────────────────────────────────

const clientSlice = createSlice({
  name: 'clients',
  initialState: {
    clients: [],
    stats: { total: 0, active: 0, lead: 0, inactive: 0 },
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearClientError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchClients
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload.clients;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchClientStats
      .addCase(fetchClientStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // createClient
      .addCase(createClient.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.submitting = false;
        state.clients.unshift(action.payload);
        state.stats.total += 1;
        if (action.payload.status === 'active') state.stats.active += 1;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // updateClient
      .addCase(updateClient.pending, (state) => {
        state.submitting = true;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.clients.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // deleteClient
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter((c) => c._id !== action.payload);
        state.stats.total = Math.max(0, state.stats.total - 1);
      });
  },
});

export const { clearClientError } = clientSlice.actions;
export default clientSlice.reducer;
