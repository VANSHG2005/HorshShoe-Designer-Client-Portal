import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchTasks,
  fetchTaskStats,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  optimisticMoveTask,
} from '../../features/tasks/taskSlice';
import { fetchProjects } from '../../features/projects/projectSlice';
import { fetchUsers } from '../../features/users/userSlice';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardDocumentList,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineChevronRight,
  HiOutlineTag,
} from 'react-icons/hi2';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'border-purple-500/20 text-purple-400 bg-purple-500/10' },
  { id: 'in_progress', title: 'In Progress', color: 'border-brand-500/20 text-brand-400 bg-brand-500/10' },
  { id: 'review', title: 'Under Review', color: 'border-amber-500/20 text-amber-400 bg-amber-500/10' },
  { id: 'done', title: 'Done', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' },
];

function TasksPage({ fixedProjectId = null }) {
  const dispatch = useDispatch();
  const { tasks, stats, loading, submitting } = useSelector((state) => state.tasks);
  const { projects } = useSelector((state) => state.projects);
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [selectedProject, setSelectedProject] = useState(fixedProjectId || 'all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Form State
  const initialForm = {
    title: '',
    description: '',
    project: fixedProjectId || '',
    assignee: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    tags: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const isClient = currentUser?.role === 'client';
  const designers = users.filter((u) => u.role === 'designer' || u.role === 'admin');

  useEffect(() => {
    const params = {
      project: fixedProjectId || selectedProject,
      assignee: selectedAssignee,
      priority: selectedPriority,
      search: searchTerm,
    };
    dispatch(fetchTasks(params));
    dispatch(fetchTaskStats());
    if (!fixedProjectId) {
      dispatch(fetchProjects({ limit: 100 }));
    }
    dispatch(fetchUsers({ limit: 100 }));
  }, [dispatch, selectedProject, selectedAssignee, selectedPriority, fixedProjectId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        fetchTasks({
          project: fixedProjectId || selectedProject,
          assignee: selectedAssignee,
          priority: selectedPriority,
          search: searchTerm,
        })
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch, selectedProject, selectedAssignee, selectedPriority, fixedProjectId]);

  const handleOpenCreateModal = (defaultStatus = 'todo') => {
    setEditingTask(null);
    setFormData({
      ...initialForm,
      project: fixedProjectId || (projects[0]?._id || ''),
      status: defaultStatus,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      project: task.project?._id || task.project || '',
      assignee: task.assignee?._id || task.assignee || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      estimatedHours: task.estimatedHours || '',
      tags: task.tags?.join(', ') || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.project) {
      toast.error('Task title and associated project are required');
      return;
    }

    const payload = {
      ...formData,
      estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : 0,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      assignee: formData.assignee || null,
    };

    if (editingTask) {
      const res = await dispatch(updateTask({ id: editingTask._id, data: payload }));
      if (!res.error) {
        toast.success('Task updated successfully');
        setIsModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to update task');
      }
    } else {
      const res = await dispatch(createTask(payload));
      if (!res.error) {
        toast.success('Task created successfully');
        setIsModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to create task');
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== targetStatus) {
      // Optimistic update
      dispatch(optimisticMoveTask({ id: taskId, newStatus: targetStatus }));
      const res = await dispatch(updateTaskStatus({ id: taskId, status: targetStatus }));
      if (res.error) {
        toast.error(res.payload || 'Failed to move task');
        dispatch(fetchTasks({ project: fixedProjectId || selectedProject }));
      }
    }
    setDraggedTaskId(null);
  };

  // Quick shift column button
  const handleShiftColumn = async (task, direction) => {
    const colIndex = COLUMNS.findIndex((c) => c.id === task.status);
    const newIndex = colIndex + direction;
    if (newIndex >= 0 && newIndex < COLUMNS.length) {
      const targetStatus = COLUMNS[newIndex].id;
      dispatch(optimisticMoveTask({ id: task._id, newStatus: targetStatus }));
      const res = await dispatch(updateTaskStatus({ id: task._id, status: targetStatus }));
      if (res.error) {
        toast.error('Failed to move task');
        dispatch(fetchTasks({ project: fixedProjectId || selectedProject }));
      }
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    const res = await dispatch(deleteTask(taskToDelete._id));
    if (!res.error) {
      toast.success('Task deleted');
      setTaskToDelete(null);
    } else {
      toast.error(res.payload || 'Failed to delete task');
    }
  };

  const getPriorityPill = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Urgent</span>;
      case 'high':
        return <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">High</span>;
      case 'medium':
        return <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Med</span>;
      default:
        return <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header (hidden if embedded inside Project Detail) ─ */}
      {!fixedProjectId && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
              Kanban Task Board
            </h1>
            <p className="text-sm text-surface-500 mt-1">
              Visualize studio deliverables, task handoffs, review queues, and sprint statuses
            </p>
          </div>
          {!isClient && (
            <button
              onClick={() => handleOpenCreateModal('todo')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <HiOutlinePlus className="w-5 h-5" />
              New Task
            </button>
          )}
        </div>
      )}

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Project dropdown (only if not fixed) */}
          {!fixedProjectId && (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-xs font-medium text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.code} — {p.title}
                </option>
              ))}
            </select>
          )}

          {/* Assignee dropdown */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-3 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-xs font-medium text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">All Assignees</option>
            {designers.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Priority dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-xs font-medium text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* ── 4-Column Kanban Board ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {COLUMNS.map((column, colIdx) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="bg-[#0e0e0e] border border-white/[0.06] rounded-2xl p-4 min-h-[520px] flex flex-col justify-between shadow-card"
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${column.color}`}>
                      {column.title}
                    </span>
                    <span className="text-xs font-semibold text-surface-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md shadow-sm">
                      {columnTasks.length}
                    </span>
                  </div>
                  {!isClient && (
                    <button
                      onClick={() => handleOpenCreateModal(column.id)}
                      className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                      title={`Add task to ${column.title}`}
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Task Cards Column Stack */}
                <div className="space-y-3">
                  {columnTasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      task.status !== 'done' &&
                      new Date(task.dueDate) < new Date();

                    return (
                      <div
                        key={task._id}
                        draggable={!isClient}
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        className="group bg-[#141414] hover:bg-[#181818] border border-white/[0.06] hover:border-brand-500/30 rounded-xl p-4 transition-all duration-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md space-y-3"
                      >
                        {/* Top: Project Code & Priority */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                            {task.project?.code || 'HSS'}
                          </span>
                          {getPriorityPill(task.priority)}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-white leading-snug group-hover:text-brand-400 transition-colors">
                          {task.title}
                        </h4>

                        {/* Description snippet */}
                        {task.description && (
                          <p className="text-[11px] text-surface-400 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Tags */}
                        {task.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-[9px] font-medium bg-white/[0.04] text-surface-400 px-1.5 py-0.5 rounded border border-white/[0.06]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer: Assignee, Due Date, Quick Move */}
                        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-surface-500">
                          <div className="flex items-center gap-1.5">
                            {task.assignee ? (
                              <div
                                className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 font-bold text-[9px] flex items-center justify-center border border-brand-500/20"
                                title={`Assigned to: ${task.assignee.name}`}
                              >
                                {task.assignee.name[0]}
                              </div>
                            ) : (
                              <span className="text-[10px] text-surface-500 italic">None</span>
                            )}
                            {task.dueDate && (
                              <span
                                className={`flex items-center gap-1 text-[10px] ${
                                  isOverdue ? 'text-red-400 font-semibold' : 'text-surface-400'
                                }`}
                              >
                                <HiOutlineCalendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString('en-US', {
                                  month: 'numeric',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>

                          {/* Action controls & Shift column buttons */}
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            {colIdx > 0 && !isClient && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftColumn(task, -1);
                                }}
                                className="p-1 rounded text-surface-400 hover:text-surface-200 hover:bg-white/[0.06] transition-colors"
                                title="Move Left"
                              >
                                <HiOutlineArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {!isClient && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(task);
                                }}
                                className="p-1 rounded text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                                title="Edit Task"
                              >
                                <HiOutlinePencilSquare className="w-3 h-3" />
                              </button>
                            )}

                            {colIdx < COLUMNS.length - 1 && !isClient && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftColumn(task, 1);
                                }}
                                className="p-1 rounded text-surface-400 hover:text-surface-200 hover:bg-white/[0.06] transition-colors"
                                title="Move Right"
                              >
                                <HiOutlineArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Add button */}
              {!isClient && (
                <button
                  onClick={() => handleOpenCreateModal(column.id)}
                  className="mt-4 w-full py-2.5 border border-dashed border-white/[0.08] hover:border-brand-500/40 hover:bg-brand-500/[0.04] rounded-xl text-xs font-semibold text-surface-400 hover:text-brand-400 flex items-center justify-center gap-1.5 transition-all"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Create / Edit Task Modal ───────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <h2 className="text-lg font-bold text-white font-display">
                {editingTask ? 'Edit Task' : 'New Design Task'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-surface-400 hover:text-surface-200 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Design Onboarding Screens"
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Project & Assignee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Associated Project *
                  </label>
                  <select
                    required
                    disabled={Boolean(fixedProjectId)}
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:opacity-60"
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.code} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Assignee
                  </label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {designers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Initial Column / Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Under Review</option>
                    <option value="done">Done / Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Estimated Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Estimated Effort (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    placeholder="e.g. 8"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Description / Deliverable Specs
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details, wireframe links, acceptance criteria..."
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                ></textarea>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Figma, UI, Prototype, Sprint1"
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTaskToDelete(editingTask);
                      setIsModalOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    Delete
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md hover:shadow-glow disabled:opacity-50 transition-all"
                  >
                    {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
              <HiOutlineTrash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Delete Task</h3>
              <p className="text-xs text-surface-500 mt-1">
                Are you sure you want to delete <span className="text-white font-semibold">{taskToDelete.title}</span>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage;
