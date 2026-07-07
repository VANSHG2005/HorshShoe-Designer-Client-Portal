import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Async Thunks ─────────────────────────────────────────

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/projects', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch projects'
      );
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data.data.project;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch project details'
      );
    }
  }
);

export const fetchProjectStats = createAsyncThunk(
  'projects/fetchProjectStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/projects/stats');
      return response.data.data.stats;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch project stats'
      );
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data.data.project;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create project'
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/projects/${id}`, data);
      return response.data.data.project;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update project'
      );
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete project'
      );
    }
  }
);

// ── Slice Definition ─────────────────────────────────────

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    stats: { total: 0, inProgress: 0, review: 0, completed: 0, planning: 0 },
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    loading: false,
    detailLoading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    clearProjectError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProjects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.projects;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchProjectById
      .addCase(fetchProjectById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // fetchProjectStats
      .addCase(fetchProjectStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // createProject
      .addCase(createProject.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.submitting = false;
        state.projects.unshift(action.payload);
        state.stats.total += 1;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // updateProject
      .addCase(updateProject.pending, (state) => {
        state.submitting = true;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.projects.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // deleteProject
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p._id !== action.payload);
        state.stats.total = Math.max(0, state.stats.total - 1);
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null;
        }
      });
  },
});

export const { clearCurrentProject, clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;
