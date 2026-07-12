import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Async Thunks ─────────────────────────────────────────

export const fetchDesigns = createAsyncThunk(
  'designs/fetchDesigns',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/designs', { params });
      return response.data.data.designs;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch designs'
      );
    }
  }
);

export const fetchDesignById = createAsyncThunk(
  'designs/fetchDesignById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/designs/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch design details'
      );
    }
  }
);

export const fetchDesignStats = createAsyncThunk(
  'designs/fetchDesignStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/designs/stats');
      return response.data.data.stats;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch design stats'
      );
    }
  }
);

export const createDesign = createAsyncThunk(
  'designs/createDesign',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/designs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to upload design'
      );
    }
  }
);

export const uploadNewVersion = createAsyncThunk(
  'designs/uploadNewVersion',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/designs/${id}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to upload new version'
      );
    }
  }
);

export const updateDesignStatus = createAsyncThunk(
  'designs/updateDesignStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/designs/${id}/status`, { status });
      return response.data.data.design;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update design status'
      );
    }
  }
);

export const deleteDesign = createAsyncThunk(
  'designs/deleteDesign',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/designs/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete design'
      );
    }
  }
);

// ── Slice Definition ─────────────────────────────────────

const designSlice = createSlice({
  name: 'designs',
  initialState: {
    designs: [],
    selectedDesign: null,
    selectedVersions: [],
    stats: { total: 0, pending: 0, inReview: 0, approved: 0, changesRequested: 0 },
    loading: false,
    detailLoading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    clearSelectedDesign: (state) => {
      state.selectedDesign = null;
      state.selectedVersions = [];
    },
    clearDesignError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDesigns
      .addCase(fetchDesigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDesigns.fulfilled, (state, action) => {
        state.loading = false;
        state.designs = action.payload;
      })
      .addCase(fetchDesigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchDesignById
      .addCase(fetchDesignById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchDesignById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedDesign = action.payload.design;
        state.selectedVersions = action.payload.versions;
      })
      .addCase(fetchDesignById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // fetchDesignStats
      .addCase(fetchDesignStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // createDesign
      .addCase(createDesign.pending, (state) => {
        state.uploading = true;
      })
      .addCase(createDesign.fulfilled, (state, action) => {
        state.uploading = false;
        state.designs.unshift(action.payload.design);
        state.stats.total += 1;
        state.stats.pending += 1;
      })
      .addCase(createDesign.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })

      // uploadNewVersion
      .addCase(uploadNewVersion.pending, (state) => {
        state.uploading = true;
      })
      .addCase(uploadNewVersion.fulfilled, (state, action) => {
        state.uploading = false;
        // update designs list
        const index = state.designs.findIndex((d) => d._id === action.payload.design._id);
        if (index !== -1) {
          state.designs[index] = action.payload.design;
        }
        if (state.selectedDesign?._id === action.payload.design._id) {
          state.selectedDesign = action.payload.design;
          state.selectedVersions.unshift(action.payload.version);
        }
      })
      .addCase(uploadNewVersion.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })

      // updateDesignStatus
      .addCase(updateDesignStatus.fulfilled, (state, action) => {
        const index = state.designs.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) {
          state.designs[index].status = action.payload.status;
        }
        if (state.selectedDesign?._id === action.payload._id) {
          state.selectedDesign.status = action.payload.status;
        }
      })

      // deleteDesign
      .addCase(deleteDesign.fulfilled, (state, action) => {
        state.designs = state.designs.filter((d) => d._id !== action.payload);
        state.stats.total = Math.max(0, state.stats.total - 1);
        if (state.selectedDesign?._id === action.payload) {
          state.selectedDesign = null;
          state.selectedVersions = [];
        }
      });
  },
});

export const { clearSelectedDesign, clearDesignError } = designSlice.actions;
export default designSlice.reducer;
