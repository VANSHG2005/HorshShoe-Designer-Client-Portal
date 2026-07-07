import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProjectById,
  updateProject,
  deleteProject,
} from '../../features/projects/projectSlice';
import { fetchClients } from '../../features/clients/clientSlice';
import { fetchUsers } from '../../features/users/userSlice';
import toast from 'react-hot-toast';
import TasksPage from './TasksPage';
import DesignsPage from './DesignsPage';
import {
  HiOutlineRectangleGroup,
  HiOutlineChevronLeft,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXMark,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlinePaintBrush,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProject: project, detailLoading: loading, submitting } = useSelector(
    (state) => state.projects
  );
  const { clients } = useSelector((state) => state.clients);
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'team' | 'designs' | 'tasks'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    progress: 0,
    budget: 0,
    spent: 0,
    deadline: '',
    tags: '',
  });

  const isAdmin = currentUser?.role === 'admin';
  const isPM = currentUser?.role === 'project_manager';
  const isLeadDesigner = project?.leadDesigner?._id === currentUser?._id;
  const canEdit = isAdmin || isPM || isLeadDesigner;

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchClients({ limit: 100 }));
      dispatch(fetchUsers({ limit: 100 }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (project) {
      setEditForm({
        title: project.title || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        progress: project.progress || 0,
        budget: project.budget || 0,
        spent: project.spent || 0,
        deadline: project.deadline ? project.deadline.split('T')[0] : '',
        tags: project.tags?.join(', ') || '',
      });
    }
  }, [project]);

  const handleUpdateStatus = async (newStatus) => {
    const res = await dispatch(updateProject({ id, data: { status: newStatus } }));
    if (!res.error) {
      toast.success(`Project status updated to ${newStatus.replace('_', ' ')}`);
    } else {
      toast.error(res.payload || 'Failed to update status');
    }
  };

  const handleUpdateProgress = async (newProgress) => {
    const res = await dispatch(
      updateProject({
        id,
        data: {
          progress: Number(newProgress),
          status: Number(newProgress) === 100 ? 'completed' : project.status,
        },
      })
    );
    if (!res.error) {
      toast.success(`Progress set to ${newProgress}%`);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const payload = {
      ...editForm,
      progress: Number(editForm.progress),
      budget: Number(editForm.budget),
      spent: Number(editForm.spent),
      tags: editForm.tags ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    const res = await dispatch(updateProject({ id, data: payload }));
    if (!res.error) {
      toast.success('Project details updated');
      setIsEditModalOpen(false);
    } else {
      toast.error(res.payload || 'Failed to update project');
    }
  };

  const handleDelete = async () => {
    const res = await dispatch(deleteProject(id));
    if (!res.error) {
      toast.success('Project removed');
      navigate('/dashboard/projects');
    } else {
      toast.error(res.payload || 'Failed to delete project');
    }
  };

  if (loading || !project) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-surface-200 rounded"></div>
        <div className="h-40 bg-surface-200 rounded-2xl"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Days remaining calculation
  let daysRemaining = null;
  if (project.deadline) {
    const diff = new Date(project.deadline) - new Date();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb & Back ──────────────────────────────────── */}
      <div className="flex items-center gap-3 text-xs text-surface-500">
        <Link
          to="/dashboard/projects"
          className="flex items-center gap-1 hover:text-white transition-colors font-medium"
        >
          <HiOutlineChevronLeft className="w-4 h-4" />
          <span>Projects</span>
        </Link>
        <span>/</span>
        <span className="font-mono text-brand-400 font-semibold">{project.code}</span>
      </div>

      {/* ── Hero Banner ────────────────────────────────────────── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                {project.code}
              </span>
              <span className="text-xs font-semibold text-surface-600 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                {project.category}
              </span>
              <span className="text-xs font-semibold text-surface-600 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] uppercase tracking-wider">
                {project.priority} Priority
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
              {project.title}
            </h1>

            {project.description && (
              <p className="text-sm text-surface-600 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0e0e0e] hover:bg-white/[0.04] text-surface-300 border border-white/[0.08] transition-colors"
              >
                <HiOutlinePencilSquare className="w-4 h-4" />
                Edit Project
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/10 text-red-400 border border-red-500/20 transition-colors"
              >
                <HiOutlineTrash className="w-4 h-4" />
                Delete
              </button>
            )}

            {/* Status Dropdown */}
            {canEdit && (
              <select
                value={project.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 focus:outline-none cursor-pointer"
              >
                <option value="planning">Status: Planning</option>
                <option value="in_progress">Status: In Progress</option>
                <option value="review">Status: Under Review</option>
                <option value="completed">Status: Completed</option>
                <option value="on_hold">Status: On Hold</option>
                <option value="cancelled">Status: Cancelled</option>
              </select>
            )}
          </div>
        </div>

        {/* Progress bar and slider */}
        <div className="mt-8 pt-6 border-t border-white/[0.04] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-surface-500 font-medium">Deliverable Completion Progress</span>
            <span className="font-bold text-white">{project.progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
          {canEdit && (
            <div className="flex items-center justify-between text-[11px] text-surface-500 pt-1">
              <span>Quick slider:</span>
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleUpdateProgress(val)}
                    className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] hover:bg-brand-500 hover:text-white text-surface-300 font-medium transition-colors"
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Key Cards Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Client Card */}
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
            <span className="uppercase tracking-wider font-semibold">Client Company</span>
            <HiOutlineBuildingOffice2 className="w-4 h-4 text-emerald-500" />
          </div>
          <h4 className="text-base font-bold text-white truncate">{project.client?.name}</h4>
          <p className="text-xs text-surface-500 mt-0.5 truncate">{project.client?.company || 'Direct Account'}</p>
        </div>

        {/* Lead Designer */}
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
            <span className="uppercase tracking-wider font-semibold">Lead Designer</span>
            <HiOutlinePaintBrush className="w-4 h-4 text-brand-600" />
          </div>
          <h4 className="text-base font-bold text-white truncate">
            {project.leadDesigner?.name || 'Unassigned'}
          </h4>
          <p className="text-xs text-surface-500 mt-0.5 truncate">{project.leadDesigner?.email || 'Assign in settings'}</p>
        </div>

        {/* Timeline */}
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
            <span className="uppercase tracking-wider font-semibold">Deadline Target</span>
            <HiOutlineCalendar className="w-4 h-4 text-amber-500" />
          </div>
          <h4 className="text-base font-bold text-white">
            {project.deadline
              ? new Date(project.deadline).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Flexible'}
          </h4>
          <p className="text-xs text-surface-500 mt-0.5">
            {daysRemaining !== null
              ? daysRemaining > 0
                ? `${daysRemaining} days remaining`
                : 'Deadline reached'
              : 'No deadline set'}
          </p>
        </div>

        {/* Budget & Spend */}
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
            <span className="uppercase tracking-wider font-semibold">Budget & Spend</span>
            <HiOutlineCurrencyDollar className="w-4 h-4 text-purple-400" />
          </div>
          <h4 className="text-base font-bold text-white">
            ${project.budget?.toLocaleString() || '0'}
          </h4>
          <p className="text-xs text-surface-500 mt-0.5">
            ${project.spent?.toLocaleString() || '0'} spent to date
          </p>
        </div>
      </div>

      {/* ── Tabbed View ────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
          {[
            { id: 'overview', label: 'Overview & Brief' },
            { id: 'team', label: 'Team & Stakeholders' },
            { id: 'tasks', label: 'Tasks (Kanban)' },
            { id: 'designs', label: 'Design Versions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold'
                  : 'text-surface-600 hover:text-white hover:bg-surface-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#111] border border-white/[0.06] rounded-2xl p-6 space-y-6 shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                  Project Brief & Scope
                </h3>
                <p className="text-sm text-surface-300 leading-relaxed">
                  {project.description || 'No detailed brief provided for this project yet.'}
                </p>
              </div>

              {project.tags?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                    Deliverable Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-white/[0.04] text-surface-300 border border-white/[0.06]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Client Card Side */}
            <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                Client Organization Details
              </h3>

              <div className="space-y-3 text-xs text-surface-600">
                <div className="flex items-center gap-2">
                  <HiOutlineBuildingOffice2 className="w-4 h-4 text-surface-400" />
                  <span className="font-semibold text-white">{project.client?.name}</span>
                </div>
                {project.client?.email && (
                  <div className="flex items-center gap-2">
                    <HiOutlineEnvelope className="w-4 h-4 text-surface-400" />
                    <a href={`mailto:${project.client.email}`} className="hover:text-brand-400 text-surface-300 truncate">
                      {project.client.email}
                    </a>
                  </div>
                )}
                {project.client?.phone && (
                  <div className="flex items-center gap-2">
                    <HiOutlinePhone className="w-4 h-4 text-surface-400" />
                    <span>{project.client.phone}</span>
                  </div>
                )}
                {project.client?.website && (
                  <div className="flex items-center gap-2">
                    <HiOutlineGlobeAlt className="w-4 h-4 text-surface-400" />
                    <a
                      href={project.client.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-400 hover:underline truncate"
                    >
                      {project.client.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team Tab Content */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Lead Designer Card */}
            {project.leadDesigner && (
              <div className="bg-[#111] border border-brand-500/20 rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 block mb-2">
                  Lead Creative
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 font-bold font-display text-lg flex items-center justify-center border border-brand-500/20">
                    {project.leadDesigner.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{project.leadDesigner.name}</h4>
                    <p className="text-xs text-surface-500">{project.leadDesigner.email}</p>
                  </div>
                </div>
                {project.leadDesigner.specializations?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
                    {project.leadDesigner.specializations.map((s, i) => (
                      <span key={i} className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded text-surface-600">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Team Members */}
            {project.team?.map((member) => (
              <div key={member._id} className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500 block mb-2">
                  Contributing Designer
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 font-bold font-display text-lg flex items-center justify-center border border-purple-500/20">
                    {member.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{member.name}</h4>
                    <p className="text-xs text-surface-500">{member.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tasks Tab — Live Project Kanban Board */}
        {activeTab === 'tasks' && (
          <div className="pt-2">
            <TasksPage fixedProjectId={project._id} />
          </div>
        )}

        {/* Designs Tab — Live Project Design Versions */}
        {activeTab === 'designs' && (
          <div className="pt-2">
            <DesignsPage fixedProjectId={project._id} />
          </div>
        )}
      </div>

      {/* ── Edit Project Modal ─────────────────────────────────── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h2 className="text-lg font-bold text-white font-display">Edit Project Details</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-surface-400 hover:text-surface-300 rounded-lg hover:bg-surface-100"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(e) => setEditForm({ ...editForm, progress: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">Spent ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.spent}
                    onChange={(e) => setEditForm({ ...editForm, spent: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">Deadline Date</label>
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">Tags</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:text-white hover:bg-surface-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ───────────────────────────────────────── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <HiOutlineTrash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Delete Project</h3>
              <p className="text-xs text-surface-600 mt-1">
                Are you sure you want to delete <span className="text-white font-semibold">{project.title}</span>? This will remove all associated project data permanently.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:text-white hover:bg-surface-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700"
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

export default ProjectDetailPage;
