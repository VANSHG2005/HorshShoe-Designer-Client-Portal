import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import clientReducer from '../features/clients/clientSlice';
import userReducer from '../features/users/userSlice';
import projectReducer from '../features/projects/projectSlice';
import taskReducer from '../features/tasks/taskSlice';
import designReducer from '../features/designs/designSlice';
import commentReducer from '../features/comments/commentSlice';
import activityReducer from '../features/activity/activitySlice';
import notificationReducer from '../features/notifications/notificationSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientReducer,
    users: userReducer,
    projects: projectReducer,
    tasks: taskReducer,
    designs: designReducer,
    comments: commentReducer,
    activity: activityReducer,
    notifications: notificationReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: import.meta.env.DEV,
});

export default store;
