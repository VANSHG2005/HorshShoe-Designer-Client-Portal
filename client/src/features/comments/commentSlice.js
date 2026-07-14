import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Async Thunks ─────────────────────────────────────────

export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async ({ design, version }, { rejectWithValue }) => {
    try {
      const response = await api.get('/comments', {
        params: { design, version },
      });
      return response.data.data.comments;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch comments'
      );
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async (commentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/comments', commentData);
      return response.data.data.comment;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to post comment'
      );
    }
  }
);

export const resolveComment = createAsyncThunk(
  'comments/resolveComment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/comments/${id}/resolve`);
      return response.data.data.comment;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle resolution'
      );
    }
  }
);

export const submitReview = createAsyncThunk(
  'comments/submitReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await api.post('/comments/review', reviewData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit review'
      );
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/comments/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete comment'
      );
    }
  }
);

// ── Slice Definition ─────────────────────────────────────

const commentSlice = createSlice({
  name: 'comments',
  initialState: {
    comments: [],
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearComments: (state) => {
      state.comments = [];
    },
    clearCommentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchComments
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createComment
      .addCase(createComment.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.submitting = false;
        state.comments.unshift(action.payload);
      })
      .addCase(createComment.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // resolveComment
      .addCase(resolveComment.fulfilled, (state, action) => {
        const index = state.comments.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) {
          state.comments[index] = action.payload;
        }
      })

      // submitReview
      .addCase(submitReview.fulfilled, (state, action) => {
        if (action.payload.comment) {
          state.comments.unshift(action.payload.comment);
        }
      })

      // deleteComment
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearComments, clearCommentError } = commentSlice.actions;
export default commentSlice.reducer;
