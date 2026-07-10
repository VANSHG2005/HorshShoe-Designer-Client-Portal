import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Async Thunks ─────────────────────────────────────────

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/tasks', { params });
      return response.data.data.tasks;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch tasks'
      );
    }
  }
);

export const fetchTaskStats = createAsyncThunk(
  'tasks/fetchTaskStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tasks/stats');
      return response.data.data.stats;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch task stats'
      );
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data.data.task;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create task'
      );
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data.data.task;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update task'
      );
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, status, order }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/tasks/${id}/status`, { status, order });
      return response.data.data.task;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update task status'
      );
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete task'
      );
    }
  }
);

// ── Slice Definition ─────────────────────────────────────

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    stats: { total: 0, todo: 0, inProgress: 0, review: 0, done: 0 },
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    // Optimistic status update for instant Kanban drag-and-drop feedback
    optimisticMoveTask: (state, action) => {
      const { id, newStatus } = action.payload;
      const task = state.tasks.find((t) => t._id === id);
      if (task) {
        task.status = newStatus;
      }
    },
    clearTaskError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchTaskStats
      .addCase(fetchTaskStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // createTask
      .addCase(createTask.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.submitting = false;
        state.tasks.push(action.payload);
        state.stats.total += 1;
        if (action.payload.status === 'todo') state.stats.todo += 1;
        if (action.payload.status === 'in_progress') state.stats.inProgress += 1;
        if (action.payload.status === 'review') state.stats.review += 1;
        if (action.payload.status === 'done') state.stats.done += 1;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // updateTask
      .addCase(updateTask.pending, (state) => {
        state.submitting = true;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // updateTaskStatus
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })

      // deleteTask
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
        state.stats.total = Math.max(0, state.stats.total - 1);
      });
  },
});

export const { optimisticMoveTask, clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;
