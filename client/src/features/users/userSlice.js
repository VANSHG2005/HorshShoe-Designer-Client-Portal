import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Async Thunks ─────────────────────────────────────────

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/users', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch users'
      );
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'users/fetchUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/stats');
      return response.data.data.stats;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user stats'
      );
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/users', userData);
      return response.data.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create user'
      );
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update user'
      );
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete user'
      );
    }
  }
);

// ── Slice Definition ─────────────────────────────────────

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    stats: { totalUsers: 0, totalDesigners: 0, totalClients: 0, totalActive: 0 },
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchUserStats
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // createUser
      .addCase(createUser.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.submitting = false;
        state.users.unshift(action.payload);
        state.stats.totalUsers += 1;
        if (action.payload.role === 'designer') state.stats.totalDesigners += 1;
        if (action.payload.role === 'client') state.stats.totalClients += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // updateUser
      .addCase(updateUser.pending, (state) => {
        state.submitting = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.users.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // deleteUser
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
        state.stats.totalUsers = Math.max(0, state.stats.totalUsers - 1);
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
