// Project status options — matches server/models/Project.js enum
export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'text-surface-600', bg: 'bg-surface-100' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'review', label: 'Review', color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'completed', label: 'Completed', color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'on_hold', label: 'On Hold', color: 'text-surface-500', bg: 'bg-surface-100' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50' },
];

// Task status options — matches server/models/Task.js enum
export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'text-surface-600', bg: 'bg-surface-100' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'review', label: 'Review', color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'done', label: 'Done', color: 'text-green-600', bg: 'bg-green-50' },
];

// Priority options — matches server/models/Project.js & Task.js enum
export const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  { value: 'high', label: 'High', color: 'text-orange-700', bg: 'bg-orange-100' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-700', bg: 'bg-red-100' },
];

// Approval status options — matches server/models/Design.js enum
export const APPROVAL_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'in_review', label: 'In Review', color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'approved', label: 'Approved', color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'changes_requested', label: 'Changes Requested', color: 'text-red-600', bg: 'bg-red-50' },
];

// User roles
export const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'designer', label: 'Designer' },
  { value: 'client', label: 'Client' },
  { value: 'project_manager', label: 'Project Manager' },
];

// Notification types — matches server/models/Notification.js enum
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS_CHANGED: 'task_status_changed',
  DESIGN_UPLOADED: 'design_uploaded',
  VERSION_UPLOADED: 'version_uploaded',
  COMMENT_ADDED: 'comment_added',
  DESIGN_APPROVED: 'design_approved',
  CHANGES_REQUESTED: 'changes_requested',
  SYSTEM_ALERT: 'system_alert',
};

